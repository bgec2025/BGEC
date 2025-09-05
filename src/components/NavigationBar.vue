<template>
  <nav class="navbar" :class="{ 'navbar-scrolled': isScrolled, 'navbar-mobile-open': isMobileMenuOpen }">
    <div class="navbar-container">
      <!-- Logo and Brand -->
      <div class="navbar-brand" ref="brand">
        <img src="../assets/images/logo.png" alt="Logo" class="navbar-logo" />
        <span class="brand-text">BITS Goa Esports Club</span>
      </div>

      <!-- Desktop Navigation -->
      <div class="navbar-nav desktop-nav" ref="desktopNav">
        <a href="/index.html" class="nav-link" @click="handleNavClick">
          <span class="nav-text">Home</span>
          <div class="nav-underline"></div>
        </a>
        <a href="/event.html" class="nav-link" @click="handleNavClick">
          <span class="nav-text">Events</span>
          <div class="nav-underline"></div>
        </a>
        <a href="/leaderboard.html" class="nav-link" @click="handleNavClick">
          <span class="nav-text">Leaderboard</span>
          <div class="nav-underline"></div>
        </a>
        <button class="nav-btn signout-btn" @click="signOutUser">
          <span class="btn-text">Sign Out</span>
          <div class="btn-glow"></div>
        </button>
      </div>

      <!-- Mobile Hamburger Toggle -->
      <div class="mobile-toggle" @click="toggleMobileMenu" ref="hamburger">
        <span class="hamburger-line" :class="{ active: isMobileMenuOpen }"></span>
        <span class="hamburger-line" :class="{ active: isMobileMenuOpen }"></span>
        <span class="hamburger-line" :class="{ active: isMobileMenuOpen }"></span>
      </div>
    </div>

    <!-- Mobile Menu Overlay -->
    <Transition name="mobile-menu">
      <div v-if="isMobileMenuOpen" class="mobile-menu-overlay" @click="closeMobileMenu">
        <div class="mobile-menu" @click.stop ref="mobileMenu">
          <div class="mobile-menu-header">
            <span class="mobile-brand">BGEC</span>
            <button class="mobile-close" @click="closeMobileMenu">
              <span>&times;</span>
            </button>
          </div>
          <div class="mobile-nav-links">
            <a href="/index.html" class="mobile-nav-link" @click="handleMobileNavClick">
              <span class="mobile-nav-text">Home</span>
              <div class="mobile-nav-icon">→</div>
            </a>
            <a href="/event.html" class="mobile-nav-link" @click="handleMobileNavClick">
              <span class="mobile-nav-text">Events</span>
              <div class="mobile-nav-icon">→</div>
            </a>
            <a href="/leaderboard.html" class="mobile-nav-link" @click="handleMobileNavClick">
              <span class="mobile-nav-text">Leaderboard</span>
              <div class="mobile-nav-icon">→</div>
            </a>
            <button class="mobile-signout-btn" @click="signOutUser">
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </nav>
</template>

<script>
import { getAuth, signOut } from "firebase/auth";
import firebaseApp from '../firebase';
import anime from 'animejs';

export default {
  name: 'NavigationBar',
  data() {
    return {
      isScrolled: false,
      isMobileMenuOpen: false,
      scrollThreshold: 50
    }
  },
  mounted() {
    this.setupEventListeners();
    this.initAnimations();
  },
  beforeUnmount() {
    this.removeEventListeners();
  },
  methods: {
    setupEventListeners() {
      //eslint-disable-next-line
      window.addEventListener('scroll', this.handleScroll);
      //eslint-disable-next-line
      window.addEventListener('resize', this.handleResize);
      //eslint-disable-next-line
      document.addEventListener('keydown', this.handleKeyDown);
    },
    
    removeEventListeners() {
      //eslint-disable-next-line
      window.removeEventListener('scroll', this.handleScroll);
      //eslint-disable-next-line
      window.removeEventListener('resize', this.handleResize);
      //eslint-disable-next-line
      document.removeEventListener('keydown', this.handleKeyDown);
    },

    handleScroll() {
      //eslint-disable-next-line
      this.isScrolled = window.scrollY > this.scrollThreshold;
    },

    handleResize() {
      //eslint-disable-next-line
      if (window.innerWidth > 992 && this.isMobileMenuOpen) {
        this.closeMobileMenu();
      }
    },

    handleKeyDown(event) {
      if (event.key === 'Escape' && this.isMobileMenuOpen) {
        this.closeMobileMenu();
      }
    },

    toggleMobileMenu() {
      this.isMobileMenuOpen = !this.isMobileMenuOpen;
      if (this.isMobileMenuOpen) {
        this.animateMobileMenuOpen();
        //eslint-disable-next-line
        document.body.classList.add('mobile-menu-open');
      } else {
        //eslint-disable-next-line
        document.body.classList.remove('mobile-menu-open');
      }
    },

    closeMobileMenu() {
      this.isMobileMenuOpen = false;
      //eslint-disable-next-line
      document.body.classList.remove('mobile-menu-open');
    },

    handleNavClick(event) {
      this.animateNavClick(event.currentTarget);
    },

    handleMobileNavClick(event) {
      this.animateMobileNavClick(event.currentTarget);
      setTimeout(() => {
        this.closeMobileMenu();
      }, 300);
    },

    signOutUser() {
      const auth = getAuth(firebaseApp.app);
      signOut(auth).then(() => {
        //eslint-disable-next-line
        window.location.href = './login.html';
      }).catch((error) => {
        console.log('Sign out failed!', error);
      });
    },

    // Animation Methods
    initAnimations() {
      // Animate navbar on load
      anime({
        targets: this.$refs.brand,
        translateY: [-30, 0],
        opacity: [0, 1],
        duration: 800,
        easing: 'easeOutCubic',
        delay: 200
      });

      anime({
        targets: '.nav-link',
        translateY: [-20, 0],
        opacity: [0, 1],
        duration: 600,
        easing: 'easeOutCubic',
        delay: anime.stagger(100, {start: 400})
      });
    },

    animateNavClick(target) {
      anime({
        targets: target,
        scale: [1, 0.95, 1],
        duration: 200,
        easing: 'easeOutCubic'
      });
    },

    animateMobileNavClick(target) {
      anime({
        targets: target,
        translateX: [0, 10, 0],
        duration: 200,
        easing: 'easeOutCubic'
      });
    },

    animateMobileMenuOpen() {
      this.$nextTick(() => {
        anime({
          targets: '.mobile-nav-link',
          translateX: [-50, 0],
          opacity: [0, 1],
          duration: 400,
          easing: 'easeOutCubic',
          delay: anime.stagger(80, {start: 200})
        });
      });
    }
  }
}
</script>

<style scoped lang="scss">
// Import theme variables
@import '../assets/styles/global.scss';

.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: linear-gradient(135deg, $bg-dark 0%, $bg-dark-alt 100%);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 209, 157, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  height: 85px;

  &.navbar-scrolled {
    height: 65px;
    background: rgba(15, 15, 15, 0.95);
    border-bottom: 1px solid $orange;
    box-shadow: 0 4px 20px rgba(244, 82, 41, 0.15);
  }

  .navbar-container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 2rem;
    padding-left: 0.1rem;
    padding-right: 0.05rem;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
}

.navigation-bar {
  width: 100vw;
  max-width: 100vw;
  margin: 0;
  padding: 0;
  overflow-x: visible;

  // Optional: flex layout for spacing
  display: flex;
  justify-content: space-between;
  align-items: center;
}

// Brand Section
.navbar-brand {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  cursor: pointer;
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.05);
  }

  .navbar-logo {
    height: 40px;
    filter: drop-shadow(0 0 10px rgba(244, 82, 41, 0.3));
    transition: filter 0.3s ease;

    &:hover {
      filter: drop-shadow(0 0 20px rgba(244, 82, 41, 0.6));
    }
  }

  .brand-text {
    font-family: 'Integral-CF', sans-serif;
    font-size: 1.4rem;
    font-weight: bold;
    color: $cream;
    letter-spacing: 2.2px;
    text-shadow: 0 0 10px rgba(255, 209, 157, 0.3);
    position: relative;

    &::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 0;
      width: 0;
      height: 2px;
      background: linear-gradient(90deg, $orange, $red);
      transition: width 0.4s ease;
    }

    &:hover::after {
      width: 100%;
    }
  }
}

// Desktop Navigation
.desktop-nav {
  display: flex;
  align-items: center;
  gap: 2rem;

  .nav-link {
    position: relative;
    color: $cream;
    text-decoration: none;
    font-family: 'Integral-CF', sans-serif;
    font-size: 1.1rem;
    font-weight: 500;
    padding: 0.5rem 0;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;
    letter-spacing: 2px;

    .nav-text {
      position: relative;
      z-index: 2;
      transition: color 0.3s ease;
    }

    .nav-underline {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 0;
      height: 2px;
      background: linear-gradient(90deg, $orange, $red);
      transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }

    &:hover {
      color: $orange;
      text-shadow: 0 0 15px rgba(244, 82, 41, 0.8);
      
      .nav-underline {
        width: 100%;
      }
    }

    &:active {
      transform: translateY(1px);
    }
  }

  .nav-btn {
    background: linear-gradient(135deg, $red, $orange);
    border: none;
    border-radius: 25px;
    padding: 0.75rem 1.5rem;
    color: $cream;
    font-family: 'Integral-CF', sans-serif;
    font-size: 0.9rem;
    font-weight: bold;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 15px rgba(196, 8, 23, 0.3);

    .btn-text {
      position: relative;
      z-index: 2;
    }

    .btn-glow {
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
      transition: left 0.5s ease;
    }

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(196, 8, 23, 0.5);
      
      .btn-glow {
        left: 100%;
      }
    }

    &:active {
      transform: translateY(0);
    }
  }
}

// Mobile Toggle
.mobile-toggle {
  display: none;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 40px;
  height: 40px;
  cursor: pointer;
  border-radius: 8px;
  background: rgba(255, 209, 157, 0.1);
  transition: all 0.3s ease;

  &:hover {
    background: rgba(244, 82, 41, 0.2);
    transform: scale(1.1);
  }

  .hamburger-line {
    width: 20px;
    height: 2px;
    background: $cream;
    margin: 2px 0;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 2px;

    &:nth-child(1) {
      &.active {
        transform: rotate(45deg) translate(5px, 5px);
        background: $orange;
      }
    }

    &:nth-child(2) {
      &.active {
        opacity: 0;
        transform: translateX(-20px);
      }
    }

    &:nth-child(3) {
      &.active {
        transform: rotate(-45deg) translate(7px, -6px);
        background: $orange;
      }
    }
  }
}

// Mobile Menu Overlay
.mobile-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(5px);
  z-index: 999;
  display: flex;
  justify-content: flex-end;
}

.mobile-menu {
  width: min(400px, 90vw);
  height: 100vh;
  background: linear-gradient(180deg, $bg-dark 0%, $bg-dark-alt 100%);
  border-left: 2px solid $orange;
  box-shadow: -10px 0 30px rgba(0, 0, 0, 0.5);
  overflow-y: auto;

  .mobile-menu-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 2rem;
    border-bottom: 1px solid rgba(255, 209, 157, 0.1);

    .mobile-brand {
      font-family: 'Integral-CF', sans-serif;
      font-size: 1.25rem;
      color: $cream;
      text-shadow: 0 0 10px rgba(255, 209, 157, 0.3);
    }

    .mobile-close {
      background: none;
      border: none;
      color: $cream;
      font-size: 2rem;
      cursor: pointer;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: all 0.3s ease;

      &:hover {
        background: rgba(244, 82, 41, 0.2);
        color: $orange;
        transform: rotate(90deg);
      }
    }
  }

  .mobile-nav-links {
    padding: 2rem 0;

    .mobile-nav-link {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 2rem;
      color: $cream;
      text-decoration: none;
      font-family: 'Integral-CF', sans-serif;
      font-size: 1.1rem;
      border-bottom: 1px solid rgba(255, 209, 157, 0.05);
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        left: -100%;
        top: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(244, 82, 41, 0.1), transparent);
        transition: left 0.4s ease;
      }

      &:hover {
        color: $orange;
        text-shadow: 0 0 10px rgba(244, 82, 41, 0.5);
        transform: translateX(10px);

        &::before {
          left: 100%;
        }

        .mobile-nav-icon {
          transform: translateX(5px);
          color: $orange;
        }
      }

      .mobile-nav-text {
        font-weight: 500;
      }

      .mobile-nav-icon {
        font-size: 1.2rem;
        transition: all 0.3s ease;
      }
    }

    .mobile-signout-btn {
      margin: 2rem;
      padding: 1rem 2rem;
      background: linear-gradient(135deg, $red, $orange);
      border: none;
      border-radius: 25px;
      color: $cream;
      font-family: 'Integral-CF', sans-serif;
      font-size: 1rem;
      font-weight: bold;
      cursor: pointer;
      width: calc(100% - 4rem);
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(196, 8, 23, 0.3);

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(196, 8, 23, 0.5);
      }

      &:active {
        transform: translateY(0);
      }
    }
  }
}

// Mobile Menu Transitions
.mobile-menu-enter-active,
.mobile-menu-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.mobile-menu-enter-from {
  opacity: 0;

  .mobile-menu {
    transform: translateX(100%);
  }
}

.mobile-menu-leave-to {
  opacity: 0;

  .mobile-menu {
    transform: translateX(100%);
  }
}

// Responsive Breakpoints
@media (max-width: 992px) {
  .desktop-nav {
    display: none;
  }

  .mobile-toggle {
    display: flex;
  }
}

@media (max-width: 768px) {
  .navbar {
    height: 60px;

    .navbar-container {
      padding: 0 1rem;
    }
  }

  .navbar-brand {
    .brand-text {
      font-size: 1.25rem;
    }

    .navbar-logo {
      height: 35px;
    }
  }
}

@media (max-width: 480px) {
  .navbar {
    height: 55px;
  }

  .navbar-brand {
    .brand-text {
      font-size: 0.6rem;
      letter-spacing: 1px;
    }

    .navbar-logo {
      height: 30px;
    }
  }

  .mobile-menu {
    width: 100vw;
    border-left: none;
  }
}

// Body scroll lock when mobile menu is open
:global(body.mobile-menu-open) {
  overflow: hidden;
}

// Glass morphism effect for modern browsers
@supports (backdrop-filter: blur(10px)) {
  .navbar {
    background: rgba(15, 15, 15, 0.8);
    backdrop-filter: blur(10px);
  }
}

// Accessibility improvements
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

// Focus styles for keyboard navigation
.nav-link:focus,
.nav-btn:focus,
.mobile-toggle:focus,
.mobile-nav-link:focus,
.mobile-signout-btn:focus {
  outline: 2px solid $orange;
  outline-offset: 2px;
}
</style>