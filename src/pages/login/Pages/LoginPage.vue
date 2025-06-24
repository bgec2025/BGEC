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