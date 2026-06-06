import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  collection as firestoreCollection, 
  addDoc as firestoreAddDoc, 
  getDocs as firestoreGetDocs, 
  onSnapshot as firestoreOnSnapshot, 
  query as firestoreQuery, 
  orderBy as firestoreOrderBy, 
  limit as firestoreLimit,
  doc as firestoreDoc,
  getDocFromServer
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Detect placeholder setup
const isPlaceholder = !firebaseConfig.apiKey || firebaseConfig.apiKey === 'placeholder-api-key';

let app: any = null;
let db: any = null;
let auth: any = null;

if (!isPlaceholder) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    auth = getAuth(app);
    
    // Quick validation check from skill
    const testConnection = async () => {
      try {
        await getDocFromServer(firestoreDoc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.warn("Firebase collection offline: please verify rules and configuration.");
        }
      }
    };
    testConnection();
  } catch (err) {
    console.error("Firebase startup failure, falling back:", err);
  }
}

// Error Handling helper matching HIPAA / Secure Database constraints
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || 'guest-local',
      email: auth?.currentUser?.email || 'guest@example.com',
      emailVerified: auth?.currentUser?.emailVerified || false,
    },
    operationType,
    path
  };
  console.error('Firestore Error Payload: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Fallback Local Storage Storage Driver matching firestore signatures
const localStorageDriver = {
  saveRecord: (path: string, data: any) => {
    try {
      const current = JSON.parse(localStorage.getItem(path) || '[]');
      const newRecord = { ...data, id: Math.random().toString(36).substring(2, 11) };
      current.push(newRecord);
      localStorage.setItem(path, JSON.stringify(current));
      return { id: newRecord.id };
    } catch (e) {
      console.error("Local storage fail:", e);
      return { id: String(Date.now()) };
    }
  },
  getRecords: (path: string) => {
    try {
      const records = JSON.parse(localStorage.getItem(path) || '[]');
      // Sort in decending timestamp order if timestamp exists
      return records.sort((a: any, b: any) => {
        const tA = a.timestamp?.seconds || a.timestamp || 0;
        const tB = b.timestamp?.seconds || b.timestamp || 0;
        return tB - tA;
      });
    } catch (e) {
      return [];
    }
  }
};

// Custom collection wrapper
export function getCollection(path: string) {
  if (!isPlaceholder && db) {
    return firestoreCollection(db, path);
  }
  return { path, isLocal: true };
}

// Add document wrapping
export async function addDocSync(collectionRef: any, data: any) {
  const timestamp = new Date();
  const docPayload = {
    ...data,
    timestamp: isPlaceholder ? timestamp.toISOString() : data.timestamp || timestamp,
  };

  if (!isPlaceholder && db && collectionRef && !collectionRef.isLocal) {
    try {
      return await firestoreAddDoc(collectionRef, docPayload);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, collectionRef.path || 'unknown');
    }
  } else {
    // Local fallback
    const path = collectionRef?.path || 'fallback';
    const saved = localStorageDriver.saveRecord(path, docPayload);
    return saved;
  }
}

// Get documents query matching API
export async function getDocsSync(collectionRef: any) {
  if (!isPlaceholder && db && collectionRef && !collectionRef.isLocal) {
    try {
      const snapshot = await firestoreGetDocs(collectionRef);
      return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as object) }));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, collectionRef.path || 'unknown');
    }
  } else {
    const path = collectionRef?.path || 'fallback';
    return localStorageDriver.getRecords(path);
  }
}

// Unified onSnapshot wrapper that allows reactive components to subscribe
export function onSnapshotSync(collectionRef: any, callback: (data: any[]) => void, errorCallback?: (err: any) => void) {
  if (!isPlaceholder && db && collectionRef && !collectionRef.isLocal) {
    return firestoreOnSnapshot(collectionRef, (snapshot) => {
      const records = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as object) }));
      callback(records);
    }, (error) => {
      if (errorCallback) errorCallback(error);
      handleFirestoreError(error, OperationType.GET, collectionRef.path || 'unknown');
    });
  } else {
    // Return early payload
    const path = collectionRef?.path || 'fallback';
    const records = localStorageDriver.getRecords(path);
    callback(records);

    // Set up local storage poll change listener
    const interval = setInterval(() => {
      const active = localStorageDriver.getRecords(path);
      callback(active);
    }, 2000);

    return () => clearInterval(interval);
  }
}

export { db, auth, isPlaceholder };
