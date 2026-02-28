import { auth, db } from './config.js';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signInWithPopup, 
    GoogleAuthProvider 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, setDoc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const provider = new GoogleAuthProvider();

// --- ROLE CHECK & REDIRECT ---
async function checkRoleAndRedirect(uid) {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.role === "admin") {
            window.location.href = "admin.html";
        } else {
            window.location.href = "index.html";
        }
    } else {
        // Agar user ka data Firestore mein nahi hai (safety check)
        await setDoc(doc(db, "users", uid), {
            uid: uid,
            role: "customer",
            createdAt: serverTimestamp()
        });
        window.location.href = "index.html";
    }
}

// --- GOOGLE AUTH ---
export async function signInWithGoogle() {
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists()) {
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                name: user.displayName,
                email: user.email,
                role: "customer",
                createdAt: serverTimestamp()
            });
        }
        checkRoleAndRedirect(user.uid);
    } catch (err) { alert(err.message); }
}

// --- EMAIL SIGNUP ---
export async function signUpUser(email, password, fullName) {
    try {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "users", res.user.uid), {
            uid: res.user.uid,
            name: fullName,
            email: email,
            role: "customer",
            createdAt: serverTimestamp()
        });
        alert("Account Created!");
        checkRoleAndRedirect(res.user.uid);
    } catch (err) { alert(err.message); }
}

// --- EMAIL LOGIN ---
export async function loginUser(email, password) {
    try {
        const res = await signInWithEmailAndPassword(auth, email, password);
        checkRoleAndRedirect(res.user.uid);
    } catch (err) { alert("Invalid Credentials"); }
}