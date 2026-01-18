const firebaseConfig = {
    apiKey: "AIzaSyDC_6QyJqeIsIorw-F3pIapRUGMqVfHtU0",
    authDomain: "chat-e8851.firebaseapp.com",
    projectId: "chat-e8851",
    databaseURL: "https://chat-e8851-default-rtdb.europe-west1.firebasedatabase.app/",
    storageBucket: "chat-e8851.firebasestorage.app",
    messagingSenderId: "1001346245488",
    appId: "1:1001346245488:web:8e756be5c46ce8927625b5"
};

// --- INITIALISATION (LA LIGNE MANQUANTE) ---
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider(); 
const db = firebase.database();
const messagesRef = db.ref('messages');

// --- AUTHENTIFICATION GOOGLE ---
function signInWithGoogle() {
    auth.signInWithPopup(provider)
        .then((result) => {
            console.log("Connecté :", result.user.displayName);
        })
        .catch((error) => {
            // Si l'erreur est "auth/operation-not-allowed", voir l'étape 2 ci-dessous
            alert("Erreur : " + error.message);
        });
}

function logout() { auth.signOut(); }

// Surveillance de la connexion
auth.onAuthStateChanged(user => {
    if (user) {
        document.getElementById('auth-screen').style.display = 'none';
        document.getElementById('chat-screen').style.display = 'flex';
        window.currentUserId = user.uid;
        window.currentUsername = user.displayName;
        window.userPhoto = user.photoURL; 
        document.getElementById('user-display').innerText = `Hello, ${window.currentUsername}`;
    } else {
        document.getElementById('auth-screen').style.display = 'flex';
        document.getElementById('chat-screen').style.display = 'none';
    }
});

// --- ENVOI DE MESSAGE ---
document.getElementById('chat-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const text = document.getElementById('message').value;
    if (!text.trim()) return;

    messagesRef.push({
        uid: window.currentUserId,
        username: window.currentUsername,
        photo: window.userPhoto || "", 
        message: text,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    });
    document.getElementById('message').value = "";
});

// --- AFFICHAGE (AJOUTE CETTE PARTIE POUR VOIR LES MESSAGES) ---
messagesRef.limitToLast(20).on('child_added', (snapshot) => {
    const data = snapshot.val();
    const isMe = data.uid === window.currentUserId;
    
    const messageElement = document.createElement('div');
    messageElement.className = `message ${isMe ? 'outgoing' : 'incoming'}`;
    
    messageElement.innerHTML = `
        ${!isMe ? `<img src="${data.photo}" class="user-pic"><b>${data.username}</b>` : ""}
        <span>${data.message}</span>
    `;

    document.getElementById('chat-box').appendChild(messageElement);
    document.getElementById('chat-box').scrollTop = document.getElementById('chat-box').scrollHeight;
});