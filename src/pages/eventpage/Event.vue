<template>
  <div class="event-page">
    <NavigationBar />


    <section class="eventsShow">
      <div v-if="!isEventLive">
        Event Yet to go Live
      </div>
      <div v-else>
        <div>
          <h1 class="event-schedule-title">
            <span class="event-title">Event</span>
            <br />
            <span class="schedule-title">Schedule</span>
          </h1>
        </div>
        <div v-for="day in eventDays" :key="day.date" class="event-day">
          <h2>{{ formatDate(day.date) }}</h2>
          <div v-for="match in day.matches" :key="match.matchId" class="match-row">
            <!-- Left team name -->
            <div class="TeamsInfo">
              <div class="match-col teamA">{{ match.teamAName }}</div>
              <!-- Center VS + teamBName -->
              <div class="vs-center">
                <span class="vs-text">VS</span>
              </div>
              <div class="match-col teamB">{{ match.teamBName }}</div>
            </div>
            <!-- Right: time on top, status below -->
            <div class="match-col time-status">
              <div class="time">{{ match.time }}</div>
              <div class="matchStatus">
                <span class="matchStatus" :class="{
                  status: day.isLive && match.isLive,
                  result: day.isLive && !match.isLive
                }">
                  {{ !match.isLive ? match.result : match.status }}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>

    <section v-if="isAdmin" class="EventSettings">
      <button v-if="!isEventLive" @click="changeEventStatus">
        Make Event Live
      </button>
      <div v-else class="PlayerStatsEdit">
        <form @submit.prevent="statUpdateSubmit">
          <!-- Toggle between Team and Player stat update -->
          <div class="StatTypeSelection">
            <Toggle v-model="statTypeTeam" :on-label="'Update Team'" :off-label="'Update Player Stat'" />
          </div>

          <!-- Team Stat Update Form -->
          <div v-if="statTypeTeam" id="team-Stat-Update">
            <label>Team ID:
              <input v-model="teamStatForm.teamId" required />
            </label>
            <label>Matches Won:
              <input type="number" v-model.number="teamStatForm.matchesWon" required />
            </label>
            <label>Matches Lost:
              <input type="number" v-model.number="teamStatForm.matchesLost" required />
            </label>
            <label>Current Win Streak:
              <input type="number" v-model.number="teamStatForm.currentWinStreak" required />
            </label>
            <label>Highest Win Streak:
              <input type="number" v-model.number="teamStatForm.highestWinStreak" required />
            </label>
            <label>Accumulated Kills:
              <input type="number" v-model.number="teamStatForm.accumulatedKills" required />
            </label>
            <label>Accumulated Deaths:
              <input type="number" v-model.number="teamStatForm.accumulatedDeaths" required />
            </label>
          </div>

          <!-- Player Stat Update Form -->
          <div v-else id="player-stat-update">
            <label>User ID:
              <input v-model="playerStatForm.userId" required />
            </label>
            <label>Team ID:
              <input v-model="playerStatForm.teamId" required />
            </label>
            <!-- Removed gameName and userName fields -->
            <label>Kills:
              <input type="number" v-model.number="playerStatForm.kills" required />
            </label>
            <label>Deaths:
              <input type="number" v-model.number="playerStatForm.deaths" required />
            </label>
            <label>Highest Team Win Streak:
              <input type="number" v-model.number="playerStatForm.highestTeamWinStreak" required />
            </label>
            <label>Avg Combat Score:
              <input type="number" v-model.number="playerStatForm.supportPoints" required />
            </label>
          </div>

          <div class="submit-section">
            <button type="submit" :disabled="isSubmitting">
              {{ isSubmitting ? 'Submitting...' : 'Update Stats' }}
            </button>
          </div>
          <div v-if="statUpdateMessage" class="stat-update-message">
            {{ statUpdateMessage }}
          </div>
        </form>
      </div>
    </section>
  </div>
</template>

<script>
/* eslint-disable */
import NavigationBar from '@/components/NavigationBar.vue';
import { onBeforeMount, ref, onMounted } from 'vue';
import Toggle from '@vueform/toggle/src/Toggle';

import '@vueform/toggle/themes/default.css'

import fetchUser from '../../getUserData'
import firebaseApp from '../../firebase'
import { onAuthStateChanged } from "firebase/auth";
import { getFirestore, getDoc, doc, updateDoc, getDocs, collection, setDoc, runTransaction } from "firebase/firestore";

const userInfo = ref(null);

export default {
  name: "EventPage",
  components: {
    Toggle,
    NavigationBar
  },
  setup() {
    const isEventLive = ref(false);
    const isAdmin = ref(false);
    const eventDays = ref([]);
    const statTypeTeam = ref(true);
    const teamStatForm = ref({
      teamId: '',
      matchesWon: 0,
      matchesLost: 0,
      currentWinStreak: 0,
      highestWinStreak: 0,
      accumulatedKills: 0,
      accumulatedDeaths: 0,
    });
    const playerStatForm = ref({
      userId: '',
      teamId: '',
      kills: 0,
      deaths: 0,
      highestTeamWinStreak: 0,
      supportPoints: 0,
    });
    const statUpdateMessage = ref('');
    const isSubmitting = ref(false);
    const loadingUserInfo = ref(true);
    const loadingUserInfoError = ref("");

    const db = getFirestore(firebaseApp.app);
    const eventStatusRef = doc(db, "events", "currentEvent");

    onBeforeMount(async () => {
      const eventSnap = await getDoc(eventStatusRef);
      if (eventSnap.exists()) {
        isEventLive.value = eventSnap.data().eventStatus;
      }
      onAuthStateChanged(firebaseApp.auth, async (user) => {
        try {
          if (!user) {
            // eslint-diable-next-line
            window.location.href = "/login.html";
          } else {
            userInfo.value = await fetchUser.fetchUserData(user);
            const adminRef = doc(db, "admin", user.uid);
            const adminSnap = await getDoc(adminRef);
            if (adminSnap.exists()) {
              isAdmin.value = true;
            }
          }
        } catch (error) {
          loadingUserInfoError.value = error.message || error;
        } finally {
          loadingUserInfo.value = false;
        }
      });
    });

    onMounted(async () => {
      const eventsSnapshot = await getDocs(collection(db, "events"));
      // Filter for documents named 'Dayx' *AND* whose isLive === true
      const dayDocs = eventsSnapshot.docs.filter(doc => /^Day\d+$/.test(doc.id) && doc.data().isLive === true);

      const days = dayDocs.map(doc => ({
        date: doc.data().Date,
        matches: doc.data().matches || [],
        isLive: doc.data().isLive || false,
      }));
      days.sort((a, b) => new Date(a.date) - new Date(b.date));
      eventDays.value = days;
    });
    
    // Helper function to safely normalize values and prevent division by zero
    // Moved outside of statUpdateSubmit to make it globally available
    const safeNormalize = (value, min, max) => {
      const denominator = max - min;
      // If min and max are equal, return 1 for the max value and 0 otherwise
      if (denominator === 0) {
        return value === max ? 1 : 0;
      }
      return (value - min) / denominator;
    };



    async function statUpdateSubmit() {
      isSubmitting.value = true;
      statUpdateMessage.value = '';
      try {
        console.log("Updating stats...", statTypeTeam.value ? "Team stats" : "Player stats");

        // First, update the team/player stats document
        if (statTypeTeam.value) {
          const refStat = doc(db, "teamstats", teamStatForm.value.teamId);
          console.log("Updating team stats for:", teamStatForm.value.teamId);
          await updateDoc(refStat, { ...teamStatForm.value });
          console.log("Team stats updated successfully");
        } else {
          const refStat = doc(db, "playerstats", playerStatForm.value.userId);
          console.log("Updating player stats for:", playerStatForm.value.userId);
          await updateDoc(refStat, { ...playerStatForm.value });
          console.log("Player stats updated successfully");
        }

        // Then update minMaxDoc to ensure we have the latest min/max values
        const minMaxRef = doc(db, "events", "minMaxDoc");
        await minMaxUpdate(minMaxRef, statTypeTeam.value, teamStatForm, playerStatForm);

        // Get updated minMaxDoc after the update
        const minMaxDoc = await getDoc(minMaxRef);
        if (!minMaxDoc.exists()) {
          throw new Error("MinMaxDoc still doesn't exist after update attempt");
        }
        const minMaxDocData = minMaxDoc.data();
        console.log("Updated minMaxDoc data retrieved:", minMaxDocData);

        if (statTypeTeam.value) {
          // Stats already updated above, now update the rankings
          const refStat = doc(db, "teamstats", teamStatForm.value.teamId);
          const refRanking = doc(db, "teamRanking", teamStatForm.value.teamId);
          const statData = (await getDoc(refStat)).data();
          const getMembers = statData.members?.length || 0;

          console.log("Updating team ranking for:", teamStatForm.value.teamId);

          // Helper function to safely normalize values and prevent division by zero
          const safeNormalize = (value, min, max) => {
            const denominator = max - min;
            // If min and max are equal, return 1 for the max value and 0 otherwise
            if (denominator === 0) {
              return value === max ? 1 : 0;
            }
            return (value - min) / denominator;
          };

          await updateDoc(refRanking, {
            normalizedDeaths: safeNormalize(
              teamStatForm.value.accumulatedDeaths,
              minMaxDocData.Team.accumulatedDeaths.min,
              minMaxDocData.Team.accumulatedDeaths.max
            ),
            normalizedKills: safeNormalize(
              teamStatForm.value.accumulatedKills,
              minMaxDocData.Team.accumulatedKills.min,
              minMaxDocData.Team.accumulatedKills.max
            ),
            normalizedCurrentWinStreak: safeNormalize(
              teamStatForm.value.currentWinStreak,
              minMaxDocData.Team.currentWinStreak.min,
              minMaxDocData.Team.currentWinStreak.max
            ),
            normalizedMaxWinStreak: safeNormalize(
              teamStatForm.value.highestWinStreak,
              minMaxDocData.Team.highestWinStreak.min,
              minMaxDocData.Team.highestWinStreak.max
            ),
            normalizedMatchesLost: safeNormalize(
              teamStatForm.value.matchesLost,
              minMaxDocData.Team.matchesLost.min,
              minMaxDocData.Team.matchesLost.max
            ),
            normalizedMatchesWon: safeNormalize(
              teamStatForm.value.matchesWon,
              minMaxDocData.Team.matchesWon.min,
              minMaxDocData.Team.matchesWon.max
            ),
            normalizedNumMembers: (getMembers - 1) / 3
          });

          const rankingdoc = (await getDoc(refRanking)).data();
          await updateDoc(refRanking, {
            totalPoints: 0.3 * rankingdoc.normalizedMatchesWon +
              0.15 * rankingdoc.normalizedCurrentWinStreak +
              0.15 * rankingdoc.normalizedMaxWinStreak +
              0.15 * rankingdoc.normalizedKills -
              0.1 * rankingdoc.normalizedDeaths - // deaths: negative effect
              0.1 * rankingdoc.normalizedMatchesLost + // matches lost: negative effect
              0.05 * rankingdoc.normalizedNumMembers
          });

          statUpdateMessage.value = 'Team stats and ranking updated!';
        } else {
          try {
            // Stats already updated above, now update the rankings
            const refRanking = doc(db, "playerRanking", playerStatForm.value.userId);
            console.log("Updating player ranking for:", playerStatForm.value.userId);
            
            // Get the current ranking document or create it if it doesn't exist
            const rankingDocSnap = await getDoc(refRanking);
            
            if (!rankingDocSnap.exists()) {
              console.log("Player ranking document doesn't exist, creating it");
              await setDoc(refRanking, {
                normalizedDeaths: 0,
                normalizedHighestTeamWinStreak: 0,
                normalizedKills: 0,
                normalizedSupportPoints: 0,
                teamId: playerStatForm.value.teamId,
                totalPoints: 0
              });
            }
            
            // Reuse the same safeNormalize helper function for player stats
            await updateDoc(refRanking, {
              normalizedKills: safeNormalize(
                playerStatForm.value.kills,
                minMaxDocData.Player.kills.min,
                minMaxDocData.Player.kills.max
              ),
              normalizedHighestTeamWinStreak: safeNormalize(
                playerStatForm.value.highestTeamWinStreak,
                minMaxDocData.Player.highestTeamWinStreak.min,
                minMaxDocData.Player.highestTeamWinStreak.max
              ),
              normalizedDeaths: safeNormalize(
                playerStatForm.value.deaths,
                minMaxDocData.Player.deaths.min,
                minMaxDocData.Player.deaths.max
              ),
              normalizedSupportPoints: safeNormalize(
                playerStatForm.value.supportPoints,
                minMaxDocData.Player.supportPoints.min,
                minMaxDocData.Player.supportPoints.max
              )
            });

            // Get updated ranking doc for calculating total points
            const rankingDoc = (await getDoc(refRanking)).data();
            await updateDoc(refRanking, {
              totalPoints: 0.4 * rankingDoc.normalizedKills +
                0.25 * rankingDoc.normalizedSupportPoints +
                0.2 * rankingDoc.normalizedHighestTeamWinStreak -
                0.15 * rankingDoc.normalizedDeaths // Changed from + to - to make deaths decrease the score
            });
            console.log("Player ranking updated successfully");
          } catch (rankingError) {
            console.error("Error updating player ranking:", rankingError);
            throw rankingError; // Re-throw to be caught by outer try-catch
          }

          statUpdateMessage.value = 'Player stats and ranking updated!';
        }

        // --- NEW: Re-normalize and update all teams and players after minMaxDoc update ---
        // Update all team rankings
        const allTeamStatsSnap = await getDocs(collection(db, "teamstats"));
        for (const teamDoc of allTeamStatsSnap.docs) {
          const teamId = teamDoc.id;
          const stat = teamDoc.data();
          const membersCount = stat.members?.length || 0;
          const refRanking = doc(db, "teamRanking", teamId);

          // Update normalized stats
          await updateDoc(refRanking, {
            normalizedDeaths: safeNormalize(
              stat.accumulatedDeaths,
              minMaxDocData.Team.accumulatedDeaths.min,
              minMaxDocData.Team.accumulatedDeaths.max
            ),
            normalizedKills: safeNormalize(
              stat.accumulatedKills,
              minMaxDocData.Team.accumulatedKills.min,
              minMaxDocData.Team.accumulatedKills.max
            ),
            normalizedCurrentWinStreak: safeNormalize(
              stat.currentWinStreak,
              minMaxDocData.Team.currentWinStreak.min,
              minMaxDocData.Team.currentWinStreak.max
            ),
            normalizedMaxWinStreak: safeNormalize(
              stat.highestWinStreak,
              minMaxDocData.Team.highestWinStreak.min,
              minMaxDocData.Team.highestWinStreak.max
            ),
            normalizedMatchesLost: safeNormalize(
              stat.matchesLost,
              minMaxDocData.Team.matchesLost.min,
              minMaxDocData.Team.matchesLost.max
            ),
            normalizedMatchesWon: safeNormalize(
              stat.matchesWon,
              minMaxDocData.Team.matchesWon.min,
              minMaxDocData.Team.matchesWon.max
            ),
            normalizedNumMembers: (membersCount - 1) / 3
          });

          // Get updated normalized stats for totalPoints calculation
          const rankingdoc = (await getDoc(refRanking)).data();
          await updateDoc(refRanking, {
            totalPoints: 0.3 * rankingdoc.normalizedMatchesWon +
              0.15 * rankingdoc.normalizedCurrentWinStreak +
              0.15 * rankingdoc.normalizedMaxWinStreak +
              0.15 * rankingdoc.normalizedKills -
              0.1 * rankingdoc.normalizedDeaths -
              0.1 * rankingdoc.normalizedMatchesLost +
              0.05 * rankingdoc.normalizedNumMembers
          });
        }

        // Update all player rankings
        const allPlayerStatsSnap = await getDocs(collection(db, "playerstats"));
        for (const playerDoc of allPlayerStatsSnap.docs) {
          const playerId = playerDoc.id;
          const stat = playerDoc.data();
          const refRanking = doc(db, "playerRanking", playerId);

          await updateDoc(refRanking, {
            normalizedKills: safeNormalize(
              stat.kills,
              minMaxDocData.Player.kills.min,
              minMaxDocData.Player.kills.max
            ),
            normalizedHighestTeamWinStreak: safeNormalize(
              stat.highestTeamWinStreak,
              minMaxDocData.Player.highestTeamWinStreak.min,
              minMaxDocData.Player.highestTeamWinStreak.max
            ),
            normalizedDeaths: safeNormalize(
              stat.deaths,
              minMaxDocData.Player.deaths.min,
              minMaxDocData.Player.deaths.max
            ),
            normalizedSupportPoints: safeNormalize(
              stat.supportPoints,
              minMaxDocData.Player.supportPoints.min,
              minMaxDocData.Player.supportPoints.max
            )
          });

          const rankingDoc = (await getDoc(refRanking)).data();
          await updateDoc(refRanking, {
            totalPoints: 0.4 * rankingDoc.normalizedKills +
              0.25 * rankingDoc.normalizedSupportPoints +
              0.2 * rankingDoc.normalizedHighestTeamWinStreak -
              0.15 * rankingDoc.normalizedDeaths
          });
        }
        // --- END NEW ---

        statUpdateMessage.value = statTypeTeam.value
          ? 'Team stats and all rankings updated!'
          : 'Player stats and all rankings updated!';

        updateWinStreak(teamStatForm.value.teamId, teamStatForm.value.highestWinStreak);
      } catch (err) {
        statUpdateMessage.value = 'Error: ' + (err.message || err);
      } finally {
        isSubmitting.value = false;
      }
    }

    function formatDate(timestamp) {
      if (timestamp && timestamp.seconds) {
        const dateObj = new Date(timestamp.seconds * 1000);
        return dateObj.toLocaleDateString();
      }
      return timestamp;
    }

    async function minMaxUpdate(minMaxRefVar, isTeamUpdate, teamStatFormUpdate, playerStatFormUpdate) {
      try {
        console.log("Starting minMaxUpdate...");
        const docSnap = await getDoc(minMaxRefVar);

        // If the minMaxDoc doesn't exist, create it with initial values
        if (!docSnap.exists()) {
          console.log("Min/max document does not exist! Creating initial document...");
          // Initialize the minMaxDoc with the current values as both min and max
          const initialData = {
            Team: {
              matchesWon: { min: 0, max: teamStatFormUpdate.value.matchesWon },
              matchesLost: { min: 0, max: teamStatFormUpdate.value.matchesLost },
              currentWinStreak: { min: 0, max: teamStatFormUpdate.value.currentWinStreak },
              highestWinStreak: { min: 0, max: teamStatFormUpdate.value.highestWinStreak },
              accumulatedKills: { min: 0, max: teamStatFormUpdate.value.accumulatedKills },
              accumulatedDeaths: { min: 0, max: teamStatFormUpdate.value.accumulatedDeaths }
            },
            Player: {
              kills: { min: 0, max: playerStatFormUpdate.value.kills },
              deaths: { min: 0, max: playerStatFormUpdate.value.deaths },
              highestTeamWinStreak: { min: 0, max: playerStatFormUpdate.value.highestTeamWinStreak },
              supportPoints: { min: 0, max: playerStatFormUpdate.value.supportPoints }
            }
          };
          await setDoc(minMaxRefVar, initialData);
          console.log("Created initial minMaxDoc:", initialData);
          // Don't recurse as this could cause stack overflow, just get the doc we just created
          const newDocSnap = await getDoc(minMaxRefVar);
          if (!newDocSnap.exists()) {
            throw new Error("Failed to create minMaxDoc");
          }
          const docData = newDocSnap.data();
          console.log("Newly created minMaxDoc data:", docData);
          return docData; // Return the data directly
        }

        // The document exists, get its data
        const docData = docSnap.data();
        console.log("Existing minMaxDoc data:", docData);

        // Make sure both Team and Player sections exist in the document
        if (!docData.Team) {
          docData.Team = {
            matchesWon: { min: 0, max: teamStatFormUpdate.value.matchesWon },
            matchesLost: { min: 0, max: teamStatFormUpdate.value.matchesLost },
            currentWinStreak: { min: 0, max: teamStatFormUpdate.value.currentWinStreak },
            highestWinStreak: { min: 0, max: teamStatFormUpdate.value.highestWinStreak },
            accumulatedKills: { min: 0, max: teamStatFormUpdate.value.accumulatedKills },
            accumulatedDeaths: { min: 0, max: teamStatFormUpdate.value.accumulatedDeaths }
          };
          await setDoc(minMaxRefVar, { Team: docData.Team }, { merge: true });
          console.log("Created missing Team section in minMaxDoc");
        }

        if (!docData.Player) {
          docData.Player = {
            kills: { min: 0, max: playerStatFormUpdate.value.kills },
            deaths: { min: 0, max: playerStatFormUpdate.value.deaths },
            highestTeamWinStreak: { min: 0, max: playerStatFormUpdate.value.highestTeamWinStreak },
            supportPoints: { min: 0, max: playerStatFormUpdate.value.supportPoints }
          };
          await setDoc(minMaxRefVar, { Player: docData.Player }, { merge: true });
          console.log("Created missing Player section in minMaxDoc");
        }

        // Always update both Team and Player sections regardless of isTeamUpdate
        // This ensures we have complete min/max data for both
        
        // Define field arrays
        const teamFields = [
          "matchesWon",
          "matchesLost",
          "currentWinStreak",
          "highestWinStreak",
          "accumulatedKills",
          "accumulatedDeaths"
        ];
        
        const playerFields = [
          "kills",
          "deaths",
          "highestTeamWinStreak",
          "supportPoints"
        ];
        
        // Create properly structured update objects for Team and Player
        const updatesTeam = {};
        const updatesPlayer = {};
        
        // Process Team fields
        teamFields.forEach(field => {
          const newVal = teamStatFormUpdate.value[field];
          
          // Handle case when field doesn't exist
          if (!docData.Team[field]) {
            console.log(`Creating missing Team.${field} field in minMaxDoc`);
            docData.Team[field] = { min: 0, max: newVal };
            updatesTeam[field] = { min: 0, max: newVal };
          } else {
            // Field exists, check if we need to update min/max
            const currMin = docData.Team[field].min;
            const currMax = docData.Team[field].max;
            
            // Initialize field in updates if needed
            if (!updatesTeam[field]) {
              updatesTeam[field] = {};
            }
            
            // Check if min needs updating
            if ((currMin === undefined || currMin === null) || newVal < currMin) {
              console.log(`Updating Team.${field}.min to ${newVal < currMin ? newVal : 0}`);
              updatesTeam[field].min = newVal < currMin ? newVal : 0;
            }
            
            // Check if max needs updating
            if ((currMax === undefined || currMax === null) || newVal > currMax) {
              console.log(`Updating Team.${field}.max to ${newVal > currMax ? newVal : newVal}`);
              updatesTeam[field].max = newVal > currMax ? newVal : newVal;
            }
            
            // Remove empty objects to avoid unnecessary updates
            if (Object.keys(updatesTeam[field]).length === 0) {
              delete updatesTeam[field];
            }
          }
        });
        
        // Process Player fields
        playerFields.forEach(field => {
          const newVal = playerStatFormUpdate.value[field];
          
          // Handle case when field doesn't exist
          if (!docData.Player[field]) {
            console.log(`Creating missing Player.${field} field in minMaxDoc`);
            docData.Player[field] = { min: 0, max: newVal };
            updatesPlayer[field] = { min: 0, max: newVal };
          } else {
            // Field exists, check if we need to update min/max
            const currMin = docData.Player[field].min;
            const currMax = docData.Player[field].max;
            
            // Initialize field in updates if needed
            if (!updatesPlayer[field]) {
              updatesPlayer[field] = {};
            }
            
            // Check if min needs updating
            if ((currMin === undefined || currMin === null) || newVal < currMin) {
              console.log(`Updating Player.${field}.min to ${newVal < currMin ? newVal : 0}`);
              updatesPlayer[field].min = newVal < currMin ? newVal : 0;
            }
            
            // Check if max needs updating
            if ((currMax === undefined || currMax === null) || newVal > currMax) {
              console.log(`Updating Player.${field}.max to ${newVal > currMax ? newVal : newVal}`);
              updatesPlayer[field].max = newVal > currMax ? newVal : newVal;
            }
            
            // Remove empty objects to avoid unnecessary updates
            if (Object.keys(updatesPlayer[field]).length === 0) {
              delete updatesPlayer[field];
            }
          }
        });
        
        // Combine updates into proper nested structure
        const updates = {};
        if (Object.keys(updatesTeam).length > 0) {
          updates.Team = updatesTeam;
        }
        if (Object.keys(updatesPlayer).length > 0) {
          updates.Player = updatesPlayer;
        }
        
        // Apply updates if there are any
        if (Object.keys(updates).length > 0) {
          console.log("Applying updates to minMaxDoc:", updates);
          await setDoc(minMaxRefVar, updates, { merge: true });
        }
      } catch (error) {
        console.error("Error updating min/max stats:", error);

        // Attempt to create the minMaxDoc as a recovery mechanism if there was an error
        try {
          const initialData = {
            Team: {
              matchesWon: { min: teamStatFormUpdate.value.matchesWon, max: teamStatFormUpdate.value.matchesWon },
              matchesLost: { min: teamStatFormUpdate.value.matchesLost, max: teamStatFormUpdate.value.matchesLost },
              currentWinStreak: { min: teamStatFormUpdate.value.currentWinStreak, max: teamStatFormUpdate.value.currentWinStreak },
              highestWinStreak: { min: teamStatFormUpdate.value.highestWinStreak, max: teamStatFormUpdate.value.highestWinStreak },
              accumulatedKills: { min: teamStatFormUpdate.value.accumulatedKills, max: teamStatFormUpdate.value.accumulatedKills },
              accumulatedDeaths: { min: teamStatFormUpdate.value.accumulatedDeaths, max: teamStatFormUpdate.value.accumulatedDeaths }
            },
            Player: {
              kills: { min: playerStatFormUpdate.value.kills, max: playerStatFormUpdate.value.kills },
              deaths: { min: playerStatFormUpdate.value.deaths, max: playerStatFormUpdate.value.deaths },
              highestTeamWinStreak: { min: playerStatFormUpdate.value.highestTeamWinStreak, max: playerStatFormUpdate.value.highestTeamWinStreak },
              supportPoints: { min: playerStatFormUpdate.value.supportPoints, max: playerStatFormUpdate.value.supportPoints }
            }
          };
          await setDoc(minMaxRefVar, initialData);
          console.log("Recovery: Created new minMaxDoc after error:", initialData);
          return initialData;
        } catch (recoveryError) {
          console.error("Failed to recover from minMaxUpdate error:", recoveryError);
          throw error; // Re-throw the original error
        }
      }
    }



    async function createStatsDocs() {
      // Create team stats and ranking for all teams
      const teamSnapShot = await getDocs(collection(db, "teams"));
      for (const teamDoc of teamSnapShot.docs) {
        const teamData = teamDoc.data();
        const teamId_stat = teamDoc.id;
        const teamStatsRef = doc(db, "teamstats", teamId_stat);
        const teamRankingRef = doc(db, "teamRanking", teamId_stat);
        await setDoc(teamStatsRef, {
          matchesWon: 0,
          matchesLost: 0,
          currentWinStreak: 0,
          highestWinStreak: 0,
          members: teamData.members || [],
          accumulatedKills: 0,
          accumulatedDeaths: 0,
        });
        await setDoc(teamRankingRef, {
          normalizedDeaths: 0,
          normalizedKills: 0,
          normalizedCurrentWinStreak: 0,
          normalizedMaxWinStreak: 0,
          normalizedMatchesLost: 0,
          normalizedMatchesWon: 0,
          normalizedNumMembers: 0,
          totalPoints: 0,
          teamName: teamData.teamName || teamId_stat
        });
      }

      // Create player stats and ranking for all users who have participated
      const userSnapShot = await getDocs(collection(db, "users"));
      for (const userDoc of userSnapShot.docs) {
        const userData = userDoc.data();
        if (userData.hasParticipated) {
          const playerStatsRef = doc(db, "playerstats", userDoc.id);
          const playerRankingRef = doc(db, "playerRanking", userDoc.id);
          await setDoc(playerStatsRef, {
            teamId: userData.teamId || "",
            kills: 0,
            deaths: 0,
            highestTeamWinStreak: 0,
            supportPoints: 0,
          });
          await setDoc(playerRankingRef, {
            normalizedDeaths: 0,
            normalizedHighestTeamWinStreak: 0,
            normalizedKills: 0,
            normalizedSupportPoints: 0,
            teamId: userData.teamId || "",
            totalPoints: 0,
            gameName: userData.gameName || "Player",
            displayName: userData.displayName || "User"
          });
        }
      }
    }

    async function updateWinStreak(teamId, newWinStreak) {
      try {
        const teamStatsRef = doc(db, "teamstats", teamId);
        const teamDocSnap = await getDoc(doc(db, "teams", teamId));

        if (!teamDocSnap.exists()) throw "Team doc does not exist";
        const members = teamDocSnap.data().members || [];

        await runTransaction(db, async (transaction) => {
          const teamStatsSnap = await transaction.get(teamStatsRef);
          if (!teamStatsSnap.exists()) throw "Team stats doc does not exist";
          const data = teamStatsSnap.data();
          const high = data.highestWinStreak || 0;
          const newHigh = Math.max(newWinStreak, high);

          transaction.update(teamStatsRef, {
            currentWinStreak: newWinStreak,
            highestWinStreak: newHigh,
          });

          for (const memberUid of members) {
            try {
              const playerStatsRef = doc(db, "playerstats", memberUid);
              // Check if document exists before updating
              const playerStatsSnap = await transaction.get(playerStatsRef);
              if (playerStatsSnap.exists()) {
                transaction.update(playerStatsRef, {
                  highestTeamWinStreak: newHigh,
                });
              }
            } catch (memberError) {
              console.error(`Error updating player stats for member ${memberUid}:`, memberError);
              // Continue with other members even if one fails
            }
          }
        });
      } catch (error) {
        console.error("Error in updateWinStreak function:", error);
      }
    }

    async function changeEventStatus() {
      if (isAdmin.value) {
        isEventLive.value = true;
        await updateDoc(eventStatusRef, { eventStatus: true });
        createStatsDocs();
      }
    }

    return {
      userInfo,
      isEventLive,
      isAdmin,
      changeEventStatus,
      eventDays,
      formatDate,
      statTypeTeam,
      teamStatForm,
      playerStatForm,
      statUpdateMessage,
      statUpdateSubmit,
      isSubmitting,
      loadingUserInfo,
      loadingUserInfoError,
      updateWinStreak
    };
  }
}
</script>

<style lang="scss" scoped>
@import "@/assets/styles/global.scss";

.event-page {
  //font-family: 'Integral-CF', sans-serif;
  color: $cream90;
  background: linear-gradient(135deg, $bg-dark 80%, $brown 100%);
  min-height: 100vh;
  padding-bottom: 5vh;

  h1 {
    font-family: 'Electroharmonix', sans-serif;
    text-align: center;
    font-size: 4rem;
    letter-spacing: 2px;
    color: $orange;
    text-shadow: 0 0 5px $red;
    margin-top: 2.3rem;
    margin-bottom: 1.1rem;
    padding: 0;
  }

  .userInfoDisplay {
    max-width: 600px;
    margin: 2rem auto 2.3rem auto;
    background: linear-gradient(90deg, $brown30 0 60%, transparent 100%);
    border-radius: 13px;
    box-shadow: 0 4px 26px $brown30;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rem; // More space between content blocks
    padding: 2rem 1.5rem 2rem 1.5rem; // More padding overall
    border: 2px solid $brown;
    overflow: hidden;
    backdrop-filter: blur(2.8px);
    font-family: 'Integral-CF';

    p {
      margin: 0.3rem 0 !important; // Smaller, but consistent gap between lines
      font-size: 1.1rem;
      color: $cream;
      text-align: center;
    }

    img {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      border: 2.5px solid $orange;
      object-fit: cover;
      box-shadow: 0 1px 9.5px $red;
      margin: 1rem auto 0.5rem auto;
      display: block;
    }

    @media (max-width: 600px) {
      max-width: 98vw;
      padding: 1rem 0.8rem;
      font-size: 0.95rem;

      img {
        width: 44px;
        height: 44px;
        margin: 0.7rem auto 0.3rem auto;
      }

      p {
        font-size: 0.92rem;
        padding-left: 0.2rem;
        padding-right: 0.2rem;
        word-break: break-word;
      }
    }
  }


  .eventsShow {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2.5rem;
    width: 80vw;
    max-width: none;
    margin: 0 auto;
    padding: 2.5rem 0 1rem 0;

    .schedule-header,
    .event-day>h2,
    .event-day .fixture-table .match-row .team,
    .event-day .fixture-table .match-row .vs,
    .event-day .fixture-table .match-row,
    .event-day .fixture-table .match-row {
      font-family: 'Integral-CF', serif !important;
    }



    .schedule-header {
      background: $brown30;
      border-radius: 9px;
      padding: 0.48rem 0 0.7rem 0;
      text-align: center;
      color: $orange;
      font-family: 'Esporte', serif;
      font-size: 1.47rem;
      text-shadow: 0 0 9px $red;
      margin-bottom: 1.09rem;
      letter-spacing: 1px;
      border: 2px solid $red;
      box-shadow: 0 0 10px 0 $red;
    }

    .eventsShow::-webkit-scrollbar {
      display: none;
    }

    .eventsShow {
      -ms-overflow-style: none;
      /* IE and Edge */
      scrollbar-width: none;
      /* Firefox */
    }

    .event-day {
      width: 80vw;
      max-width: none;
      margin-bottom: 5vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      background: linear-gradient(120deg, $bg-dark-alt 90%, $brown30 100%);
      border-radius: 10px;
      padding: 2rem 1.5rem 1rem 1.5rem;

      h2 {
        text-align: center;
        font-size: 2.1rem;

        @media (max-width: 600px) {
          font-size: 1.15rem;
          margin-bottom: 0.5rem;
        }
      }

      .match-row {
        // Remove grid and flex rules
        width: 75vw;
        padding-top: 1rem;
        padding-left: 1rem;
        padding-right: 1rem;
        display: flex;
        flex-direction: row;
        align-items: stretch;
        justify-content: space-between;
        min-height: 80px;
        background: $brown30;
        border-radius: 10px;
        margin-bottom: 1rem;
        box-shadow: 0 0 4px $brown, 0 0 4.7px;
        padding: 1.2rem 1.2rem; // Increased padding for card content

        @media (max-width: 600px) {
          flex-direction: row;
          min-height: 60px;
          padding: 0.7rem 0.7rem; // More padding for mobile
        }

        .TeamsInfo {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: center;
          flex: 2;
          min-width: 0;
          gap: 0.2rem;

          @media (max-width: 600px) {
            flex: 2;
            gap: 0.1rem;
          }

          .teamA,
          .teamB {
            font-family:'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif;
            font-size: 1.5rem;
            font-weight: bold;
            color: $cream90;
            max-width: 250px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;

            @media (max-width: 600px) {
              font-size: 1rem;
            }
          }

          .vs-center {
            display: flex;
            flex-direction: row;
            align-items: center;
            gap: 0.2rem;

            .vs-text {
              font-family: 'Electroharmonix', serif;
              color: $red;
              font-weight: bold;
              font-size: 1.1rem;
              letter-spacing: 1px;
              white-space: nowrap;

              @media (max-width: 600px) {
                font-size: 0.95rem;
              }
            }
          }
        }

        .match-col.time-status .time {
          font-family: 'Esporte', serif; // Change to your desired font
          font-size: 1.7rem;
          color: $orange;
          margin-bottom: 0.1rem;
          text-align: left; // Align left
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 170px;
        }

        @media (max-width: 600px) {
          .match-col.time-status .time {
            font-size: 1.1rem;
            max-width: 120px;
          }
        }

          .matchStatus {
            display: inline-block;
            padding: 0.4rem 1.2rem;
            border-radius: 10px;
            font-weight: 600;
            font-size: 1rem;
            box-sizing: border-box;
            margin: 0;
            text-align: right;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 220px; // Increased for 15+ letters
            font-family: Verdana, Geneva, Tahoma, sans-serif;

            @media (max-width: 600px) {
              font-size: 0.85rem;
              padding: 0.15rem 0.5rem;
              max-width: 160px; // Mobile: still enough for 15 letters
            }

            &.status,
            &.ongoing {
              background: linear-gradient(90deg, #f15229 70%, #c40817 100%);
              color: #fff;
              border: 2px solid $orange;
              box-shadow: 0 0 2px $orange;
              animation: blinklive 1.1s infinite alternate;
            }

            &.result {
              background: $brown;
              color: $orange;
              border: 2px solid $orange;
              font-weight: 700;
            }

            &.upcoming {
              background: $brown30;
              color: $cream90;
              border: 2px dashed $orange;
            }
          }
        }
      }
    }
  }



  .EventSettings {
    margin-top: 3.2rem;
    max-width: 520px;
    margin-left: auto;
    margin-right: auto;
    background-color: $bg-dark-alt;
    padding: 1.28rem 1.25rem 1.33rem 1.15rem;
    border-radius: 12px;
    box-shadow: 0 0 6px $red;
    border: 1.5px solid $red;

    button {
      background: linear-gradient(85deg, $red 60%, $orange 100%);
      border: none;
      color: $cream90;
      padding: 0.73rem 1.2rem;
      font-size: 1.02rem;
      border-radius: 6px;
      cursor: pointer;
      font-family: 'Esporte', serif;
      box-shadow: 0 0 8px $orange;
      margin-top: 0.4rem;
      margin-bottom: 0.85rem;
      transition: background 0.21s, box-shadow 0.21s;

      &:hover:not(:disabled) {
        background: $orange;
        box-shadow: 0 0 11px $orange;
      }

      &:disabled {
        background: $brown30;
        cursor: not-allowed;
        box-shadow: none;
      }
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 0.55rem;
      font-family: 'Integral-CF', sans-serif;
      color: $cream80;

      label {
        display: flex;
        flex-direction: column;
        font-weight: 600;

        input {
          margin-top: 0.23rem;
          padding: 0.45rem;
          border-radius: 4px;
          border: 1px solid $brown30;
          background-color: $bg-dark;
          color: $cream90;

          &:focus {
            outline: none;
            border-color: $orange;
            box-shadow: 0 0 5px $orange;
          }
        }
      }

      .StatTypeSelection {
        margin-bottom: 0.7rem;
        display: flex;
        justify-content: center;
      }

      .submit-section {
        margin-top: 0.33rem;
        display: flex;
        justify-content: center;
      }

      .stat-update-message {
        text-align: center;
        margin-top: 0.6rem;
        font-weight: 700;
        color: $orange;
        text-shadow: 0 0 5px $red;
      }
    }
  }

  .event-schedule-title {
    display: block;
    text-align: center;
    margin-bottom: 1.1rem;
    padding: auto;
    width: 100%;
    line-height: 0.5em; // Reduce line-height to decrease gap
    font-family: 'Electroharmonix', sans-serif;
  }

  .event-title,
  .schedule-title {
    display: block;
    width: 100%;
    text-align: center;
    color: $orange;
    text-shadow: 0 0 5px $red;
    letter-spacing: 2px;
  }

  .event-title {
    font-size: 4rem;
  }

  .schedule-title {
    font-size: 3.5rem;
  }

  @media (max-width: 900px) {
    .event-title {
      font-size: 2.8rem;

    }

    .schedule-title {
      font-size: 2.3rem;
    }
  }

  //   @media (max-width: 600px) {
  //     .event-schedule-title {


  //       padding-left: 0.5rem;
  //       padding-right: 0.5rem;
  //       line-height: 1.05; // Keep reduced line-height for mobile
  //     }
  //     .event-title {
  //       font-size: 1.7rem;
  //       letter-spacing: 0.5px;

  //     }
  //     .schedule-title {
  //       font-size: 1.5rem;
  //       letter-spacing: 0.5px;
  //     }
  //   }
  // }

  @keyframes blinklive {
    0% {
      box-shadow: 0 0 8px $orange, 0 0 12px $red;
    }

    100% {
      box-shadow: 0 0 15px $orange, 0 0 18px $red;
    }
  }

  nav {
    width: 100%;
    display: block;
    position: relative;
    /* or fixed/sticky as per your logic */
    z-index: 10;
  }



  .container {
    width: 100%;
    max-width: none; // ✅ remove fixed max-width
    margin: 0; // ✅ remove centering
    padding: 0 1rem; // optional, if you still want side spacing
  }

  // Make the NavigationBar always stretch full width, and push it to the very top.
  .event-page>.navbar {
    width: 100vw; // Full viewport width, like leaderboard
    margin: 0 !important; // No extra margin
    padding: 0.5rem 2rem; // Same as leaderboard's navbar
    box-sizing: border-box;
    position: relative;
    left: 50%;
    right: 50%;
    transform: translate(-50%, 0); // Center it (handles the 100vw inside other boxed elements)
    z-index: 20;
    border-radius: 0; // No rounding
    background: $bg-dark; // Or whatever you use
    // Optional: add .navbar-specific box-shadow, etc as in leaderboard
  }

  // Remove any "auto/max-width" limits or margin-top
  .event-page {
    margin: 0;
    padding: 0;
    width: 100vw; // Ensure parent fills viewport horizontally
    min-height: 100vh; // Optional, for full screen

  }

  // If you want a gap BELOW nav like leaderboard, add:
  .event-page>.navbar {
    margin-bottom: 2rem;
  }

  @media (max-width: 600px) {
    .event-page {
      padding-bottom: 2vh;
      width: 100vw;
      min-height: 100vh;
      margin: 0;
      font-size: 0.95rem;
    }

    h1 {
      font-size: 2rem;
      margin-top: 0.7rem;
      margin-bottom: 0.5rem;
      letter-spacing: 0.5px; // Reduce letter spacing so word stays together
      text-shadow: 0 0 3px $red;
      width: 100%;
      box-sizing: border-box;
      padding-left: 0.5rem;
      padding-right: 0.5rem;
      overflow-wrap: normal;
      word-break: normal; // Prevent breaking in the middle of words
      white-space: normal; // Allow normal wrapping
      line-height: 1.1;
    }

    .eventsShow {
      width: 100vw;
      padding: 1rem 0 0.5rem 0;
      gap: 1.2rem;
      box-sizing: border-box;
      overflow-x: auto;
    }

    .event-day {
      width: 100vw;
      max-width: 100vw;
      box-sizing: border-box;
      padding: 0.7rem 0.5rem 0.3rem 0.5rem;
      overflow-x: auto;

      h2 {
        font-size: 1.1rem;
        margin-bottom: 0.5rem;
        width: 100%;
        box-sizing: border-box;
        padding-left: 0.2rem;
        padding-right: 0.2rem;
        overflow-wrap: break-word;
        word-break: break-word;
      }

      .match-row {
        width: 100%;
        min-width: 0;
        box-sizing: border-box;
        padding: 0.7rem 0.7rem;
        margin-bottom: 0.5rem;
        display: flex;
        flex-direction: row;
        align-items: stretch;
        justify-content: space-between;
        overflow-x: auto;
      }
    }

    .EventSettings {
      max-width: 98vw;
      padding: 0.7rem 0.3rem;

      button {
        font-size: 0.95rem;
        padding: 0.5rem 0.8rem;
      }

      form {
        gap: 0.3rem;

        label {
          font-size: 0.95rem;

          input {
            font-size: 0.95rem;
            padding: 0.3rem;
          }
        }

        .submit-section {
          margin-top: 0.2rem;
        }

        .stat-update-message {
          font-size: 0.95rem;
        }
      }
    }

    h1 {
      font-size: 2rem;
      margin-top: 0.7rem;
      margin-bottom: 0.5rem;
      letter-spacing: 0.5px; // Reduce letter spacing so word stays together
      text-shadow: 0 0 3px $red;
    }

    // Fix overflow for all sections
    .event-page,
    .eventsShow,
    .event-day,
    .match-row {
      box-sizing: border-box;
      overflow-x: hidden;
    }
  }
</style>