// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore"; // 1. 👈 檢查有沒有引入這行

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAq3CnmbINHpJZfDTNwS96RWVnZW19ATeg",
  authDomain: "music-3523a.firebaseapp.com",
  projectId: "music-3523a",
  storageBucket: "music-3523a.firebasestorage.app",
  messagingSenderId: "982072352857",
  appId: "1:982072352857:web:70ed71c934f05554f71148",
  measurementId: "G-0XG4HWRG65"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// 2. 👈 關鍵！一定要加上這一行，把 db 建立並 export 給 App.tsx 使用
export const db = getFirestore(app);