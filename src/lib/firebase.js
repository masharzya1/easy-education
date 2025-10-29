import { initializeApp } from "firebase/app"
import { getAuth, GoogleAuthProvider } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getMessaging, isSupported } from "firebase/messaging"

//(" Initializing Firebase...")

const firebaseConfig = {
  apiKey: "AIzaSyAWjDmHS4zO_u0tBdVY6beUIrqGD7x6cvs",
  authDomain: "easy-education-923e5.firebaseapp.com",
  projectId: "easy-education-923e5",
  storageBucket: "easy-education-923e5.firebasestorage.app",
  messagingSenderId: "84493551579",
  appId: "1:84493551579:web:4240c019dc3614cbd5c9fe",
  measurementId: "G-DLYDSEPVKG"
};

let app
let auth
let db
let googleProvider
let messaging

try {
  app = initializeApp(firebaseConfig)

  auth = getAuth(app)
  db = getFirestore(app)
  googleProvider = new GoogleAuthProvider()
  googleProvider.setCustomParameters({
    prompt: 'select_account'
  })

  isSupported().then((supported) => {
    if (supported) {
      messaging = getMessaging(app)
      //(" Firebase Messaging initialized successfully")
    } else {
      console.warn(" Firebase Messaging not supported in this browser")
    }
  }).catch((error) => {
    console.error(" Firebase Messaging initialization error:", error)
  })

  //(" Firebase initialized successfully")
  //(" Project ID:", firebaseConfig.projectId)
  //(" Using imgbb.com for image storage and Firebase Cloud Messaging for notifications")
} catch (error) {
  console.error(" Firebase initialization error:", error)
  throw new Error("Failed to initialize Firebase. Please check your configuration.")
}

export { auth, db, googleProvider, messaging }
export default app
