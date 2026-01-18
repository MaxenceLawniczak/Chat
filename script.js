const firebaseConfig = {
    apiKey: "AIzaSyDC_6QyJqeIsIorw-F3pIapRUGMqVfHtU0",
    authDomain: "chat-e8851.firebaseapp.com",
    projectId: "chat-e8851",
    databaseURL: "https://chat-e8851-default-rtdb.europe-west1.firebasedatabase.app/",
    storageBucket: "chat-e8851.firebasestorage.app",
    messagingSenderId: "1001346245488",
    appId: "1:1001346245488:web:8e756be5c46ce8927625b5"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();
const messagesRef = db.ref('messages');
const provider = new firebase.auth.GoogleAuthProvider();

// --- CONNEXION ---
function signInWithGoogle() {
    auth.signInWithPopup(provider).catch(err => alert(err.message));
}

function logout() {
    auth.signOut()
        .then(() => {
            console.log("Utilisateur déconnecté");
        })
        .catch((error) => {
            console.error("Erreur lors de la déconnexion :", error);
            alert("Impossible de se déconnecter : " + error.message);
        });
}

function saveUsername() {
    const chosenName = document.getElementById('custom-username').value;
    if (chosenName.trim().length >= 3) {
        localStorage.setItem('chat_pseudo', chosenName);
        
        showChat(auth.currentUser);
    } else {
        alert("Ton pseudo doit faire au moins 3 caractères !");
    }
}

function showChat(user) {
    document.getElementById('username-screen').style.display = 'none';
    document.getElementById('chat-screen').style.display = 'flex';
    
    window.currentUserId = user.uid;
    window.currentUsername = localStorage.getItem('chat_pseudo');
    window.userPhoto = user.photoURL;

    document.getElementById('user-display').innerText = `Connecté : ${window.currentUsername}`;
}

auth.onAuthStateChanged(user => {
    if (user) {
        const savedPseudo = localStorage.getItem('chat_pseudo');
        
        if (!savedPseudo) {
            document.getElementById('auth-screen').style.display = 'none';
            document.getElementById('username-screen').style.display = 'flex';
        } else {
            setupChatUI(user);
        }
    } else {
        document.getElementById('auth-screen').style.display = 'flex';
        document.getElementById('chat-screen').style.display = 'none';
        document.getElementById('username-screen').style.display = 'none';
    }
});

function setupChatUI(user) {
    document.getElementById('username-screen').style.display = 'none';
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('chat-screen').style.display = 'flex';
    
    window.currentUserId = user.uid;
    window.currentUsername = localStorage.getItem('chat_pseudo');
    window.userPhoto = user.photoURL;

    document.getElementById('user-display').innerText = `Pseudo : ${window.currentUsername}`;
}

// --- ENVOI ---
document.getElementById('chat-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const text = document.getElementById('message').value;
    if (!text.trim()) return;

    messagesRef.push({
        uid: window.currentUserId,
        username: window.currentUsername,
        photo: window.userPhoto,
        message: text,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    });
    document.getElementById('message').value = "";
});

// --- RÉCEPTION ---
messagesRef.limitToLast(30).on('child_added', (snapshot) => {
    const data = snapshot.val();
    const isMe = data.uid === window.currentUserId;
    const chatBox = document.getElementById('chat-box');

    const messageElement = document.createElement('div');
    messageElement.className = `message ${isMe ? 'outgoing' : 'incoming'}`;
    
    const userInfoHTML = !isMe ? `
        <div class="pseudo-label">
            <img src="${data.photo}" class="user-pic">
            <span>${data.username}</span>
        </div>` : "";

    const time = data.timestamp ? new Date(data.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '';

    messageElement.innerHTML = `
        ${userInfoHTML}
        <span class="text-content">${data.message}</span>
        <small class="time-label">${time}</small>
    `;

    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;
});