# AI Sports Talent ID Platform

## Folder Structure
```
/
├── index.html     # Landing page (Login/Register)
├── app.html       # Main application page (Push-up tracker)
├── style.css      # Shared styling
├── auth.js        # Firebase authentication logic
├── app.js         # MediaPipe Pose detection and game logic
└── README.md      # Documentation and Script
```

## Architecture

### How Pose Detection Works
We use Google's MediaPipe Pose, which is a lightweight machine learning model. It processes video frames from the webcam in real-time, detecting 33 2D landmarks of the human body. We specifically look at the shoulder, elbow, and wrist to calculate the angle of the elbow joint and determine push-up phases.

### How Edge AI Works in Browser
Instead of sending video feeds to a cloud server (which introduces latency and privacy concerns), the ML model runs directly in the user's browser using WebAssembly and WebGL. This "Edge AI" approach ensures zero latency, protects user privacy (no video leaves the device), and eliminates server inference costs.

### How Data Sync Works
We use Firebase as our Serverless backend. 
- **Firebase Authentication** handles user login and registration securely.
- **Firestore Database** stores users' scores in real-time. Once a rep session is completed, the final score and badge are synced to Firestore, updating the leaderboard immediately.

---

## Step-by-Step Build Instructions

1. **Serve Files Locally:**
   Instead of opening HTML files directly, run a local server (e.g., `npx serve .` or use VS Code Live Server). MediaPipe and webcam access require a secure context (localhost or HTTPS).
   
2. **Setup Firebase:**
   - Go to the Firebase Console, create a new project.
   - Enable Authentication (Email/Password).
   - Enable Firestore Database.
   - Replace the `firebaseConfig` object in `auth.js` and `app.js` with your actual Firebase config.

---

## Deployment Instructions

1. **Vercel or Netlify (Simplest for Hackathons):**
   - Push your folder to a GitHub repository.
   - Connect the repo to Vercel or Netlify.
   - Ensure you add your Firebase Authorized Domains in the Firebase Console (under Authentication -> Settings -> Authorized domains) to allow login from your deployed URL.

---

## 2-Minute Pitch Script

"Hi everyone, we are team [Name]. 

Finding sports talent early is a huge challenge, especially in developing regions where coaches and facilities are scarce. Today, we're introducing our AI Sports Talent Identification platform—accessible to anyone with a browser and a webcam.

Our prototype starts with the fundamental push-up fitness test. Instead of relying on manual counting or expensive sensors, our system uses advanced browser-based Edge AI to track body movements in real-time. 

Here is how it works: An athlete logs in, stands in front of their webcam, and starts doing push-ups. Our Edge AI, running entirely in the browser for zero latency and total privacy, computes joint angles to ensure perfect form. It counts a rep only when the elbow goes below 70 degrees and returns past 160 degrees. 

To maintain integrity, our system includes basic cheat detection—it warns if the full body isn't visible or if multiple people step into the frame. Once finished, their verified score is synced to our real-time cloud leaderboard, categorized into beginner, intermediate, or advanced badges.

This is highly scalable, costs practically nothing to run per user, and opens the door for remote sports recruitment worldwide. Thank you!"
