<template>
  <div class="login-root" :style="{ backgroundImage: 'url(' + currentBg + ')' }">
    <div class="blue-gradient-overlay"></div>

    <div class="text-container">
      <div class="wreck-text" ref="wreckRef">Wreck</div>
      <div class="havoc-text" ref="havocRef">Havoc</div>

      <div class="neon-quote" ref="neonQuoteRef">
        Fuel the Chaos. Rule the Game.
      </div>
    </div>

    <div class="black-overlay"></div>

    <button class="insert-coin-btn" @click="handleCoin" :disabled="isLoading" ref="googleBtnRef">
      Insert Coin
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { getApp } from 'firebase/app'
import { gsap } from 'gsap'
import { TextPlugin } from 'gsap/TextPlugin'

// Register GSAP plugins
gsap.registerPlugin(TextPlugin);

// --- Reactive State & Refs ---
const bgImages = [
  require('@/assets/images/bg1.jpg'),
  require('@/assets/images/bg2.jpg'),
  require('@/assets/images/bg3.jpg'),
  require('@/assets/images/bg4.jpg'),
  require('@/assets/images/bg5.jpg'),
  require('@/assets/images/bg6.jpg'),
  require('@/assets/images/bg7.jpg'),
];
const currentBg = ref(bgImages[Math.floor(Math.random() * bgImages.length)]);
const isLoading = ref(false);
const googleBtnRef = ref(null);
let coinSound;

// Refs for animation targets
const wreckRef = ref(null);
const havocRef = ref(null);
const neonQuoteRef = ref(null);
// pixelQuoteRef is removed as the element is removed to match exact replica
// const pixelQuoteRef = ref(null); // Keep commented for reference if needed later


// --- Lifecycle & Methods ---
onMounted(() => {
  // Initialize the coin sound effect
  // eslint-disable-next-line
  coinSound = new Audio(require('@/assets/sounds/insert-coin.mp3'));
  coinSound.volume = 0.8;

  // --- Animation Setup ---
  const tl = gsap.timeline({ delay: 0.5 });

  // 1. Typewriter animations (Values are from your original code's template)
  tl.from(wreckRef.value, {
    text: "", // Typewriter from empty
    duration: 1.5,
    ease: "power1.in"
  }, "start");

  tl.from(havocRef.value, {
    text: "",
    duration: 1.5,
    ease: "power1.in"
  }, "start");

  tl.from(neonQuoteRef.value, {
    text: "",
    duration: 2,
    ease: "none"
  }, ">-0.5"); // Starts 0.5s before the previous one ends

  // 2. Shift animation for pixel text (Removed as pixel-quote element is not in exact replica)
  // gsap.from(pixelQuoteRef.value, {
  //   opacity: 0,
  //   x: (50 / 1366 * 100) + 'vw', // Scaled 50px shift from right
  //   duration: 1.5,
  //   ease: 'power2.out',
  //   delay: 1 // Delay to start after Wreck/Havoc appear
  // });

  // 3. Neon animation for button is handled by CSS (As per your original code's comment)
});

// onBeforeUnmount is removed as there is no JS-controlled flicker based on your original code's reliance on CSS animation.


async function handleCoin() {
  if (coinSound) {
    coinSound.pause();
    coinSound.currentTime = 0;
    coinSound.play();
  }

  if (isLoading.value) return;
  isLoading.value = true;

  const auth = getAuth(getApp());
  const provider = new GoogleAuthProvider();
  // Animation for button click (Scaled for responsiveness)
  gsap.to(googleBtnRef.value, { scale: 0.95, duration: 0.1, yoyo: true, repeat: 1 });

  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    // Error animation (Scaled for responsiveness)
    gsap.to(googleBtnRef.value, {
      x: [(-10 / 1366 * 100) + 'vw', (10 / 1366 * 100) + 'vw', (-10 / 1366 * 100) + 'vw', (10 / 1366 * 100) + 'vw', '0vw'], 
      duration: 0.5,
      ease: 'power2.out',
    });
  } finally {
    isLoading.value = false;
  }
}
</script>
<style lang="scss" scoped>
// Font imports & variables
@import url("https://fonts.cdnfonts.com/css/norwester");
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

$font-norwester: 'Norwester', sans-serif;
$font-orbitron: 'Orbitron', 'Arial Black', sans-serif;
$font-press: 'Press Start 2P', 'VT323', monospace;

// Reference dimensions
$ref-width: 1366;
$ref-height: 768;

// Root
.login-root {
  position: relative;
  width: 100vw;
  height: 100vh;
  background-color: #050818;
  background-size: cover;
  background-position: center;
  overflow: hidden;
}

// Gradient & overlay layers
.blue-gradient-overlay {
  position: absolute; inset: 0;
  background: radial-gradient(ellipse at center, rgba(28,48,118,0.25) 0%, rgba(9,11,47,0.85) 100%);
  z-index: 1;
}
.black-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(to right, transparent 0%, rgba(0,0,0,0.7) 75%, rgba(0,0,0,0.9) 100%);
  z-index: 2;
}

// Text container
.text-container {
  position: absolute; inset: 0;
  pointer-events: none;
  z-index: 3;
}

// Wreck
.wreck-text {
  position: absolute;
  left: (857.8 / $ref-width) * 100vw;
  top:  (100 / $ref-height) * 100vh;
  width:  (567.9 / $ref-width) * 100vw;
  height: (177.8 / $ref-height) * 100vh;
  font-family: $font-norwester;
  font-size: (177.8 / $ref-height) * 100vh;
  line-height: 1;
  color: #ffffff;
}

// Havoc
.havoc-text {
  position: absolute;
  left: (900 / $ref-width) * 100vw;
  top:  (260 / $ref-height) * 100vh;
  width:  (527.1 / $ref-width) * 100vw;
  height: (165    / $ref-height) * 100vh;
  font-family: $font-norwester;
  font-size: (165 / $ref-height) * 100vh;
  line-height: 1;
  color: #ffffff;
}

// Neon quote
.neon-quote {
  position: absolute;
  left: (910   / $ref-width) * 100vw;
  top:  (420  / $ref-height) * 100vh;
  width:  (500 / $ref-width) * 100vw;
  height: (22.8  / $ref-height) * 100vh;
  font-family: $font-orbitron;
  font-size: (22.8 / $ref-height) * 100vh;
  line-height: 1;
  color: #f0efea;
  
}

// Button
.insert-coin-btn {
  position: absolute;
  z-index: 4;
  left: (960   / $ref-width) * 100vw;
  top:  (546.9  / $ref-height) * 100vh;
  width:  (237.5 / $ref-width) * 100vw;
  height: (43.6  / $ref-height) * 100vh;
  background: rgba(34, 33, 33, 0.3);
  border: none;
  color: #ffffff;
  font-family: $font-press;
  font-size: (18 / $ref-height) * 100vh;
  line-height: (43.6 / $ref-height) * 100vh;
  text-align: center;
  cursor: pointer;
  animation: neon-glow 2s infinite alternate ease-in-out;

  &:hover {
    animation-play-state: paused;
    text-shadow:
      0 0 (20 / $ref-width) * 100vw #fff,
      0 0 (10 / $ref-width) * 100vw #fff,
      0 0 (5  / $ref-width) * 100vw #fff;
  }
  &:disabled {
    opacity: 0.6;
    background: rgba(0,0,0,0.3);
    cursor: not-allowed;
  }
}

@keyframes neon-glow {
  from {
    text-shadow: 0 0 (8 / $ref-width) * 100vw rgba(255,255,255,0.2);
  }
  to {
    text-shadow:
      0 0 (15 / $ref-width) * 100vw rgba(255,255,255,0.8),
      0 0 (5  / $ref-width) * 100vw rgba(255,255,255,0.8);
  }
}
</style>
