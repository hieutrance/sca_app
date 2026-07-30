import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDxuUuzu-L5cippJqnqujOCLztAj-1smEk",
  authDomain: "smart-car-rental-b2b.firebaseapp.com",
  databaseURL: "https://smart-car-rental-b2b-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "smart-car-rental-b2b",
  storageBucket: "smart-car-rental-b2b.firebasestorage.app",
  messagingSenderId: "693464084729",
  appId: "1:693464084729:web:e7a5e2c5de6dfad7f0f228"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);