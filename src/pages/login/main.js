import { createApp } from 'vue';
import Login from './Login.vue';
import router from './Router/router.js';
import firebaseApp from '../../firebase';

firebaseApp.app;
createApp(Login).use(router).mount('#login');