<template>
<RouterView></RouterView>
</template>

<script>
import { onBeforeMount } from 'vue';
import { useRouter } from 'vue-router';
import { useRoute } from 'vue-router';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getApp } from "firebase/app";
import {getFirestore, doc, setDoc} from 'firebase/firestore';

export default {
  name: "LoginPage",
  setup() {
    const router = useRouter();
    const route = useRoute();
    const auth = getAuth(getApp());
    const db = getFirestore(getApp());

    onBeforeMount(() => {
      onAuthStateChanged(auth, async (user) => {
        if (!user) {
          router.replace('/Login');
        } else  {
            const userRef = doc(db, "users", user.uid);
            await setDoc(userRef, {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
            }, {merge:true});
            if (route.path == '/Login' || route.path == '/Register')
            {
              router.replace('/');
            }
            // eslint-disable-next-line
            window.location.href = '/homepage.html';
        }
        
        
    });
    });
  }
}

</script>

<style>
</style>