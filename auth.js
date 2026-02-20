// Replace this config with your Firebase project config
// DO NOT commit real keys to public repos. Replace these during deployment.
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
let app, auth, db;
try {
    app = firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();
} catch (error) {
    console.warn("Firebase not configured perfectly yet. If testing locally, update firebaseConfig. Auth might fail.");
}

// Redirect if already logged in
if (auth) {
    auth.onAuthStateChanged((user) => {
        if (user && window.location.pathname.includes("index.html")) {
            window.location.href = "app.html";
        }
        if (!user && window.location.pathname.includes("app.html")) {
            window.location.href = "index.html";
        }
    });
}

// Auth UI Logic
document.addEventListener("DOMContentLoaded", () => {
    const toggleBtn = document.getElementById("toggle-auth");
    const formTitle = document.getElementById("form-title");
    const authBtn = document.getElementById("auth-btn");
    const errorMsg = document.getElementById("error-message");

    const emailInput = document.getElementById("email");
    const passInput = document.getElementById("password");

    let isLogin = true;

    if (toggleBtn) {
        const toggleAuthUI = (e) => {
            isLogin = !isLogin;
            formTitle.innerText = isLogin ? "Login" : "Register";
            authBtn.innerText = isLogin ? "Login" : "Register";

            const pElement = document.querySelector(".toggle-text");
            if (pElement) {
                pElement.innerHTML = isLogin ?
                    `Don't have an account? <span id="toggle-auth" style="color:var(--primary);cursor:pointer;">Register</span>` :
                    `Already have an account? <span id="toggle-auth" style="color:var(--primary);cursor:pointer;">Login</span>`;

                // Re-bind event listener after innerHTML change
                document.getElementById("toggle-auth").addEventListener("click", toggleAuthUI);
            }
        };

        toggleBtn.addEventListener("click", toggleAuthUI);
    }

    if (authBtn) {
        authBtn.addEventListener("click", async () => {
            const email = emailInput.value;
            const password = passInput.value;
            errorMsg.classList.add("hidden");

            if (!email || !password) {
                showError("Please fill in both fields.");
                return;
            }

            try {
                if (isLogin) {
                    await auth.signInWithEmailAndPassword(email, password);
                } else {
                    await auth.createUserWithEmailAndPassword(email, password);
                }
                window.location.href = "app.html";
            } catch (error) {
                showError(error.message);
            }
        });
    }
});

function showError(msg) {
    const errorMsg = document.getElementById("error-message");
    if (errorMsg) {
        errorMsg.innerText = msg;
        errorMsg.classList.remove("hidden");
    }
}
