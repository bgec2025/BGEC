
<template>
<h1>This is a event page</h1>
</template>

<script>
import { onBeforeMount } from 'vue';
// eslint-disable-next-line
import { useRouter } from 'vue-router';
import firebaseApp from '../../firebase'
import { onAuthStateChanged } from "firebase/auth"; 

export default{
    name: "EventPage",
    setup()
    {
        onBeforeMount(()=> {
            onAuthStateChanged(firebaseApp.auth, (user)=>{
                if(!user){
                    // eslint-disable-next-line
                    window.location.href = "/login.html"
                }else{// eslint-disable-next-line
                    
                }
            })
        });
    }
}
</script>

<style>
</style>