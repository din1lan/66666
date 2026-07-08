// Firebase initialization.
//
// PROTOTYPE NOTE: this currently points at the local Firebase Emulator Suite
// (Firestore + Storage + Auth) so the app is fully runnable/testable without a
// real Firebase project. Before going to production:
//   1. Create a real Firebase project, drop its config into .env.local as
//      VITE_FIREBASE_* vars (see .env.example).
//   2. Set VITE_USE_EMULATORS=false.
//   3. Replace the permissive auth-only security rules in firestore.rules /
//      storage.rules with real per-case / per-role access control — see the
//      TODO markers in those files. This is the single highest-risk item in
//      the whole system: a Storage rule mistake here means one client's case
//      file becomes readable by someone with no business seeing it.
import { initializeApp } from 'firebase/app'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getStorage, connectStorageEmulator } from 'firebase/storage'
import { getAuth, connectAuthEmulator, signInAnonymously } from 'firebase/auth'

const useEmulators = import.meta.env.VITE_USE_EMULATORS !== 'false'

const firebaseConfig = useEmulators
  ? {
      // Any project id works against the emulator suite.
      projectId: 'law-firm-app-demo',
      apiKey: 'demo-key',
      authDomain: 'law-firm-app-demo.firebaseapp.com',
      storageBucket: 'law-firm-app-demo.appspot.com',
    }
  : {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    }

export const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const storage = getStorage(app)
export const auth = getAuth(app)

let emulatorsConnected = false
if (useEmulators && !emulatorsConnected) {
  emulatorsConnected = true
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
  connectStorageEmulator(storage, '127.0.0.1', 9199)
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
}

// Prototype-only auth: sign everyone in anonymously so uid-scoped security
// rules and "who did this" fields (uploadedBy, confirmedBy...) have something
// real to point at. Replace with real staff accounts + custom claims
// (role, assigned case IDs) before this leaves the prototype stage.
export function ensureSignedIn() {
  return new Promise((resolve, reject) => {
    const unsub = auth.onAuthStateChanged((user) => {
      unsub()
      if (user) {
        resolve(user)
      } else {
        signInAnonymously(auth).then((cred) => resolve(cred.user)).catch(reject)
      }
    }, reject)
  })
}
