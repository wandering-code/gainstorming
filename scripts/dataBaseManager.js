import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDn4D6i9ETBbIvhcxhyzJcnK_CiSFMEjqk",
  authDomain: "gainstorming-8ebe3.firebaseapp.com",
  projectId: "gainstorming-8ebe3",
  storageBucket: "gainstorming-8ebe3.firebasestorage.app",
  messagingSenderId: "263726703221",
  appId: "1:263726703221:web:a66eb8325ddcccfc3f4e3c"
};

const erroresFirebase = {
  "auth/invalid-email": "El correo no es válido.",
  "auth/user-disabled": "La cuenta ha sido deshabilitada.",
  "auth/user-not-found": "No hay ningún usuario con ese correo.",
  "auth/wrong-password": "La contraseña es incorrecta.",
  "auth/email-already-in-use": "Este correo ya está en uso.",
  "auth/weak-password": "La contraseña es demasiado débil.",
  "auth/missing-password": "Debes ingresar una contraseña.",
  "auth/invalid-credential": "El usuario o la contraseña es incorrecta."
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

window.signup = () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  if (email == "" || password == "") {
    alert("Que eres, ¿retrasado? ¿Ni dos putos campos sabes rellenar?");
    return;
  }

  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {alert("Registrado correctamente")})
    .catch((error) => {
      const mensaje = erroresFirebase[error.code] || error.code;
      alert(mensaje);
    });
};

window.login = () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  if (email == "" || password == "") {
    alert("Que eres, ¿retrasado? ¿Ni dos putos campos sabes rellenar?");
    return;
  }

  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      window.location.href = "html/main.html";
    })
    .catch((error) => {
      const mensaje = erroresFirebase[error.code] || error.code;
      alert(mensaje);
    });
};

window.logout = () => {
  signOut(auth)
    .then(() => {
      localStorage.clear(); // si estás usando almacenamiento local
      window.location.href = "../index.html";
    })
    .catch((error) => {
      alert("Error al cerrar sesión");
    });
}

export { auth };