import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { getFirestore, doc, collection, addDoc, setDoc, getDocs, deleteDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

import { renderizarTablaMedidas } from "./main.js";

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
const db = getFirestore(app);

// Solo para desarrollo:
window.auth = auth;
window.db = db;
window.getDocs = getDocs;
window.collection = collection;

// #region Funciones de sesión

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

// #endregion


// #region Funciones de almacenamiento y extracción de datos

export async function guardarMedida() {
  const user = auth.currentUser;
  if (!user) return;

  if (!auth.currentUser) {
    alert("Usuario no autenticado");
    return;
  }

  const fecha = document.getElementById("input-fecha-medidas").value;
  const valor = document.getElementById("input-valor-medidas").value;

  if (fecha == "") {
    alert("El campo fecha es obligatorio");
    return;
  } else if (valor == "") {
    alert("El campo valor es obligatorio");
    return;
  }

  const input = document.getElementById("input-valor-medidas");
  const valorAux = parseFloat(input.value);

  if (valorAux < input.min || valorAux > input.max) {
    alert(`El peso debe estar entre ${input.min} y ${input.max}`);
    return;
  }

  const loader = document.getElementById('loader');
  loader.classList.remove('oculto');

  try {
    const medidasRef = collection(db, `usuarios/${user.uid}/medidas`);
    const docRef = await addDoc(medidasRef, {
      fecha: fecha,
      valor: valor,
    });

    console.log("Medida guardada con ID:", docRef.id);

    document.getElementById("input-fecha-medidas").value = "";
    document.getElementById("input-valor-medidas").value = "";

    renderizarTablaMedidas();
  } catch (error) {
    console.error("Error al guardar medida:", error);
  } finally {
    loader.classList.add('oculto');
  }
}


export async function obtenerMedidas() {
  const user = auth.currentUser;
  if (!user) return [];

  const medidasRef = collection(db, `usuarios/${user.uid}/medidas`);
  const snapshot = await getDocs(medidasRef);

  const medidas = snapshot.docs.map(doc => ({
    id: doc.id,
    fecha: doc.data().fecha,
    valor: doc.data().valor
  }));

  return medidas;
}

export async function eliminarMedida(id) {
  const user = auth.currentUser;
  if (!user) return;

  const loader = document.getElementById('loader');
  loader.classList.remove('oculto');

  try {
    const medidaRef = doc(db, `usuarios/${user.uid}/medidas/${id}`);
    await deleteDoc(medidaRef);
  } catch (error) {
    console.error('Error al eliminar medida:', error);
  } finally {
    loader.classList.add('oculto');
  }
}

// #endregion

export { auth };
