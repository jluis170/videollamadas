import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/auth';
import 'firebase/storage';
import 'firebase/functions';
import 'firebase/messaging';

var firebaseConfig = {
    apiKey: "AIzaSyBQd2bCgF5_nYmOvurtcBYh8MwO6iICCnw",
    authDomain: "videollamadas-2cbb4.firebaseapp.com",
    projectId: "videollamadas-2cbb4",
    storageBucket: "videollamadas-2cbb4.appspot.com",
    messagingSenderId: "796977236946",
    appId: "1:796977236946:web:a5c941f21b24cd9a89160b"
  };
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  export default firebase;