<template>
  <div class="login">
    <h1>Login</h1>
    <!-- <form @submit.prevent="LoginFunction">
      <input type="text" placeholder="Email" v-model="email">
      <input type="password" placeholder="Enter Password" v-model="password">
      <input type="submit" value="Login">
    </form> -->
    <div id="additionalLogInOptions">
        <div id="googleLogIn">
            <button type="button" @click="googleSignIn">Sign in with Google</button>
        </div>
    </div>
    <!-- <p>Need an account? <router-link to="/Register">Register Here</router-link></p> -->
  </div>
</template>

<script>
import { ref } from 'vue';
import { getApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
// import firebaseApp from '../../../firebase'

export default {
  setup() {
    const email = ref('');
    const password = ref('');
    const auth = getAuth(getApp());

    const LoginFunction = () => {
      signInWithEmailAndPassword(auth, email.value, password.value)
        .then(data => console.log(data))
        // eslint-disable-next-line
        .catch(err => alert(err.message));
    };

    const googleSignIn = () => {
      const provider = new GoogleAuthProvider();
      signInWithPopup(auth, provider)
        .then(result => {
          console.log('User signed in:', result.user);
        })
        // eslint-disable-next-line
        .catch(error => alert(error.message));
    };

    return {
      LoginFunction,
      googleSignIn,
      email,
      password,
    };
  },
};
</script>


<style lang="scss" scoped>

</style>