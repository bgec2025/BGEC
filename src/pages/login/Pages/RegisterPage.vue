<template>
    <div class="Register">
        <h1>Register</h1>
        <form action="" @submit.prevent="RegisterFunction">
            <input type="text" placeholder="Email" v-model="email">
            <input type="password" placeholder="Enter Password" v-model="password">
            <input type="submit" value="Login">
            <p>Have an account? <router-link to="/Login">Login Here</router-link></p>
        </form>
    </div>
</template>

<script>
import {ref} from 'vue';
import {getApp} from 'firebase/app'
import {getAuth, createUserWithEmailAndPassword} from 'firebase/auth'
export default{
    setup(){
        const email = ref("");
        const password = ref("");
        const auth  = getAuth(getApp())

        const RegisterFunction = ()=>{
            createUserWithEmailAndPassword(auth, email.value, password.value)
            .then(user => {
                console.log(user);
            })
            .catch(err => {
                console.log(err.message);
            })
        }
        return {
            RegisterFunction,
            email,
            password
        }
    }   
}
</script>

<style scoped>

</style>