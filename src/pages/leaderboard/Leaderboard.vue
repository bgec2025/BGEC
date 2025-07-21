<template>
  <div class="leaderboard">
    <NavigationBar />
    <h1>This is a leaderboard page</h1>
    <div v-if="userInfo" class="user-info">
      <p>Welcome, {{ userInfo.displayName }}</p>
      <img :src="userInfo.photoURL" alt="User Photo" referrerpolicy="no-referrer" />
      <p>Email: {{ userInfo.email }}</p>
    </div>

    <section v-if="isEventLive" id="leaderboard">
      <div class="toggle-buttons">
        <button :class="{ active: !showTeams }" @click="showTeams = false">Player Rankings</button>
        <button :class="{ active: showTeams }" @click="showTeams = true">Team Rankings</button>
      </div>
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
              <td>{{ entry.totalPoints ? entry.totalPoints.toFixed(2) : '0.00' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="actions">
        <button v-if="myRank !== null" @click="scrollToMyRank">
          Jump to My Rank
        </button>
      </div>

      <div id="info-side-panel">
        <div v-if="selectedEntry" class="side-panel">
          <h3>Details for {{ showTeams ? selectedEntry.teamName : selectedEntry.userName ||
            selectedEntry.displayName || selectedEntry.gameName }}</h3>

          <ul>
            <li v-for="item in entryDetails" :key="item.key">
              <strong>{{ item.label }}:</strong> {{ item.value }}
            </li>
          </ul>

        </div>
      </div>
    </section>
    <section v-else class="Event-not-started">

    </section>
  </div>
</template>

<script>
import { ref, onMounted, watch, nextTick, computed } from 'vue';
import { getFirestore, collection, query, orderBy, getDocs, getDoc, doc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth'; // For auth
import firebaseApp from '../../firebase';
import NavigationBar from '@/components/NavigationBar.vue';
import { gsap } from 'gsap';

// Nicely formatted labels for each property
const FIELD_LABELS = {
  id: 'ID',
  teamName: 'Team Name',
  gameName: 'Username',
  displayName: 'Name',
  userName: 'Username',
  totalPoints: 'Total Points',
  normalizedHighestTeamWinStreak: 'Team Win Streak',
  noramlizedSupportPoints: 'Support Points',
  normalizedSupportPoints: 'Support Points',
  normalizedDeaths: 'Deaths',
  normalizedKills: 'Kills',
  teamId: 'Team ID',
  userId: 'User ID',
  email: 'Email',
  // Add other properties as needed...
};

const INFO_DISPLAY_ORDER = [
  'id',
  'teamName', 'gameName', 'displayName', 'userName',
  'teamId', 'userId',
  'totalPoints',
  'normalizedHighestTeamWinStreak',
  'noramlizedSupportPoints', 'normalizedSupportPoints',
  'normalizedDeaths',
  'normalizedKills',
  // Add other keys as needed, in desired order
];


export default {
  name: 'LeaderboardPage',
  components: { NavigationBar },
  setup() {
    const db = getFirestore(firebaseApp.app);
    const auth = getAuth(firebaseApp.app);

    const showTeams = ref(false); // false = player, true = team
    const leaderboard = ref([]);
    const userInfo = ref(null);
    const selectedEntry = ref(null);
    const currentUserId = ref(null);
    const isEventLive = ref(false);

    // -- 1. Get current logged-in user info --
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
        isEventLive.value = false; // Or handle as needed
      }
    });

    // -- 2. Fetch leaderboard data based on mode (team/player) --
    async function fetchLeaderboard() {
      const colName = showTeams.value ? 'teamRanking' : 'playerRanking';
      const q = query(collection(db, colName), orderBy('totalPoints', 'desc'));
      const snapshot = await getDocs(q);
      leaderboard.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      await nextTick();
    }

    onMounted(fetchLeaderboard);
    watch(showTeams, fetchLeaderboard);
    onMounted(() => {
      // Animate the heading
      gsap.from("h1", { duration: 1, opacity: 0, y: -45, ease: "power3.out" });
      // Animate user info
      gsap.from(".user-info", { duration: 1, opacity: 0, y: -25, delay: 0.2, ease: "power3.out" });
      // Animate table and toggle buttons
      gsap.from(".toggle-buttons, .table-container", { duration: 1.1, opacity: 0, y: 35, delay: 0.35, stagger: 0.2, ease: "power2.out" });
    });

    // Side panel GSAP animate ONLY when selectedEntry changes & panel is present
    watch(selectedEntry, async (val) => {
      if (val) {
        await nextTick();// eslint-disable-next-line
        const panel = document.querySelector('.side-panel');
        if (panel) {
          gsap.from(panel, { duration: 0.6, opacity: 0, y: 38, scale: 0.94, ease: "power3.out" });
        }
      }
    });
    // -- 3. Get "my own entry id" to highlight and scroll to row --
    const myOwnEntryId = computed(() => {
      if (!userInfo.value || leaderboard.value.length === 0) return null;
      if (!showTeams.value) {
        // Player view: match by entry.userId or entry.id
        // Prefer entry.userId if available, else fallback to entry.id === currentUserId
        const userId = userInfo.value.uid;
        // First try userId property
        const found = leaderboard.value.find(
          (entry) => entry.userId === userId || entry.id === userId
        );
        return found ? found.id : null;
      } else {
        // Team view: need user's team id, assume userInfo.value.teamId or similar
        const userTeamId = userInfo.value && userInfo.value.teamId; // This may require extra logic!
        if (userTeamId) {
          const found = leaderboard.value.find(
            (entry) => entry.teamId === userTeamId || entry.id === userTeamId
          );
          return found ? found.id : null;
        }
        // No user team: fallback to null
        return null;
      }
    });

    // -- 4. Find "my rank": index in leaderboard of myOwnEntryId --
    const myRank = computed(() => {
      if (!myOwnEntryId.value) return null;
      const idx = leaderboard.value.findIndex(entry => entry.id === myOwnEntryId.value);
      return idx !== -1 ? idx + 1 : null;
    });

    const entryDetails = computed(() => {
      if (!selectedEntry.value) return [];
      // Only show "known" keys (filtered)
      return INFO_DISPLAY_ORDER
        .map((key) => {
          if (selectedEntry.value[key] !== undefined && selectedEntry.value[key] !== null) {
            return {
              key,
              label: FIELD_LABELS[key] || key,
              value: selectedEntry.value[key]
            }
          }
        })
        .filter(Boolean); // remove undefineds
    });

    // -- 5. Scroll to "my row" --
    function scrollToMyRank() {
      if (!myOwnEntryId.value) return;
      nextTick(() => {
        //eslint-disable-next-line
        const row = document.querySelector('tr.highlight');
        if (row) row.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }

    function selectEntry(entry) {
      selectedEntry.value = entry;
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
      entryDetails
    };
  },
};
</script>

<style scoped lang="scss">
@import "@/assets/styles/global.scss";

// Completely remove all browser/app margins and paddings
html,
body,
#app {
  width: 100vw !important;
  min-width: 100vw !important;
  height: 100vh !important;
  min-height: 100vh !important;
  margin: 0 !important;
  padding: 0 !important;
  background: $bg-dark !important;
  box-sizing: border-box !important;
  overflow-x: hidden !important;
}

.leaderboard {
  min-height: 100vh;
  min-width: 100vw;
  width: 100vw;
  height: 100vh;
  background: $bg-dark-alt;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  margin: 0 !important;
  padding: 0 !important;
  overflow-x: hidden;
}

// Center LeaderBoard text (heading), animate in (via GSAP) and restyle for modern look
h1 {
  color: #fff;
  font-family: 'Esporte', serif;
  font-size: clamp(2.3rem, 5vw, 4.2rem);
  font-weight: 900;
  text-align: center;
  margin: 0;
  padding: 2.2rem 0 1.1rem 0;
  letter-spacing: 2.5px;
  text-shadow: 0 2px 20px rgba(0, 0, 0, 0.27);
  filter: drop-shadow(0 12px 30px $brown30);
  user-select: none;
}

// User info panel, white text, softened dark bg
.user-info {
  background: rgba(26, 26, 26, 0.89);
  border-radius: 14px;
  padding: 1.2rem 2.1rem 1.2rem 2.1rem;
  margin: 0 auto 2.2rem auto;
  color: white;
  font-family: 'Integral-CF', sans-serif;
  font-size: 1.05rem;
  width: 97vw;
  max-width: 850px;
  box-shadow: 0 6px 40px $brown30;
  border: 1px solid $brown30;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 1.2rem;
  position: relative;
  z-index: 1;
}

.user-info img {
  height: 52px;
  width: 52px;
  border-radius: 50%;
  border: 2px solid $cream20;
  background: $brown;
  object-fit: cover;
  box-shadow: 0 0 14px $brown30;
  margin-right: 18px;
}

// Toggle buttons
.toggle-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  align-items: center;
  margin-bottom: 1.5rem;
}

.toggle-buttons button {
  font-size: 1.03rem;
  padding: 0.48rem 2.1rem;
  border-radius: 18px;
  background: $bg-dark;
  color: white;
  border: 2px solid $orange;
  cursor: pointer;
  font-family: 'Integral-CF', 'Esporte', serif;
  font-weight: 700;
  margin: 0;
  transition:
    background 0.21s cubic-bezier(.4, 1.1, .45, 1),
    color 0.18s cubic-bezier(.4, 1.1, .45, 1),
    border 0.19s cubic-bezier(.4, 1.1, .45, 1),
    box-shadow 0.19s cubic-bezier(.4, 1.1, .45, 1);
  box-shadow: 0 1px 5px $brown30;
  letter-spacing: 1px;
}

.toggle-buttons button.active,
.toggle-buttons button:hover {
  background: $orange;
  color: $bg-dark;
  border: 2px solid $cream;
  box-shadow: 0 2px 14px $orange;
}

.table-container {
  width: 100vw;
  margin: 0;
  padding: 0;
  overflow-x: auto;
  display: flex;
  justify-content: center;
}

table {
  border-collapse: collapse;
  width: 97vw;
  max-width: 1200px;
  background: rgba(12, 12, 15, 0.99);
  color: $cream;
  font-family: 'Integral-CF', serif;
  border-radius: 10px;
  box-shadow: 0 2px 32px $brown30, 0 10px 80px $brown30;
  table-layout: auto;
  font-size: 1.09rem;
  margin: 0 auto;
}

// Table head
th,
td {
  padding: 1.03rem 0.82rem;
  text-align: left;
  border-bottom: 1px solid $brown30;
  font-family: inherit;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

// Special thead
th {
  font-weight: 800;
  color: $orange;
  background: $brown30;
  border-bottom: 2px solid $orange;
  font-size: 1.13rem;
}

tr.highlight {
  background: $red;
  color: $cream90;
  font-weight: 700;
  transition: background 0.23s;
}

tr:hover {
  background: rgba(255, 255, 255, 0.04);
  cursor: pointer;
  color: $cream;
}

// Table body bg color
tbody tr {
  background: transparent;
  color: #fafcff;
  transition: background 0.22s;
}

tbody tr:nth-child(even) {
  background: rgba(255, 255, 255, 0.012);
}

.actions {
  margin: 1.35rem 0 0 0;
  text-align: right;
  width: 97vw;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
  padding-right: 0;
}

.actions button {
  background: $red;
  color: white;
  border: none;
  border-radius: 7px;
  padding: 0.7rem 1.5rem;
  font-size: 1.03rem;
  font-family: 'Integral-CF', serif;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.17s;
  box-shadow: 0 0 5px $red;
  letter-spacing: 0.7px;
}

.actions button:hover {
  background: $dark-red;
  color: $cream;
}

// INFOPANEL with background image, blur, and GSAP fadein
#info-side-panel {
  margin: 2.1rem auto 0 auto;
  min-height: 80px;
  width: 97vw;
  max-width: 1200px;
  position: relative;
  padding: 0;
  z-index: 10;
}

.side-panel {
  background: url('@/assets/images/logo.png'), linear-gradient(90deg, rgba(34, 34, 34, 0.92) 90%, rgba(52, 3, 7, 0.02) 100%);
  background-size: cover;
  background-repeat: no-repeat;
  background-position: right center;
  border-left: 5px solid $orange;
  padding: 2.3rem 1.8rem 2.3rem 2.4rem;
  border-radius: 18px;
  box-shadow: 0 6px 80px 10px $brown30;
  color: #fff;
  font-family: 'Integral-CF', serif;
  font-size: 1.16rem;
  width: 100%;
  overflow: hidden;
  backdrop-filter: blur(8.5px) brightness(1.04);
  position: relative;
  z-index: 8889;
  animation: showPanel 0.8s cubic-bezier(.6, 1.45, .6, .96);
}

@keyframes showPanel {
  from {
    opacity: 0;
    transform: translateY(32px) scale(0.96);
  }

  to {
    opacity: 1;
    transform: none;
  }
}

// Make sure all cards and content are full-bleed on mobile
@media (max-width: 900px) {

  .user-info,
  table,
  .actions,
  #info-side-panel,
  .side-panel {
    width: 99vw !important;
    max-width: 99vw !important;
    border-radius: 0 !important;
    margin-left: 0 !important;
    margin-right: 0 !important;
    padding-left: 6vw !important;
    padding-right: 4vw !important;
  }

  h1 {
    padding-left: 0;
    padding-right: 0;
    font-size: 2rem;
  }
}

// universal: No horizontal or vertical scroll
body,
html,
#app,
.leaderboard {
  overflow-x: hidden !important;
  overflow-y: auto;
}
</style>