// ===============================
// STATE MANAGEMENT
// ===============================
let currentTab = 'home';

const files = {
    image: null,
    video: null,
    audio: null
};

// ===============================
// TAB SWITCHING
// ===============================
function switchTab(tabName) {
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('onclick').includes(tabName)) {
            link.classList.add('active');
        }
    });

    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
        content.classList.remove('show');
    });

    const selectedTab = document.getElementById(`${tabName}-tab`);
    if (selectedTab) {
        selectedTab.classList.remove('hidden');
        selectedTab.classList.add('show');
    }

    currentTab = tabName;
}

// ===============================
// FILE HANDLING
// ===============================
function setupFileHandler(type) {
    const dropZone = document.getElementById(`${type}-drop-zone`);
    const input = document.getElementById(`${type}-input`);
    const preview = document.getElementById(`${type}-preview`);

    if (!dropZone) return;

    dropZone.addEventListener('click', () => input.click());

    dropZone.addEventListener('dragover', e => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', e => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        if (e.dataTransfer.files.length) {
            handleFile(e.dataTransfer.files[0], type, preview);
        }
    });

    input.addEventListener('change', e => {
        if (e.target.files.length) {
            handleFile(e.target.files[0], type, preview);
        }
    });
}

async function uploadToGradio(file) {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(
        "https://bnavaneeth0522-deepfake-detection.hf.space/upload",
        {
            method: "POST",
            body: formData
        }
    );

    const json = await res.json();
    return json[0]; // file reference
}

function handleFile(file, type, previewEl) {
    const sizeLimit =
        type === 'image' ? 3 * 1024 * 1024 :
        type === 'video' ? 10 * 1024 * 1024 :
        5 * 1024 * 1024;

    if (file.size > sizeLimit) {
        showToast(`File too large. Max ${sizeLimit / 1024 / 1024}MB`);
        return;
    }

    files[type] = file;
    previewEl.src = URL.createObjectURL(file);
    previewEl.style.display = 'block';

    const dropZone = previewEl.parentElement;
    dropZone.querySelectorAll('i, h3, p').forEach(el => {
        el.style.display = 'none';
    });

    showToast(`${file.name} uploaded`);
}

// Init handlers
setupFileHandler('image');
setupFileHandler('video');
setupFileHandler('audio');

// ===============================
// DETECTION LOGIC (JSON BASED)
// ===============================
async function runDetection(type) {
    if (!files[type]) {
        showToast("Upload a file first");
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

    try {
        // 1. Upload file
        const fileRef = await uploadToGradio(files[type]);

        // 2. Choose endpoint
        let endpoint = "";
        if (type === "image") {
            endpoint = "analyze_image_ui";
        } else if (type === "video") {
            endpoint = "analyze_video_ui";
        } else {
            endpoint = "analyze_audio_ui";
        }

        // 3. Call Gradio inference
        const res = await fetch(
            `https://bnavaneeth0522-deepfake-detection.hf.space/run/${endpoint}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    data: [fileRef]
                })
            }
        );

        const json = await res.json();
        const data = json.data[0];

        // UI updates
        score.textContent = `${data.overall_score}%`;

        if (data.risk_level === "High") {
            badge.textContent = "High Risk";
            badge.className = "result-badge result-fake";
        } else if (data.risk_level === "Medium") {
            badge.textContent = "Medium Risk";
            badge.className = "result-badge result-warning";
        } else {
            badge.textContent = "Low Risk";
            badge.className = "result-badge result-real";
        }

        data.indicators.forEach(ind => {
            const row = document.createElement("div");
            row.className = "indicator-row";
            row.innerHTML = `<span>${ind.name}</span><span>${ind.score}%</span>`;
            indicatorBox.appendChild(row);
        });

        explanationBox.textContent = data.explanation;
        showToast("Analysis complete");

    } catch (err) {
        console.error(err);
        showToast("Backend error");
    } finally {
        btn.disabled = false;
        btn.innerHTML = "Detect Forgery";
    }
}

// ===============================
// RESET
// ===============================
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

    if (input) input.value = "";
    if (preview) {
        preview.src = "";
        preview.style.display = "none";
    }

    if (resultBox) resultBox.style.display = "none";
    if (badge) badge.textContent = "Result";
    if (score) score.textContent = "0%";
    if (indicators) indicators.innerHTML = "";
    if (explanation) explanation.textContent = "";

    if (dropZone) {
        dropZone.querySelectorAll('i, h3, p').forEach(el => {
            el.style.display = 'block';
        });
    }

    showToast("Reset complete");
}

// ===============================
// TOAST
// ===============================
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

