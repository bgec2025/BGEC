<template>
  <nav class="navbar">
    <div class="navbar-left">
      <img src="../assets/images/logo.png" alt="Logo" class="logo" />
      <span class="brand">WreckHavoc</span>
    </div>
    <div class="navbar-right">
      <a href="/index.html" class="nav-link">Home</a>
      <a href="/event.html" class="nav-link">Events</a>
      <a href="/leaderboard.html" class="nav-link">Leaderboard</a>
      <button class="signout-btn" @click="signOutUser">Sign Out</button>
    </div>
  </nav>
</template>

<script>
import { getAuth, signOut } from "firebase/auth";
import firebaseApp from '../firebase';

export default {
  name: 'NavigationBar',
  methods: {
    signOutUser() {
      const auth = getAuth(firebaseApp.app);
      signOut(auth).then(() => {
        // eslint-disable-next-line
        window.location.href = './login.html';
      }).catch((error) => {
        console.log('Sign out failed!',error);
      });
    }
  }
}
</script>

<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #181818;
 padding: 0.5rem 2rem;
  height: 64px;
}

.navbar-left {
  display: flex;
  align-items: center;
}

.logo {
  height: 40px;
  margin-right: 1rem;
}

.brand {
  color: orange;
  font-size: 1.8rem;
  font-weight: bold;
  letter-spacing: 2px;
  /* text-shadow: 0 0 8px #ff9900; */
}

.navbar-right {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.nav-link, .signout-btn {
  color: orange;
  background: none;
  border: none;
  font-size: 1.1rem;
  cursor: pointer;
  text-decoration: none;
  transition: text-shadow 0.2s, color 0.2s;
  outline: none;
  padding: 0 0.5rem;
}

.nav-link:hover, .nav-link:active,
.signout-btn:hover, .signout-btn:active {
  color: #fff;
  text-shadow: 0 0 10px orange, 0 0 20px orange;
}

.signout-btn {
  font-weight: bold;
  margin-left: 1.5rem;
  border-radius: 4px;
  padding: 0.3rem 1rem;
}
</style>