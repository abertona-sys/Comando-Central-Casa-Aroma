import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

let app;
let db: any;
let auth: any;

try {
  if (!firebaseConfig || !firebaseConfig.apiKey) {
    throw new Error("La configuración de Firebase está incompleta en el archivo JSON.");
  }
  app = initializeApp(firebaseConfig);
  db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
  auth = getAuth(app);
} catch (error) {
  console.error("Error inicializando Firebase:", error);
}

export { db, auth };
