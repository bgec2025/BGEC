<template>
<RouterView></RouterView>
</template>

<script>
import { onBeforeMount, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useRoute } from 'vue-router';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getApp } from "firebase/app";
import {getFirestore, doc, setDoc, getDoc} from 'firebase/firestore';

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
    } else {
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);
      
      // Only set defaults if user document doesn't exist
      if (!userDoc.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          hasParticipated: false,
          participatedAt: null,
          gameName: "",
          bitsID: "",
        });
      } else {
        // Just update basic info without touching participation status
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        }, {merge: true});
      }
      
      if (route.path == '/Login') {
        // eslint-disable-next-line
        window.location.href = '/index.html';
      }
      
    }
  });
});

  onMounted(() => {
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace('/Login');
      }
    });
  });

  }
};

</script>

<style>
</style>