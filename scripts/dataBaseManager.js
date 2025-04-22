import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, 
  onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { getFirestore, doc, collection, addDoc, setDoc, getDocs, getDoc, 
  deleteDoc, query, collectionGroup, where, updateDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

import { renderizarTablaMedidas, calcularTMB, obtenerFactorActividad, 
  ajustarKcalPorObjetivo, calcularMacros, cargarVista } from "./main.js";

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

  const loader = document.getElementById('loader');
  loader.classList.remove('oculto');

  // Si no contiene "@" asumimos que es un nombre de usuario
  if (!entrada.includes("@")) {
    const q = query(
      collectionGroup(db, "datos-personales"),
      where("nombreUsuario", "==", entrada)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      alert("Nombre de usuario no encontrado.");
      loader.classList.add('oculto');
      return;
    }

    const path = snapshot.docs[0].ref.path;
    const uid = path.split("/")[1]; // extraer el UID del path
    const userRef = await getDoc(doc(db, `usuarios/${uid}/datos-personales/perfil`));
    const userData = userRef.data();

    if (!userData || !userData.email) {
      alert("No se ha podido recuperar el email asociado.");
      loader.classList.add('oculto');
      return;
    }

    email = userData.email;
  }

  // Login normal con email y contraseña
  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      loader.classList.add('oculto');
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

  let modificarRecomendacionNutricional = false;

  let tmb, factor, kcalTotales, macros, kcalDiarias, proteinas, carbohidratos, grasas;

  if (dataActual.peso && dataActual.edad && dataActual.altura && 
    dataActual.nivelActividad && dataActual.objetivo && dataActual.tipoDieta) {
      modificarRecomendacionNutricional = dataActual.recomendacionNutricionalAutomatica;

      if (modificarRecomendacionNutricional) {
        tmb = calcularTMB(parseFloat(dataActual.peso), parseFloat(dataActual.altura), parseInt(dataActual.edad));
        factor = obtenerFactorActividad(dataActual.nivelActividad);
        kcalTotales = ajustarKcalPorObjetivo(tmb * factor, dataActual.objetivo);
        macros = calcularMacros(parseFloat(dataActual.peso), kcalTotales, dataActual.tipoDieta);

        kcalDiarias = Math.round(kcalTotales);
        proteinas = macros.proteinas;
        carbohidratos = macros.carbohidratos;
        grasas = macros.grasas;
      }
  }

  if (modificarRecomendacionNutricional) {
    await setDoc(docRef, {
      peso: nuevoPeso,
      kcalDiarias: kcalDiarias,
      proteinas: proteinas,
      carbohidratos: carbohidratos,
      grasas: grasas
    }, { merge: true });
  } else {
    await setDoc(docRef, {
      peso: nuevoPeso
    }, { merge: true });
  }
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

  if (!snapshot.exists()) {
    console.log("Snapshot no existe...")
    return null;
  } 

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

export async function obtenerComidas(fecha) {
  const user = auth.currentUser;
  if (!user || !fecha) return null;

  const baseRef = collection(db, `usuarios/${user.uid}/comidas/${fecha}/comidas`);
  const snapshot = await getDocs(baseRef);

  if (snapshot.empty) {
    console.warn("⚠️ No hay comidas para esta fecha.");
    return null;
  }

  const comidas = {};

  // Cargar todas las subcolecciones "alimentos" en paralelo
  await Promise.all(
    snapshot.docs.map(async (docSnap) => {
      const nombreComida = docSnap.id;
      const alimentosRef = collection(docSnap.ref, "alimentos");
      const alimentosSnap = await getDocs(alimentosRef);
      const alimentos = alimentosSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      comidas[nombreComida] = alimentos;
    })
  );

  return {
    fecha,
    comidas
  };
}








export async function registrarAlimento(datos) {
  const user = auth.currentUser;
  if (!user) return;

  if (!auth.currentUser) {
    alert("Usuario no autenticado");
    return;
  }

  try {

    const alimentosRef = collection(db, `usuarios/${user.uid}/alimentos`);
    const docRef = await addDoc(alimentosRef, {
        nombre: datos.nombre,
        marca: datos.marca,
        codigo: datos.codigo || null,
        carbos: Math.round((datos.carbos || 0) * 10) / 10,
        protes: Math.round((datos.protes || 0) * 10) / 10,
        grasas: Math.round((datos.grasas || 0) * 10) / 10,
        kcal: Math.round((datos.kcal || 0) * 10) / 10,
    });

    console.log("Alimento: ", datos);

    console.log("ALimento guardado con ID:", docRef.id);

  } catch (error) {
    console.error("Error al guardar alimento:", error);
  }
}

export async function obtenerAlimentos(texto) {
  const user = auth.currentUser;
  if (!user) return [];

  const colRef = collection(db, `usuarios/${user.uid}/alimentos`);

  if (texto && texto.trim() !== "") {
    const textoTrim = texto.trim();
    const textoBusqueda = textoTrim.toLowerCase();

    // Buscar por ID directamente
    try {
      const docRef = doc(db, `usuarios/${user.uid}/alimentos/${textoTrim}`);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        return [{
          id: snap.id,
          nombre: data.nombre,
          marca: data.marca,
          codigo: data.codigo,
          carbos: data.carbos,
          protes: data.protes,
          grasas: data.grasas,
          kcal: data.kcal,
          peso: data.peso
        }];
      }
    } catch (e) {
      // continuar si no existe
    }

    // Si es un código de barras (solo números)
    if (/^\d+$/.test(textoTrim)) {
      const qCodigo = query(colRef, where("codigo", "==", textoTrim));
      const snapCodigo = await getDocs(qCodigo);
      return snapCodigo.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          nombre: data.nombre,
          marca: data.marca,
          codigo: data.codigo,
          carbos: data.carbos,
          protes: data.protes,
          grasas: data.grasas,
          kcal: data.kcal,
          peso: data.peso
        };
      });
    }

    // 🔍 BÚSQUEDA LOCAL: siempre usar includes
    const snapshot = await getDocs(colRef);
    const resultados = snapshot.docs.filter(doc => {
      const data = doc.data();
      return (
        data.nombre?.toLowerCase().includes(textoBusqueda) ||
        data.marca?.toLowerCase().includes(textoBusqueda)
      );
    });

    console.log("Búsqueda local (includes):", textoBusqueda, resultados.length);

    return resultados.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        nombre: data.nombre,
        marca: data.marca,
        codigo: data.codigo,
        carbos: data.carbos,
        protes: data.protes,
        grasas: data.grasas,
        kcal: data.kcal,
        peso: data.peso
      };
    });
  }

  // Si no hay texto → devolver todos
  const snapshot = await getDocs(colRef);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      nombre: data.nombre,
      marca: data.marca,
      codigo: data.codigo,
      carbos: data.carbos,
      protes: data.protes,
      grasas: data.grasas,
      kcal: data.kcal,
      peso: data.peso
    };
  });
}

export async function registrarAlimentoAComida(alimento, comidaIndex) {
  const user = auth.currentUser;
  if (!user) return;

  const fecha = document.getElementById("selector-calendario").value;
  const nombreComida = `comida${comidaIndex}`.trim();

  if (comidaIndex === null || comidaIndex == "" || comidaIndex === undefined) {
    alert("Error al añadir alimento a comida");
    return ;
  }

  const alimentoLimpio = {
    nombre: alimento.nombre || 'Sin nombre',
    carbos: Math.round((alimento.carbos || 0) * 10) / 10,
    protes: Math.round((alimento.protes || 0) * 10) / 10,
    grasas: Math.round((alimento.grasas || 0) * 10) / 10,
    kcal: Math.round((alimento.kcal || 0) * 10) / 10,
    peso: Math.round((alimento.peso || 0) * 10) / 10
  };

  const docComidaRef = doc(db, `usuarios/${user.uid}/comidas/${fecha}/comidas/${nombreComida}`);
  await setDoc(docComidaRef, {}, { merge: true }); // 👈 asegura que exista comida1

  const colRef = collection(docComidaRef, "alimentos");
  const ref = await addDoc(colRef, alimentoLimpio);

  console.log("✅ Alimento guardado:", colRef.path, "→ ID:", ref.id);
}

export async function actualizarAlimentoDeComida(alimento, nombreComida) {
  const user = auth.currentUser;
  if (!user) return;

  const fecha = document.getElementById("selector-calendario").value;

  if (!alimento?.id || !nombreComida) {
    alert("Error al actualizar alimento");
    return;
  }

  const docRef = doc(db, `usuarios/${user.uid}/comidas/${fecha}/comidas/${nombreComida}/alimentos/${alimento.id}`);

  const alimentoActualizado = {
    peso: Math.round(alimento.peso * 10) / 10 || 0,
    carbos: Math.round(alimento.carbos * 10) / 10 || 0,
    protes: Math.round(alimento.protes * 10) / 10 || 0,
    grasas: Math.round(alimento.grasas * 10) / 10 || 0,
    kcal: Math.round(alimento.kcal * 10) / 10 || 0,
  };

  await updateDoc(docRef, alimentoActualizado);
}


export async function eliminarAlimentoDeComida(id, fecha, nombreComida) {
  const user = auth.currentUser;
  if (!user) return;

  try {
    const ref = doc(db, `usuarios/${user.uid}/comidas/${fecha}/comidas/${nombreComida}/alimentos/${id}`);
    await deleteDoc(ref);
  } catch (error) {
    console.error("Error al eliminar el alimento:", error);
    alert("Hubo un error al eliminar el alimento.");
  }
}







export async function eliminarAlimento(id) {
  const user = auth.currentUser;
  if (!user) return;

  const loader = document.getElementById('loader');
  loader.classList.remove('oculto');

  try {
    const docRef = doc(db, `usuarios/${user.uid}/alimentos/${id}`);
    await deleteDoc(docRef);
    console.log("Alimento eliminado:", id);
  } catch (error) {
    console.error("Error al eliminar alimento:", error);
  } finally {
    loader.classList.add('oculto');
  }
}

export async function actualizarAlimento(alimento) {
  const user = auth.currentUser;
  if (!user) return;

  const loader = document.getElementById("loader");
  loader.classList.remove("oculto");

  try {
    const docRef = doc(db, `usuarios/${user.uid}/alimentos/${alimento.id}`);
    await updateDoc(docRef, {
      nombre: alimento.nombre,
      marca: alimento.marca,
      carbos: Number(alimento.carbos),
      protes: Number(alimento.protes),
      grasas: Number(alimento.grasas),
      kcal: Number(alimento.kcal)
    });

    console.log("Alimento actualizado:", alimento.id);
  } catch (error) {
    console.error("Error al actualizar alimento:", error);
  } finally {
    loader.classList.add("oculto");
  }
}


// #endregion

 // asegúrate de tener este import arriba

onAuthStateChanged(auth, (user) => {
  if (user) {
    const vistaGuardada = localStorage.getItem("ultima-vista") || "";
    cargarVista(vistaGuardada);
  } else {
    console.warn("Usuario no autenticado");
    // podrías redirigir a login aquí si hace falta
  }
});

export { auth };


















