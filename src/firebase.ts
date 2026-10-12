import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "semiotic-polygon-36shk",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
