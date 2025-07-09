import { createApp } from 'vue';
import Login from './Event.vue';
// import { initializeApp } from "firebase/app";
import firebaseApp from '../../firebase'
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// const firebaseConfig = {
  // apiKey: process.env.VUE_APP_API_KEY,
  // authDomain: process.env.VUE_APP_AUTH_DOMAIN,
  // projectId: process.env.VUE_APP_PROJECT_ID,
  // storageBucket: process.env.VUE_APP_STORAGEBUCKET,
  // messagingSenderId: process.env.VUE_APP_MESSAGING_SENDER_ID,
  // appId: process.env.VUE_APP_APP_ID
// };

// Initialize Firebase
// const app = initializeApp(firebaseConfig);
// console.log(app)
firebaseApp.app;
createApp(Login).mount('#event')
