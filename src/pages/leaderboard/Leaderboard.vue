<template>
  <div class="leaderboard">
    <NavigationBar />
    <h1>LeaderBoard</h1>


  

    <section v-if="isEventLive" id="leaderboard-content">
      <div class="toggle-buttons-section">
        <div class="toggle-buttons">
          <button :class="{ active: !showTeams }" @click="toggleRanking(false)">Player Rankings</button>
          <button :class="{ active: showTeams }" @click="toggleRanking(true)">Team Rankings</button>
        </div>
      </div>


      <div class="table-section">
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th v-if="showTeams">Team Name</th>
                <th v-else>Player Name</th>
                <th>Total Points</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(entry, idx) in leaderboard" :key="entry.id" :class="{ highlight: entry.id === myOwnEntryId }"
                @click="selectEntry(entry)" :ref="entry.id === myOwnEntryId ? 'myRow' : null">
                <td>{{ idx + 1 }}</td>
                <td v-if="showTeams">{{ entry.teamName }}</td>
                <td v-else>{{ entry.gameName || entry.displayName || entry.userName }}</td>
                <td>{{ entry.totalPoints ? (entry.totalPoints * 100).toFixed(3) : '0.000' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>


      <div class="actions bottom-actions">
        <button v-if="myRank !== null" @click="scrollToMyRank">
          Jump to My Rank
        </button>
      </div>


      <div id="info-side-panel-section">
        <div v-if="selectedEntry" class="side-panel">
          <div class="side-panel-bg"></div>
          <h3 class="side-panel-title">
            {{ showTeams.value ? 'Team Details: ' : 'Player Details: ' }}
            {{ showTeams.value ? selectedEntry.teamName || 'Team' : 
               selectedEntry.gameName || selectedEntry.userName || selectedEntry.displayName || 'Player' }}
          </h3>


          <ul class="side-panel-list">
            <li v-for="item in entryDetails" :key="item.key">
              <strong>{{ item.label }}:</strong> {{ item.value }}
            </li>
          </ul>
        </div>
      </div>


      <section class="top-players-section" v-if="isEventLive && topThreePlayers.length > 0">
        <h2 class="section-title">{{ topSectionTitle }}</h2>
        <div class="top-players-carousel-wrapper">
          <button @click="scrollCarousel('left')" class="carousel-nav-btn left-arrow">◀</button>
          <div class="carousel-track" ref="carouselTrack">
            <div class="top-player-card" v-for="(player, index) in topThreePlayers" :key="player.id">
              <span class="rank-overlay">{{ index + 1 }}</span>
              <div class="card-content">
                <img :src="getRandomAvatar(player.id)" alt="Player Avatar" class="player-avatar" />
                <h4 class="player-name">{{ showTeams ? player.teamName : (player.gameName || player.displayName ||
                  player.userName) }}</h4>
                <p class="player-points">{{ (player.totalPoints * 100).toFixed(3) }} Points</p>
              </div>
            </div>
          </div>
          <button @click="scrollCarousel('right')" class="carousel-nav-btn right-arrow">▶</button>
        </div>
      </section>
    </section>
    <section v-else class="event-not-started">
      <p class="event-message">The event is not currently live. Please check back later!</p>
    </section>
  </div>
</template>



<script>
import { ref, onMounted, watch, nextTick, computed } from 'vue';
import { getFirestore, collection, query, orderBy, getDocs, getDoc, doc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import firebaseApp from '../../firebase';
import NavigationBar from '@/components/NavigationBar.vue';
import { gsap } from 'gsap';



const FIELD_LABELS = {
  id: 'ID',
  teamName: 'Team Name',
  gameName: 'Username',
  displayName: 'Name',
  userName: 'Username',
  totalPoints: 'Total Points',
  normalizedHighestTeamWinStreak: 'Normalized Team Win Streak',
  noramlizedSupportPoints: 'Normalized Support Points',
  normalizedSupportPoints: 'Normalized Support Points',
  normalizedDeaths: 'Normalized Deaths',
  normalizedKills: 'Normalized Kills',
  teamId: 'Team ID',
  userId: 'User ID',
  email: 'Email',
  // Raw player stats fields
  kills: 'Kills',
  deaths: 'Deaths',
  supportPoints: 'Support Points',
  highestTeamWinStreak: 'Highest Team Win Streak',
  // Team stats fields
  matchesWon: 'Matches Won',
  matchesLost: 'Matches Lost',
  currentWinStreak: 'Current Win Streak',
  highestWinStreak: 'Highest Win Streak',
  accumulatedKills: 'Total Kills',
  accumulatedDeaths: 'Total Deaths',
};



// Create separate display orders for teams and players
const TEAM_INFO_DISPLAY_ORDER = [
  // Team basic info
  'teamName',
  'totalPoints',
  
  // Team stats from teamStats
  'matchesWon',
  'matchesLost',
  'currentWinStreak',
  'highestWinStreak',
  'accumulatedKills',
  'accumulatedDeaths',
  
  // ID (lowest priority)
  'id',
];

const PLAYER_INFO_DISPLAY_ORDER = [
  // Player basic info
  'gameName', 
  'displayName', 
  'userName',
  'totalPoints',
  
  // Player stats from playerStats
  'kills',
  'deaths',
  'supportPoints',
  'highestTeamWinStreak',
  
  // Normalized values (less priority)
  'normalizedKills',
  'normalizedDeaths',
  'normalizedSupportPoints',
  'normalizedHighestTeamWinStreak',
  
  // IDs (lowest priority)
  'teamId',
  'id',
];


let audioContext;
let clickSoundBuffer;


async function loadClickSound() {
  if (!audioContext) { // eslint-disable-next-line
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (!clickSoundBuffer) {
    try {
      const response = await fetch('/assets/sounds/click.mp3');
      const arrayBuffer = await response.arrayBuffer();
      clickSoundBuffer = await audioContext.decodeAudioData(arrayBuffer);
    } catch (error) {
      console.error("Error loading click sound:", error);
    }
  }
}


function playClickSound() {
  if (clickSoundBuffer && audioContext) {
    const source = audioContext.createBufferSource();
    source.buffer = clickSoundBuffer;
    source.connect(audioContext.destination);
    source.start(0);
  }
}


export default {
  name: 'LeaderboardPage',
  components: { NavigationBar },
  setup() {
    const db = getFirestore(firebaseApp.app);
    const auth = getAuth(firebaseApp.app);


    const showTeams = ref(false);
    const leaderboard = ref([]);
    const userInfo = ref(null);
    const selectedEntry = ref(null);
    const currentUserId = ref(null);
    const isEventLive = ref(false);


    onMounted(async () => {
      onAuthStateChanged(auth, (user) => {
        if (user) {
          userInfo.value = {
            displayName: user.displayName,
            photoURL: user.photoURL,
            email: user.email,
            uid: user.uid,
          };
          currentUserId.value = user.uid;
        } else {
          userInfo.value = null;
          currentUserId.value = null;
        }
      });


      const eventDataRef = doc(db, "events", "currentEvent");
      const eventDoc = await getDoc(eventDataRef);
      if (eventDoc.exists()) {
        isEventLive.value = eventDoc.data().eventStatus;
      } else {
        isEventLive.value = false;
      }


      await loadClickSound();


      // Animate the heading
      gsap.from("h1", { opacity: 0, y: -30, duration: 1, ease: "power3.out" });


      // Animate user info (only if present)
      nextTick(() => {// eslint-disable-next-line
        if (document.querySelector(".user-info")) {
          gsap.from(".user-info", {
            opacity: 0, scale: 0.9, duration: 0.8, delay: 0.2, ease: "back.out(1.2)",
            clearProps: "all"
          });
        }
        // Animate toggle buttons (only once)
        // eslint-disable-next-line
        if (document.querySelectorAll(".toggle-buttons button").length) {
          gsap.fromTo(".toggle-buttons button",
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.8, delay: 0.3, stagger: 0.12, clearProps: "all", ease: "power2.out" }
          );
        }
        // Animate leaderboard
        // eslint-disable-next-line
        if (document.querySelector(".table-container")) {
          gsap.from(".table-container", {
            opacity: 0, y: 50, duration: 1, delay: 0.7, ease: "power3.out", clearProps: "all"
          });
        }
        // Animate Jump button in
        // eslint-disable-next-line
        if (document.querySelector(".actions.bottom-actions button")) {
          gsap.from(".actions.bottom-actions button", {
            opacity: 0, scale: 0.8, duration: 0.8, delay: 1, ease: "elastic.out(1, 0.5)", clearProps: "all"
          });
        }
        // Animate Top Players section only if present
        // eslint-disable-next-line
        if (document.querySelector(".top-players-section")) {
          gsap.from(".top-players-section", {
            opacity: 0, y: 50, duration: 1, delay: 1.1, ease: "power3.out", clearProps: "all"
          });
        }
      });
    });
    function getRandomAvatar(playerId) {
      if (playerId) {
        const idx = Math.abs(hashCode(playerId)) % 6 + 1; // 6 avatars available
        return `/assets/avatars/avatar${idx}.jpg`;
      }
      return '/assets/avatars/avatar1.jpg'; // fallback
    }

    // Simple hash function for string to integer
    function hashCode(str) {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
      }
      return hash;
    }

    async function fetchLeaderboard() {
      const colName = showTeams.value ? 'teamRanking' : 'playerRanking';
      const q = query(collection(db, colName), orderBy('totalPoints', 'desc'));
      const snapshot = await getDocs(q);
      leaderboard.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // No need to modify the totalPoints in the actual data, just display it differently
      console.log("Leaderboard after fetch:", leaderboard.value);
      console.log("Top Three Players computed value:", topThreePlayers.value);


      await nextTick();
      gsap.from("tbody tr", { opacity: 0, x: -20, duration: 0.5, stagger: 0.05, ease: "power2.out" });
    }


    onMounted(fetchLeaderboard);
    watch(showTeams, () => {
      // Clear the selected entry when switching between teams and players
      selectedEntry.value = null;
      // Fetch the new leaderboard
      fetchLeaderboard();
    });


    const myOwnEntryId = computed(() => {
      if (!userInfo.value || leaderboard.value.length === 0) return null;
      if (!showTeams.value) {
        const userId = userInfo.value.uid;
        const found = leaderboard.value.find(
          (entry) => entry.userId === userId || entry.id === userId
        );
        return found ? found.id : null;
      } else {
        const userTeamId = userInfo.value && userInfo.value.teamId;
        if (userTeamId) {
          const found = leaderboard.value.find(
            (entry) => entry.teamId === userTeamId || entry.id === userTeamId
          );
          return found ? found.id : null;
        }
        return null;
      }
    });


    const myRank = computed(() => {
      if (!myOwnEntryId.value) return null;
      const idx = leaderboard.value.findIndex(entry => entry.id === myOwnEntryId.value);
      return idx !== -1 ? idx + 1 : null;
    });


    const entryDetails = computed(() => {
      if (!selectedEntry.value) return [];
      
      // Use the appropriate display order based on whether we're showing teams or players
      const displayOrder = showTeams.value ? TEAM_INFO_DISPLAY_ORDER : PLAYER_INFO_DISPLAY_ORDER;
      
      return displayOrder
        .map((key) => {
          if (selectedEntry.value[key] !== undefined && selectedEntry.value[key] !== null) {
            // Format values
            let value = selectedEntry.value[key];
            
            if (key === 'totalPoints') {
              // Multiply by 100 and format to 3 decimal places
              value = (value * 100).toFixed(3);
            } else if (typeof value === 'number') {
              // Format only normalized values with 3 decimal places
              if (key.startsWith('normalized')) {
                value = value.toFixed(3);
              }
            }
            
            return {
              key,
              label: FIELD_LABELS[key] || key,
              value: value
            }
          }
        })
        .filter(Boolean);
    });


    const topThreePlayers = computed(() => {
      return leaderboard.value.slice(0, 3);
    });


    // MODIFICATION 3: Added computed property for the section title
    const topSectionTitle = computed(() => {
      return showTeams.value ? 'Top Teams' : 'Top Players';
    });


    const carouselTrack = ref(null);
    const scrollCarousel = (direction) => {
      playClickSound();
      if (carouselTrack.value) {
        // Dynamically get the card width for all screen sizes
        const card = carouselTrack.value.querySelector('.top-player-card');
        const cardWidth = card ? card.offsetWidth : 300;
        const gapWidth = 32;
        const scrollAmount = cardWidth + gapWidth;
        const el = carouselTrack.value;
        const target = direction === 'left' ? el.scrollLeft - scrollAmount : el.scrollLeft + scrollAmount;

        el.scrollTo({
          left: target,
          behavior: 'smooth'
        });
      }
    };



    async function scrollToMyRank() {
      playClickSound();
      if (!myOwnEntryId.value) return;
      await nextTick();// eslint-disable-next-line
      const row = document.querySelector('tr.highlight');
      if (row) {
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        gsap.to(row, { scale: 1.02, duration: 0.2, yoyo: true, repeat: 1, ease: "power1.inOut" });
      }
    }


    // New: Scroll to player card function
    function scrollToPlayerCard() {// eslint-disable-next-line
      const panel = document.getElementById('info-side-panel-section'); // Target the new section wrapper ID
      if (panel) {
        panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }


    function toggleRanking(isTeam) {
      playClickSound();
      showTeams.value = isTeam;
    }


    async function selectEntry(entry) {
      playClickSound();
      
      // Store basic entry info
      selectedEntry.value = entry;
      
      // If viewing player rankings, fetch the detailed playerStats data
      if (!showTeams.value && entry.id) {
        try {
          const playerStatsRef = doc(db, "playerstats", entry.id);
          const playerStatsSnap = await getDoc(playerStatsRef);
          
          if (playerStatsSnap.exists()) {
            // Combine the playerStats data with the existing entry data
            selectedEntry.value = { 
              ...entry, 
              ...playerStatsSnap.data(),
              // Keep totalPoints from the ranking data
              totalPoints: entry.totalPoints
            };
          }
        } catch (error) {
          console.error("Error fetching player stats:", error);
        }
      }
      // If viewing team rankings, fetch the detailed teamStats data
      else if (showTeams.value && entry.id) {
        try {
          const teamStatsRef = doc(db, "teamstats", entry.id);
          const teamStatsSnap = await getDoc(teamStatsRef);
          
          if (teamStatsSnap.exists()) {
            // Combine the teamStats data with the existing entry data
            selectedEntry.value = { 
              ...entry, 
              ...teamStatsSnap.data(),
              // Keep totalPoints from the ranking data
              totalPoints: entry.totalPoints
            };
          }
        } catch (error) {
          console.error("Error fetching team stats:", error);
        }
      }
      
      gsap.fromTo(".side-panel",
        { opacity: 0, x: 50 },
        { opacity: 1, x: 0, duration: 0.5, ease: "power3.out" }
      );
      scrollToPlayerCard(); // Scroll to the player card on selection
    }


    return {
      showTeams,
      leaderboard,
      selectedEntry,
      selectEntry,
      userInfo,
      myOwnEntryId,
      myRank,
      scrollToMyRank,
      isEventLive,
      entryDetails,
      toggleRanking,
      topThreePlayers,
      scrollCarousel,
      carouselTrack,
      topSectionTitle,
      getRandomAvatar // <-- Make sure to return the new property
    };
  },
};
</script>



<style scoped lang="scss">
@import "@/assets/styles/global.scss";


/* Root and HTML/Body Resets (Crucial for consistency from leaderboard.html) */
/* These are now primarily controlled by leaderboard.html, but keep them for reference/scoped overrides */
html,
body,
#app {
  margin: 0;
  padding: 0;
  width: 100vw;
  min-height: auto;
  overflow-x: hidden;
  box-sizing: border-box;
  background: $bg-dark;
  margin: 0 auto;
}


#app {
  display: flex;
  /* Inherit from #leaderboard in HTML if possible */
  flex-direction: column;
  align-items: center;
}



/* Main Leaderboard Container */
.leaderboard {
  width: 100vw;
  /* Explicitly full viewport width */
  min-height: auto;
  background: $bg-dark;
  color: $cream;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0;
  padding: 0;
  overflow-x: hidden;
  /* Ensure no internal horizontal scroll */
  box-sizing: border-box;
  margin-top: 3rem;
}


/* Navigation Bar (Full Width) - Assumes Navbar component has a 'navbar' class */
.leaderboard>.navbar {
  width: 100vw;
  /* Spans full viewport width */
  margin-bottom: 2rem;
  padding: 0.5rem 2rem;
  box-sizing: border-box;
}


/* Global H1 (LeaderBoard Text) */
h1 {
  font-family: 'Esporte', serif;
  color: $orange;
  font-size: 4.5rem;
  margin-bottom: 2.5rem;
  text-align: center;
  width: 100%;
  /* Take full width of parent .leaderboard */
  max-width: 1200px;
  /* Aligns with other main content */
  padding: 1rem 3rem;
  /* Add horizontal padding directly */
  box-sizing: border-box;
}


/* User Info Card */
.user-info {
  background: $light-brown10;
  border-radius: 12px;
  padding: 2rem 3rem;
  margin-bottom: 3rem;
  color: $cream;
  font-family: 'Integral-CF', sans-serif;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  border: 1px solid $brown30;
  width: 100%;
  /* Take full width of parent .leaderboard */
  max-width: 900px;
  /* Keep consistent max-width */
  box-sizing: border-box;
}


.user-info p {
  margin: 0.5rem 0;
  font-size: 1.1rem;
}


.welcome-text {
  font-family: 'Integral-CF', sans-serif;
  font-size: 1.3rem;
  color: $orange;
}


.user-photo {
  height: 80px;
  width: 80px;
  border-radius: 50%;
  border: 3px solid $orange;
  margin: 1rem 0;
  background: $dark-red;
  object-fit: cover;
  box-shadow: 0 0 15px rgba(241, 82, 41, 0.6);
}


.email-text {
  color: $cream90;
  font-size: 0.95rem;
}



/* Main Leaderboard Content Section (Table, buttons, side panel, top players) */
#leaderboard-content {
  width: 100%;
  /* Takes full width of parent (.leaderboard) */
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 3rem;
  /* Space at the very bottom */
}



/* --- Button & Table Layout Containers --- */
/* Add specific wrappers for elements that need to fill max-width but maintain internal padding */
.toggle-buttons-section,
/* Renamed wrapper */
.table-section,
/* Renamed wrapper */
.actions.bottom-actions,
#info-side-panel-section,
/* Renamed wrapper */
.top-players-section {
  width: 100%;
  max-width: 1600px;
  text-align: center;
  /* Consistently align content horizontally */
  padding: 2rem 3rem;
  /* Add horizontal padding to these wrappers */
  box-sizing: border-box;
  margin-bottom: 3rem;
  /* Consistent spacing between major sections */
}



/* Toggle Buttons (Player/Team Rankings) */
.toggle-buttons {
  margin-bottom: 0;
  /* Wrapper handles margin now */
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  width: 100%;
  /* Fills its wrapper */
}


.toggle-buttons button {
  font-family: 'Integral-CF', sans-serif;
  font-size: 1.1rem;
  padding: 0.8rem 2.5rem;
  border-radius: 30px;
  background: $bg-dark-alt;
  color: $cream;
  border: 2px solid $orange;
  cursor: pointer;
  transition: all 0.3s ease-in-out;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
  white-space: nowrap;
}


.toggle-buttons button.active,
.toggle-buttons button:hover {
  background: $orange;
  color: $bg-dark;
  border: 2px solid $cream;
  transform: translateY(-5px) scale(1.05);
  box-shadow: 0 8px 15px rgba(241, 82, 41, 0.7);
}


/* Table Container */
.table-container {
  overflow-x: auto;
  width: 100%;
  /* Fills its wrapper */
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.6);
  border-radius: 15px;
  background: $bg-dark-alt;
  border: 1px solid $brown;
  /* margin-bottom handled by wrapper */
}


table {
  border-collapse: collapse;
  width: 100%;
  min-width: 700px;
  font-family: 'Integral-CF', sans-serif;
  color: $cream;
  border-radius: 15px;
  overflow: hidden;
}


th,
td {
  padding: 1.2rem 1.5rem;
  text-align: left;
  border-bottom: 1px solid $brown;
  font-family: 'Integral-CF', sans-serif;
  color: $cream;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}


th {
  font-family: 'Integral-CF', sans-serif;
  font-weight: 700;
  color: $orange;
  letter-spacing: 1.5px;
  background: $brown;
  border-bottom: 3px solid $dark-red;
}


tr.highlight {
  background: $red;
  color: $cream90;
  font-family: 'Integral-CF', sans-serif;
  animation: pulse-red 2s infinite alternate;
}


@keyframes pulse-red {
  0% {
    box-shadow: 0 0 5px $red;
  }


  100% {
    box-shadow: 0 0 20px $red;
  }
}


tr:hover {
  background: $brown30;
  cursor: pointer;
  transform: scale(1.005);
  transition: all 0.2s ease-out;
}


/* Jump to My Rank Button (Bottom Actions) */
.actions.bottom-actions {
  /* margin-top and margin-bottom handled by wrapper */
  text-align: center;
  display: flex;
  justify-content: center;
  width: 100%;
}


.actions button {
  background: $dark-red;
  color: $cream;
  border: 1px solid $red;
  border-radius: 10px;
  padding: 0.8rem 2rem;
  font-size: 1.1rem;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.4);
  transition: all 0.3s ease-in-out;
  font-family: 'Integral-CF', sans-serif;
  font-weight: bold;
  cursor: pointer;
  white-space: nowrap;
}


.actions button:hover {
  background: $red;
  color: $cream90;
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 8px 20px rgba(196, 8, 23, 0.7);
}


/* Info Side Panel (Player Card) */
#info-side-panel-section {
  /* Renamed ID to match template */
  width: 100%;
}


.side-panel {
  background: $bg-dark-alt;
  border-left: 6px solid $orange;
  padding: 2rem 2.5rem;
  border-radius: 15px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.6);
  color: $cream;
  font-family: 'Integral-CF', sans-serif;
  font-size: 1rem;
  position: relative;
  overflow: hidden;
  z-index: 1;
  border: 1px solid $brown;
}


.side-panel-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url('/public/assets/images/nebula-dark-bg.jpg');
  background-size: cover;
  background-position: center;
  filter: blur(10px) brightness(0.4);
  transform: scale(1.1);
  z-index: -1;
}


.side-panel-title {
  font-family: 'Esporte', serif;
  color: $orange;
  margin-top: 0;
  margin-bottom: 1.5rem;
  font-size: 2rem;
  position: relative;
  z-index: 2;
}


.side-panel-list {
  list-style: none;
  padding: 0;
  margin: 0;
  position: relative;
  z-index: 2;
}


.side-panel-list li {
  margin-bottom: 0.8rem;
  line-height: 1.6;
  color: $cream80;
}


.side-panel-list li strong {
  color: $orange;
  font-family: 'Integral-CF', sans-serif;
  margin-right: 0.5rem;
}


/* Event Not Started Message */
.event-not-started {
  width: 90%;
  margin: 0 auto;
  text-align: center;
  padding: 5rem 0;
  background: $bg-dark-alt;
  border-radius: 15px;
  margin-top: 3rem;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
  margin-bottom: 13rem;
}


.event-message {
  font-family: 'Electroharmonix', sans-serif;
  color: $red;
  font-size: 2rem;
  text-shadow: 0 0 8px rgba(196, 8, 23, 0.8);
  animation: flicker 1.5s infinite alternate;
}


@keyframes flicker {


  0%,
  100% {
    opacity: 1;
    text-shadow: 0 0 8px rgba(196, 8, 23, 0.8);
  }


  50% {
    opacity: 0.8;
    text-shadow: 0 0 15px rgba(196, 8, 23, 0.8);
  }
}


.section-title {
  font-family: 'Esporte', serif;
  color: $orange;
  font-size: 2.8rem;
  margin-bottom: 2rem;
  text-align: center;
}


.top-players-carousel-wrapper {
  /* New wrapper for carousel to control horizontal padding */
  display: flex;
  align-items: center;
  gap: 1.5rem;
  position: relative;
  width: 100%;
  /* Fills parent */
  padding: 0 1rem;
  /* Padding applied here for the entire carousel container */
  box-sizing: border-box;
}


.carousel-track {
  display: flex;
  overflow-x: scroll;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  -ms-overflow-style: none;
  gap: 2rem;
  /* Keep this gap */
  padding-bottom: 1rem;
  flex-grow: 1;
  width: 100%;
  // justify-content: center;
  /* Remove any padding-left/right here, it's handled by carousel-carousel-wrapper */
  padding-left: 0;
  padding-right: 0;
}



.carousel-track::-webkit-scrollbar {
  display: none;
}

.top-player-card {
  flex: 0 0 auto;
  /* IMPORTANT: Set a fixed width here for all screen sizes, unless overridden by media queries */
  width: 90%;
  /* Or whatever your desired default card width is */
  margin: 3rem;
  height: 300px;
  /* Keep consistent height */
  background: $bg-dark-alt;
  border: 2px solid $brown;
  border-radius: 15px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.5);
  position: relative;
  overflow: visible;
  scroll-snap-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  /* Remove or significantly reduce margin here. Gap on carousel-track will handle spacing. */
  /* Set to 0, or a very small value like 0 0.5rem if you want slight internal card margin */
  text-align: center;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  padding-top: 50px;
}


.top-player-card:hover {
  transform: translateY(-5px) scale(1.02);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.6), 0 0 15px $orange;
}



.rank-overlay {
  position: absolute;
  top: -35px;
  left: 50%;
  transform: translateX(-50%);
  font-family: 'Electroharmonix', sans-serif;
  font-size: 6rem;
  color: $orange;
  text-shadow: 0 0 20px $orange, 0 0 40px $orange;
  z-index: 2;
  opacity: 0.85;
  white-space: nowrap;
  line-height: 1;
}


/* Specific colors for top ranks */
.top-player-card:nth-child(1) .rank-overlay {
  color: gold;
  text-shadow: 0 0 20px gold, 0 0 40px gold;
}


.top-player-card:nth-child(2) .rank-overlay {
  color: silver;
  text-shadow: 0 0 20px silver, 0 0 40px silver;
}


.top-player-card:nth-child(3) .rank-overlay {
  color: #cd7f32;
  text-shadow: 0 0 20px #cd7f32, 0 0 40px #cd7f32;
}


.card-content {
  position: relative;
  z-index: 3;
}


.player-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid $cream;
  margin-bottom: 0.8rem;
  box-shadow: 0 0 10px rgba(255, 209, 157, 0.5);
}


.player-name {
  font-family: 'Integral-CF', sans-serif;
  color: $cream;
  font-size: 1.4rem;
  margin-bottom: 0.3rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}


.player-points {
  font-family: 'Integral-CF', sans-serif;
  color: $orange;
  font-size: 1.2rem;
  font-weight: bold;
}



.carousel-nav-btn {
  background: $dark-red;
  color: $cream;
  border: 1px solid $red;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
  transition: all 0.3s ease-in-out;
  flex-shrink: 0;
  z-index: 5;
}


.carousel-nav-btn:hover {
  background: $red;
  color: $cream90;
  transform: scale(1.1);
  box-shadow: 0 4px 15px rgba(196, 8, 23, 0.7);
}



/* Responsive adjustments */
@media (max-width: 1600px) {


  h1,
  .user-info,
  .toggle-buttons-section,
  .table-section,
  .actions.bottom-actions,
  #info-side-panel-section,
  .top-players-section {
    padding-left: 2rem;
    padding-right: 2rem;
  }


  .user-info {
    width: calc(100% - 4rem);
  }
}



@media (max-width: 768px) {
  h1 {
    font-size: 3rem;
  }


  h1,
  .user-info,
  .toggle-buttons-section,
  .table-section,
  .actions.bottom-actions,
  #info-side-panel-section,
  .top-players-section {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }


  .user-info {
    padding: 1.5rem 2rem;
    margin-bottom: 2.5rem;
    width: calc(100% - 3rem);
  }


  .user-photo {
    height: 60px;
    width: 60px;
  }


  .welcome-text {
    font-size: 1.2rem;
  }


  .email-text {
    font-size: 0.2rem;
  }


  .toggle-buttons {
    flex-direction: column;
    gap: 1rem;
  }


  .toggle-buttons button {
    font-size: 1.1rem;
    padding: 0.6rem 2rem;
    width: 90%;
    max-width: 300px;
  }


  th,
  td {
    padding: 1rem 1rem;
    font-size: 0.9rem;
  }


  .actions button {
    padding: 0.7rem 1.8rem;
    font-size: 1rem;
  }


  .side-panel {
    padding: 1.5rem 1.8rem;
    font-size: 0.95rem;
  }


  .side-panel-title {
    font-size: 1.8rem;
  }


  .event-message {
    font-size: 1.5rem;
  }


  .section-title {
    font-size: 2.2rem;
  }


  .top-players-carousel-wrapper {
    flex-direction: row;
    justify-content: space-between;
    gap: 0.5rem;
  }


  .carousel-nav-btn {
    width: 40px;
    height: 40px;
    font-size: 1.2rem;
  }


  .carousel-track {
    width: calc(100% - 100px);
    gap: 1rem;
    padding-left: 0.5rem;
    padding-right: 0.5rem;
    scroll-snap-align: start;
  }



  .rank-overlay {
    font-size: 5rem;
    top: -25px;
  }


  .player-avatar {
    width: 80px;
    height: 80px;
  }


  .player-name {
    font-size: 1.3rem;
  }


  .player-points {
    font-size: 1.1rem;
  }
}

@media (max-width: 480px) {
  h1 {
    font-size: 3rem;
    margin-top: 4rem;
  }
  .leaderboard,
  #app {
    min-height: auto;
    height: auto;
    overflow-x: visible;
    padding-bottom: 7rem;
  }

  .leaderboard,
  .user-info,
  .table-section,
  .top-players-section {
    margin: 0 auto;
  }
  


  h1,
  .user-info,
  .table-section,
  .actions.bottom-actions,
  #info-side-panel-section,
  .top-players-section {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .user-info {
    padding: 1rem 1rem;
    margin-bottom: 2rem;
    width: 90%;
    box-sizing: border-box;
    margin-left: auto; // Ensure no shift to the right
    margin-right: auto;
    left: 0;
    right: 0;
    margin: 0 auto;
  }

  .user-photo {
    height: 50px;
    width: 50px;
  }
  .email-text
  {
    font-size: 0.75rem !important;
  }

  .toggle-buttons {
    flex-direction: row; // Make buttons side by side
    gap: 0.5rem;
    justify-content: center;
    width: 100%;
  }

  .toggle-buttons button {
    font-size: 0.65rem; // Smaller font
    padding: 0.5rem 0.8rem; // Smaller button
    min-width: 100px;
    max-width: 50vw;
    width: auto;
    margin: 0;
  }


  table {
    font-size: 0.5rem;
    table-layout: fixed;
    min-width: unset;
    width: 100%;
  }

  th,
  td {
    padding: 0.5rem 0.2rem;
    font-size: 0.7rem;
  }
th:nth-child(1), td:nth-child(1) { width: 15%; padding-left: 0.5rem; }
th:nth-child(2), td:nth-child(2) { width: 45%; }
th:nth-child(3), td:nth-child(3) { width: 40%; }

  .table-container {
    min-width: unset;
    max-width: 100%;
  }

  .actions button {
    padding: 0.6rem 1.5rem;
    font-size: 0.9rem;
  }

  .side-panel {
    padding: 1.2rem 1.5rem;
    font-size: 0.9rem;
  }

  .side-panel-title {
    font-size: 1.5rem;
  }

  .event-message {
    font-size: 1.2rem;
  }

  .section-title {
    font-size: 2rem;
    margin-bottom: 1.5rem;
  }

  .top-players-carousel-wrapper {
    flex-direction: row;
    gap: 0.5rem;
    align-items: center;
    justify-content: center;
    padding-bottom: 5rem;
  }

  .carousel-nav-btn {
    width: 35px;
    height: 35px;
    font-size: 1rem;
  }

  .rank-overlay {
    font-size: 3.5rem;
    top: -15px;
  }

  .player-avatar {
    width: 60px;
    height: 60px;
  }

  .player-name {
    font-size: 1.1rem;
  }

  .player-points {
    font-size: 0.9rem;
  }
}
</style>  

