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
                            <!-- Add more columns as needed -->
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(entry, idx) in leaderboard" :key="entry.id"
                            :class="{ highlight: entry.id === myOwnEntryId }" @click="selectEntry(entry)"
                            :ref="entry.id === myOwnEntryId ? 'myRow' : null">
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
                    <!-- Render selectedEntry details nicely -->
                    <ul>
                        <li v-for="(val, key) in selectedEntry" :key="key">
                            <strong>{{ key }}:</strong> {{ val }}
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
            isEventLive
        };
    },
};
</script>

<style scoped>
.leaderboard {
    max-width: 900px;
    margin: 2rem auto;
    padding: 1.5rem 2rem;
    background: #fafbfe;
    border-radius: 18px;
    box-shadow: 0 2px 12px rgba(40, 56, 98, 0.08);
}

.user-info {
    margin-bottom: 1.5rem;
}

.user-info img {
    height: 48px;
    width: 48px;
    border-radius: 50%;
    border: 1px solid #ddd;
    vertical-align: middle;
    margin-right: 12px;
}

.toggle-buttons {
    margin-bottom: 1.25rem;
}

.toggle-buttons button {
    font-size: 1rem;
    padding: 0.4rem 1.5rem;
    margin-right: 0.6rem;
    border-radius: 22px;
    background: #eee;
    border: none;
    cursor: pointer;
    transition: background 0.18s;
}

.toggle-buttons button.active,
.toggle-buttons button:hover {
    background: #3667d6;
    color: white;
}

.table-container {
    overflow-x: auto;
}

table {
    border-collapse: collapse;
    width: 100%;
    background: white;
}

th,
td {
    padding: 0.75rem 1rem;
    text-align: left;
    border-bottom: 1px solid #ececec;
}

tr.highlight {
    background: #4f6aa4;
    font-weight: 600;
}

tr:hover {
    background: #f8fafe;
    cursor: pointer;
}

.actions {
    margin: 1.5rem 0;
    text-align: right;
}

.actions button {
    background: #3558da;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 0.6rem 1.2rem;
    font-size: 1rem;
    cursor: pointer;
    box-shadow: 0 2px 4px #caf3ff10;
    transition: background 0.15s;
}

.actions button:hover {
    background: #243a6a;
}

#info-side-panel {
    margin-top: 2rem;
    min-height: 80px;
}

.side-panel {
    background: #f7faff;
    border-left: 4px solid #4b90ea;
    padding: 1rem 1.2rem;
    border-radius: 8px;
    box-shadow: 0 1px 4px rgba(138, 180, 255, 0.11);
}

@media (max-width: 600px) {
    .leaderboard {
        padding: 1rem 0.5rem;
    }

    th,
    td {
        padding: 0.5rem 0.4rem;
    }
}
</style>
