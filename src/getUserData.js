import { doc, getDoc } from "firebase/firestore";
import firebaseApp from './firebase'

async function fetchUserData (user){
            const userRef = doc(firebaseApp.db, "users", user.uid);
            const userSnap = await getDoc(userRef);

            if(userSnap.exists()){
                return userSnap.data();
            }else{
                //eslint-disable-next-line
                alert("User doc does not exist, should have redirected to login, there is an issue");
            }
}

export default {fetchUserData};