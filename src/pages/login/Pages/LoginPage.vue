<template>
    <div class="login">
        <h1>Login</h1>
        <form action="" @submit.prevent="LoginFunction">
            <input type="text" placeholder="Email" v-model="email">
            <input type="password" placeholder="Enter Password" v-model="password">
            <input type="submit" value="Login">
            <p>Need an account? <router-link to="/Register">Register Here</router-link></p>
        </form>
    </div>
</template>

<script>
/* eslint-disable no-unused-vars, no-undef */

import {ref} from 'vue';
import {getApp} from 'firebase/app';
import {getAuth, onAuthStateChanged, signInWithEmailAndPassword} from 'firebase/auth';
import { addLocale } from 'core-js';
export default{
    setup(){
        const email = ref("");
        const password = ref("");
        const auth = getAuth(getApp())
        const LoginFunction = ()=>{
            signInWithEmailAndPassword(auth, email.value, password.value)
            .then(data=>console.log(data))
            .catch(err=>alert(err.message));
        }
        return {
            LoginFunction,
            email,
            password,
        }
    }
}

</script>

<style lang="scss" scoped>

</style>