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

function signInWithGoogle() {
    auth.signInWithPopup(provider).catch(err => alert(err.message));
}

function logout() {
    auth.signOut().then(() => {
        localStorage.removeItem('chat_pseudo');
        location.reload();
    });
}

function saveUsername() {
    const input = document.getElementById('custom-username');
    if (input.value.trim().length >= 3) {
        localStorage.setItem('chat_pseudo', input.value.trim());
        setupChatUI(auth.currentUser);
    } else {
        alert("Pseudo trop court !");
    }
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
    window.userPhoto = user.photoURL || `https://ui-avatars.com/api/?name=${window.currentUsername}`;
    document.getElementById('user-display').innerText = `Salut, ${window.currentUsername}`;
}

document.getElementById('chat-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('message');
    if (!input.value.trim()) return;

    messagesRef.push({
        uid: window.currentUserId,
        username: window.currentUsername,
        photo: window.userPhoto,
        message: input.value,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    });
    input.value = "";
});

messagesRef.limitToLast(30).on('child_added', (snapshot) => {
    const data = snapshot.val();
    const isMe = data.uid === window.currentUserId;
    const chatBox = document.getElementById('chat-box');

    const wrapper = document.createElement('div');
    wrapper.className = `message-wrapper ${isMe ? 'outgoing' : 'incoming'}`;
    
    const dateObj = data.timestamp ? new Date(data.timestamp) : new Date();
    const time = dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    const date = dateObj.toLocaleDateString([], {day: '2-digit', month: 'short'});

    wrapper.innerHTML = `
        <img src="${data.photo}" class="user-pic">
        <div class="message-content">
            ${!isMe ? `<span class="pseudo-label">${data.username}</span>` : ''}
            <div class="bubble">${data.message}</div>
            <div class="meta-data">
                <span>${time}</span>
                <span>•</span>
                <span>${date}</span>
            </div>
        </div>
    `;

    chatBox.appendChild(wrapper);
    chatBox.scrollTop = chatBox.scrollHeight;
});