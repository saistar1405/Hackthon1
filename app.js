// Configuration
const REQUIRED_VISIBILITY = 0.5;
const ANGLE_DOWN = 70;
const ANGLE_UP = 160;

// State
let repCount = 0;
let phase = "UP"; // UP or DOWN
let isTesting = false;
let camera = null;
let currentBadge = "Beginner";

// DOM Elements
const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');
const repCountEl = document.getElementById('rep-count');
const phaseEl = document.getElementById('current-phase');
const badgeEl = document.getElementById('current-badge');
const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const warningMsg = document.getElementById('warning-message');
const logoutBtn = document.getElementById('logout-btn');
const userEmailEl = document.getElementById('user-email');
const leaderboardList = document.getElementById('leaderboard-list');

// --- Helper Functions ---

// Calculate Angle between 3 points
function calculateAngle(a, b, c) {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs(radians * 180.0 / Math.PI);
    if (angle > 180.0) {
        angle = 360 - angle;
    }
    return angle;
}

function updateBadge() {
    if (repCount < 10) currentBadge = "Beginner";
    else if (repCount < 25) currentBadge = "Intermediate";
    else currentBadge = "Advanced";
    badgeEl.innerText = currentBadge;
}

function showWarning(msg) {
    if (msg) {
        warningMsg.innerText = msg;
        warningMsg.classList.remove('hidden');
    } else {
        warningMsg.classList.add('hidden');
    }
}

// --- MediaPipe Pose ---

const pose = new Pose({
    locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
    }
});

pose.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    enableSegmentation: false,
    smoothSegmentation: false,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});

pose.onResults((results) => {

    // Draw feed
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    if (results.poseLandmarks && isTesting) {
        // Draw Skeleton
        drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS,
            { color: '#00e676', lineWidth: 4 });
        drawLandmarks(canvasCtx, results.poseLandmarks,
            { color: '#2979ff', lineWidth: 2, radius: 4 });

        // Get Landmarks
        const landmarks = results.poseLandmarks;

        // 1. Cheat Detection
        const nose = landmarks[0];
        const leftAnkle = landmarks[27];
        const rightAnkle = landmarks[28];

        if (nose.visibility < REQUIRED_VISIBILITY) {
            showWarning("⚠️ Face not fully visible! Keep in frame.");
            return;
        } else if (leftAnkle.visibility < 0.2 && rightAnkle.visibility < 0.2) {
            showWarning("⚠️ Full body not visible! Step back.");
            return;
        } else {
            showWarning(""); // Clear warning
        }

        // 2. Logic (Using Left Arm for example)
        const shoulder = landmarks[11];
        const elbow = landmarks[13];
        const wrist = landmarks[15];

        // Only process if arm is visible
        if (shoulder.visibility > REQUIRED_VISIBILITY && elbow.visibility > REQUIRED_VISIBILITY && wrist.visibility > REQUIRED_VISIBILITY) {

            const angle = calculateAngle(shoulder, elbow, wrist);

            // Push-up counter logic
            if (angle > ANGLE_UP) {
                if (phase === "DOWN") {
                    repCount++;
                    repCountEl.innerText = repCount;
                    updateBadge();
                }
                phase = "UP";
            }
            if (angle < ANGLE_DOWN) {
                phase = "DOWN";
            }
            phaseEl.innerText = phase;

            // Draw angle for feedback
            canvasCtx.fillStyle = '#ff1744';
            canvasCtx.font = "24px Inter";
            canvasCtx.fillText(Math.round(angle) + "°", elbow.x * canvasElement.width + 15, elbow.y * canvasElement.height);
        }
    }
    canvasCtx.restore();
});

// --- App Flow ---

startBtn.addEventListener('click', async () => {
    // Basic check for secure context
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showWarning("Camera access denied! Please ensure you are running this on localhost or a secure HTTPS server.");
        return;
    }

    isTesting = true;
    repCount = 0;
    phase = "UP";
    repCountEl.innerText = repCount;
    updateBadge();

    startBtn.classList.add('hidden');
    stopBtn.classList.remove('hidden');

    // Show loading state
    canvasCtx.fillStyle = '#1e212c';
    canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.fillStyle = '#ff9800';
    canvasCtx.font = "20px Inter";
    canvasCtx.textAlign = "center";
    canvasCtx.fillText("Loading AI Model and Camera... please wait.", canvasElement.width / 2, canvasElement.height / 2);

    try {
        camera = new Camera(videoElement, {
            onFrame: async () => {
                if (isTesting) {
                    await pose.send({ image: videoElement }).catch(err => {
                        console.error("Pose Error: ", err);
                    });
                }
            },
            width: 640,
            height: 480
        });

        await camera.start();
        showWarning(""); // Clear warnings on success
    } catch (error) {
        console.error("Camera failed to start:", error);
        showWarning("Failed to access camera. Please allow permissions.");
        startBtn.classList.remove('hidden');
        stopBtn.classList.add('hidden');
        isTesting = false;
    }
});

stopBtn.addEventListener('click', async () => {
    isTesting = false;
    if (camera) {
        camera.stop();
    }

    startBtn.classList.remove('hidden');
    stopBtn.classList.add('hidden');

    // Save to Firebase
    await saveScore();
});

// --- Firebase Integration ---

// Auth Display
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        userEmailEl.innerText = user.email;
        fetchLeaderboard();
    } else {
        window.location.href = "index.html";
    }
});

logoutBtn.addEventListener('click', () => {
    firebase.auth().signOut();
});

async function saveScore() {
    const user = firebase.auth().currentUser;
    if (!user || repCount === 0) return;

    try {
        await firebase.firestore().collection("leaderboard").add({
            email: user.email,
            score: repCount,
            badge: currentBadge,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert(`Score saved: ${repCount} reps!`);
        fetchLeaderboard();
    } catch (e) {
        console.error("Error adding document: ", e);
    }
}

function fetchLeaderboard() {
    firebase.firestore().collection("leaderboard")
        .orderBy("score", "desc")
        .limit(10)
        .onSnapshot((snapshot) => {
            leaderboardList.innerHTML = "";
            let rank = 1;
            snapshot.forEach((doc) => {
                const data = doc.data();
                const li = document.createElement("li");

                li.innerHTML = `
                    <div style="display: flex; align-items: center;">
                        <span class="rank">#${rank}</span>
                        <span class="lb-email">${data.email.split('@')[0]}</span>
                    </div>
                    <div style="display: flex; align-items: center;">
                        <span class="lb-score">${data.score}</span>
                        <span class="lb-badge">${data.badge}</span>
                    </div>
                `;
                leaderboardList.appendChild(li);
                rank++;
            });
        }, (error) => {
            console.error("Leaderboard error:", error);
        });
}

// Draw initial static state to canvas
canvasCtx.fillStyle = '#1e212c';
canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);
canvasCtx.fillStyle = '#9aa0a6';
canvasCtx.font = "20px Inter";
canvasCtx.textAlign = "center";
canvasCtx.fillText("Click 'Start Test' to activate camera", canvasElement.width / 2, canvasElement.height / 2);
