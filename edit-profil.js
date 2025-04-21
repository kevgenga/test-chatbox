// CONFIG FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyD5QCMgqMnms3Jr5HnfYi6ddAbLvUAR668",
  authDomain: "test212121.firebaseapp.com",
  projectId: "test-fb54d",
  storageBucket: "test-fb54d.appspot.com",
  messagingSenderId: "1011475501358",
  appId: "1:1011475501358:web:xxxxxxxxxxxxxx" // Remplace les x par le vrai appId  
};
  
  // Initialisation de Firebase
  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  // const storage = firebase.storage(); // Pour le stockage d'images
  const db = firebase.firestore();
  
  // Vérification de l'authentification de l'utilisateur
  auth.onAuthStateChanged((user) => {
    if (user) {
      // Affichage des informations du profil
      document.getElementById('user-email').textContent = user.email;
      document.getElementById('user-uid').textContent = user.uid;
      document.getElementById('user-displayName').textContent = user.displayName || "Non défini";
      
      // Affichage de l'avatar ou image par défaut
      if (user.photoURL) {
        document.getElementById('user-avatar').src = user.photoURL; 
      } else {
        document.getElementById('user-avatar').src = "assets/profil.jpg"; // Chemin du fichier par défaut
      }
    } else {
      window.location.href = "index.html"; // Redirige si non connecté
    }
  });
  
  // Redirection vers le chat
  document.getElementById('go-to-chat').addEventListener('click', () => { // Bouton pour retourner à la page du chatbbox
    window.location.href = "chat.html"; // lien vers la page du chatbox
  });
  
  // // Déconnexion
  // document.getElementById('logout-button').addEventListener('click', () => {
  //   auth.signOut().then(() => {
  //     window.location.href = "index.html";
  //   }).catch(error => {
  //     console.error("Erreur de déconnexion :", error);
  //   });
  // });
  
  // Affichage du formulaire d'édition
  document.getElementById('edit-profile-button').addEventListener('click', () => { // Bouton pour éditer le profil
    document.getElementById('edit-profile-form').style.display = 'block'; // formulaire de modification de profil
  });
  
  // Annulation de l'édition
  document.getElementById('cancel-edit').addEventListener('click', () => { // Bouton pour annuler l'édition
    document.getElementById('edit-profile-form').style.display = 'none'; // bouton annuler pour annuler la modification du pseudo dans le formulaire
  });
  
  // Gestion de la mise à jour du profil
  document.getElementById('profileForm').addEventListener('submit', async function(e) { // Formulaire de modification du profil
    e.preventDefault(); // Empêche le rechargement de la page
    const user = auth.currentUser; // Récupération de l'utilisateur actuel
    if (!user) return; // Si pas d'utilisateur connecté, on ne fait rien
  
    const newDisplayName = document.getElementById('displayName').value; // Récupération du pseudo dans la variable newDisplayName
    // const avatarFile = document.getElementById('avatar').files[0];
    
    let updates = {}; // Objet pour stocker les mises à jour
  
    if (newDisplayName) { // Si un pseudo est saisi, on le met à jour
      updates.displayName = newDisplayName; // met à jour le pseudo
    }
  
    try {
      // Si un fichier avatar est sélectionné, on l'upload sur Firebase Storage
      // if (avatarFile) {
      //   if (!avatarFile.type.startsWith('image/')) {
      //     alert("Veuillez télécharger une image valide.");
      //     return;
      //   }
  
      //   const storageRef = storage.ref();
      //   const avatarRef = storageRef.child(`avatars/${user.uid}/${avatarFile.name}`);
  
      //   // Upload de l'image
      //   const snapshot = await avatarRef.put(avatarFile);
      //   // Récupération de l'URL de téléchargement
      //   const downloadURL = await snapshot.ref.getDownloadURL();
      //   updates.photoURL = downloadURL;
      // }
  
      // Mise à jour du profil dans Firebase Auth
      await user.updateProfile(updates);
  
      // Mise à jour des éléments affichés
      document.getElementById('user-displayName').textContent = user.displayName;
      if (user.photoURL) {
        document.getElementById('user-avatar').src = user.photoURL;
      }
  
      document.getElementById('edit-profile-form').style.display = 'none';
      alert("Profil mis à jour !");
    } catch (error) {
      console.error("Erreur lors de la mise à jour du profil :", error);
      alert(`Erreur lors de la mise à jour du profil : ${error.message}`);
    }
  });

