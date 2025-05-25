// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getAuth} from "firebase/auth";
import {getFirestore} from "@firebase/firestore";
import { getStorage } from "firebase/storage";
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD70IScOQDqkMWIuqV4LEuo_n0_O-JbcAo",
  authDomain: "point-of-sale-d2940.firebaseapp.com",
  projectId: "point-of-sale-d2940",
  storageBucket: "point-of-sale-d2940.firebasestorage.app",
  messagingSenderId: "139523289583",
  appId: "1:139523289583:web:08c4c4bea267c3703a461a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const storage = getStorage(app);
const db = getFirestore(app);
export {auth, db, storage};