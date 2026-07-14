
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

// Inicializa o Firebase com o arquivo de configuração
const app = initializeApp(firebaseConfig);

// Exporta o serviço de autenticação
export const auth = getAuth(app);

// Exporta o banco de dados (Firestore) com o ID correto e ignoreUndefinedProperties habilitado
const databaseId = (firebaseConfig as any).firestoreDatabaseId || "(default)";
export const db = initializeFirestore(app, {
    ignoreUndefinedProperties: true
}, databaseId);

