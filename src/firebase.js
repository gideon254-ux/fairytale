import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyAZhBmS3JODC7IoxjHbznTdGi5gYBFG6X0',
  authDomain: 'project-tracker-c2cd2.firebaseapp.com',
  projectId: 'project-tracker-c2cd2',
  storageBucket: 'project-tracker-c2cd2.firebasestorage.app',
  messagingSenderId: '898012215027',
  appId: '1:898012215027:web:5238a6386df5e13e6fe986',
  measurementId: 'G-QQTEY5779S',
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, analytics, auth, db };

window.app = app;
window.analytics = analytics;
window.auth = auth;
window.db = db;
