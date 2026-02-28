// Firebase SDK imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyBW0Cc4s--bZu6qv64mbkV-rW0vMMg7ypc",
    authDomain: "foodapp-4f002.firebaseapp.com",
    projectId: "foodapp-4f002",
    storageBucket: "foodapp-4f002.firebasestorage.app",
    messagingSenderId: "197666732238",
    appId: "1:197666732238:web:258c6466425171c491f89f"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);