<template>
  <div class="login-root" :style="{ backgroundImage: 'url(' + currentBg + ')' }">
    <div class="blue-gradient-overlay"></div>

    <div class="text-container">
      <div class="wreck-text" ref="wreckRef">BITS Goa</div>
      <div class="havoc-text" ref="havocRef">ESPORTS Club</div>
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
import { ref, onMounted, onBeforeUnmount } from 'vue'
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

const mobileBgImages = [
  require('@/assets/images/mobile_bg_1.jpg'),
  require('@/assets/images/mobile_bg_2.jpg'),
  require('@/assets/images/mobile_bg_3.jpg'),
  require('@/assets/images/mobile_bg_4.jpg'),
  require('@/assets/images/mobile_bg_5.jpg'),
];

//eslint-disable-next-line
const isMobile = ref(window.innerWidth <= 768);
const currentBg = ref(
  isMobile.value 
    ? mobileBgImages[Math.floor(Math.random() * mobileBgImages.length)]
    : bgImages[Math.floor(Math.random() * bgImages.length)]
);

const isLoading = ref(false);
const googleBtnRef = ref(null);
let coinSound;
let resizeHandler;

// Refs for animation targets
const wreckRef = ref(null);
const havocRef = ref(null);
const neonQuoteRef = ref(null);

// --- Lifecycle & Methods ---
onMounted(() => {
  // Initialize the coin sound effect
  //eslint-disable-next-line
  coinSound = new Audio(require('@/assets/sounds/insert-coin.mp3'));
  coinSound.volume = 0.8;

  // Handle window resize
  resizeHandler = () => {
    //eslint-disable-next-line
    const wasMobile = isMobile.value;
    //eslint-disable-next-line
    isMobile.value = window.innerWidth <= 768;
    
    if (wasMobile !== isMobile.value) {
      currentBg.value = isMobile.value 
        ? mobileBgImages[Math.floor(Math.random() * mobileBgImages.length)]
        : bgImages[Math.floor(Math.random() * bgImages.length)];
    }
  };
  //eslint-disable-next-line
  window.addEventListener('resize', resizeHandler);

  // --- GSAP Animation Setup ---
  gsap.matchMedia().add("(min-width: 769px)", () => {
    // Desktop animations
    const tl = gsap.timeline({ delay: 0.5 });

    tl.from(wreckRef.value, {
      text: "",
      duration: 0.8,
      ease: "power1.in"
    }, "start");

    tl.from(havocRef.value, {
      text: "",
      duration: 0.8,
      ease: "power1.in"
    }, "start");

    tl.from(neonQuoteRef.value, {
      text: "",
      duration: 2,
      ease: "none"
    }, ">-0.5");
  });

  gsap.matchMedia().add("(max-width: 768px)", () => {
    // Mobile animations - ensure button is visible
    const tl = gsap.timeline({ delay: 0.3 });

    // Set initial states
    gsap.set(googleBtnRef.value, { opacity: 1, visibility: 'visible' });

    tl.from(wreckRef.value, {
      opacity: 0,
      y: 20,
      duration: 0.6,
      ease: "power2.out"
    }, "start");

    tl.from(havocRef.value, {
      opacity: 0,
      y: 20,
      duration: 0.6,
      ease: "power2.out"
    }, "start+=0.2");

    tl.from(neonQuoteRef.value, {
      opacity: 0,
      y: 15,
      duration: 0.8,
      ease: "power2.out"
    }, "start+=0.4");

    tl.from(googleBtnRef.value, {
      opacity: 0,
      y: 15,
      duration: 0.6,
      ease: "power2.out"
    }, "start+=0.6");
  });
});

onBeforeUnmount(() => {
  if (resizeHandler) {
    //eslint-disable-next-line
    window.removeEventListener('resize', resizeHandler);
  }
});

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
  
  // Animation for button click
  gsap.to(googleBtnRef.value, { scale: 0.95, duration: 0.1, yoyo: true, repeat: 1 });

  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    // Error animation
    gsap.to(googleBtnRef.value, {
      x: ['-10px', '10px', '-10px', '10px', '0px'], 
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

// Reference dimensions for desktop
$ref-width: 1366;
$ref-height: 768;

// Root
.login-root {
  position: relative;
  width: 100vw;
  min-height: 100vh;
  background-color: #050818;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  overflow: hidden;
  
  // Mobile: Flexbox layout
  @media (max-width: 768px) {
    background-size: cover;
    background-position: center;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    padding-top: 20vh;
    height: 100vh; // Fixed height for proper centering
    overflow-y: auto;
  }
}

// Gradient & overlay layers
.blue-gradient-overlay {
  position: absolute; 
  inset: 0;
  background: radial-gradient(ellipse at center, rgba(28,48,118,0.25) 0%, rgba(9,11,47,0.85) 100%);
  z-index: 1;
  
  @media (max-width: 768px) {
    background: radial-gradient(ellipse at center, rgba(28,48,118,0.15) 0%, rgba(9,11,47,0.6) 100%);
  }
}

.black-overlay {
  position: absolute; 
  inset: 0;
  background: linear-gradient(to right, transparent 0%, rgba(0,0,0,0.7) 75%, rgba(0,0,0,0.9) 100%);
  z-index: 2;
  
  @media (max-width: 768px) {
    background: rgba(0,0,0,0.35);
  }
}

// Text container
.text-container {
  position: absolute; 
  inset: 0;
  pointer-events: none;
  z-index: 3;
  
  @media (max-width: 768px) {
    position: static;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    text-align: center;
    padding: 0 2rem;
    margin-bottom: 3rem;
  }
}

// Wreck - Desktop positioning
.wreck-text {
  position: absolute;
  left: (880 / $ref-width) * 100vw;
  top:  (100 / $ref-height) * 100vh;
  width:  (600 / $ref-width) * 100vw;
  height: (177.8 / $ref-height) * 100vh;
  font-family: $font-norwester;
  font-size: (140 / $ref-height) * 100vh;
  line-height: 1;
  color: #ffffff;
  
  // Mobile: Centered and responsive
  @media (max-width: 768px) {
    position: static;
    width: auto;
    font-size: 17vw;
    gap: 0.5rem;
    text-shadow: 3px 3px 6px rgba(0,0,0,0.9);
    letter-spacing: 2px;
    line-height: 1;
  }
}

// Havoc - Desktop positioning
.havoc-text {
  position: absolute;
  left: (780 / $ref-width) * 100vw;
  top:  (260 / $ref-height) * 100vh;
  width:  (700 / $ref-width) * 100vw;
  height: (165    / $ref-height) * 100vh;
  font-family: $font-norwester;
  font-size: (120 / $ref-height) * 100vh;
  line-height: 1;
  color: #ffffff;
  
  // Mobile: Centered and responsive
  @media (max-width: 768px) {
    position: static;
    font-size: 14vw;
    width: auto;
    gap: 1rem;
    text-shadow: 3px 3px 6px rgba(0,0,0,0.9);
    letter-spacing: 2px;
    line-height: 1;
    transform: translateY(-4rem);
  }
}

// Neon quote - Desktop positioning
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
  // Mobile: Centered and responsive
  @media (max-width: 768px) {
    position: static;
    width:auto;
    font-size: 4.5vw;
    margin-bottom: 2rem;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.9);
    transform: translateY(-6rem);
    max-width: 90vw;
  }
}

// Button - Desktop positioning
.insert-coin-btn {
  position: absolute;
  z-index: 10; // Increased z-index
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
  
  // Mobile: Centered and responsive
  @media (max-width: 768px) {
    position: static; // Changed from relative to static
    z-index: 10;
    width: 80vw;
    max-width: 320px;
    height: 60px;
    font-size: 14px;
    line-height: 60px;
    border-radius: 6px;
    background: rgba(34, 33, 33, 0.8);
    backdrop-filter: blur(15px);
    border: 2px solid rgba(255,255,255,0.3);
    margin-top: auto;
    margin-bottom: 10vh;
    text-shadow: 0 0 10px rgba(255,255,255,0.5);
    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    
    // Touch-friendly styling
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }

  &:hover {
    animation-play-state: paused;
    text-shadow:
      0 0 (20 / $ref-width) * 100vw #fff,
      0 0 (10 / $ref-width) * 100vw #fff,
      0 0 (5  / $ref-width) * 100vw #fff;
      
    @media (max-width: 768px) {
      text-shadow:
        0 0 15px #fff,
        0 0 8px #fff,
        0 0 4px #fff;
      transform: scale(1.02);
    }
  }
  
  &:active {
    @media (max-width: 768px) {
      transform: scale(0.98);
      background: rgba(34, 33, 33, 0.9);
    }
  }
  
  &:disabled {
    opacity: 0.6;
    background: rgba(0,0,0,0.3);
    cursor: not-allowed;
    
    @media (max-width: 768px) {
      background: rgba(0,0,0,0.5);
    }
  }
}

@keyframes neon-glow {
  from {
    text-shadow: 0 0 (8 / $ref-width) * 100vw rgba(255,255,255,0.2);
    
    @media (max-width: 768px) {
      text-shadow: 0 0 6px rgba(255,255,255,0.3);
    }
  }
  to {
    text-shadow:
      0 0 (15 / $ref-width) * 100vw rgba(255,255,255,0.8),
      0 0 (5  / $ref-width) * 100vw rgba(255,255,255,0.8);
      
    @media (max-width: 768px) {
      text-shadow:
        0 0 12px rgba(255,255,255,0.8),
        0 0 6px rgba(255,255,255,0.8),
        0 0 3px rgba(255,255,255,0.6);
    }
  }
}

// Responsive breakpoints for tablets
@media (min-width: 769px) and (max-width: 1024px) {
  .wreck-text {
    font-size: 14vw;
    left: 50vw;
    transform: translateX(-50%);
    top: 15vh;
  }
  
  .havoc-text {
    font-size: 13vw;
    left: 50vw;
    transform: translateX(-50%);
    top: 30vh;
  }
  
  .neon-quote {
    font-size: 3vw;
    left: 50vw;
    transform: translateX(-50%);
    top: 50vh;
    text-align: center;
  }
  
  .insert-coin-btn {
    left: 50vw;
    transform: translateX(-50%);
    top: 65vh;
    width: 40vw;
    max-width: 300px;
    font-size: 2vw;
  }
}
</style>
