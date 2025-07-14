
<template>
        <nav class="main-nav"></nav>
    <nav class="page-nav"></nav>
<h1>This is a Home page</h1>
<div v-if="userInfo" class="userInfoTrialDisplay">
    <p>Hello there, {{ userInfo.displayName }}</p>
    <img 
        :src="userInfo.photoURL" 
        alt="user photo"
        referrerpolicy="no-referrer"    
    />
    <p>Email: {{ userInfo.email }}</p>
</div>

<section class="hero"></section>

<section class="submit form">
    <div v-if="!userHasParticipated && !hasEventStarted" class="participation-form">
        <form v-on:submit.prevent="submitParticipation">
            <div class="FormTitle">
                <h1>Lets Play!</h1>
            </div>
            <div class="personal-info">
                <label for="GameName">Your Game Name:</label>
                <input 
                    v-model="participationData.gameName" 
                    type="text" 
                    name="inGameName" 
                    id="GameName" 
                    required 
                />

                <label for="bitsID">Enter your BITS ID</label>
                <input 
                    type="text" 
                    name="bitsID" 
                    id="bitsID"  
                    v-model="participationData.bitsID"
                    required
                    pattern="^20\d{2}[A-Za-z]\d[A-Za-z]{2}\d{4}[A-Za-z]$"
                    title="Format: 20XXA1BB1234C (e.g., 2021A3BC1234D)"
                />
                <span v-if="userIdError" style="color:red">{{ userIdError }}</span>

                <label for="Tell">Enter a "Tell"</label>
                <textarea 
                    v-model="participationData.Tell"
                    name="" 
                    id="Tell"
                    >
                    Enter a fact, gossip, or suggestion
                </textarea>

            </div>
            <div class="team-formation-unit">
                <div class="Info-about-working">

                </div>
                <div class="Team-Formation">
                    <Toggle 
                        v-model="teamOptIn" 
                        :on-label="'Create Team'" 
                        :off-label="'Join Team'" 
                    />
                    <div v-if="teamOptIn">
                        <label>Team Name:</label>
                        <input v-model="participationData.teamName" required>
                        
                        <label>Team Slogan:</label>
                        <input v-model="participationData.teamSlogan" required>
                        
                        <div>
                            <strong>Your Team ID:</strong> {{ participationData.teamId }}
                        </div>
                    </div>
                    
                    <div v-else>
                        <label>Enter Team ID:</label>
                        <input v-model="participationData.teamId" required>
                        
                        <div v-if="teamJoinError" class="error">
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

</template>



<script>

import { onBeforeMount, ref, watch, onMounted } from 'vue';
import Toggle from '@vueform/toggle'
import '@vueform/toggle/themes/default.css'
// eslint-disable-next-line
import { useRouter } from 'vue-router';
import firebaseApp from '../../firebase'
import { onAuthStateChanged } from "firebase/auth";
import getUser from '../../getUserData';
import { query, where, collection, orderBy, updateDoc, arrayUnion, limit } from 'firebase/firestore';

import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc,  
    addDoc, 
    getDocs 
} from 'firebase/firestore';
import { getApp } from 'firebase/app';

const userInfo = ref(null);

export default{
    components: { Toggle },
    name: "HomePage",
    setup()
    {
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
        const hasEventStarted = ref(false);
        
        const participationData = ref({
            gameName:"",
            bitsID:"",
            Tell:"",
            teamId:"",
            teamName:"NoTeam",
            teamSlogan:"",
        })

        onBeforeMount(()=> {
            onAuthStateChanged(firebaseApp.auth,async (user)=>{
                if(!user){// eslint-disable-next-line
                    window.location.href = "/login.html"
                }else{// eslint-disable-next-line
                    userInfo.value = await getUser.fetchUserData(user);
                    userHasParticipated.value = userInfo.value.hasParticipated??false;
                    console.log(userHasParticipated.value);
                    if(userHasParticipated.value){
                        fetchTeamData(userInfo.value);
                    }
                }
            })
        });

        onMounted(async ()=>{
            const eventStatusRef = doc(db,"events","currentEvent");
            const eventStatusDoc = getDoc(eventStatusRef);
            hasEventStarted.value = (await eventStatusDoc).data().eventStatus;
        })

        async function submitParticipation() 
        {
            console.log("Function is called");
            if (isSubmitting.value) return; // Prevent double submission
            
            // Step 1: Validate BITS ID
            if (!validateUserID()) {
                return; // Stop if validation fails
            }
        
            isSubmitting.value = true;
            teamJoinError.value = ''; // Clear previous errors
        
            try {
                const user = firebaseApp.auth.currentUser;
                if (!user) throw new Error('User not authenticated');
            
                // Step 2: Handle team creation or joining
                if (teamOptIn.value) {
                    // Creating a new team
                    await createNewTeam(user);
                } else {
                    // Joining existing team
                    const canJoin = await handleTeamJoin(user);
                    if (!canJoin) return; // Stop if can't join team
                }
            
                // Step 3: Update user data
                await updateUserData(user);
            
                // Step 4: Mark user as participated
                userHasParticipated.value = true;
                //eslint-disable-next-line
                alert('Participation successful!');
                userInfo.value = await getUser.fetchUserData(user);
                } catch (error) {
                    console.error('Error submitting participation:', error);//eslint-disable-next-line
                    alert('Failed to submit participation. Please try again.');
                }finally {
                    isSubmitting.value = false;
                }
        }

        // Create new team
        async function createNewTeam(user) {
            const teamData = {
                teamId: participationData.value.teamId,
                teamName: participationData.value.teamName,
                teamSlogan: participationData.value.teamSlogan,
                creatorUid: user.uid,
                members: [user.uid],
                maxMembers: 4, // Set your team size limit
                createdAt: new Date(),
                status: 'active'
            };

            await setDoc(doc(db, "teams", participationData.value.teamId), teamData);
        }

// Handle team join request
        async function handleTeamJoin(user) {
            const teamId = participationData.value.teamId.trim();
            
            if (!teamId) {
                teamJoinError.value = 'Please enter a Team ID';
                return false;
            }
            
            // Check if team exists
            const teamDoc = await getDoc(doc(db, "teams", teamId));
            if (!teamDoc.exists()) {
                teamJoinError.value = 'Team not found. Please check the Team ID.';
                return false;
            }
            
            const teamData = teamDoc.data();
            
            // Check if team is full
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
            
            // Create join request
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

// Update user data
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


        function generateTeamId() 
        {
            return (
                'TEAM-' + 
                Date.now().toString(36) + 
                '-' + 
                Math.random().toString(36).substr(2, 5).toUpperCase()
            );
  
        }

        function validateUserID()
        {
            const regex = /^20\d{2}[A-Za-z]\d[A-Za-z]{2}\d{4}[A-Za-z]$/;
            if (!regex.test(participationData.value.bitsID))
            {
                userIdError.value = 'Invalid ID format. Example: 2021A3BC1234D';
                return false;
            }
            
            userIdError.value = '';
            return true;
        }
        
        watch(teamOptIn, (newValue)=>{
            if(newValue){
                participationData.value.teamId = generateTeamId();
            }else{
                participationData.value.teamId = "";
            }
        })

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
            userHasParticipated,
            participationData,
            isSubmitting,
            teamOptIn,
            teamJoinError,
            userIdError,
            generateTeamId,
            submitParticipation,
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
            hasEventStarted,
            acceptRequest,
            declineRequest

        };
    }
}
</script>

<style scoped>
.main-nav, .page-nav {
  height: 50px;
  background: #222;
  color: #fff;
  padding: 10px;
  margin-bottom: 20px;
}
.FormTitle h1 {
  font-size: 2rem;
  margin-bottom: 1rem;
}
.personal-info label {
  display: block;
  margin-top: 10px;
}
.personal-info input, .personal-info textarea {
  margin-bottom: 10px;
  width: 300px;
  padding: 6px;
}
.submit-section {
  margin-top: 20px;
}
</style>
