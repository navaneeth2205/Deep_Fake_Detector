# DeepDetect AI

## Deepfake Detection Web Application

----------------------------------------
## Overview

DeepDetect AI is a web-based application designed to help users analyze images, videos, and audio files to identify potential deepfake or AI-generated content. The project focuses on explainable analysis, stable performance, and a clean user interface, making it suitable for hackathons and educational demonstrations.

----------------------------------------
## Features

Image deepfake detection using a pretrained AI model

Explainable visual indicators for transparency

Video analysis using frame-based consistency checks

Audio analysis using signal-based heuristics

Supports multiple image, video, and audio formats

Simple and responsive frontend interface

Single unified backend API

----------------------------------------
## Supported Media Formats
### Images
JPG,JPEG,PNG,WEBP,BMP

### Videos
MP4,AVI,MKV,MOV,WEBM

### Audio
WAV,MP3,OGG,AAC,FLAC,M4A

----------------------------------------
## Tech Stack
### Frontend
HTML
CSS
JavaScript

### Backend
Python
FastAPI
OpenCV
NumPy
Torch
Transformers
Media Processing
FFmpeg

----------------------------------------
## System Architecture
Frontend handles user interaction, uploads, and result rendering
Backend handles all analysis and detection logic
Communication via REST API
Clear separation between UI and detection logic

----------------------------------------
## How It Works
User uploads an image, video, or audio file
Frontend sends the file to the backend /analyze endpoint
Backend processes the file based on media type
Analysis results are returned as structured JSON
Frontend displays risk level, confidence score, indicators, and explanation

----------------------------------------
## Running the Project
### Backend Setup

Install required Python packages

Ensure FFmpeg is installed and available in PATH

Run the backend server

uvicorn main:app --reload


Backend runs at

http://127.0.0.1:8000

### Frontend Setup

Open index.html directly in a browser

Or use a local server such as Live Server

----------------------------------------
## Output Explanation

Overall Score: Combined probability score

Risk Level: Low, Medium, or High

Indicators: Individual explainable checks

Explanation: Human-readable summary of analysis

### Sample outputs
![alt text](https://github.com/navaneeth2205/Deep_Fake_Detector/frontend/assets/images/image_sample.png?raw=true)

----------------------------------------
## Limitations

Results are probabilistic and not definitive

Video and audio analysis are preliminary

Deepfake techniques evolve rapidly

Not intended for legal or forensic decisions

----------------------------------------
## Future Enhancements

Advanced deepfake models for video

Audio-visual lip-sync consistency checks

Batch media analysis

User authentication and history tracking

Performance optimizations

----------------------------------------
## Disclaimer

This project is intended for educational and awareness purposes only. Detection results should not be treated as absolute proof of authenticity or manipulation.

----------------------------------------
## Team

Developed as a hackathon project focusing on digital security and explainable AI.

----------------------------------------
