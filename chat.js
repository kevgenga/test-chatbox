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

// Fonction pour bloquer/débloquer le formulaire de message
function toggleMessageForm(disabled) {
  const messageInput = document.getElementById('messageInput');
  const sendButton = document.getElementById('bouton-envoyer');
  
  messageInput.disabled = disabled;
  sendButton.disabled = disabled;
  
  if (disabled) {
    messageInput.placeholder = "Veuillez définir un pseudo pour envoyer des messages";
  } else {
    messageInput.placeholder = "Tapez votre message...";
  }
}

// Initialisation : bloquer le formulaire par défaut
toggleMessageForm(true);

// Vérification de l'état de l'utilisateur
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
      toggleMessageForm(false); // Débloquer le formulaire si pseudo existe
    }
  } else {
    window.location.href = "index.html";
  }
});

// Fonction pour demander à l'utilisateur de définir son pseudo
function setUserName() {
  const newUserName = prompt("Veuillez définir votre pseudo :");
  if (newUserName) {
    userName = newUserName;
    const user = auth.currentUser;
    user.updateProfile({
      displayName: userName
    }).then(() => {
      initializeChat();
      updateOnlineStatus();
      updateOnlineUsersRealtime();
      toggleMessageForm(false); // Débloquer le formulaire après avoir défini le pseudo
    }).catch((error) => {
      console.error("Erreur lors de la mise à jour du pseudo : ", error);
      toggleMessageForm(true); // Garder le formulaire bloqué en cas d'erreur
    });
  } else {
    // Si l'utilisateur annule la saisie du pseudo
    toggleMessageForm(true);
  }
}

// Fonction pour initialiser le chat
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

        const isAdmin = adminIds.includes(data.from);

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
}

// Envoi du message dans Firestore
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

// Fonction pour envoyer un message normal dans la base de données
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

// Fonction pour mettre à jour le statut en ligne de l'utilisateur
function updateOnlineStatus() {
  const user = auth.currentUser;
  if (!user) return;

  const onlineRef = db.collection("onlineUsers").doc(user.uid);

  onlineRef.set({
    uid: user.uid,
    pseudo: user.displayName || userLink.textContent,
    lastSeen: firebase.firestore.FieldValue.serverTimestamp()
  });

  window.addEventListener('beforeunload', () => {
    onlineRef.delete();
  });
}

// Fonction pour afficher les utilisateurs en ligne
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

// Nettoyage des utilisateurs inactifs
function cleanupInactiveUsers() {
  const now = firebase.firestore.Timestamp.now();
  const maxInactiveDuration = 5 * 60 * 1000;

  db.collection("onlineUsers")
    .get()
    .then(snapshot => {
      snapshot.forEach(doc => {
        const user = doc.data();
        const lastSeen = user.lastSeen.toMillis();

        if (now - lastSeen > maxInactiveDuration) {
          db.collection("onlineUsers").doc(user.uid).delete();
        }
      });
    });
}

setInterval(cleanupInactiveUsers, 60 * 1000);

// Déconnexion
document.getElementById('logout-button').addEventListener('click', () => {
  auth.signOut().then(() => {
    window.location.href = "index.html";
  }).catch(error => {
    console.error("Erreur de déconnexion : ", error);
  });
});

// Mode sombre / clair
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

// Envoi avec touche "Entrée"
document.getElementById('messageInput').addEventListener('keydown', function (event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
});

// Gestion des commandes
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

document.getElementById('logout-button').addEventListener('click', () => {
  firebase.auth().signOut().then(() => {
    window.location.href = "index.html";
  }).catch(error => {
    console.error("Erreur lors de la déconnexion :", error);
    alert("Erreur lors de la déconnexion.");
  });
});
