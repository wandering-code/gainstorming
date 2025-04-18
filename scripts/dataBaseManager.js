import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { getFirestore, doc, collection, addDoc, setDoc, getDocs, getDoc, deleteDoc, query, collectionGroup, where } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

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

  if (email === "" || password === "") {
    alert("Debes especificar un correo válido y una contraseña");
    return;
  }

  // 🔹 Marcamos que es un registro manual
  localStorage.setItem("registroManual", "1");

  createUserWithEmailAndPassword(auth, email, password)
  .then(async (userCredential) => {
    const user = userCredential.user;

    const docRef = doc(db, `usuarios/${user.uid}/datos-personales/perfil`);
    await setDoc(docRef, {
      email: email
    }, { merge: true });

    alert("Registro realizado correctamente");

    // Redirigir manualmente después de guardar
    window.location.href = "html/main.html";
  })
  .catch((error) => {
    const mensaje = erroresFirebase[error.code] || error.code;
    alert(mensaje);
  });
};

window.login = async () => {
  const entrada = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  if (entrada === "" || password === "") {
    alert("Debes especificar un correo o un nombre de usuario registrado y la contraseña correcta");
    return;
  }

  let email = entrada;

  // Si no contiene "@" asumimos que es un nombre de usuario
  if (!entrada.includes("@")) {
    const q = query(
      collectionGroup(db, "datos-personales"),
      where("nombreUsuario", "==", entrada)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      alert("Nombre de usuario no encontrado.");
      return;
    }

    const path = snapshot.docs[0].ref.path;
    const uid = path.split("/")[1]; // extraer el UID del path
    const userRef = await getDoc(doc(db, `usuarios/${uid}/datos-personales/perfil`));
    const userData = userRef.data();

    if (!userData || !userData.email) {
      alert("No se ha podido recuperar el email asociado.");
      return;
    }

    email = userData.email;
  }

  // Login normal con email y contraseña
  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
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


  const hoy = new Date();
  const hoyStr = hoy.toISOString().split("T")[0]; // "2025-04-20"

  try {
    if (fecha > hoyStr) {
      alert("No se pueden registrar medidas en días futuros");
      return;
    }

    const medidasRef = collection(db, `usuarios/${user.uid}/medidas`);
    const docRef = await addDoc(medidasRef, {
      fecha: fecha,
      valor: valor,
    });

    console.log("Medida guardada con ID:", docRef.id);

    document.getElementById("input-fecha-medidas").value = "";
    document.getElementById("input-valor-medidas").value = "";

    renderizarTablaMedidas();

    if (fecha === hoyStr) {
      actualizarPeso(valor);
    }
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

export async function actualizarPeso(nuevoPeso) {
  const user = auth.currentUser;
  if (!user) return;

  const docRef = doc(db, `usuarios/${user.uid}/datos-personales/perfil`);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) return;

  const dataActual = snapshot.data();

  await setDoc(docRef, {
    ...dataActual,
    peso: nuevoPeso
  });
}


export async function guardarDatosPersonales() {
  const user = auth.currentUser;
  if (!user) return;

  if (!auth.currentUser) {
    alert("Usuario no autenticado");
    return;
  }
  
  // Datos personales
  const nombreUsuario = document.getElementById("input-nombre-usuario")
  const edad = document.getElementById("input-edad");
  const peso = document.getElementById("input-peso");
  const altura = document.getElementById("input-altura")

  // Objetivo
  const nivelActividad = document.getElementById("select-nivel-actividad");
  const objetivo = document.getElementById("select-objetivo");
  const cantidadComidas = document.getElementById("select-comidas-dia");
  const tipoDieta = document.getElementById("select-tipo-dieta");

  // Recomendación nutricional
  const recomendacionNutricionalAutomatica = document.getElementById("switch-recomendacion");
  const kcalDiarias = document.getElementById("input-kcal-diarias");
  const proteinas = document.getElementById("input-proteinas");
  const carbohidratos = document.getElementById("input-carbohidratos");
  const grasas = document.getElementById("input-grasas");

  if (!edad.value || !peso.value || !altura.value) {
    if (!confirm("Si no rellenas la edad, la altura o el peso, no se calculará de manera automática la recomendación nutricional. ¿Quieres continuar igualmente?")) {
      return;
    }
  }

  parseFloat(edad.value) < edad.min || parseFloat(edad.value) > edad.max ?
    alert(`La edad debe estar entre ${edad.min} y ${edad.max}`) : "";

  parseFloat(peso.value) < peso.min || parseFloat(peso.value) > peso.max ?
    alert(`El peso debe estar entre ${peso.min} y ${peso.max}`) : "";

  parseFloat(altura.value) < altura.min || parseFloat(altura.value) > altura.max ?
    alert(`La altura debe estar entre ${altura.min} y ${altura.max}`) : "";

  const loader = document.getElementById('loader');
  loader.classList.remove('oculto');

  try {
    // Comprobación de nombre de usuario existente
    const q = query(
      collectionGroup(db, "datos-personales"),
      where("nombreUsuario", "==", nombreUsuario.value)
    );
    const snapshot = await getDocs(q);

    // Si ya existe y no es del usuario actual
    if (!snapshot.empty && snapshot.docs[0].ref.path !== `usuarios/${user.uid}/datos-personales/perfil`) {
      alert("Ese nombre de usuario ya está en uso.");
      loader.classList.add('oculto');
      return;
    }

    const docRef = doc(db, `usuarios/${user.uid}/datos-personales/perfil`);
    await setDoc(docRef, {
      nombreUsuario: nombreUsuario.value,
      edad: edad.value,
      peso: peso.value,
      altura: altura.value,
      nivelActividad: nivelActividad.value,
      objetivo: objetivo.value,
      cantidadComidas: cantidadComidas.value,
      tipoDieta: tipoDieta.value,
      recomendacionNutricionalAutomatica: recomendacionNutricionalAutomatica.checked,
      kcalDiarias: kcalDiarias.value,
      proteinas: proteinas.value,
      carbohidratos: carbohidratos.value,
      grasas: grasas.value
    }, { merge: true });

    console.log("Datos guardados con ID:", docRef.id);

    alert("Datos actualizados correctamente");

  } catch (error) {
    console.error("Error al guardar medida:", error);
  } finally {
    loader.classList.add('oculto');
  }
}

export async function obtenerDatosPersonales() {
  const user = auth.currentUser;
  if (!user) return null;

  const datosPersonalesRef = doc(db, `usuarios/${user.uid}/datos-personales/perfil`);
  const snapshot = await getDoc(datosPersonalesRef);

  if (!snapshot.exists()) return null;

  const data = snapshot.data();

  return {
    id: snapshot.id,
    nombreUsuario: data.nombreUsuario,
    email: data.email,
    edad: data.edad,
    peso: data.peso,
    altura: data.altura,
    nivelActividad: data.nivelActividad,
    objetivo: data.objetivo,
    cantidadComidas: data.cantidadComidas,
    tipoDieta: data.tipoDieta,
    recomendacionNutricionalAutomatica: data.recomendacionNutricionalAutomatica,
    kcalDiarias: data.kcalDiarias,
    proteinas: data.proteinas,
    carbohidratos: data.carbohidratos,
    grasas: data.grasas
  };
}

// #endregion

export { auth };


















