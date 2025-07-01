import { createApp } from 'vue';
import Login from './Home.vue';
// import { initializeApp } from "firebase/app";
import firebaseApp from '../../firebase'

firebaseApp.app;
createApp(Login).mount('#homepage')
