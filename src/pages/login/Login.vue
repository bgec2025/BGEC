
<template>
<RouterView></RouterView>
</template>

<script>
import { onBeforeMount } from 'vue';
import { useRouter } from 'vue-router';
import { useRoute } from 'vue-router';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getApp } from "firebase/app";

export default {
  name: "LoginPage",
  setup() {
    const router = useRouter();
    const route = useRoute();

    onBeforeMount(() => {
      const auth = getAuth(getApp());
      onAuthStateChanged(auth, (user) => {
        if (!user) {
          router.replace('/Login');
        } else if (route.path == '/Login' || route.path == '/Register') {
          router.replace('/');
        }
      });
    });
  }
}

</script>

<style>
</style>