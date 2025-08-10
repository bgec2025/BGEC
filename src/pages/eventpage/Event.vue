<template>
  <div class="event-page">
    <NavigationBar />
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
                  result: !day.isLive && match.isLive
                }">
                  {{ !day.isLive ? match.result : match.status }}
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
    gap: 1.5rem; // More space between content blocks
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
    .event-day .fixture-table .match-row .time,
    .event-day .fixture-table .match-row .matchStatus {
      font-family: 'Integral-CF', serif ;
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
        text-align: center; // Center the date
      }

      .match-row {
        width: 75vw;
        padding-top: 1rem;
        padding-left: 1rem;
        padding-right: 1rem;
        display: grid;
        grid-template-columns: 1fr auto;
        grid-template-rows: auto auto;
        align-items: center;
        min-height: 100px;
        background: $brown30;
        border-radius: 10px;
        margin-bottom: 1rem;
        box-shadow: 0 0 4px $brown, 0 0 4.7px;
        /* Remove flex rules from here */
        gap: 0 0;
        /* No gap between columns/rows */

        .match-col {
          display: flex;
          flex-direction: column;
          justify-content: center;
          font-family: 'Esporte';
          letter-spacing: 5px;
        }

        .teamA {
          flex: 1.7;
          font-family: 'Esporte', serif;
          font-size: 1.8rem;
          font-weight: bold;
          color: $cream90;
          align-items: flex-start;
          justify-content: center;
          text-align: left;
          letter-spacing: 5px;
        }

        .vs-center {
          flex: 2.5;
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 0.45rem;
          justify-content: center;
          .vs-text {
            font-family: 'Electroharmonix', serif ;
            color: $red;
            font-weight: bold;
            letter-spacing: 1.1px;
            font-size: 1.25rem;
          }

          .teamB {
            font-family: 'Esporte', serif !important;
            font-weight: bold;
            color: $cream90;
            font-size: 1.8rem;
            letter-spacing: 5px;
            
          }
        }

        .time-status {
          grid-column: 2/3;
          grid-row: 1/2;
          justify-self: end;
          align-self: start;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.2rem;
          min-width: 90px;

          .time {
            font-size: 1.6rem;
            font-weight: 700;
            color: $orange;
            margin: 0 0 0.3rem 0;
            text-align: right;
            line-height: 1.1;
          }

          .matchStatus {
            grid-column: 2/3;
            grid-row: 2/3;
            justify-self: end;
            align-self: start;
            display: inline-block;
            padding: 0.4rem 1.2rem;
            border-radius: 10px;
            font-weight: 600;
            font-size: 1rem;
            box-sizing: border-box;
            margin: 0;
            /* No additional margin needed */
            text-align: right;

            &.status,
            &.ongoing {
              background: linear-gradient(90deg, #f15229 70%, #c40817 100%);
              color: #fff;
              border: 2px solid $orange;
              box-shadow: 0 0 8px $orange;
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

        .TeamsInfo {
          grid-column: 1/2;
          grid-row: 1/2;
          justify-self: start;
          align-self: start;
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 1rem;
          white-space: nowrap;
          font-weight: 600;
          color: $cream90;
          font-size: 1.8rem;
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
}

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
</style>
