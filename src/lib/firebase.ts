import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBhdos3JjsCF6K3xm7nF2EfmMJ2GVkXbxU",
  authDomain: "silverline-bdd-test-dashboard.firebaseapp.com",
  projectId: "silverline-bdd-test-dashboard",
  storageBucket: "silverline-bdd-test-dashboard.firebasestorage.app",
  messagingSenderId: "863266047324",
  appId: "1:863266047324:web:493bc106be7372c92e6d99",
};

function getDb(): Firestore {
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  return getFirestore(app);
}

export { getDb, firebaseConfig };
