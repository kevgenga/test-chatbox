// CONFIG FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyD5QCMgqMnms3Jr5HnfYi6ddAbLvUAR668",
  authDomain: "test212121.firebaseapp.com",
  projectId: "test-fb54d",
  storageBucket: "test-fb54d.appspot.com",
  messagingSenderId: "1011475501358",
  appId: "1:1011475501358:web:xxxxxxxxxxxxxx" // Remplace les x par le vrai appId  
};


  // Redirection vers le chat
  document.getElementById('go-to-chat').addEventListener('click', () => { // Bouton pour retourner à la page du chatbbox
    window.location.href = "chat.html"; // lien vers la page du chatbox
  });
  
// Initialisation de Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const storage = firebase.storage();
const db = firebase.firestore();

// Fonction pour récupérer les paramètres d'URL
function getQueryParams() {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    user: urlParams.get('user')
  };
}

// Fonction principale
async function fetchUserProfile(userId) {
  try {
    const querySnapshot = await db.collection('messages')
      .where('from', '==', userId)
      .limit(1)
      .get();

    if (!querySnapshot.empty) {
      const messageData = querySnapshot.docs[0].data();
      const userEmail = messageData.email || "Non défini";
      const userPseudo = messageData.pseudo || "Non défini";
      const userUid = messageData.from;

      // Remplir les champs du profil
      document.getElementById('user-displayName').textContent = userPseudo;
      document.getElementById('user-email').textContent = userEmail;
      document.getElementById('user-uid').textContent = userUid;

      // Avatar (par défaut ici)
      document.getElementById('user-avatar').src = 'assets/profil.jpg';

    } else {
      // Si aucun message → profil inexistant
      afficherMessageErreur("Ce profil n'existe pas encore ou l'utilisateur n'a pas encore écrit de message. Veuillez attendre que l'utilisateur créé son profil public.");
    }
  } catch (error) {
    console.error("Erreur lors de la récupération du profil :", error);
    afficherMessageErreur("Une erreur est survenue lors de la récupération du profil.");
  }
}

// Fonction pour afficher le message d’erreur
function afficherMessageErreur(texte) {
  const profilContainer = document.getElementById('profil-container');
  profilContainer.innerHTML = `
    <p style="color: red;">${texte}</p>
    <button id="go-to-chat">Retourner au chat</button>
  `;

  // 🔁 Réattacher le listener car le bouton vient d'être recréé
  const retourBtn = document.getElementById('go-to-chat');
  if (retourBtn) {
    retourBtn.addEventListener('click', () => {
      window.location.href = "chat.html";
    });
  }
}


// Lancer la récupération du profil
const { user } = getQueryParams();
if (user) {
  fetchUserProfile(user);
} else {
  afficherMessageErreur("Aucun utilisateur spécifié.");
}

