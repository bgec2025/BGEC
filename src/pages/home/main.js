import { createApp } from 'vue';
import Login from './Home.vue';
// import { initializeApp } from "firebase/app";
import firebaseApp from '../../firebase'
//import router from '../../pages/login/Router/router'

firebaseApp.app;
createApp(Login).mount('#home')
