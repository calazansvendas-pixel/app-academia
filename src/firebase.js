import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA3890izvwJy9-Lq7itACSYZHSWZ9ose9U",
  authDomain: "app-academia-f2f81.firebaseapp.com",
  projectId: "app-academia-f2f81",
  storageBucket: "app-academia-f2f81.firebasestorage.app",
  messagingSenderId: "109275262361",
  appId: "1:109275262361:web:1423df1f6c2fc560d2f708"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
