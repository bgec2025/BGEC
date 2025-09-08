<template>
  <div class="login-root" :style="{ backgroundImage: 'url(' + currentBg + ')' }">
    <div class="blue-gradient-overlay"></div>
    <div class="black-overlay"></div>
    <div class="login-content-wrapper">
      <!-- Left side: empty for now, just for layout -->
      <div class="login-left"></div>
      <!-- Right side: actual content -->
      <div class="login-right">
        <div class="text-container" ref="textContainerRef">
          <div class="centered-title-group">
            <div class="wreck-text" ref="wreckRef">BITS Goa</div>
            <div class="havoc-text" ref="havocRef">Esports Community</div>
          </div>
          <hr class="divider-line" />
          <div class="neon-quote" ref="neonQuoteRef">
            Fuel the Chaos. Rule the Game.
          </div>
          <button class="insert-coin-btn" @click="handleCoin" :disabled="isLoading" ref="googleBtnRef">
            Insert Coin
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/* eslint-disable */
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

// Additional refs for container adjustment
const textContainerRef = ref(null);
const contentOverflowing = ref(false);
const containerOffset = ref(0);

// Function to check if text is overflowing and adjust container position
const checkTextOverflow = () => {
  if (!wreckRef.value || !havocRef.value || !textContainerRef.value) return;

  // Get container and text dimensions
  const container = textContainerRef.value;
  const wreckEl = wreckRef.value;
  const havocEl = havocRef.value;

  // Calculate the right edge of the container parent (.login-right)
  const parentRect = container.parentElement.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  const containerRightEdge = parentRect.right; // Use parent's right edge instead

  // Get the text elements' dimensions
  const wreckRect = wreckEl.getBoundingClientRect();
  const havocRect = havocEl.getBoundingClientRect();

  // Find the rightmost text edge
  const wreckRightEdge = wreckRect.left + wreckRect.width;
  const havocRightEdge = havocRect.left + havocRect.width;
  const textRightEdge = Math.max(wreckRightEdge, havocRightEdge);

  // Debug check (can be removed in production)
  console.log('Text right edge:', textRightEdge);
  console.log('Container right edge:', containerRightEdge);

  // Check if text is overflowing the container's parent
  contentOverflowing.value = textRightEdge > (containerRightEdge - 10); // Subtract 10px buffer

  // If overflowing, calculate needed offset with padding
  if (contentOverflowing.value) {
    const padding = 30; // Increased padding to ensure text is fully visible
    const neededOffset = textRightEdge - containerRightEdge + padding;
    containerOffset.value = neededOffset;

    // Force the container to be aligned at the start (left) when overflowing
    container.style.transform = `translateX(-${neededOffset}px)`;

    // Ensure all elements inside are visible by setting min-width
    const totalContentWidth = Math.max(wreckRect.width, havocRect.width) + padding;
    container.style.minWidth = `${totalContentWidth}px`;

    // Debug
    console.log('Applied offset:', neededOffset);
  } else {
    // Reset if not overflowing
    containerOffset.value = 0;
    container.style.transform = 'translateX(0)';
    container.style.minWidth = '';
  }
};

// --- Lifecycle & Methods ---
onMounted(() => {
  // Initialize the coin sound effect
  //eslint-disable-next-line
  coinSound = new Audio(require('@/assets/sounds/insert-coin.mp3'));
  coinSound.volume = 0.8;

  // Run the text overflow check after a small delay to ensure DOM is fully rendered
  setTimeout(checkTextOverflow, 300);

  // Set up a mutation observer to detect text changes and recheck overflow
  const textObserver = new MutationObserver(() => {
    checkTextOverflow();
  });

  // Observe both text elements for changes
  if (wreckRef.value && havocRef.value) {
    textObserver.observe(wreckRef.value, { childList: true, characterData: true, subtree: true });
    textObserver.observe(havocRef.value, { childList: true, characterData: true, subtree: true });
  }

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

    // Check for text overflow when window size changes
    setTimeout(checkTextOverflow, 100); // Small delay to ensure DOM is updated
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

    // Check text overflow after animations complete and ensure it's checked multiple times
    tl.call(() => {
      // Run the check multiple times with increasing delays to ensure it works
      // after all animations and font loading are complete
      checkTextOverflow();
      setTimeout(checkTextOverflow, 100);
      setTimeout(checkTextOverflow, 500);
      setTimeout(checkTextOverflow, 1000);
    });
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
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: stretch;
}

.login-content-wrapper {
  display: flex;
  flex-direction: row;
  height: 100vh;
  width: 100vw;
  position: relative;
  z-index: 10;

  @media (max-width: 768px) {
    flex-direction: column;
    height: auto;
    width: 100vw;
  }
}

.login-left {
  flex: 1 1 0;

  // Empty, just for layout spacing
  @media (max-width: 768px) {
    display: none;
  }
}

.login-right {
  flex: 0 0 800px; // Increase from 600px
  max-width: 800px; // Increase from 600px
  min-width: 350px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start; // Changed from center to push content higher
  align-items: center;
  margin-left: auto;
  margin-right: 0;
  height: 100vh;
  position: relative;
  z-index: 10;
  padding-top: 20vh; // Add top padding to position content higher
  padding-bottom: 20vh; // Increased padding to move content up more

  @media (max-width: 1200px) {
    flex: 0 0 600px; // Increase from 480px
    max-width: 600px; // Increase from 480px
    min-width: 320px;
  }

  @media (max-width: 900px) {
    flex: 0 0 100vw;
    max-width: 100vw;
    min-width: 0;
    margin: 0 auto;
    height: auto;
  }

  @media (max-width: 768px) {
    width: 100vw;
    max-width: 100vw;
    min-width: 0;
    margin: 0 auto;
    height: auto;
    align-items: center;
    justify-content: flex-start;
  }
}

// Gradient & overlay layers
.blue-gradient-overlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, rgba(28, 48, 118, 0.25) 0%, rgba(9, 11, 47, 0.85) 100%);
  z-index: 1;

  @media (max-width: 768px) {
    background: radial-gradient(ellipse at center, rgba(28, 48, 118, 0.15) 0%, rgba(9, 11, 47, 0.6) 100%);
  }
}

.black-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to right, transparent 0%, rgba(0, 0, 0, 0.7) 75%, rgba(0, 0, 0, 0.9) 100%);
  z-index: 2;

  @media (max-width: 768px) {
    background: rgba(0, 0, 0, 0.35);
  }
}

// Text container
.text-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  margin-top: 0;
  margin-bottom: 0;
  position: relative;
  z-index: 10;
  min-width: 500px; // Ensure minimum width to prevent wrapping
  max-width: none; // Remove max-width constraint to allow full text visibility
  overflow: visible !important; // Ensure content is visible outside container
  transition: transform 0.3s ease; // Smooth transition when shifting position
  will-change: transform; // Optimize for transform animations

  @media (max-width: 768px) {
    padding: 0 1rem;
    margin-bottom: 3rem;
    min-width: auto; // Reset for mobile
    max-width: 100%; // Allow full width on mobile
    overflow: visible; // Ensure visibility
    transform: none !important; // Disable transform on mobile
  }
}

.centered-title-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  margin-top: 0;
  margin-bottom: 5rem !important; // Increased margin with !important
  overflow: visible; // Change from overflow-x: auto

  @media (max-width: 768px) {
    margin-bottom: 1.2rem;
    white-space: normal;
    overflow: visible; // Change from overflow-x: visible
  }
}

// Wreck - Desktop positioning
.wreck-text {
  font-family: $font-norwester;
  font-size: clamp(2.2rem, 10rem, 20rem);
  color: #fff;
  text-align: center;
  line-height: 1;
  letter-spacing: 2px;
  margin-bottom: 1.5rem; // Reduced from 3rem to tighten up spacing
  max-width: 100%;
  overflow: visible; // Change from overflow-x: auto to visible
  white-space: nowrap;
  word-break: keep-all;

  @media (max-width: 1200px) {
        font-size: clamp(1rem, 4rem, 7rem);

  }

  @media (max-width: 768px) {
    font-size: clamp(1rem, 4rem, 7rem);

    margin-bottom: 0.5rem;
    white-space: normal;
    word-break: break-word;
    overflow-x: visible;
  }
}

// Havoc - Desktop positioning
.havoc-text {
  font-family: $font-norwester;
  font-size: clamp(2.2rem, 5rem, 10rem);
  color: #fff;
  text-align: center;
  line-height: 1;
  letter-spacing: 2px;
  margin-bottom: 1vh !important; // Much larger bottom margin with !important
  max-width: none; // Remove max-width to prevent truncation
  overflow: visible !important; // Force overflow to be visible
  white-space: nowrap !important; // Ensure text doesn't wrap
  display: inline-block; // Use inline-block for proper width calculation
  width: auto; // Allow natural width
  word-break: keep-all;

  @media (max-width: 1200px) {
    font-size: clamp(1.2rem, 3vw, 2rem);
  }

  @media (max-width: 768px) {
    font-size: clamp(1rem, 3rem, 5rem);
    margin-bottom: 0.5rem;
    white-space: normal !important; // Allow wrapping on mobile
    word-break: break-word;
    overflow-x: visible;
    width: 100%; // Full width on mobile
  }
}

.divider-line {
  width: 70%;
  border: none;
  border-top: 2px solid #fff;
  margin: 0 auto 1vh auto !important; // Larger bottom margin with !important
  opacity: 0.25;

  @media (max-width: 768px) {
    width: 80%;
    margin: 1.2rem auto 2rem auto; // Increased bottom margin for mobile
  }
}

// Neon quote - Desktop positioning
.neon-quote {
  font-family: $font-orbitron;
  font-size: clamp(1rem, 2.5vw, 1.5rem);
  color: #f0efea;
  text-align: center;
  margin-bottom: 9rem !important; // Much larger bottom margin with !important
  margin-top: 0; // Keep this at 0 since we increased divider's bottom margin
  width: 100%;
  line-height: 1.2;
  text-shadow: 0 0 10px #fff, 0 0 4px #fff;

  @media (max-width: 1200px) {
    font-size: clamp(0.9rem, 2vw, 1.2rem);
    margin-bottom: 2rem;
  }

  @media (max-width: 768px) {
    font-size: clamp(0.8rem, 4vw, 1rem);
    margin-bottom: 1.5rem;
  }
}

// Button - Desktop positioning
.insert-coin-btn {
  display: block;
  margin: 0 auto;
  background: rgba(34, 33, 33, 0.8);
  border: none;
  color: #ffffff;
  font-family: $font-press;
  font-size: 1.3rem;
  line-height: 2.8rem;
  text-align: center;
  cursor: pointer;
  border-radius: 8px;
  width: 70%;
  max-width: 320px;
  height: 60px;
  margin-bottom: 0;
  margin-top: 4rem !important; // Increased top margin with !important
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  animation: neon-glow 2s infinite alternate ease-in-out;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(15px);
  border: 2px solid rgba(255, 255, 255, 0.3);

  @media (max-width: 1200px) {
    font-size: 1.1rem;
    height: 50px;
    max-width: 260px;
  }

  @media (max-width: 768px) {
    width: 80vw;
    max-width: 320px;
    font-size: 1rem;
    height: 45px;
    margin-bottom: 10vh;
  }

  &:hover {
    animation-play-state: paused;
    text-shadow: 0 0 20px #fff, 0 0 10px #fff, 0 0 5px #fff;
    transform: scale(1.02);
  }

  &:active {
    transform: scale(0.98);
    background: rgba(34, 33, 33, 0.9);
  }

  &:disabled {
    opacity: 0.6;
    background: rgba(0, 0, 0, 0.3);
    cursor: not-allowed;
  }
}

@keyframes neon-glow {
  from {
    text-shadow: 0 0 (8 / $ref-width) * 100vw rgba(255, 255, 255, 0.2);

    @media (max-width: 768px) {
      text-shadow: 0 0 6px rgba(255, 255, 255, 0.3);
    }
  }

  to {
    text-shadow:
      0 0 (15 / $ref-width) * 100vw rgba(255, 255, 255, 0.8),
      0 0 (5 / $ref-width) * 100vw rgba(255, 255, 255, 0.8);

    @media (max-width: 768px) {
      text-shadow:
        0 0 12px rgba(255, 255, 255, 0.8),
        0 0 6px rgba(255, 255, 255, 0.8),
        0 0 3px rgba(255, 255, 255, 0.6);
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

// Responsive for screens below 1600px (to prevent overflow)
@media (max-width: 1650px) {
  .text-container {
    min-width: 320px !important;
    max-width: 98vw !important;
    padding: 0 0.5rem;
    margin-bottom: 1rem !important;
  }
  .login-content-wrapper {
    height: auto !important;
    width: 100vw !important;
    flex-direction: column !important;
  }
  .login-right {
    height: auto !important;
    min-height: 0 !important;
    padding-top: 1rem !important;
    padding-bottom: 1rem !important;
    max-height: none !important;
    overflow: visible !important;
    width: 100vw !important;
    max-width: 100vw !important;
    flex: none !important;
    margin: 0 auto !important;
  }
  .centered-title-group {
    margin-bottom: 2rem !important;
  }
  .wreck-text {
    font-size: clamp(1.2rem, 7vw, 7rem) !important;
    margin-bottom: 1rem !important;
  }
  .havoc-text {
    font-size: clamp(1.2rem, 6vw, 6rem) !important;
    margin-bottom: 0.5rem !important;
  }
  .neon-quote {
    font-size: clamp(0.8rem, 2vw, 1.1rem) !important;
    margin-bottom: 1rem !important;
  }
  .insert-coin-btn {
    font-size: 1rem !important;
    height: 40px !important;
    margin-top: 1rem !important;
    margin-bottom: 1rem !important;
    max-width: 220px !important;
    width: 80vw !important;
  }
}

@media (max-width: 768px) {
  .login-content-wrapper {
    flex-direction: column;
    height: auto;
    width: 100vw;
  }

  .login-right {
    width: 100vw;
    max-width: 100vw;
    min-width: 0;
    margin: 0 auto;
    height: auto;
    align-items: center;
    justify-content: flex-start;
    padding-top: 30vh ;
    padding-bottom: 5vh;
  }

  .text-container {
    padding: 0 1rem;
    margin-bottom: 3rem;
    max-width: 100vw;
    min-width: 0;
    white-space: normal;
    overflow-x: visible;
  }

  .centered-title-group {
    margin-bottom: 2rem;
    white-space: normal;
    overflow: visible;
  }

  .wreck-text {
    margin-bottom: 1rem !important;
  }

  .havoc-text {
    margin-bottom: 1vh!important;
  }

  .divider-line {
    margin: 1.5rem auto 3rem auto !important;
  }

  .neon-quote {
    margin-bottom: 3rem !important;
  }

  .insert-coin-btn {
    margin-top: 2rem !important;
    margin-bottom: 10vh;
  }
}
</style>
