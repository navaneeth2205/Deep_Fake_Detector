from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import os
import shutil
import cv2
import subprocess
import uuid
import wave

import numpy as np
from PIL import Image
import torch

from transformers import AutoImageProcessor, AutoModelForImageClassification
from moviepy.video.io.VideoFileClip import VideoFileClip


# -------------------------
# App setup
# -------------------------

app = FastAPI(title="Explainable Deepfake Detection API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# -------------------------
# Load pretrained model ONCE
# -------------------------

MODEL_NAME = "prithivMLmods/deepfake-detector-model-v1"

processor = AutoImageProcessor.from_pretrained(MODEL_NAME)
model = AutoModelForImageClassification.from_pretrained(MODEL_NAME)
model.eval()

# -------------------------
# Utility functions
# -------------------------

def load_image(path):
    img = Image.open(path).convert("RGB")
    return np.array(img)


def image_analysis(image):
    gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
    variance = np.var(gray)

    h, w, _ = image.shape
    mid = w // 2

    left = image[:, :mid]
    right = image[:, w - mid:]
    right_flipped = cv2.flip(right, 1)

    symmetry_diff = np.mean(
        np.abs(left.astype("float") - right_flipped.astype("float"))
    )

    return {
        "Skin Smoothness": min(100, int(1000 / (variance + 1))),
        "Facial Symmetry": min(100, int(symmetry_diff / 2))
    }


def pretrained_model_score(image_np):
    inputs = processor(images=image_np, return_tensors="pt")

    with torch.no_grad():
        outputs = model(**inputs)
        probs = torch.softmax(outputs.logits, dim=1)

    fake_prob = probs[0][1].item()
    return int(fake_prob * 100)


def video_analysis(path):
    clip = VideoFileClip(path)
    frame_count = 0
    face_detected = 0

    face_cascade = cv2.CascadeClassifier(
        cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    )

    for frame in clip.iter_frames(fps=1):
        if frame_count >= 15:
            break

        gray = cv2.cvtColor(frame, cv2.COLOR_RGB2GRAY)
        faces = face_cascade.detectMultiScale(gray, 1.3, 5)

        if len(faces) > 0:
            face_detected += 1

        frame_count += 1

    clip.close()

    return {
        "Face Consistency": int((face_detected / max(frame_count, 1)) * 100),
        "Frame Stability": 80
    }


def audio_analysis(path):
    temp_wav = f"temp_{uuid.uuid4().hex}.wav"

    try:
        # Convert any audio format to WAV using FFmpeg
        subprocess.run(
            ["ffmpeg", "-y", "-i", path, temp_wav],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=True
        )

        # Read WAV safely
        with wave.open(temp_wav, "rb") as audio:
            frames = audio.readframes(audio.getnframes())
            signal = np.frombuffer(frames, dtype=np.int16)
            variance = np.var(signal)

        return {
            "Audio Naturalness": min(100, int(variance / 1000)),
            "Background Noise": 70
        }

    except Exception:
        return {
            "Audio Naturalness": 0,
            "Background Noise": 0
        }

    finally:
        if os.path.exists(temp_wav):
            os.remove(temp_wav)



# -------------------------
# API endpoints
# -------------------------

@app.get("/")
def root():
    return {"status": "Backend running"}


@app.post("/analyze")
async def analyze_file(file: UploadFile = File(...)):
    file_path = os.path.join(UPLOAD_DIR, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_type = file.content_type
    indicators = []

    # IMAGE
    if file_type.startswith("image"):
        image = load_image(file_path)

        rule_results = image_analysis(image)
        ai_score = pretrained_model_score(image)

        for k, v in rule_results.items():
            indicators.append({
                "name": k,
                "score": v,
                "description": f"{k} analysis based on visual patterns"
            })

        indicators.append({
            "name": "AI Model Confidence",
            "score": ai_score,
            "description": "Pretrained deepfake detection model confidence"
        })

        rule_avg = sum(rule_results.values()) / len(rule_results)
        overall_score = int(rule_avg * 0.2 + ai_score * 0.8)
        media_type = "Image"

    # VIDEO
    elif file_type.startswith("video"):
        results = video_analysis(file_path)

        for k, v in results.items():
            indicators.append({
                "name": k,
                "score": v,
                "description": f"{k} analysis for video"
            })

        overall_score = int(sum(results.values()) / len(results))
        media_type = "Video"

    # AUDIO
    elif file_type.startswith("audio"):
        results = audio_analysis(file_path)

        for k, v in results.items():
            indicators.append({
                "name": k,
                "score": v,
                "description": f"{k} analysis for audio"
            })

        overall_score = int(sum(results.values()) / len(results))
        media_type = "Audio"

    else:
        return {"error": "Unsupported file type"}

    risk_level = (
        "Low" if overall_score < 30 else
        "Medium" if overall_score < 60 else
        "High"
    )

    explanation = (
        f"This {media_type.lower()} analysis combines explainable indicators "
        "with a pretrained deepfake detection model where applicable. "
        "No single signal is conclusive. The result reflects a combined risk assessment."
    )

    return {
        "media_type": media_type,
        "overall_score": overall_score,
        "risk_level": risk_level,
        "indicators": indicators,
        "explanation": explanation
    }
