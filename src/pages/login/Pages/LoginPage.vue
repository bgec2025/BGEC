/* global document */

<template>
  <div class="login-page">
    <!-- Black Banner with Marquee -->
    <div class="marquee-banner">
      <div class="marquee-content" ref="marqueeRef">
        <span class="brand-text">WreckHavoc</span>
        <span class="brand-text">WreckHavoc</span>
        <span class="brand-text">WreckHavoc</span>
        <span class="brand-text">WreckHavoc</span>
        <span class="brand-text">WreckHavoc</span>
        <span class="brand-text">WreckHavoc</span>
      </div>
    </div>

    <!-- Main Content Container -->
    <div class="main-content">
      <!-- Mandalorian Background Section -->
      <div class="hero-section" ref="heroRef">
        <div class="logo-container" ref="logoRef">
          <img :src="logoImage" alt="WreckHavoc Logo" class="logo-image" />
        </div>
        <div class="hero-background" :style="{ backgroundImage: `url(${mandalorianImage})` }"></div>
      </div>

      <!-- Black Box Login Section -->
      <div class="login-section" ref="loginBoxRef">
        <div class="login-content">
          <!-- Gaming SVG Elements -->

          <!-- Welcome Text -->
          <div class="welcome-text" ref="welcomeTextRef">
            <h1 class="main-heading">Welcome to WreckHavoc</h1>
            <p class="sub-heading">Your Gaming Journey Awaits</p>
            <p class="description">Sign in to access events, leaderboards and more</p>
          </div>

          <!-- Google Login Button -->
          <div class="login-button-container" ref="buttonRef">
            <button 
              class="google-login-btn" 
              @click="handleGoogleSignIn"
              :disabled="isLoading"
              ref="googleBtnRef"
            >
              <svg class="google-icon" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>{{ isLoading ? 'Signing in...' : 'Sign in with Google' }}</span>
            </button>
          </div>

          <!-- Loading Indicator -->
          <div v-if="isLoading" class="loading-spinner" ref="spinnerRef">
            <div class="spinner"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { getApp } from 'firebase/app'
import gsap from 'gsap'
//import {anime} from 'animejs'

// Images
import mandalorianImage from '@/assets/images/login-bg-mandalorian.jpg'
import logoImage from '@/assets/images/logo.png'

// Refs
const marqueeRef = ref(null)
const heroRef = ref(null)
const logoRef = ref(null)
const loginBoxRef = ref(null)
const welcomeTextRef = ref(null)
const buttonRef = ref(null)
const googleBtnRef = ref(null)
const spinnerRef = ref(null)

// State
const isLoading = ref(false)

// Authentication
const handleGoogleSignIn = async () => {
  console.log('Google sign-in button clicked') // Debug log
  
  if (isLoading.value) return
  
  isLoading.value = true
  
  try {
    const auth = getAuth(getApp())
    const provider = new GoogleAuthProvider()
    
    // Add button animation
    gsap.to(googleBtnRef.value, {
      scale: 0.95,
      duration: 0.1,
      yoyo: true,
      repeat: 1
    })
    
    const result = await signInWithPopup(auth, provider)
    console.log('User signed in successfully:', result.user) // Debug log
    
    // Success animation
    gsap.to(loginBoxRef.value, {
      scale: 1.05,
      duration: 0.3,
      ease: 'back.out(1.7)'
    })
    
  } catch (error) {
    console.error('Error signing in:', error) // Debug log
    
    // Error animation
    gsap.to(googleBtnRef.value, {
      x: [-10, 10, -10, 10, 0],
      duration: 0.5,
      ease: 'power2.out'
    })
    
    console.log(`Sign-in failed: ${error.message}`)
  } finally {
    isLoading.value = false
  }
}

// Animations
const initAnimations = () => {
  // Marquee Animation
  if (marqueeRef.value) {
    gsap.set(marqueeRef.value, { x: 0 })
    gsap.to(marqueeRef.value, {
      x: '-50%',
      duration: 20,
      ease: 'none',
      repeat: -1
    })
  }
  
  // Page Load Animation Timeline
  const tl = gsap.timeline()
  
  // Hero section entrance
  tl.from(heroRef.value, {
    opacity: 0,
    x: -100,
    duration: 1,
    ease: 'power3.out'
  })
  .from(logoRef.value, {
    opacity: 0,
    y: -50,
    duration: 0.8,
    ease: 'back.out(1.7)'
  }, '-=0.5')
  
  // Login box entrance
  .from(loginBoxRef.value, {
    opacity: 0,
    x: 100,
    duration: 1,
    ease: 'power3.out'
  }, '-=0.8')
  
  // Gaming icons float animation
  .from('.gaming-svg', {
    opacity: 0,
    y: 30,
    duration: 0.6,
    stagger: 0.2,
    ease: 'power2.out'
  }, '-=0.6')
  
  // Welcome text stagger
  .from('.main-heading', {
    opacity: 0,
    y: 30,
    duration: 0.8,
    ease: 'power2.out'
  }, '-=0.4')
  .from('.sub-heading', {
    opacity: 0,
    y: 20,
    duration: 0.6,
    ease: 'power2.out'
  }, '-=0.6')
  .from('.description', {
    opacity: 0,
    y: 20,
    duration: 0.6,
    ease: 'power2.out'
  }, '-=0.4')
  
  // Button entrance
  .fromTo(googleBtnRef.value, 
  {
    opacity: 0,
    scale: 0.8
  },
    {
      opacity :1,
      scale: 1,
      duration: 0.6,
      ease: 'back.out(1.7)'
  }, '-=0.3')
}

const initFloatingAnimations = () => {
  // Gaming icons floating animation
  // eslint-disable-next-line no-undef
  const gamingIcons = document.querySelectorAll('.gaming-svg')
  gamingIcons.forEach((icon, index) => {
    gsap.to(icon, {
      y: -15 + (index * 5),
      duration: 2 + (index * 0.5),
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
      delay: index * 0.3
    })
    
    gsap.to(icon, {
      rotation: 5 - (index * 2),
      duration: 3 + index,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
      delay: index * 0.2
    })
  })
  
  // Logo subtle animation
  gsap.to('.logo-image', {
    scale: 1.05,
    duration: 4,
    ease: 'sine.inOut',
    repeat: -1,
    yoyo: true
  })
}

const initHoverAnimations = () => {
  // Button hover effects
  const button = googleBtnRef.value
  if (button) {
    button.addEventListener('mouseenter', () => {
      gsap.to(button, {
        scale: 1.05,
        duration: 0.3,
        ease: 'power2.out'
      })
      
      gsap.to('.google-icon', {
        rotation: 360,
        duration: 0.6,
        ease: 'power2.out'
      })
    })
    
    button.addEventListener('mouseleave', () => {
      gsap.to(button, {
        scale: 1,
        duration: 0.3,
        ease: 'power2.out'
      })
    })
  }
  
  // Gaming icons hover
  // eslint-disable-next-line no-undef
  document.querySelectorAll('.gaming-svg').forEach(icon => {
    icon.addEventListener('mouseenter', () => {
      gsap.to(icon, {
        scale: 1.2,
        duration: 0.3,
        ease: 'back.out(1.7)'
      })
    })
    
    icon.addEventListener('mouseleave', () => {
      gsap.to(icon, {
        scale: 1,
        duration: 0.3,
        ease: 'power2.out'
      })
    })
  })
}

// Lifecycle
onMounted(async () => {
  await nextTick()
  
  // Initialize all animations
  initAnimations()
  initFloatingAnimations()
  initHoverAnimations()
  
  console.log('Login page loaded and animations initialized') // Debug log
})
</script>

<style lang="scss" scoped>
@import '../assets/styles/LoginPage.scss';
</style>