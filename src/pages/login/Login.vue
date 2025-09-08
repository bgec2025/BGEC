<template>
  <RouterView></RouterView>
</template>

<script>
/* eslint-disable */
import { onBeforeMount, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useRoute } from 'vue-router';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

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
          // Check for BITS Goa email
          if (!user.email.endsWith('@goa.bits-pilani.ac.in')) {
            await auth.signOut();
            alert('Please login via your BITS Email');
            router.replace('/Login');
            return;
          }
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
            }, { merge: true });
          }

          if (route.path == '/Login') {
            // eslint-disable-next-line
            console.log("Making the documents right now");

            setTimeout(() => { window.location.href = '/index.html' }, 1000);
          }

        }
      });
    });

    // onMounted(()=>{
    //   onAuthStateChanged(auth,async(user)=>{
    //     if(user){//eslint-disable-next-line
    //       window.location.href = '/index.html';
    //     }
    //   })
    // })
  }
};

</script>

<style></style>