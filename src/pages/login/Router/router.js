import { createRouter, createWebHashHistory } from 'vue-router';
// import Login from '../Login.vue';
// import RegisterPage from '../Pages/RegisterPage.vue';
// import LoginPage from '../Pages/LoginPage.vue'

const routes = [
  { path: '/',name: "Login sucessful", component: ()=>import('../Login.vue') },
  { path: '/Register',name: "Register Page", component: ()=>import('../Pages/RegisterPage.vue') },
  { path: '/Login', name:"Login Page", component: ()=>import('../Pages/LoginPage.vue') }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

export default router;