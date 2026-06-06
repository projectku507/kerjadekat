// Konfigurasi Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDemoKey1234567890",
    authDomain: "kerjadekat.firebaseapp.com",
    projectId: "kerjadekat-app",
    storageBucket: "kerjadekat-app.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcd1234efgh5678"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Export untuk digunakan di app.js
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();
