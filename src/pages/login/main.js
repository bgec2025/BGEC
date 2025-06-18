import { createApp } from 'vue';
import Login from './Login.vue';
import { initializeApp } from "firebase/app";
import router from './Router/router'
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCTVuCtWbZs_Sxn6RvmmJ2qVdaUQksvNBU",
  authDomain: "wreckhavoc-4c9b4.firebaseapp.com",
  projectId: "wreckhavoc-4c9b4",
  storageBucket: "wreckhavoc-4c9b4.firebasestorage.app",
  messagingSenderId: "365102349927",
  appId: "1:365102349927:web:386f38cd9e7bab83d99ec2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
console.log(app)
createApp(Login).use(router).mount('#loginpage')