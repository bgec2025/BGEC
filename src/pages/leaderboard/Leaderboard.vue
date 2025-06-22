<template>
  <h1>This is a leaderboard page</h1>
  <div v-if="userInfo">
    <p>Welcome, {{ userInfo.displayName }}</p>
    <img
  :src="userInfo.photoURL"
  alt="User Photo"
  referrerpolicy="no-referrer"
/>
    <p>Email: {{ userInfo.email }}</p>
  </div>
</template>


<script>
import { onBeforeMount } from 'vue';
// eslint-disable-next-line
import { useRouter } from 'vue-router';
import fetchUser from '../../getUserData';
import {ref} from 'vue';
import firebaseApp from '../../firebase'
import { onAuthStateChanged } from "firebase/auth"; 

const userInfo = ref(null);

export default{
    name: "LeaderboardPage",
    setup()
    {
        onBeforeMount(()=> {
            onAuthStateChanged(firebaseApp.auth, async (user)=>{
                if(!user){// eslint-disable-next-line
                    window.location.href = "/login.html"
                }else{
                    userInfo.value = await fetchUser.fetchUserData(user);
                }
            })
        });
        return {userInfo,}
    }
}
</script>

<style>
</style>