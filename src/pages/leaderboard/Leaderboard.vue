<template>
    <div class="leaderboard">
        <NavigationBar />
    <h1>This is a leaderboard page</h1>
    <div v-if="userInfo">
        <p>Welcome, {{ userInfo.displayName }}</p>
        <img :src="userInfo.photoURL" alt="User Photo" referrerpolicy="no-referrer" />
        <p>Email: {{ userInfo.email }}</p>
    </div>

    <section id="leaderboard">
        <div>
            <button @click="showTeams = false">Player Rankings</button>
            <button @click="showTeams = true">Team Rankings</button>
        </div>
        <div>
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
                        :class="{ highlight: entry.id === currentUserId }" @click="selectEntry(entry)"
                        :ref="entry.id === currentUserId ? 'myRow' : null">
                        <td>{{ idx + 1 }}</td>
                        <td v-if="showTeams">{{ entry.teamName }}</td>
                        <td v-else>{{ entry.gameName }}</td>
                        <td>{{ entry.totalPoints.toFixed(2) }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
        <div>
            <button v-if="myRank !== null" @click="scrollToMyRank">
                Jump to My Rank
            </button>
        </div>

        <div id="info-side-panel">
            <div v-if="selectedEntry" class="side-panel">
                <!-- Show all stats for selected team/player -->
                <h3>Details for {{ showTeams ? selectedEntry.teamName : selectedEntry.userName }}</h3>
                <pre>{{ selectedEntry }}</pre>
            </div>
        </div>

    </section>
</div>
</template>


<script>
import { ref, onMounted, watch } from 'vue';
import { getFirestore, collection, query, orderBy, getDocs } from 'firebase/firestore';
import firebaseApp from '../../firebase';
import NavigationBar from '@/components/NavigationBar.vue';

export default {
    name: "LeaderboardPage",
    components: {
        NavigationBar
    },
    setup() {
        const db = getFirestore(firebaseApp.app);
        const showTeams = ref(false); // false = player, true = team
        const leaderboard = ref([]);
        const userInfo = ref(null);
        const selectedEntry = ref(null);

        // Fetch leaderboard data
        async function fetchLeaderboard() {
            const colName = showTeams.value ? 'teamRanking' : 'playerRanking';
            const q = query(collection(db, colName), orderBy('totalPoints', 'desc'));
            const snapshot = await getDocs(q);
            leaderboard.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }

        // Fetch on mount and when toggling teams/players
        onMounted(fetchLeaderboard);
        watch(showTeams, fetchLeaderboard);

        // Example: select an entry for details
        function selectEntry(entry) {
            selectedEntry.value = entry;
        }

        return {
            showTeams,
            leaderboard,
            selectedEntry,
            selectEntry,
            userInfo,
        };
    }
}
</script>

<style></style>