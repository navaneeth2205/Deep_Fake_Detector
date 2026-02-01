// --- State Management ---
let currentTab = 'home'; // Default to dashboard
const files = {
    image: null,
    video: null,
    audio: null
};

// --- Tab Switching Logic ---
function switchTab(tabName) {
    // 1. Update Navigation UI (Tabs)
    // Find all nav links
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        // Remove active class
        link.classList.remove('active');
        // Add active class if the onclick attribute contains the tabName
        if (link.getAttribute('onclick').includes(tabName)) {
            link.classList.add('active');
        }
    });

    // 2. Hide all content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('show');
        content.classList.add('hidden');
    });

    // 3. Show selected content
    const selectedTab = document.getElementById(`${tabName}-tab`);
    if (selectedTab) {
        selectedTab.classList.remove('hidden');
        selectedTab.classList.add('show');
    }

    currentTab = tabName;
}

// --- File Handling Setup ---
const setupFileHandler = (type) => {
    const dropZone = document.getElementById(`${type}-drop-zone`);
    const input = document.getElementById(`${type}-input`);
    const preview = document.getElementById(`${type}-preview`);

    if (!dropZone) return;

    // Click to upload
    dropZone.addEventListener('click', () => input.click());

    // Drag events
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        if (e.dataTransfer.files.length) {
            handleFile(e.dataTransfer.files[0], type, preview);
        }
    });

    // Input change
    input.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFile(e.target.files[0], type, preview);
        }
    });
};

function handleFile(file, type, previewEl) {
    const sizeLimit = type === 'image' ? 3 * 1024 * 1024 :
        type === 'video' ? 10 * 1024 * 1024 : 5 * 1024 * 1024;

    if (file.size > sizeLimit) {
        showToast(`File too large. Max limit is ${sizeLimit / 1024 / 1024}MB.`);
        return;
    }

    files[type] = file;
    const url = URL.createObjectURL(file);
    previewEl.src = url;
    previewEl.style.display = 'block';

    // Hide icons/text inside dropzone
    const icon = previewEl.parentElement.querySelector('i');
    if (icon) icon.style.display = 'none';
    const texts = previewEl.parentElement.querySelectorAll('p, h3');
    texts.forEach(t => t.style.display = 'none');

    showToast(`${file.name} uploaded successfully.`);
}

// Initialize Handlers
setupFileHandler('image');
setupFileHandler('video');
setupFileHandler('audio');

async function runDetection(type) {
    if (!files[type]) {
        showToast("Please upload a file first.");
        return;
    }

    const btn = document.getElementById(`${type}-detect-btn`);
    const resultBox = document.getElementById(`${type}-result`);
    const badge = document.getElementById(`${type}-badge`);
    const score = document.getElementById(`${type}-score`);
    const indicatorBox = document.getElementById(`${type}-indicators`);
    const explanationBox = document.getElementById(`${type}-explanation`);

    btn.disabled = true;
    btn.innerHTML = "Analyzing...";
    resultBox.style.display = "block";

    indicatorBox.innerHTML = "";
    explanationBox.textContent = "";

    // Gradio expects "data"
    const formData = new FormData();
    formData.append("data", files[type]);

    let endpoint = "";

    if (type === "image") {
        endpoint = "https://bnavaneeth0522-deepfake-detection.hf.space/run/analyze_image_ui";
    } else if (type === "video") {
        endpoint = "https://bnavaneeth0522-deepfake-detection.hf.space/run/analyze_video_ui";
    } else if (type === "audio") {
        endpoint = "https://bnavaneeth0522-deepfake-detection.hf.space/run/analyze_audio_ui";
    }

    try {
        const response = await fetch(endpoint, {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            throw new Error("Backend error");
        }

        const result = await response.json();

        // Gradio wraps output in data[0]
        const outputText = result.data[0];

        explanationBox.textContent = outputText;

        // Extract score
        const scoreMatch = outputText.match(/OVERALL SCORE:\s*(\d+)%/);
        if (scoreMatch) {
            score.textContent = `${scoreMatch[1]}%`;
        }

        // Risk badge
        if (outputText.includes("RISK LEVEL: High")) {
            badge.textContent = "High Risk";
            badge.className = "result-badge result-fake";
        } else if (outputText.includes("RISK LEVEL: Medium")) {
            badge.textContent = "Medium Risk";
            badge.className = "result-badge result-warning";
        } else {
            badge.textContent = "Low Risk";
            badge.className = "result-badge result-real";
        }

        showToast("Analysis complete");

    } catch (err) {
        console.error(err);
        showToast("Backend connection failed");
    } finally {
        btn.disabled = false;
        btn.innerHTML = "Detect Forgery";
    }
}

function resetTool(type) {
    files[type] = null;

    const input = document.getElementById(`${type}-input`);
    const preview = document.getElementById(`${type}-preview`);
    const dropZone = document.getElementById(`${type}-drop-zone`);
    const resultBox = document.getElementById(`${type}-result`);
    const badge = document.getElementById(`${type}-badge`);
    const score = document.getElementById(`${type}-score`);
    const indicators = document.getElementById(`${type}-indicators`);
    const explanation = document.getElementById(`${type}-explanation`);
    const removeBtn = document.getElementById(`${type}-remove-btn`);

    if (input) input.value = "";

    if (preview) {
        preview.src = "";
        preview.style.display = "none";
    }

    if (removeBtn) removeBtn.style.display = "none";

    if (resultBox) resultBox.style.display = "none";

    if (badge) badge.textContent = "Result";

    if (score) score.textContent = "0%";

    if (indicators) indicators.innerHTML = "";

    if (explanation) explanation.textContent = "";

    // Restore drop zone icons/text
    if (dropZone) {
        dropZone.querySelectorAll("i, h3, p").forEach(el => {
            el.style.display = "block";
        });
    }

    showToast("Reset complete");
}


// --- Utility: Toast Notification ---
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);

}
