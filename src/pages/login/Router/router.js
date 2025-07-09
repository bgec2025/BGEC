import { createRouter, createWebHashHistory } from 'vue-router';
import HomePage from '../../home/Home.vue';
import EventPage from '../../eventpage/Event.vue';
import LeaderboardPage from '../../leaderboard/Leaderboard.vue';

const routes = [
  {path: '/home' , name: 'HomePage', component: HomePage},
  {path: '/event' , name: 'EventPage', component: EventPage},
  {path: '/leaderboard' , name: 'LeaderboardPage', component: LeaderboardPage},
  { path: '/login', name:"Login Page", component: ()=>import('../Pages/LoginPage.vue') }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

export default router;