<template>
<h1>This is a Home page</h1>
<div v-if="userInfo" class="userInfoTrialDisplay">
    <p>Hello there, {{ userInfo.displayName }}</p>
    <img 
        :src="userInfo.photoURL" 
        alt="user photo"
        referrerpolicy="no-referrer"    
    />
    <p>Email: {{ userInfo.email }}</p>
</div>
</template>

<script>
import { onBeforeMount } from 'vue';
// eslint-disable-next-line
import { useRouter } from 'vue-router';
import firebaseApp from '../../firebase'
import { onAuthStateChanged } from "firebase/auth";
import getUser from '../../getUserData';
import { ref } from 'vue';

const userInfo = ref(null);

export default{
    name: "HomePage",
    setup()
    {
        onBeforeMount(()=> {
            onAuthStateChanged(firebaseApp.auth,async (user)=>{
                if(!user){// eslint-disable-next-line
                    window.location.href = "/login.html"
                }else{// eslint-disable-next-line
                    userInfo.value = await getUser.fetchUserData(user);
                }
            })
        });

        return {userInfo};
    }
}
</script>

<style>
</style>