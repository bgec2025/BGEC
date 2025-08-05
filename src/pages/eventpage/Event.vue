<template>
  <div class="event-page">
    <NavigationBar />
    <h1>Event Schedule</h1>
    <div class="userInfoDisplay">
      <div v-if="loadingUserInfo">
        Loading...
      </div>
      <div v-else-if="loadingUserInfoError">
        Error Occurred: {{ loadingUserInfoError.value }}
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
            <span class="matchStatus" :class="match.isLive ? 'live' : 'upcoming'">
              {{ match.isLive ? 'Live' : 'Yet to Begin' }}
            </span>
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
              <input v-model="playerStatForm.gameName" />
            </label>
            <label>User Name:
              <input v-model="playerStatForm.userName" />
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
      const days = [];
      const eventsSnapshot = await getDocs(collection(db, "events"));
      eventsSnapshot.forEach(doc => {
        const data = doc.data();
        days.push({
          date: data.Date,              // Note: lowercase 'date' for consistency
          matches: data.matches || [],
          isLive: data.isLive || false
        });
      });
      days.sort((a, b) => new Date(a.date) - new Date(b.date));
      eventDays.value = days;
    })

    async function statUpdateSubmit() {
      isSubmitting.value = true;
      statUpdateMessage.value = '';
      try {
        const minMaxRef = doc(db, "events", "minMaxDoc");
        await minMaxUpdate(minMaxRef, statTypeTeam.value, teamStatForm, playerStatForm);

        const minMaxDoc = await getDoc(minMaxRef);
        const minMaxDocData = minMaxDoc.data();

        if (statTypeTeam.value) {
          // Update team stats
          const refStat = doc(db, "teamstats", teamStatForm.value.teamId);
          await updateDoc(refStat, { ...teamStatForm.value });

          const refRanking = doc(db, "teamRanking", teamStatForm.value.teamId);
          const statData = (await getDoc(refStat)).data();
          const getMembers = statData.members?.length || 0;

          await updateDoc(refRanking, {
            normalizedDeaths: (teamStatForm.value.accumulatedDeaths - minMaxDocData.Team.accumulatedDeaths.min) / (minMaxDocData.Team.accumulatedDeaths.max - minMaxDocData.Team.accumulatedDeaths.min),
            normalizedKills: (teamStatForm.value.accumulatedKills - minMaxDocData.Team.accumulatedKills.min) / (minMaxDocData.Team.accumulatedKills.max - minMaxDocData.Team.accumulatedKills.min),
            normalizedCurrentWinStreak: (teamStatForm.value.currentWinStreak - minMaxDocData.Team.currentWinStreak.min) / (minMaxDocData.Team.currentWinStreak.max - minMaxDocData.Team.currentWinStreak.min),
            normalizedMaxWinStreak: (teamStatForm.value.highestWinStreak - minMaxDocData.Team.highestWinStreak.min) / (minMaxDocData.Team.highestWinStreak.max - minMaxDocData.Team.highestWinStreak.min),
            normalizedMatchesLost: (teamStatForm.value.matchesLost - minMaxDocData.Team.matchesLost.min) / (minMaxDocData.Team.matchesLost.max - minMaxDocData.Team.matchesLost.min),
            normalizedMatchesWon: (teamStatForm.value.matchesWon - minMaxDocData.Team.matchesWon.min) / (minMaxDocData.Team.matchesWon.max - minMaxDocData.Team.matchesWon.min),
            normalizedNumMembers: (getMembers - 1) / 3
          });

          const rankingdoc = (await getDoc(refRanking)).data();
          await updateDoc(refRanking, {
            totalPoints: 0.3 * rankingdoc.normalizedMatchesWon +
              0.15 * rankingdoc.normalizedCurrentWinStreak +
              0.15 * rankingdoc.normalizedMaxWinStreak +
              0.15 * rankingdoc.normalizedKills +
              0.1 * rankingdoc.normalizedDeaths +
              0.1 * rankingdoc.normalizedMatchesLost +
              0.05 * rankingdoc.normalizedNumMembers
          });

          statUpdateMessage.value = 'Team stats and ranking updated!';
        } else {
          // Update player stats
          const refStat = doc(db, "playerstats", playerStatForm.value.userId);
          await updateDoc(refStat, { ...playerStatForm.value });

          const refRanking = doc(db, "playerRanking", playerStatForm.value.userId);
          await updateDoc(refRanking, {
            normalizedKills: (playerStatForm.value.kills - minMaxDocData.Player.kills.min) / (minMaxDocData.Player.kills.max - minMaxDocData.Player.kills.min),
            normalizedHighestTeamWinStreak: (playerStatForm.value.highestTeamWinStreak - minMaxDocData.Player.highestTeamWinStreak.min) / (minMaxDocData.Player.highestTeamWinStreak.max - minMaxDocData.Player.highestTeamWinStreak.min),
            normalizedDeaths: (playerStatForm.value.deaths - minMaxDocData.Player.deaths.min) / (minMaxDocData.Player.deaths.max - minMaxDocData.Player.deaths.min),
            noramlizedSupportPoints: (playerStatForm.value.supportPoints - minMaxDocData.Player.supportPoints.min) / (minMaxDocData.Player.supportPoints.max - minMaxDocData.Player.supportPoints.min)
          });

          const rankingDoc = (await getDoc(refRanking)).data();
          await updateDoc(refRanking, {
            totalPoints: 0.4 * rankingDoc.normalizedKills +
              0.25 * rankingDoc.noramlizedSupportPoints +
              0.2 * rankingDoc.normalizedHighestTeamWinStreak +
              0.15 * rankingDoc.normalizedDeaths
          });

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
        const dateObj = new Date(timestamp.seconds * 1000);
        return dateObj.toLocaleDateString();
      }
      return timestamp;
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

    async function createStatsDocs() {
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
          teamName: teamData.teamName
        });

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
            highestTeamWinStreak: 0,
            supportPoints: 0,
          });

          await setDoc(playerRankingRef, {
            normalizedDeaths: 0,
            gameName: userData.data().gameName,
            normalizedHighestTeamWinStreak: 0,
            normalizedKills: 0,
            noramlizedSupportPoints: 0,
            teamId: teamId_stat,
            totalPoints: 0
          });
        }
      }
    }

    async function updateWinStreak(teamId, newWinStreak) {
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
          const playerStatsRef = doc(db, "playerstats", memberUid);
          transaction.update(playerStatsRef, {
            highestTeamWinStreak: newHigh,
          });
        }
      });
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

<style lang="scss" scoped>@import "@/assets/styles/global.scss";

.event-page {
  font-family: 'Integral-CF-Regular', sans-serif;
  color: $cream90;
  background: linear-gradient(135deg, $bg-dark 80%, $brown 100%);
  min-height: 100vh;
  padding-bottom: 5vh;

  h1 {
    font-family: 'Electroharmonix', sans-serif;
    text-align: center;
    font-size: 2.4rem;
    letter-spacing: 2px;
    color: $orange;
    text-shadow: 0 0 10px $red, 0 0 18px $orange;
    margin-top: 2.3rem;
    margin-bottom: 1.1rem;
    padding: 0;
  }

  .userInfoDisplay {
    max-width: 470px;
    margin: 2rem auto 2.3rem auto;
    background: linear-gradient(90deg, $brown30 0 60%, transparent 100%);
    border-radius: 13px;
    box-shadow: 0 4px 26px $brown30;
    display: flex;
    flex-direction: column; /* vertical alignment */
    align-items: center;    /* center horizontally */
    gap: 0.8rem;
    padding: 0.9rem 1.2rem 0.9rem 1.2rem;
    border: 2px solid $brown;
    overflow: hidden;
    backdrop-filter: blur(2.8px);

    p {
      margin: 0;
      font-size: 1rem;
      color: $cream;
      text-align: center;   /* center text inside */
    }

    img {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      border: 2.5px solid $orange;
      object-fit: cover;
      box-shadow: 0 1px 9.5px $red;
      margin: 0 auto;       /* center image */
      display: block;
    }
  }

  .eventsShow {
    max-width: 820px;
    margin: 0 auto;
    padding-top: 2.2vh;

    .schedule-header,
    .event-day > h2,
    .event-day .fixture-table .match-row .team,
    .event-day .fixture-table .match-row .vs,
    .event-day .fixture-table .match-row .time,
    .event-day .fixture-table .match-row .matchStatus {
      font-family: 'Esporte', serif !important;
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

    .event-day {
      background: linear-gradient(120deg, $bg-dark-alt 90%, $brown30 100%);
      border: 1.5px solid $red;
      border-radius: 10px;
      box-shadow: 0 1.2px 10px $red;
      margin-bottom: 1.34rem;
      padding: 1.17rem 1.15rem 0.85rem 1.07rem;
      transition: box-shadow .23s, transform .23s;
      position: relative;

      &:hover {
        box-shadow: 0 0 21px 0 $orange, 0 0 23px 0 $red;
        transform: translateY(-2px) scale(1.011);
      }

      h2 {
        font-family: 'Esporte', serif;
        font-size: 1.11rem;
        letter-spacing: 1.1px;
        color: $orange;
        text-shadow: 0 0 6px $red;
        padding-bottom: 0.45rem;
        border-bottom: 1px solid $orange;
        margin-bottom: 1.01rem;
      }

      .fixture-table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0 7px;

        .match-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.67rem 0.7rem 0.67rem 0.7rem;
          border-radius: 8px;
          margin-bottom: 5px;
          background: $brown30;
          box-shadow: 0 0 4px $brown, 0 0 4.7px $red inset;
          border: 1px solid $red;

          .team {
            flex: 1 1 0;
            font-family: 'Esporte', serif;
            font-size: 1.03rem;
            color: $cream90;
            font-weight: bold;
            text-shadow: 0 0 2px $red;
            text-align: center;
            min-width: 62px;
          }
          .vs {
            flex: 0 1 46px;
            color: $red;
            font-family: 'Esporte', serif;
            font-weight: bold;
            font-size: 1rem;
            text-shadow: 0 0 4px $red;
            text-align: center;
            letter-spacing: 0.5px;
            margin: 0 4.5px;
          }
          .time {
            flex: 0 1 84px;
            color: $cream80;
            text-shadow: 0 0 2.1px $brown;
            text-align: center;
            font-size: 0.98rem;
            font-style: italic;
            margin-left: 9.5px;
            font-family: 'Esporte', serif;
          }
          .matchStatus {
            flex: 0 1 114px;
            text-align: center;
            font-size: 0.96rem;
            text-transform: uppercase;
            letter-spacing: 1.2px;
            border-radius: 14px;
            padding: 0.15rem 0.85rem;
            font-weight: 700;
            background: none;
            border: 2px solid transparent;
            box-shadow: none;
            font-family: 'Esporte', serif;

            &.live {
              background: linear-gradient(90deg, #f15229 70%, #c40817 100%);
              color: #fff;
              border: 2px solid $orange;
              box-shadow: 0 0 7.5px $red, 0 0 11px $orange;
              animation: blinklive 1.1s infinite alternate;
            }

            &.upcoming {
              background: $brown30;
              color: $cream90;
              border: 2px dashed $orange;
              font-weight: 400;
              letter-spacing: 1.2px;
            }
          }
        }
      }
    }

    .no-live-message {
      margin: 4.5vh 0 0 0;
      font-size: 1.34rem;
      text-align: center;
      color: $red;
      font-family: 'Electroharmonix', sans-serif;
      text-shadow: 0 0 9px $red, 0 0 20px $orange;
      border-radius: 9px;
      padding: 1.1rem 0.5rem;
      border: 2.1px dashed $orange;
      background: $brown30;
      backdrop-filter: blur(2px);
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
      font-family: 'Integral-CF-Regular', sans-serif;
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
}

@keyframes blinklive {
  0% {
    box-shadow: 0 0 8px $orange, 0 0 12px $red;
  }
  100% {
    box-shadow: 0 0 15px $orange, 0 0 18px $red;
  }
}
</style>
