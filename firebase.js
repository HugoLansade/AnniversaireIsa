// Firebase connection.
// The configuration below is public by nature: it identifies the project,
// it gives access to nothing. The data is protected by the Firestore security
// rules (firestore.rules file, to paste into the Firebase console).

export const firebaseConfig = {
  apiKey: "AIzaSyC6DbFBlL5hamVKb7tWIkFx5Z9hTpfv7GQ",
  authDomain: "annisa-b918a.firebaseapp.com",
  projectId: "annisa-b918a",
  storageBucket: "annisa-b918a.firebasestorage.app",
  messagingSenderId: "1094867312765",
  appId: "1:1094867312765:web:2e1d2f3c597f3a514a1114"
};

// How guests get in:
//  "email" — they type their address and are in right away (Spark plan, free);
//  "lien"  — they get a sign-in link by email (Blaze plan recommended:
//            the Spark plan only sends 5 links a day). Remember to also set
//            entreeParEmailAutorisee() to false in the Firestore rules.
// Organizers always confirm their address with a link.
export const modeInvites = "email";

export { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
export {
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
  signOut,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
export {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  writeBatch
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
