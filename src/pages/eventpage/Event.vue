<template>
  <h1>This is a event page</h1>
  <div class="userInfoDisplay">
    <div v-if="loadingUserInfo">
      Loading...
    </div>
    <div v-else-if="loadingUserInfoError">
      Error Occured: {{ loadingUserInfoError.value }}
    </div>
    <div v-else-if="userInfo && !loadingUserInfo">
      <p>Hello there, {{ userInfo.displayName }}</p>
      <img :src="userInfo.photoURL" alt="user photo" referrerpolicy="no-referrer" />
      <p>Email: {{ userInfo.email }}</p>
    </div>
  </div>

  <section class="eventsShow">
    <div v-if="!isEventLive">
      Event Yet to go Live
    </div>
    <div v-else>
      <div>
        <h1>Event Schedule</h1>
      </div>
      <div v-for="day in eventDays" :key="day.date" class="event-day">
        <h2>{{ formatDate(day.date) }}</h2>
        <div v-for="match in day.matches" :key="match.matchId" class="match-row">
          <span class="team">{{ match.teamAName }}</span>
          <span class="vs">VS</span>
          <span class="team">{{ match.teamBName }}</span>
          <span class="time">{{ match.time }}</span>
          <span class="matchStatus">{{ day.hasStarted }}</span>
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
          <label>Game Name:
            <input v-model="playerStatForm.gameName" required />
          </label>
          <label>User Name:
            <input v-model="playerStatForm.userName" required />
          </label>
          <label>Kills:
            <input type="number" v-model.number="playerStatForm.kills" required />
          </label>
          <label>Deaths:
            <input type="number" v-model.number="playerStatForm.deaths" required />
          </label>
          <label>Highest Team Win Streak:
            <input type="number" v-model.number="playerStatForm.highestTeamWinStreak" required />
          </label>
          <label>Support Points:
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

</template>

<script>
import { onBeforeMount, ref, onMounted } from 'vue';
import Toggle from '@vueform/toggle/src/Toggle';
import '@vueform/toggle/themes/default.css'

// eslint-disable-next-line
import { useRouter } from 'vue-router';
import fetchUser from '../../getUserData'
import firebaseApp from '../../firebase'
import { onAuthStateChanged } from "firebase/auth";
import { getFirestore, getDoc, doc, updateDoc, getDocs, collection, setDoc, runTransaction } from "firebase/firestore"
//eslint-disable-next-line
import { getApp } from 'firebase/app';

const userInfo = ref(null);

export default {
  name: "EventPage",
  components: { Toggle },
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
      gameName: '',
      userName: '',
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
    // const adminRef = ref(null);
    // const adminSnap = ref(null);
    const eventStatusRef = doc(db, "events", "currentEvent")


    onBeforeMount(async () => {
      const eventSnap = await getDoc(eventStatusRef);
      if (eventSnap.exists()) {
        isEventLive.value = eventSnap.data().eventStatus;
      }
      onAuthStateChanged(firebaseApp.auth, async (user) => {
        try {
          if (!user) {
            // eslint-disable-next-line
            window.location.href = "/login.html"
          } else {// eslint-disable-next-line
            userInfo.value = await fetchUser.fetchUserData(user);

            const adminRef = doc(db, "admin", user.uid);
            const adminSnap = await getDoc(adminRef);
            //eslint-disable-next-line
            if (adminSnap.exists()) {
              isAdmin.value = true;
            }
          }
        } catch (error) {
          loadingUserInfoError.value = error;
        } finally {
          loadingUserInfo.value = false;
        }
      })
    });

    onMounted(async () => {
      const days = [];
      const eventsSnapshot = await getDocs(collection(db, "events"));
      eventsSnapshot.forEach(doc => {
        const data = doc.data();
        days.push({
          Date: data.Date,
          matches: data.matches || [],
          hasStarted: data.isLive
        })
      })
      days.sort((a, b) => new Date(a.date) - new Date(b.date));
      eventDays.value = days;

    })

    async function statUpdateSubmit() {
      isSubmitting.value = true;
      statUpdateMessage.value = '';
      try {
        const minMaxRef = doc(db, "events", "minMaxDoc");
        minMaxUpdate(minMaxRef, statTypeTeam, teamStatForm, playerStatForm)
        //eslint-disable-next-line
        const minMaxdoc = (await getDoc(minMaxRef));
        //eslint-disable-next-line
        const minMaxDocData = minMaxDoc.data();
        if (statTypeTeam.value) {
          // Update team stats
          const refStat = doc(db, "teamstats", teamStatForm.value.teamId);
          await updateDoc(refStat, { ...teamStatForm.value });
          const refRanking = doc(db, "teamRanking", teamStatForm.value.teamId);
          const getMembers = (await getDoc(refStat)).data().members?.length || 0;
          await updateDoc(refRanking, {
            normalizedDeaths: (teamStatForm.value.accumulatedDeaths - minMaxDocData.Team.accumulatedDeaths.min) / (minMaxDocData.Team.accumulatedDeaths.max - minMaxDocData.Team.accumulatedDeaths.min),
            normalizedKills: (teamStatForm.value.accumulatedKills - minMaxDocData.Team.accumulatedKills.min) / (minMaxDocData.Team.accumulatedKills.max - minMaxDocData.Team.accumulatedKills.min),
            normalizedCurrentWinStreak: (teamStatForm.value.currentWinStreak - minMaxDocData.Team.currentWinStreak.min) / (minMaxDocData.Team.currentWinStreak.max - minMaxDocData.Team.currentWinStreak.min),
            normalizedMaxWinStreak: (teamStatForm.value.highestWinStreak - minMaxDocData.Team.highestWinStreak.min) / (minMaxDocData.Team.highestWinStreak.max - minMaxDocData.Team.highestWinStreak.min),
            normalizedMatchesLost: (teamStatForm.value.matchesLost - minMaxDocData.Team.matchesLost.min) / (minMaxDocData.Team.matchesLost.max - minMaxDocData.Team.matchesLost.min),
            normalizedMatchesWon: (teamStatForm.value.matchesWon - minMaxDocData.Team.matchesWon.min) / (minMaxDocData.Team.matchesWon.max - minMaxDocData.Team.matchesWon.min),
            normalizedNumMembers: (getMembers - 1) / 3
          })
          const rankingdoc = (await getDoc(refRanking)).data();
          await updateDoc(refRanking, {
            totalPoints: 0.3 * rankingdoc.normalizedMatchesWon +
              0.15 * rankingdoc.normalizedCurrentWinStreak +
              0.15 * rankingdoc.normalizedMaxWinStreak +
              0.15 * rankingdoc.normalizedKills +
              0.1 * rankingdoc.normalizedDeaths +
              0.1 * rankingdoc.normalizedMatchesLost +
              0.05 * rankingdoc.normalizedNumMembers
          })
          statUpdateMessage.value = 'Team stats and ranking updated!';
        } else {
          // Update player stats
          const refStat = doc(db, "playerstats", playerStatForm.value.userId);
          await updateDoc(refStat, { ...playerStatForm.value });
          const refRanking = doc(db, "playerRanking", playerStatForm);
          await updateDoc(refRanking, {
            normalizedKills: (playerStatForm.value.kills - minMaxDocData.Player.kills.min) / (minMaxDocData.Player.kills.max - minMaxDocData.Player.kills.min),
            normalizedHighestTeamWinStreak: (playerStatForm.value.highestTeamWinStreak - minMaxDocData.Player.highestTeamWinStreak.min) / (minMaxDocData.Player.highestTeamWinStreak.max - minMaxDocData.Player.highestTeamWinStreak.min),
            normalizedDeaths: (playerStatForm.value.deaths - minMaxDocData.Player.deaths.min) / (minMaxDocData.Player.deaths.max - minMaxDocData.Player.deaths.min),
            noramlizedSupportPoints: (playerStatForm.value.supportPoints - minMaxDocData.Player.supportPoints.min) / (minMaxDocData.Player.supportPoints.max - minMaxDocData.Player.supportPoints.min)
          })
          const rankingDoc = (await getDoc(refRanking)).data();
          await updateDoc(refRanking, {
            totalPoints: 0.4 * rankingDoc.normalizedKills +
              0.25 * rankingDoc.noramlizedSupportPoints +
              0.2 * rankingDoc.normalizedHighestTeamWinStreak +
              0.15 * rankingDoc.normalizedDeaths
          })
          statUpdateMessage.value = 'Player stats and ranking updated!';
        }
        updateWinStreak(teamStatForm.value.teamId, teamStatForm.value.highestWinStreak);

      } catch (err) {
        statUpdateMessage.value = 'Error: ' + (err.message || err);
      } finally {
        isSubmitting.value = false;
      }
    }

    function formatDate(timestamp) {
      if (timestamp && timestamp.seconds) {
        const dateObj = new Date(timestamp.seconds * 1000)
        return dateObj.toLocaleDateString()
      }
      return timestamp
    }


    async function minMaxUpdate(minMaxRefVar, isTeamUpdate, teamStatFormUpdate, playerStatFormUpdate) {
      try {
        const docSnap = await getDoc(minMaxRefVar);
        if (!docSnap.exists()) {
          console.error("Min/max document does not exist!");
          return;
        }
        const docData = docSnap.data();

        if (isTeamUpdate) {
          // List of fields to check for Team
          const fields = [
            "matchesWon",
            "matchesLost",
            "currentWinStreak",
            "highestWinStreak",
            "accumulatedKills",
            "accumulatedDeaths"
          ];
          const updates = {};
          fields.forEach(field => {
            const currMin = docData.Team[field]?.min ?? teamStatFormUpdate.value[field];
            const currMax = docData.Team[field]?.max ?? teamStatFormUpdate.value[field];
            const newVal = teamStatFormUpdate.value[field];
            if (newVal < currMin) {
              updates[`Team.${field}.min`] = newVal;
            }
            if (newVal > currMax) {
              updates[`Team.${field}.max`] = newVal;
            }
          });
          if (Object.keys(updates).length > 0) {
            await setDoc(minMaxRefVar, updates, { merge: true });
          }
        } else {
          // List of fields to check for Player
          const fields = [
            "kills",
            "deaths",
            "highestTeamWinStreak",
            "supportPoints"
          ];
          const updates = {};
          fields.forEach(field => {
            const currMin = docData.Player[field]?.min ?? playerStatFormUpdate.value[field];
            const currMax = docData.Player[field]?.max ?? playerStatFormUpdate.value[field];
            const newVal = playerStatFormUpdate.value[field];
            if (newVal < currMin) {
              updates[`Player.${field}.min`] = newVal;
            }
            if (newVal > currMax) {
              updates[`Player.${field}.max`] = newVal;
            }
          });
          if (Object.keys(updates).length > 0) {
            await setDoc(minMaxRefVar, updates, { merge: true });
          }
        }
      } catch (error) {
        console.error("Error updating min/max stats:", error);
      }
    }

    //called when isEventlive() turns true fr
    async function createStatsDocs() {
      //Get Teams
      const teamSnapShot = await getDocs(collection(db, "teams"));

      for (const teamDoc of teamSnapShot.docs) {
        const teamData = teamDoc.data();
        const teamId_stat = teamDoc.id;
        //Creating teamstats docs
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
          teamName: teamData.teamName
        })
        // For each member, create playerstats doc
        for (const memberUid of teamData.members || []) {
          const playerStatsRef = doc(db, "playerstats", memberUid);
          const playerRankingRef = doc(db, "playerRanking", memberUid);

          const userRef = doc(db, "users", memberUid);
          const userData = await getDoc(userRef);

          await setDoc(playerStatsRef, {
            teamId: teamId_stat,
            gameName: userData.data().gameName,
            userName: userData.data().displayName,
            kills: 0,
            deaths: 0,
            highestTeamWinStreak: 0, // Will be updated from teamstats
            supportPoints: 0,
          })

          await setDoc(playerRankingRef, {
            normalizedDeaths: 0,
            gameName: userData.data().gameName,
            normalizedHighestTeamWinStreak: 0,
            normalizedKills: 0,
            noramlizedSupportPoints: 0,
            teamId: teamId_stat,
            totalPoints: 0
          })
        }
      }
    }

    //call when the admin updates any stats
    //eslint-disable-next-line
    async function updateWinStreak(teamId, newWinStreak) {
      const db = getFirestore(firebaseApp.app);
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

        // Update teamstats
        transaction.update(teamStatsRef, {
          currentWinStreak: newWinStreak,
          highestWinStreak: newHigh,
        });

        // Update each player's highestTeamWinStreak
        for (const memberUid of members) {
          const playerStatsRef = doc(db, "playerstats", memberUid);
          transaction.update(playerStatsRef, {
            highestTeamWinStreak: newHigh,
          });
        }
      });
    }

    async function changeEventStatus() {
      //eslint-disable-next-line
      if (isAdmin) {
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

<style></style>