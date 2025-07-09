import { createApp } from 'vue';
import Login from './Login.vue';
import router from './Router/router.js';
import firebaseApp from '../../firebase';

// Import global styles
import '../../assets/styles/main.scss';

firebaseApp.app;
createApp(Login).use(router).mount('#login');