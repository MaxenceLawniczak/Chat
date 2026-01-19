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
const provider = new firebase.auth.GoogleAuthProvider();

let currentForumId = "general"; 
let editingForumId = null; 
let draggedItemId = null;

function signInWithGoogle() {
    auth.signInWithPopup(provider).catch(err => alert("Erreur : " + err.message));
}

function logout() {
    auth.signOut().then(() => {
        localStorage.removeItem('chat_pseudo');
        location.reload();
    });
}

function saveUsername() {
    const input = document.getElementById('custom-username');
    const val = input.value.trim();
    if (val.length >= 3) {
        localStorage.setItem('chat_pseudo', val);
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
    checkGeneralForum();
    loadMessages(currentForumId);
}

function addDragEvents(element) {
    element.addEventListener('dragstart', (e) => {
        if (!e.target.classList.contains('drag-handle')) {
            e.preventDefault();
            return;
        }
        draggedItemId = element.getAttribute('data-id');
        element.classList.add('dragging');
    });
    element.addEventListener('dragend', () => {
        element.classList.remove('dragging');
        document.querySelectorAll('.forum-item').forEach(i => i.classList.remove('drag-over'));
    });
    element.addEventListener('dragover', (e) => {
        e.preventDefault();
        element.classList.add('drag-over');
    });
    element.addEventListener('dragleave', () => element.classList.remove('drag-over'));
    element.addEventListener('drop', (e) => {
        e.preventDefault();
        const targetId = element.getAttribute('data-id');
        if (draggedItemId && draggedItemId !== targetId) swapForumsOrder(draggedItemId, targetId);
        draggedItemId = null;
    });
}

async function swapForumsOrder(id1, id2) {
    const snap1 = await db.ref(`forums/${id1}`).once('value');
    const snap2 = await db.ref(`forums/${id2}`).once('value');
    if (snap1.exists() && snap2.exists()) {
        const order1 = snap1.val().order;
        const order2 = snap2.val().order;
        db.ref(`forums/${id1}`).update({ order: order2 });
        db.ref(`forums/${id2}`).update({ order: order1 });
    }
}

function checkGeneralForum() {
    const ref = db.ref('forums/general');
    ref.once('value', snap => {
        if (!snap.exists()) ref.set({ name: "Général", id: "general", color: "#3b82f6", order: 0 });
    });
}

function createNewForum() {
    document.getElementById('create-forum-name').value = "";
    document.getElementById('create-modal').style.display = 'flex';
}

function closeCreateModal() { document.getElementById('create-modal').style.display = 'none'; }

function confirmCreateForum() {
    const name = document.getElementById('create-forum-name').value.trim();
    const color = document.getElementById('create-forum-color').value;
    if (name) {
        const newRef = db.ref('forums').push();
        newRef.set({ name, id: newRef.key, color, order: Date.now() });
        closeCreateModal();
    }
}

function openForumSettings(id, name, color, event) {
    event.stopPropagation();
    editingForumId = id;
    document.getElementById('edit-forum-name').value = name;
    document.getElementById('edit-forum-color').value = color || "#3b82f6";
    document.getElementById('forum-modal').style.display = 'flex';
}

function closeModal() { document.getElementById('forum-modal').style.display = 'none'; }

function saveForumSettings() {
    const name = document.getElementById('edit-forum-name').value.trim();
    const color = document.getElementById('edit-forum-color').value;
    if (editingForumId && name) {
        db.ref(`forums/${editingForumId}`).update({ name, color }); 
        closeModal();
    }
}

db.ref('forums').orderByChild('order').on('value', (snapshot) => {
    const list = document.getElementById('forums-list');
    if (!list) return; 
    list.innerHTML = "";
    snapshot.forEach((child) => {
        const forum = child.val();
        const div = document.createElement('div');
        const isActive = String(currentForumId) === String(forum.id);
        const maCouleur = forum.color || "#3b82f6";

        div.className = `forum-item ${isActive ? 'active' : ''}`;
        div.setAttribute('data-id', forum.id);
        div.setAttribute('data-color', maCouleur);
        addDragEvents(div);

        if (isActive) {
            div.style.setProperty('color', maCouleur, 'important');
            div.style.setProperty('border-left', `4px solid ${maCouleur}`, 'important');
            div.style.setProperty('background-color', maCouleur + "25", 'important');
            const title = document.getElementById('current-forum-title');
            if (title) title.style.setProperty('color', maCouleur, 'important');
        } else {
            div.style.setProperty('color', '#94a3b8', 'important');
        }

        div.innerHTML = `
            <span class="drag-handle" draggable="true">☰</span>
            <span class="forum-name"># ${forum.name.toLowerCase()}</span>
            <div class="forum-actions">
                <button onclick="openForumSettings('${forum.id}', '${forum.name.replace(/'/g, "\\'")}', '${maCouleur}', event)">⚙️</button>
                ${forum.id !== 'general' ? `<button onclick="deleteForum('${forum.id}', event)">×</button>` : ''}
            </div>
        `;
        div.onclick = () => switchForum(forum.id, forum.name);
        list.appendChild(div);
    });
});

function switchForum(forumId, forumName) {
    if (currentForumId === forumId) return;
    db.ref(`forum-messages/${currentForumId}`).off();
    currentForumId = forumId;
    const titleElem = document.getElementById('current-forum-title');
    if (titleElem) titleElem.innerText = `# ${forumName.toLowerCase()}`;
    loadMessages(forumId);

    document.querySelectorAll('.forum-item').forEach(item => {
        const id = item.getAttribute('data-id');
        const color = item.getAttribute('data-color');
        if (id === currentForumId) {
            item.classList.add('active');
            item.style.setProperty('color', color, 'important');
            item.style.setProperty('border-left', `4px solid ${color}`, 'important');
            item.style.setProperty('background-color', color + "25", 'important');
            if (titleElem) titleElem.style.setProperty('color', color, 'important');
        } else {
            item.classList.remove('active');
            item.style.color = "#94a3b8";
            item.style.borderLeft = "";
            item.style.backgroundColor = "";
        }
    });
}

function deleteForum(forumId, event) {
    event.stopPropagation();
    if (confirm("Supprimer ce salon ?")) {
        db.ref(`forums/${forumId}`).remove();
        db.ref(`forum-messages/${forumId}`).remove();
        if (currentForumId === forumId) switchForum('general', 'Général');
    }
}

function loadMessages(forumId) {
    const box = document.getElementById('chat-box');
    box.innerHTML = ""; 
    db.ref(`forum-messages/${forumId}`).off();
    db.ref(`forum-messages/${forumId}`).limitToLast(30).on('child_added', snap => renderSingleMessage(snap.val()));
}

function renderSingleMessage(data) {
    const box = document.getElementById('chat-box');
    const isMe = data.uid === window.currentUserId;
    const div = document.createElement('div');
    div.className = `message-wrapper ${isMe ? 'outgoing' : 'incoming'}`;
    const time = data.timestamp ? new Date(data.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "";
    div.innerHTML = `
        <img src="${data.photo}" class="user-pic" onerror="this.src='https://ui-avatars.com/api/?name=?'">
        <div class="message-content">
            ${!isMe ? `<span class="pseudo-label">${data.username}</span>` : ''}
            <div class="bubble">${data.message}</div>
            <div class="meta-data"><span>${time}</span></div>
        </div>`;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}

window.onclick = function(event) {
    const createModal = document.getElementById('create-modal');
    const forumModal = document.getElementById('forum-modal');
    if (event.target == createModal) closeCreateModal();
    if (event.target == forumModal) closeModal();
}

document.getElementById('chat-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('message');
    const text = input.value.trim();
    if (text && window.currentUserId) {
        db.ref(`forum-messages/${currentForumId}`).push({
            uid: window.currentUserId, username: window.currentUsername,
            photo: window.userPhoto, message: text,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });
        input.value = "";
    }
});