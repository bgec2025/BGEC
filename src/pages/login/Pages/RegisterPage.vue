<template>
    <div class="Register">
        <!-- <h1>Register</h1>
        <form action="" @submit.prevent="RegisterFunction">
            <input type="text" placeholder="Email" v-model="email">
            <input type="password" placeholder="Enter Password" v-model="password">
            <input type="submit" value="Login">
            <p>Have an account? <router-link to="/Login">Login Here</router-link></p>
        </form>
        <div id="additionalSignInOptions">
            <div id="googleSignIn">
                <button @click.prevent="googleSignIn">Sign In With Google</button>
            </div>
        </div> -->
    </div>
</template>

<script>
import {ref} from 'vue';
import {getApp} from 'firebase/app';
import {getAuth, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider} from 'firebase/auth';
// import firebaseApp from '../../../firebase'
export default{
    setup(){
        const email = ref("");
        const password = ref("");
        const auth  = getAuth(getApp())
        const provider = new GoogleAuthProvider();
        
        const googleSignIn = ()=>
        {
            signInWithPopup(auth, provider)
        .then((result)=>{
            console.log("user signed in:", result.user);
        })
        // eslint-disable-next-line
        .catch((err)=>alert(err.message))
    }

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
            googleSignIn,
            email,
            password
        }
    }   
}
</script>

<style scoped>

</style>