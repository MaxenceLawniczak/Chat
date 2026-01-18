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

// Fonction pour enregistrer le pseudo perso
function saveUsername() {
    const chosenName = document.getElementById('custom-username').value;
    if (chosenName.trim() !== "") {
        localStorage.setItem('chat_pseudo', chosenName); // On sauvegarde dans le navigateur
        setupChatUI(auth.currentUser); // On lance le chat
    } else {
        alert("Merci d'entrer un pseudo !");
    }
}

auth.onAuthStateChanged(user => {
    if (user) {
        // Est-ce qu'on a déjà un pseudo enregistré ?
        const savedPseudo = localStorage.getItem('chat_pseudo');
        
        if (!savedPseudo) {
            // Pas de pseudo ? On montre l'écran de choix
            document.getElementById('auth-screen').style.display = 'none';
            document.getElementById('username-screen').style.display = 'flex';
        } else {
            // Déjà un pseudo ? On lance le chat direct
            setupChatUI(user);
        }
    } else {
        // Déconnecté
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
    window.currentUsername = localStorage.getItem('chat_pseudo'); // On utilise le pseudo perso
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
    
    // On n'affiche le pseudo et la photo que pour les autres
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