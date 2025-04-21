// CONFIG FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyD5QCMgqMnms3Jr5HnfYi6ddAbLvUAR668",
  authDomain: "test212121.firebaseapp.com",
  projectId: "test-fb54d",
  storageBucket: "test-fb54d.appspot.com",
  messagingSenderId: "1011475501358",
  appId: "1:1011475501358:web:xxxxxxxxxxxxxx" // Remplace les x par le vrai appId
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let userId = null;
let userName = 'Utilisateur';

function toggleMessageForm(disabled) {
  const messageInput = document.getElementById('messageInput');
  const sendButton = document.getElementById('bouton-envoyer');

  messageInput.disabled = disabled;
  sendButton.disabled = disabled;

  messageInput.placeholder = disabled
    ? "Veuillez définir un pseudo pour envoyer des messages"
    : "Tapez votre message...";
}

toggleMessageForm(true);

auth.onAuthStateChanged((user) => {
  if (user) {
    userId = user.uid;
    userName = user.displayName || 'Utilisateur';

    if (!user.displayName) {
      setUserName();
    } else {
      initializeChat();
      updateOnlineStatus();
      updateOnlineUsersRealtime();
      toggleMessageForm(false);
    }
  } else {
    window.location.href = "index.html";
  }
});

function setUserName() {
  const newUserName = prompt("Veuillez définir votre pseudo :");
  if (newUserName) {
    userName = newUserName;
    const user = auth.currentUser;
    user.updateProfile({ displayName: userName })
      .then(() => {
        initializeChat();
        updateOnlineStatus();
        updateOnlineUsersRealtime();
        toggleMessageForm(false);
      })
      .catch((error) => {
        console.error("Erreur lors de la mise à jour du pseudo : ", error);
        toggleMessageForm(true);
      });
  } else {
    toggleMessageForm(true);
  }
}

function initializeChat() {
  const messagesList = document.getElementById('messages');
  const messageInput = document.getElementById('messageInput');
  const sendButton = document.getElementById('bouton-envoyer');

  messageInput.disabled = false;
  sendButton.disabled = false;

  db.collection("messages")
    .orderBy("createdAt")
    .onSnapshot(snapshot => {
      messagesList.innerHTML = '';
      snapshot.forEach(doc => {
        const data = doc.data();
        const li = document.createElement('li');
        li.classList.add(data.from === userId ? 'sent' : 'received');

        const container = document.createElement('div');
        container.className = "message-container";

        const avatar = document.createElement('div');
        avatar.className = "message-avatar";

        const header = document.createElement('div');
        header.className = "message-header";

        const userNameElement = document.createElement('div');
        userNameElement.className = "message-user";

        const userLink = document.createElement('a');
        userLink.href = `public-profil.html?user=${data.from}`;
        userLink.textContent = "Profil";
        userLink.classList.add("user-link");

        if (data.from === userId) {
          const vousSpan = document.createElement("span");
          vousSpan.textContent = "(Vous) ";
          vousSpan.classList.add("vous-label");
          userNameElement.appendChild(vousSpan);
          userNameElement.appendChild(document.createTextNode(userName));
        } else {
          userNameElement.textContent = (data.pseudo || "Utilisateur") + " ";
          userNameElement.appendChild(userLink);
        }

        const messageText = document.createElement('div');
        messageText.className = "message-text message-content";
        messageText.innerHTML = linkify(data.content);

        const timestamp = document.createElement('div');
        timestamp.className = "message-timestamp";
        timestamp.textContent = data.createdAt?.seconds
          ? new Date(data.createdAt.seconds * 1000).toLocaleString()
          : "Date inconnue";

        container.appendChild(avatar);
        header.appendChild(userNameElement);
        container.appendChild(header);

        li.appendChild(container);
        li.appendChild(messageText);
        li.appendChild(timestamp);
        messagesList.appendChild(li);
      });

      messagesList.scrollTop = messagesList.scrollHeight;
    });

  function linkify(text) {
    const urlPattern = /(\b(https?:\/\/)?[\w.-]+\.[a-z]{2,}(\S*)?)/gi;
    return text.replace(urlPattern, function (url) {
      let hyperlink = url;
      if (!hyperlink.startsWith("http")) {
        hyperlink = "https://" + hyperlink;
      }
      return `<a href="${hyperlink}" target="_blank" rel="noopener noreferrer">${url}</a>`;
    });
  }
}

function sendMessage(e) {
  if (e) e.preventDefault();

  const input = document.getElementById('messageInput');
  const content = input.value.trim();
  if (!content || !userId) return;

  const processedMessage = traiterCommandes(content);
  if (processedMessage) {
    sendChatMessage(processedMessage);
  }
  input.value = '';
}

function sendChatMessage(content) {
  const userEmail = auth.currentUser.email;

  db.collection("messages").add({
    from: userId,
    email: userEmail,
    pseudo: userName,
    content: content,
    participants: [userId, userEmail],
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  console.log("Envoi du message par :", userName);
}

document.getElementById('messageForm').addEventListener('submit', sendMessage);

function updateOnlineStatus() {
  const user = auth.currentUser;
  if (!user) return;

  const onlineRef = db.collection("onlineUsers").doc(user.uid);

  onlineRef.set({
    uid: user.uid,
    pseudo: user.displayName || "Utilisateur",
    lastSeen: firebase.firestore.FieldValue.serverTimestamp()
  });

  window.addEventListener('beforeunload', () => {
    onlineRef.delete();
  });
}

function updateOnlineUsersRealtime() {
  const onlineUsersList = document.getElementById('online-users-list');

  db.collection("onlineUsers")
    .orderBy("lastSeen", "desc")
    .onSnapshot(snapshot => {
      onlineUsersList.innerHTML = '';

      snapshot.forEach(doc => {
        const user = doc.data();
        const li = document.createElement('li');
        li.classList.add('online');

        const userLink = document.createElement('a');
        userLink.href = `public-profil.html?user=${doc.id}`;
        userLink.textContent = user.pseudo || "Utilisateur";
        userLink.classList.add("user-link");

        li.appendChild(userLink);
        onlineUsersList.appendChild(li);
      });
    });
}

function cleanupInactiveUsers() {
  const now = firebase.firestore.Timestamp.now();
  const maxInactiveDuration = 5 * 60 * 1000;

  db.collection("onlineUsers")
    .get()
    .then(snapshot => {
      snapshot.forEach(doc => {
        const user = doc.data();
        const lastSeen = user.lastSeen.toMillis();

        if (now.toMillis() - lastSeen > maxInactiveDuration) {
          db.collection("onlineUsers").doc(user.uid).delete();
        }
      });
    });
}

setInterval(cleanupInactiveUsers, 60 * 1000);

document.getElementById('logout-button').addEventListener('click', () => {
  auth.signOut().then(() => {
    window.location.href = "index.html";
  }).catch(error => {
    console.error("Erreur de déconnexion : ", error);
  });
});

const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const savedTheme = localStorage.getItem('theme');
const bodyClass = document.body.classList;

if (savedTheme) {
  bodyClass.add(savedTheme);
} else {
  bodyClass.add(prefersDark ? 'dark' : 'light');
}

document.getElementById('theme-toggle').addEventListener('click', () => {
  if (bodyClass.contains('dark')) {
    bodyClass.replace('dark', 'light');
    localStorage.setItem('theme', 'light');
  } else {
    bodyClass.replace('light', 'dark');
    localStorage.setItem('theme', 'dark');
  }
});

document.getElementById('messageInput').addEventListener('keydown', function (event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
});

function traiterCommandes(message) {
  const trimmed = message.trim();
  const lower = trimmed.toLowerCase();

  if (lower === "/shrug") return "¯\\_(ツ)_/¯";
  if (lower === "/roll") return `🎲 Tu as lancé un dé 6 faces... Résultat : ${Math.floor(Math.random() * 6) + 1}`;
  if (lower === "/flip") return `🪙 Tu as lancé une pièce... Résultat : ${Math.random() < 0.5 ? "Pile" : "Face"}`;
  if (lower === "/help") return "📜 Commandes disponibles : /shrug, /roll, /flip, /dice (n)";

  if (lower.startsWith("/dice ")) {
    const nombreFaces = parseInt(trimmed.split(" ")[1]);
    if (!isNaN(nombreFaces) && nombreFaces > 1) {
      return `🎲 Tu as lancé un dé ${nombreFaces} faces... Résultat : ${Math.floor(Math.random() * nombreFaces) + 1}`;
    } else {
      return "⚠️ Utilisation : /dice + le nombre de faces --> /dice 20";
    }
  }

  return message;
}
