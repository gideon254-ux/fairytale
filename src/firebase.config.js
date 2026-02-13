import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAZhBmS3JODC7IoxjHbznTdGi5gYBFG6X0",
  authDomain: "project-tracker-c2cd2.firebaseapp.com",
  projectId: "project-tracker-c2cd2",
  storageBucket: "project-tracker-c2cd2.firebasestorage.app",
  messagingSenderId: "898012215027",
  appId: "1:898012215027:web:5238a6386df5e13e6fe986",
  measurementId: "G-QQTEY5779S"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
