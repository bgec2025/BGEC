<template>
  <div class="home-page">
    <NavigationBar />

    <!-- HERO SECTION (always visible) -->
    <section class="hero-section">
      <div class="hero-headline">
        <h1>The Battle Begins!</h1>
        <p class="hero-subtext">Witness the clash of titans as teams battle for glory.</p>
        <div class="hero-info-box">
          Register here as a particpant to join the competition and showcase your skills!
        </div>
      </div>
    </section>

    <!-- VERSUS OR NO EVENT MESSAGE -->
    <section class="live-match-spotlight-section" v-if="hasEventStarted">
      <div v-if="isLive" class="match-wrapper">
        <h2 class="ongoing-match">Ongoing Match</h2>
          <div class="live-match-spotlight">
          <div class="team team-a"> 
          <div class="team-bg"></div>
          <h2>{{ teamAName || 'Team Alpha' }}</h2>
          <ul>
            <li v-for="player in teamAPlayers" :key="player.id">
              {{ player.gameName || player.displayName || player }}
            </li>
          </ul>
          <div class="team-stats">
            <span>WINS: {{ teamAStats.matchesWon }}</span>
            <span>KILLS: {{ teamAStats.accumulatedKills }}</span>
            <span>DEATHS: {{ teamAStats.accumulatedDeaths }}</span>
          </div>
        </div>
        <div class="versus">
          <span>VS</span>
        </div>
        <div class="team team-b">
          <div class="team-bg"></div>
          <h2>{{ teamBName || 'Team Bravo' }}</h2>
          <ul>
            <li v-for="player in teamBPlayers" :key="player.id">
              {{ player.gameName || player.displayName || player }}
            </li>
          </ul>
          <div class="team-stats">
            <span>WINS: {{ teamBStats.matchesWon }}</span>
            <span>KILLS: {{ teamBStats.accumulatedKills }}</span>
            <span>DEATHS: {{ teamBStats.accumulatedDeaths }}</span>
          </div>
        </div>
        </div>
      </div>
      <div v-else class="no-event-message">
        <h2>No current events scheduled for now</h2>
      </div>
    </section>

    <!-- REGISTRATION FORM (shown when event not started and not participated) -->
    <section class="submit-form" v-if="!userHasParticipated && !hasEventStarted">
      <div class="participation-form">
        <form v-on:submit.prevent="submitParticipation">
          <div class="FormTitle">
            <h1>Register Here!</h1>
          </div>
          <div class="personal-info">
            <label for="GameName">Your Game Name:</label>
            <input v-model="participationData.gameName" type="text" id="GameName" required />

            <label for="bitsID">Enter your BITS ID</label>
            <input
              type="text"
              id="bitsID"
              v-model="participationData.bitsID"
              required
              pattern="^20\\d{2}[A-Za-z]\\d[A-Za-z]{2}\\d{4}[A-Za-z]$"
              title="Format: 20XXA1BB1234C (e.g., 2021A3BC1234D)"
            />
            <span v-if="userIdError" class="error">{{ userIdError }}</span>

            <label for="Tell">Enter a "Tell"</label>
            <textarea v-model="participationData.Tell" id="Tell"></textarea>
          </div>
          <div class="team-formation-unit">
            <div class="Team-Formation">
              <div class="toggle-switch">
                <input type="checkbox" id="toggleTeam" v-model="teamOptIn" />
                <label for="toggleTeam">
                  <span :class="{ active: teamOptIn }">{{ teamOptIn ? 'Create Team' : 'Join Team' }}</span>
                </label>
                 <p class="toggle-hint">
                {{ teamOptIn ? 'Toggle to join a team' : 'Toggle to create a team' }}
              </p>
              </div>
              <div v-if="teamOptIn" class="create-team-fields">
                <label>Team Name:</label>
                <input v-model="participationData.teamName" type="text" required />
                <label>Team Slogan:</label>
                <input v-model="participationData.teamSlogan" type="text" required />
                <div class="team-id-display">
                  <strong>Your Team ID:</strong> {{ participationData.teamId }}
                </div>
                <span class="team-id-hint">Save this ID to share with your team members.</span>
              </div>
              <div v-else class="join-team-fields">
                <label>Enter Team ID:</label>
                <input v-model="participationData.teamId" required />
                <div v-if="teamJoinError" :class="teamJoinError.includes('Join request sent') ? 'status-message pending' : 'error'">
                  {{ teamJoinError }}
                </div>
              </div>
            </div>
          </div>
          <div class="submit-section">
            <button type="submit" :disabled="isSubmitting">
              {{ isSubmitting ? 'Submitting...' : 'Join Competition' }}
            </button>
          </div>
        </form>
      </div>
    </section>
    <section  v-if="userInfo && userHasParticipated" class="IfUserIsAParticipant">
        <h1>Welcome {{ userInfo.gameName }}</h1> 
        <div class="requests">
            <div v-if="isTeamCreator && !hasEventStarted">
                <h2>
                    Pending Join Requests
                </h2>
                
                <div v-if="requestsLoading">
                    Loading requests...
                </div>
                
                <div v-else-if="teamRequests.length === 0">
                    No pending requests
                </div>
                
                <ul v-else>
                    <li v-for="req in teamRequests" :key="req.id">
                        <p>Name: {{ req.requesterName }}</p>
                        <p>Game Name: {{ req.requesterGameName }}</p>
                        <p>BITS ID: {{ req.requesterBitsID }}</p>
                        <p>Email: {{ req.requesterEmail }}</p>
                        <button @click="acceptRequest(req)">
                            Accept
                        </button>
                        <button @click="declineRequest(req)">
                            Decline
                        </button>
                    </li>
                </ul>
            </div>

            <div v-if="teamMembers.length >= 0 && userInfo && userHasParticipated" class="team-Members">
                <h2>Your Team: {{ userInfo.teamId }}</h2>
                <h3>Members:</h3>
                <ul>
                    <li v-for="member in teamMembers" :key="member.id">
                        {{ member.gameName }} ({{ member.bitsID }}) - {{ member.email }}
                    </li>
                </ul>
            </div>
    
            <div v-if="userJoinRequest && userInfo">
                <h2>Your Request Status</h2>

                <div v-if="userJoinRequest.status === 'pending'">
                    <p>Your request to join team {{ userJoinRequest.teamId }} is pending approval.</p>
                </div>
        
                <div v-else-if="userJoinRequest.status === 'accepted'">
                    <p>
                        Your request has been accepted! You are now part of team {{ userJoinRequest.teamId }}.
                    </p>
                    <button @click="fetchTeamData(userInfo)">View Team Details</button>
                </div>
        
                <div v-else-if="userJoinRequest.status === 'rejected'">
                    <p>
                        Your request to join team {{ userJoinRequest.teamId }} has been rejected.
                    </p>
            
                    <div>
                        <label>Enter New Team ID:</label>
                        <input v-model="newTeamId" required>

                        <button @click="submitNewRequest">Submit New Request</button>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- FEATURED PLAYERS (shown when event started) -->
    <div class="featured-profiles" v-if="hasEventStarted">
      <h3>Featured Players</h3>
      <div class="featured-list">
        <div class="featured-card" v-for="player in featuredPlayers" :key="player.id">
          <img :src="player.photoURL || player.photoURL " alt="avatar" />
          <div class="featured-info">
            <span class="featured-name">{{ player.gameName || player.displayName }}</span>
            <span class="featured-metric">Kills: {{ player.kills }}</span>
            <span class="featured-metric">Deaths: {{ player.deaths }}</span>
          </div>
        </div>
      </div>
      <button class="leaderboard-link" @click="goToLeaderboard">
        View Leaderboard & MVPs
      </button>
    </div>
  </div>
</template>

<script>
import { onBeforeMount, ref, watch, onMounted } from 'vue';
//import { useRouter } from 'vue-router';
import firebaseApp from '../../firebase';
import { onAuthStateChanged } from "firebase/auth";
import getUser from '../../getUserData';
import {
  arrayUnion,
  updateDoc,
  where,
  getFirestore,
  doc,
  setDoc,
  getDoc,
  addDoc,
  getDocs,
  collection,
  query,
  orderBy,
  limit
} from 'firebase/firestore';
import { getApp } from 'firebase/app';
import NavigationBar from '@/components/NavigationBar.vue';
import ScrollReveal from 'scrollreveal';
import anime from 'animejs';

const userInfo = ref(null);

export default {
  components: { NavigationBar },
  name: "HomePage",
  setup() {
    const db = getFirestore(getApp());
    const isSubmitting = ref(false);
    const userHasParticipated = ref(false);
    const userIdError = ref("");
    const teamOptIn = ref(false);
    const teamJoinError = ref('');
    const requests = ref([]);
    const requestsLoading = ref(true);
    const isTeamCreator = ref(false);
    const teamRequests = ref([]);
    const userJoinRequest = ref(null);
    const newTeamId = ref('');
    const teamMembers = ref([]);
    const participationData = ref({
      gameName: "",
      bitsID: "",
      Tell: "Enter a fact, gossip, or suggestion",
      teamId: "",
      teamName: "",
      teamSlogan: "",
    });

    // Hero/versus logic
    const isLive = ref(false);
    const teamAName = ref('');
    const teamBName = ref('');
    const teamAPlayers = ref([]);
    const teamBPlayers = ref([]);
    const teamAStats = ref({
      matchesWon: 0,
      accumulatedKills: 0,
      accumulatedDeaths: 0
    });
    const teamBStats = ref({
      matchesWon: 0,
      accumulatedKills: 0,
      accumulatedDeaths: 0
    });

    // Featured players
    const featuredPlayers = ref([]);

    // Event status flag
    const hasEventStarted = ref(false);

    // Fetch event status and user info
    onBeforeMount(() => {
      onAuthStateChanged(firebaseApp.auth, async (user) => {
        if (!user) {
          //eslint-disable-next-line
          window.location.href = "/login.html";
        } else {
          const userData = await getUser.fetchUserData(user);
          userHasParticipated.value = userData.hasParticipated ?? false;
          console.log(userHasParticipated.value);
          if(userHasParticipated.value){
              fetchTeamData(userInfo.value);
          }
        }
      });
    });

    onMounted(async () => {
      // Get event start status
      const eventStatusSnap = await getDoc(doc(db, "events", "currentEvent"));
      hasEventStarted.value = eventStatusSnap.exists() && eventStatusSnap.data().eventStatus;

      if (hasEventStarted.value) {
        // Get live match info
        const eventsSnapshot = await getDocs(collection(db, "events"));
        let foundMatch = null;
        eventsSnapshot.forEach(docSnap => {
          const data = docSnap.data();
          if (data.isLive && data.matches && data.matches.length > 0 && !foundMatch) {
            isLive.value = true;
            foundMatch = data.matches[0];
            teamAName.value = foundMatch.teamAName;
            teamBName.value = foundMatch.teamBName;
            teamAPlayers.value = [];
            teamBPlayers.value = [];
            if (foundMatch.teamAName) {
              fetchTeamStats(foundMatch.teamAName, teamAStats, teamAPlayers);
            }
            if (foundMatch.teamBName) {
              fetchTeamStats(foundMatch.teamBName, teamBStats, teamBPlayers);
            }
          }
        });
        if (!isLive.value) {
          teamAName.value = '';
          teamBName.value = '';
        }

        // Fetch featured players after event starts
        await fetchFeaturedPlayers();
      }

      ScrollReveal().reveal('.hero-headline', { origin: 'top', distance: '50px', duration: 1000 });
      ScrollReveal().reveal('.live-match-spotlight-section', { origin: 'bottom', distance: '50px', duration: 1000 });
      ScrollReveal().reveal('.submit-form', { origin: 'bottom', distance: '20px', delay: 300 });
      ScrollReveal().reveal('.featured-profiles', { origin: 'bottom', distance: '50px', duration: 1000 });
      ScrollReveal().reveal('.requests', { origin: 'bottom', distance: '20px', delay: 300 });
    
      anime({
        targets: '.hero-headline h1',
        translateX: [-100, 0],
        opacity: [0, 1],
        easing: 'easeOutExpo',
        duration: 1200
      });

      anime({
        targets: '.featured-card',
        scale: [0.8, 1],
        opacity: [0, 1],
        delay: anime.stagger(150, { start: 500 }),
        easing: 'easeOutBack',
        duration: 800
      });

      // Button pulse on hover
      //eslint-disable-next-line
      const btn = document.querySelector('.leaderboard-link');
      if(btn)
      {
      btn.addEventListener('mouseenter', () => {
        anime({
          targets: btn,
          scale: 1.05,
          duration: 200,
          easing: 'easeInOutQuad'
        });
      });
      btn.addEventListener('mouseleave', () => {
        anime({
          targets: btn,
          scale: 1,
          duration: 200,
          easing: 'easeInOutQuad'
        });
      });
    }
    
      });

   // Registration logic
    async function submitParticipation() {
      if (isSubmitting.value) return;
      if (!validateUserID()) return;
      isSubmitting.value = true;
      teamJoinError.value = '';
      try {
        const user = firebaseApp.auth.currentUser;
        if (!user) throw new Error('User not authenticated');
        if (teamOptIn.value) {
          await createNewTeam(user);
        } else {
          const canJoin = await handleTeamJoin(user);
          if (!canJoin) return;
        }
        await updateUserData(user);
        userHasParticipated.value = true;
        userInfo.value = await getUser.fetchUserData(user);
      } catch (error) {
        console.error('Error submitting participation:', error);
      } finally {
        isSubmitting.value = false;
      }
    }

    async function createNewTeam(user) {
      const teamData = {
        teamId: participationData.value.teamId,
        teamName: participationData.value.teamName,
        teamSlogan: participationData.value.teamSlogan,
        creatorUid: user.uid,
        members: [user.uid],
        maxMembers: 4,
        createdAt: new Date(),
        status: 'active'
      };
      await setDoc(doc(db, "teams", participationData.value.teamId), teamData);
    }


    async function handleTeamJoin(user) {
      const teamId = participationData.value.teamId.trim();
      if (!teamId) {
        teamJoinError.value = 'Please enter a Team ID';
        return false;
      }
      const teamDoc = await getDoc(doc(db, "teams", teamId));
      if (!teamDoc.exists()) {
        teamJoinError.value = 'Team not found. Please check the Team ID.';
        return false;
      }
      const teamData = teamDoc.data();
      if (teamData.members.length >= teamData.maxMembers) {
        teamJoinError.value = 'Team is full. Please try another team.';
        return false;
      }

       // Check if user already requested to join this team
      const existingRequests = await getDocs(
          query(
              collection(db, "teamJoinRequests"),
              where("teamId", "==", teamId),
              where("requesterUid", "==", user.uid),
              where("status", "==", "pending")
          )
      );
      
      if (!existingRequests.empty) {
          teamJoinError.value = 'You already have a pending request for this team.';
          return false;
      }
      await addDoc(collection(db, "teamJoinRequests"), {
        teamId: teamId,
        requesterUid: user.uid,
        requesterName: user.displayName,
        requesterEmail: user.email,
        status: 'pending',
        requestedAt: new Date()
      });
      teamJoinError.value = 'Join request sent! Awaiting team leader approval.';
      return true;
    }

    async function updateUserData(user) {
      const userData = {
        gameName: participationData.value.gameName,
        bitsID: participationData.value.bitsID,
        tell: participationData.value.Tell,
        teamId: participationData.value.teamId,
        hasParticipated: true,
        participatedAt: new Date(),
        updatedAt: new Date(),
      };
      await setDoc(doc(db, "users", user.uid), userData, { merge: true });
    }

    function generateTeamId() {
      return (
        'TEAM-' +
        Date.now().toString(36) +
        '-' +
        Math.random().toString(36).substr(2, 5).toUpperCase()
      );
    }

    function validateUserID() {
      const regex = /^20\\d{2}[A-Za-z]\\d[A-Za-z]{2}\\d{4}[A-Za-z]$/;
      if (!regex.test(participationData.value.bitsID)) {
        userIdError.value = 'Invalid ID format. Example: 2021A3BC1234D';
        return false;
      }
      userIdError.value = '';
      return true;
    }


    async function fetchTeamStats(teamName, statsRef, playersRef) {
      const teamsSnapshot = await getDocs(collection(db, "teams"));
      let teamId = '';
      teamsSnapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data.teamName === teamName) {
          teamId = docSnap.id;
        }
      });
      if (!teamId) return;
      const teamStatsDoc = await getDoc(doc(db, "teamstats", teamId));
      if (teamStatsDoc.exists()) {
        const stats = teamStatsDoc.data();
        statsRef.value = {
          matchesWon: stats.matchesWon || 0,
          accumulatedKills: stats.accumulatedKills || 0,
          accumulatedDeaths: stats.accumulatedDeaths || 0
        };
        const members = stats.members || [];
        const playerNames = [];
        for (const uid of members) {
          const userDoc = await getDoc(doc(db, "users", uid));
          if (userDoc.exists()) {
            playerNames.push(userDoc.data().gameName || userDoc.data().displayName || uid);
          }
        }
        playersRef.value = playerNames;
      }
    }

    async function fetchFeaturedPlayers() {
      const q = query(collection(db, "playerRanking"), 
      orderBy("normalizedKills", "desc"), limit(3));
      const snapshot = await getDocs(q);
      featuredPlayers.value = snapshot.docs.map(doc => 
        {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        role: "MVP",
        kills: data.normalizedKills
          ? Math.round(data.normalizedKills)
          : 0,
        deaths: data.normalizedDeaths
          ? Math.round(data.normalizedDeaths)
          : 0 // fallback to 0 if missing
      };
    });
    }

    function goToLeaderboard() {
      //eslint-disable-next-line
      window.location.href = "/leaderboard.html";
    }

 

    watch(teamOptIn, (newValue) => {
      if (newValue) {
        participationData.value.teamId = generateTeamId();
      } else {
        participationData.value.teamId = "";
      }
    });
 
    async function fetchTeamData(user){
        if(!user.teamId) return;

        const teamDoc = await getDoc(doc(db, "teams", user.teamId));
        if((await teamDoc).exists()){
            const teamData = teamDoc.data();
            isTeamCreator.value = teamData.creatorUid === user.uid;
            if(isTeamCreator.value){
                fetchTeamRequests(user.teamId);
                fetchTeamMembers(teamData.members);
                return;
            }
            
            if(!teamData.members.includes(user.uid)){
                fetchUserRequests(user.uid);
                return;
            }

            fetchTeamMembers(teamData.members);
            return;
        }
    }

    async function fetchTeamRequests(teamID){
        requestsLoading.value = true;
        const q = query(
            collection(db, "teamJoinRequests"),
            where("teamId","==",teamID),
            where("status","==","pending")
        );

        const querySnapshot = await getDocs(q);

        teamRequests.value = querySnapshot.docs.map(doc  => ({
            id:doc.id,
            ...doc.data()
        }))
        requestsLoading.value = false;
    }

    async function fetchUserRequests(userID){
        const q = query(
            collection(db,"teamJoinRequests"),
            where("requesterUid","==",userID),
            orderBy("requestedAt","desc"),
            limit(1)
        )

        const querySnapshot = await getDocs(q);
        if(!querySnapshot.empty){
            userJoinRequest.value = {
                id: querySnapshot.docs[0].id,
                ...querySnapshot.docs[0].data()
            };
        }
    }

    async function fetchTeamMembers(membersID){
        const members = [];
        for(const uid of membersID){
            const userDoc = await getDoc(doc(db, "users", uid));
            if(userDoc.exists()){
                members.push({id: uid, ...userDoc.data()})
            }    
        }
        teamMembers.value = members;
    }

    async function acceptRequest(request){
        try{
            await updateDoc(doc(db, "teamJoinRequests", request.id),{
                status:"accepted"
            });

            await updateDoc(doc(db, "teams", request.teamId), {
                members: arrayUnion(request.requesterUid)
            });

            await updateDoc(doc(db,"users",request.requesterUid),{
                teamId: request.teamId
            })

            fetchTeamRequests(request.teamId);
        } catch (error) {
            console.error("Error accepting request:", error);
        }
    }
    async function declineRequest(request) {
        try {
            await updateDoc(doc(db, "teamJoinRequests", request.id), {
                status: "rejected"
            });
            fetchTeamRequests(request.teamId);
        } catch (error) {
            console.error("Error declining request:", error);
        }
    }
//eslint-disable-next-line
    async function submitNewRequest(){
        if (!newTeamId.value.trim()) return;
        
        try {
            const user = firebaseApp.auth.currentUser;
            if (!user) throw new Error('User not authenticated');
            
            // 1. Get existing request ID (should be stored earlier)
            const requestId = userJoinRequest.value.id; // Assuming you have this
            
            // 2. Update EXISTING request document
            await updateDoc(doc(db, "teamJoinRequests", requestId), {
                teamId: newTeamId.value,
                requestedAt: new Date(),
                status: 'pending' // Reset status
            });

            // 3. Update user's teamId
            await updateDoc(doc(db, "users", user.uid), {
                teamId: newTeamId.value
            });

            // 4. Refresh data
            fetchUserRequests(user.uid);
            newTeamId.value = '';
        } 
        catch (error) 
        {
            console.error("Error submitting new request:", error);
        }
    }    

    return {
      userInfo,
      isSubmitting,
      userHasParticipated,
      participationData,
      teamOptIn,
      teamJoinError,
      userIdError,
      submitParticipation,
      generateTeamId,
      validateUserID,
      requests,
      requestsLoading,
      isTeamCreator,
      teamRequests,
      userJoinRequest,
      newTeamId,
      teamMembers,
      fetchTeamData,
      fetchTeamMembers,
      fetchTeamRequests,
      fetchUserRequests,
      acceptRequest,
      declineRequest,
      submitNewRequest,
      isLive,
      teamAName,
      teamBName,
      teamAPlayers,
      teamBPlayers,
      teamAStats,
      teamBStats,
      featuredPlayers,
      goToLeaderboard,
      hasEventStarted
    };
  }
};
</script>

<style scoped lang="scss">
@import "@/assets/styles/global.scss";


.home-page {
  background: $bg-dark;
  color: $cream;
  padding-bottom: 4rem;
  
}

// HERO SECTION
.hero-section {
  width: 100%;
  min-height: 320px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding-top: 3rem;
  position: relative;
  overflow-x: hidden;
}

.hero-headline {
  text-align: center;
  margin-bottom: 2rem;
  h1 {
    font-family: 'Esporte', serif;
    font-size: 4rem;
    color: $orange;
    letter-spacing: 2px;
    text-shadow: 0 0 30px $orange, 0 0 60px $orange;
    margin-bottom: 1rem;
  }
  .hero-subtext {
    font-family: 'Integral-CF-Regular', sans-serif;
    color: $cream;
    font-size: 1.2rem;
    opacity: 0.85;
    margin-bottom: 0.5rem;
  }
  .hero-info-box {
    margin: 1.2rem auto 0 auto;
    background: $brown30;
    color: $red;
    font-family: 'Integral-CF-Regular', sans-serif;
    font-size: 1.1rem;
    border-radius: 16px;
    padding: 1rem 2rem;
    max-width: 500px;
    box-shadow: 0 2px 12px $brown30;
  }
}

// VERSUS SECTION
.live-match-spotlight-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  margin-bottom: 6rem;

   .match-wrapper {
    width: 90%;
    max-width: 1400px;
    display: flex;
    flex-direction: column;
    align-items: stretch;
  }

  .live-match-spotlight {
    display: flex;
    flex: 1;
    border-radius: 40px;
    overflow: visible;
    box-shadow: 0 10px 40px rgba(52, 3, 7, 0.35);
    background: transparent;
    position: relative;
    align-items: stretch;
    gap: 1rem; // optional spacing between teams and versus
  }
  .ongoing-match {
  width: 100%;
  text-align: center;
  font-family: 'Esporte', serif;
  color: $cream;
  font-size: 2.8rem; // slightly smaller if needed on narrow
  margin: 0 auto 1rem auto;
  text-transform: uppercase;
  letter-spacing: 1px;
  padding-bottom: 0.5rem;
  position: relative;
  &:after {
    content: '';
    display: block;
    width: 120px;
    height: 3px;
    background: rgba($orange, 0.8);
    margin: 8px auto 0;
    border-radius: 2px;
  }
}


  .team {
    flex: 1 1 0;
    padding: 2.5rem 2rem 2rem 2rem;
    border-radius: 40px;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    min-width: 0;
    z-index: 2;
    background: transparent;
    box-shadow: none;
    h2 {
      font-family: 'Esporte', serif;
      font-size: 2rem;
      color: $cream;
      margin-bottom: 1rem;
      text-shadow: 0 0 10px $orange;
    }
    ul {
      list-style: none;
      padding: 0;
      margin-bottom: 1.2rem;
      li {
        font-family: 'Integral-CF-Regular', sans-serif;
        color: $cream80;
        font-size: 1rem;
        margin-bottom: 0.3rem;
        background: rgba(255,255,255,0.03);
        border-radius: 8px;
        padding: 0.3rem 0.8rem;
        display: inline-block;
        transition: background 0.2s;
      }
      li:hover {
        background: $cream20;
      }
    }
    .team-stats {
      display: flex;
      gap: 1.5rem;
      font-size: 1rem;
      color: $orange;
      font-family: 'Integral-CF-Bold', sans-serif;
      margin-top: 1rem;
      span {
        background: $bg-dark;
        border-radius: 8px;
        padding: 0.3rem 1rem;
        box-shadow: 0 2px 8px rgba(52,3,7,0.12);
      }
    }
  }
  .team-a {
    background: linear-gradient(120deg, $brown 0%, $dark-red 100%);
    .team-bg {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: linear-gradient(120deg, $brown30 0%, $dark-red 60%);
      opacity: 0.6;
      border-radius: 40px;
      z-index: 1;
      pointer-events: none;
    }
  }
  .team-b {
    background: linear-gradient(120deg, $bg-dark-alt 0%, $orange 100%);
    .team-bg {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: linear-gradient(120deg, $cream20 0%, $orange 60%);
      opacity: 0.5;
      border-radius: 40px;
      z-index: 1;
      pointer-events: none;
    }
  }
  .versus {
    flex: 0 0 120px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2.2rem;
    color: $orange;
    font-family: 'Electroharmonix', sans-serif;
    background: none;
    z-index: 3;
    margin: 0 1rem;
    span {
      padding: 1.2rem 2rem;
      background: $brown30;
      border-radius: 50px;
      box-shadow: 0 0 20px $orange;
      opacity: 0.95;
    }
  }
  .no-event-message {
    width: 100%;
    text-align: center;
    padding: 2rem 0;
    h2 {
      font-family: 'Integral-CF-Bold', sans-serif;
      color: $orange;
      font-size: 1.5rem;
      margin-top: 2rem;
    }
  }
}

// FORM SECTION
.submit-form {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 2rem;
  .participation-form {
    background: linear-gradient(120deg, $bg-dark-alt 0%, $cream20 100%);
    border-radius: 30px;
    box-shadow: 0 8px 30px rgba(52,3,7,0.18);
    padding: 2rem 2.5rem;
    min-width: 320px;
    max-width: 600px;
    width: 100%;
    margin-bottom: 2rem;
    .FormTitle h1 {
      font-family: 'Esporte', serif;
      font-size: 3rem;
      color: $red;
      margin-bottom: 2rem;
      text-align: center;
    }
    .personal-info label {
      display: block;
      margin-top: 10px;
      font-family: 'Integral-CF-Bold', sans-serif;
      color: $orange;
      font-size: 0.9rem;
      margin-bottom: 0.5rem;
    }
    .personal-info input, .personal-info textarea {
      margin-bottom: 10px;
      width: 100%;  
      height : 35px;
      padding: 10px;
      border-radius: 10px;
      border: 1px solid $brown30;
      background: $bg-dark-alt;
      color: $cream;
      font-family: 'Integral-CF-Regular', sans-serif;
      font-size: 1rem;
      transition: border 0.2s;
    }
    .personal-info input:focus, .personal-info textarea:focus {
      border: 1.5px solid $orange;
      outline: none;
    }
    .error {
      color: $red;
      font-size: 0.95rem;
      margin-bottom: 0.5rem;
    }
    .team-formation-unit {
      margin-top: 1.2rem;
      .Team-Formation {
        background: $brown30;
        border-radius: 15px;
        padding: 1rem;
        margin-bottom: 1.2rem;
        .toggle-switch {
          display: flex;
          align-items: center;
          margin-bottom: 1rem;
          input[type="checkbox"] {
            display: none;
          }
          .toggle-hint {
              font-size: 0.9rem;
              color: $cream80;
              font-family: 'Integral-CF-Regular', sans-serif;
              font-size: 70%;
              padding-left: 0.3rem;
              // align vertically:
              margin: 0;
              }
          label {
            cursor: pointer;
            display: flex;
            align-items: center;
            position: relative;
            width: 200px;
            height: 36px;
            background: $cream20;
            border-radius: 18px;
            transition: background 0.2s;
            box-shadow: 0 2px 8px $brown30;
            span {
              position: absolute;
              left: 8px;
              top: 7px;
              font-family: 'Integral-CF-Bold', sans-serif;
              font-size: 1rem;
              color: $orange;
              transition: left 0.2s, color 0.2s;
            }
            .active {
              left: 64px;
              color: $red;
            }
          }
          input[type="checkbox"]:checked + label {
            background: $orange;
          }
        }
        .create-team-fields, .join-team-fields {
          display: block;
          margin-top: 10px;
          font-family: 'Integral-CF-Bold', sans-serif;
          color: $orange;
          font-size: 0.9rem;
          margin-bottom: 1rem;
        }
        .create-team-fields input, .join-team-fields input , .create-team-fields textarea , .join-team-fields textarea {
          margin-bottom: 10px;
          width: 90%;  
          height : 35px;
          padding: 10px;
          border-radius: 10px;
          border: 1px solid $brown30;
          background: $bg-dark-alt;
          color: $cream;
          font-family: 'Integral-CF-Regular', sans-serif;
          font-size: 1rem;
          transition: border 0.2s;
          
        }
        .team-id-hint {
          font-size: 0.95rem;
          color: $cream90;
          margin-top: 0.8rem;
          display: block;
        }
      }
    }
    .submit-section {
      margin-top: 2rem;
      text-align: center;
      button {
        background: $orange;
        color: $bg-dark;
        font-family: 'Integral-CF-Bold', sans-serif;
        border-radius: 15px;
        padding: 0.8rem 2rem;
        font-size: 1.1rem;
        border: none;
        box-shadow: 0 4px 16px $orange;
        cursor: pointer;
        transition: background 0.2s, color 0.2s, box-shadow 0.2s;
      }
      button:disabled {
        background: $brown30;
        color: $cream80;
        cursor: not-allowed;
      }
      button:hover:not(:disabled) {
        background: $red;
        color: $cream;
        box-shadow: 0 8px 30px $red;
      }
    }
    .status-message {
      font-family: 'Integral-CF-Bold', sans-serif;
      text-align: center;
      margin-top: 1rem;
    }
    .pending {
      color: #FFA500; /* pending - orange */
    }
    .accepted {
      color: #4CAF50; /* accepted - green */
    }
    .rejected {
      color: $red; /* rejected - red */
    }
  }
}

// FEATURED PLAYERS
.featured-profiles {
  width: 90%;
  align-items: center;
  max-width: 1200px;
  margin: 2.5rem auto 0 auto;
  background: linear-gradient(90deg, $bg-dark-alt 0%, $cream20 100%);
  border-radius: 30px;
  box-shadow: 0 8px 30px rgba(52,3,7,0.18);
  padding: 2rem 2.5rem;
  h3 {
    font-family: 'Esporte', serif;
    color: $dark-red;
    font-size: 3rem;
    margin-bottom: 2rem;
    text-align: center;
  }
  .featured-list {
    display: flex;
    gap: 2rem;
    flex-wrap: wrap;
    justify-content: center;
    margin-bottom: 1.5rem;
    .featured-card {
      background: $brown30;
      border-radius: 20px;
      box-shadow: 0 4px 16px rgba(52,3,7,0.12);
      padding: 1.2rem 1.5rem;
      display: flex;
      align-items: center;
      gap: 1.2rem;
      flex: 1 1 30%;
      min-width: 240px;
      transition: box-shadow 0.2s, transform 0.2s;
      img {
        width: 70px;
        height: 70px;
        border-radius: 50%;
        object-fit: cover;
        border: 2px solid $orange;
        box-shadow: 0 0 10px $orange;
      }
      .featured-info {
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
        .featured-name {
          font-family: 'Integral-CF-Bold', sans-serif;
          color: $cream;
          font-size: 1.2rem;
        }
        .featured-metric {
          color: $red;
          font-family: 'Franklin Gothic Medium', 'Arial Narrow', Arial, sans-serif;
          font-size: 1rem;
        }
      }
    }
    .featured-card:hover {
      box-shadow: 0 8px 30px $orange;
      transform: scale(1.04);
    }
  }
  .leaderboard-link {
    background: $orange;
    color: $bg-dark;
    font-family: 'Integral-CF-Bold', sans-serif;
    border-radius: 20px;
    padding: 0.8rem 2rem;
    font-size: 1.1rem;
    border: none;
    box-shadow: 0 4px 16px $orange;
    cursor: pointer;
    transition: background 0.2s, color 0.2s, box-shadow 0.2s;
    margin-top: 1rem;
  }
  .leaderboard-link:hover {
    background: $red;
    color: $cream;
    box-shadow: 0 8px 30px $red;
  }
}

// Responsive
@media (max-width: 1200px) {
  .live-match-spotlight, .featured-profiles {
    max-width: 98%;
    padding: 1.2rem;
  }
  .featured-list {
    gap: 1rem;
  }
  .featured-card {
    flex: 1 1 30%;
    min-width: 220px !important;
    max-width: 320px !important;
  }
}
@media (max-width: 900px) {
  .live-match-spotlight {
    flex-direction: column;
    min-height: 0;
    .versus {
      flex: 0 0 80px;
      font-size: 2rem;
      margin: 1rem auto;
    }
  }
  .team {
    padding: 1.2rem;
    h2 { font-size: 1.5rem;}
    .team-stats { font-size: 0.95rem;}
  }
  .featured-profiles {
    padding: 1rem;
    h3 { font-size: 2.5rem;}
  }
}

@media (max-width: 768px) {
  .live-match-spotlight {
    flex-direction: column;
    .versus { margin: 1rem auto; }
  }
  .featured-list .featured-card {
    flex: 1 1 100%;             // full width each
    max-width: 400px;           // cap so they donâ€™t get huge
  }
}
@media (max-width: 600px) {
  .hero-headline h1 { font-size: 2.5rem;}
  .live-match-spotlight { flex-direction: column;}
  .team { padding: 0.7rem;}
  .featured-profiles { padding: 0.5rem;}
}
</style>