import { guardarMedida, obtenerMedidas, eliminarMedida, obtenerDatosPersonales, guardarDatosPersonales } from '../scripts/dataBaseManager.js';

var camposDatosPersonales = {}
var validacionActiva = false;

window.addEventListener("DOMContentLoaded", function () {
  cargarVistaAjustes();

  camposDatosPersonales = {
    nombreUsuario: document.getElementById("input-nombre-usuario"),
    email: this.document.getElementById("input-email"),
    edad: document.getElementById("input-edad"),
    peso: document.getElementById("input-peso"),
    altura: document.getElementById("input-altura"),
    nivelActividad: document.getElementById("select-nivel-actividad"),
    objetivo: document.getElementById("select-objetivo"),
    cantidadComidas: document.getElementById("select-comidas-dia"),
    tipoDieta: document.getElementById("select-tipo-dieta"),
    recomendacionNutricionalAutomatica: document.getElementById("switch-recomendacion"),
    kcalDiarias: document.getElementById("input-kcal-diarias"),
    proteinas: document.getElementById("input-proteinas"),
    carbohidratos: document.getElementById("input-carbohidratos"),
    grasas: document.getElementById("input-grasas")
  };

  function activarValidacionEnTiempoReal(campo) {
    const evento = !campo && campo != null ? campo.tagName === "SELECT" ? "change" : "input" : "";
  
    if (evento != "") {
      campo.addEventListener(evento, () => {
        if (campo.value.trim() !== "") {
          campo.classList.remove("input-error");
        }
      });
    }
  }
  
  Object.values(camposDatosPersonales).forEach(campo => {
    activarValidacionEnTiempoReal(campo);
  });

  const camposParaRecalculo = [
    camposDatosPersonales.edad ? camposDatosPersonales.edad.id : "",
    camposDatosPersonales.peso ? camposDatosPersonales.peso.id : "",
    camposDatosPersonales.altura ? camposDatosPersonales.altura.id : "",
    camposDatosPersonales.nivelActividad ? camposDatosPersonales.nivelActividad.id : "",
    camposDatosPersonales.objetivo ? camposDatosPersonales.objetivo.id : "",
    camposDatosPersonales.tipoDieta ? camposDatosPersonales.tipoDieta.id : ""
  ];
  
  camposParaRecalculo.forEach(id => {
    const campo = document.getElementById(id);
    if (campo) {
      const evento = campo.tagName === "SELECT" ? "change" : "input";
  
      campo.addEventListener(evento, () => {
        calcularRecomendacionNutricional();
      });
    }
  });
});

function limpiarErrores(campos) {
  Object.values(campos).forEach(campo => {
    campo.classList.remove("input-error");
  });
}


function mostrarVista(idVista) {
  // Oculta todas las vistas
  document.querySelectorAll('.vista').forEach(v => v.classList.add('oculto'));

  // Muestra la vista seleccionada
  const vista = document.getElementById(idVista);
  vista.classList.remove('oculto');

  // Ejecuta funciones según la vista
  switch (idVista) {
    case 'vista-medidas':
      iniciarMedidas();
      break;
    case 'vista-rutina':
      iniciarRutina();
      break;
    case 'vista-ejercicios':
      iniciarEjercicios();
      break;
  }
}

// Funciones específicas para cada vista
function iniciarMedidas() {
  console.log('Vista de medidas cargada');
}

function iniciarRutina() {
  console.log('Vista de rutina cargada');
}

function iniciarEjercicios() {
  console.log('Vista de ejercicios cargada');
}

// Mostrar menú desplegable
function menuDesplegable() {
  const menu = document.getElementById("contenedor-menu-principal");
  menu.classList.toggle("activo");

  if (menu.classList.contains("activo")) {
    document.getElementById('overlay').classList.remove('oculto');
  } else {
    document.getElementById('overlay').classList.add('oculto');
  }
}

function cargarVistaEntrenamiento() {
  cambiarVista("vista-entrenamiento")
}

function cargarVistaRutinas() {
  cambiarVista("vista-rutinas");
}

async function cargarVistaMedidas() {
  cambiarVista("vista-medidas");

  renderizarTablaMedidas();
}

function cargarVistaEjercicios() {
  cambiarVista("vista-ejercicios")
}

function cargarVistaAjustes() {
  cambiarVista("vista-ajustes")
}

async function cargarVistaAjustesDatosPersonales() {
  document.getElementById("vista-ajustes-botones").classList.add('oculto');
  document.getElementById("vista-ajustes-datos-personales").classList.remove('oculto');

  const loader = document.getElementById("loader");
  loader.classList.remove("oculto");

  const datos = await obtenerDatosPersonales();
  if (datos) {
    camposDatosPersonales.nombreUsuario.value = datos.nombreUsuario || "";
    camposDatosPersonales.email.value = datos.email || "";
    camposDatosPersonales.edad.value = datos.edad || "";
    camposDatosPersonales.peso.value = datos.peso || "";
    camposDatosPersonales.altura.value = datos.altura || "";

    camposDatosPersonales.recomendacionNutricionalAutomatica.checked = datos.recomendacionNutricionalAutomatica || "";
    camposDatosPersonales.nivelActividad.value = datos.nivelActividad || "";
    camposDatosPersonales.objetivo.value = datos.objetivo || "";
    camposDatosPersonales.cantidadComidas.value = datos.cantidadComidas || "";
    camposDatosPersonales.tipoDieta.value = datos.tipoDieta || "";

    camposDatosPersonales.kcalDiarias.value = datos.kcalDiarias || "";
    camposDatosPersonales.proteinas.value = datos.proteinas || "";
    camposDatosPersonales.carbohidratos.value = datos.carbohidratos || "";
    camposDatosPersonales.grasas.value = datos.grasas || "";

    calcularRecomendacionNutricionalAutomatica()
  }

  loader.classList.add("oculto");
}

function cambiarVista(vista, callback = null) {
  var titulo;
  const loader = document.getElementById('loader');

  switch (vista) {
    case "vista-entrenamiento":
      titulo = "Entrenamiento";
      break;
    case "vista-rutinas":
      titulo = "Rutinas";
      break;
    case "vista-medidas":
      titulo = "Medidas";
      break;
    case "vista-ejercicios":
      titulo = "Ejercicios";
      break;
    case "vista-ajustes":
      titulo = "Ajustes";
      break;
    default:
      titulo = "Principal";
      break;
  }

  loader.classList.remove('oculto');

  setTimeout(() => {
    document.getElementById("nombre-seccion") ? document.getElementById("nombre-seccion").textContent = titulo : "";

    document.querySelectorAll('.vista').forEach(el => {
      if (el.id !== vista) {
        el.classList.add('oculto');
      } else {
        el.classList.remove('oculto');
      }
    });

    document.querySelectorAll('.vista-secundaria').forEach(sub => {
      sub.classList.remove('oculto');
    });

    document.getElementById("contenedor-menu-principal") ? 
        document.getElementById("contenedor-menu-principal").classList.remove("activo") : "";
    document.getElementById('overlay').classList.add('oculto');

    if (typeof callback === 'function') {
      callback();
    }

    loader.classList.add('oculto');
  }, 300);
}






async function renderizarTablaMedidas() {
  const listaMedidasDiv = document.getElementById("listaMedidas");
  listaMedidasDiv.innerHTML = "";

  const medidas = await obtenerMedidas();
  if (!medidas.length) {
    const mensaje = document.createElement("p");
    mensaje.className = "text-center text-gray-500";
    mensaje.textContent = "No hay medidas registradas.";
    listaMedidasDiv.appendChild(mensaje);
    return;
  }

  const tabla = document.createElement("table");
  tabla.className = "w-full text-sm text-left border border-gray-300 rounded overflow-hidden";

  const thead = document.createElement("thead");
  const filaCabecera = document.createElement("tr");
  filaCabecera.className = "bg-gray-200 text-gray-700";

  const thFecha = document.createElement("th");
  thFecha.className = "p-2";
  thFecha.textContent = "Fecha";

  const thValor = document.createElement("th");
  thValor.className = "p-2";
  thValor.textContent = "Peso";

  const thAcciones = document.createElement("th");
  thAcciones.className = "p-2";
  thAcciones.textContent = "Acciones";

  filaCabecera.appendChild(thFecha);
  filaCabecera.appendChild(thValor);
  filaCabecera.appendChild(thAcciones);
  thead.appendChild(filaCabecera);
  tabla.appendChild(thead);

  const tbody = document.createElement("tbody");

  medidas
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    .forEach(medida => {
      const fila = document.createElement("tr");
      fila.className = "border-t hover:bg-gray-50";

      const tdFecha = document.createElement("td");
      tdFecha.className = "p-2";
      const fecha = new Date(medida.fecha);
      const fechaFormateada = fecha.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      });
      tdFecha.textContent = fechaFormateada;

      const tdValor = document.createElement("td");
      tdValor.className = "p-2";
      tdValor.textContent = `${medida.valor} kg`;

      const tdAcciones = document.createElement("td");
      tdAcciones.className = "p-2";

      const boton = document.createElement("button");
      boton.className = "bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded";
      boton.textContent = "Eliminar";
      boton.addEventListener("click", async () => {
        await eliminarMedida(medida.id);
        await renderizarTablaMedidas();
      });

      tdAcciones.appendChild(boton);
      fila.appendChild(tdFecha);
      fila.appendChild(tdValor);
      fila.appendChild(tdAcciones);
      tbody.appendChild(fila);
    });

  tabla.appendChild(tbody);
  listaMedidasDiv.appendChild(tabla);
}

function calcularRecomendacionNutricionalAutomatica() {
  console.log(camposDatosPersonales.recomendacionNutricionalAutomatica.checked)

  if (camposDatosPersonales.recomendacionNutricionalAutomatica.checked) {
    validacionActiva = true;
    calcularRecomendacionNutricional(true);
  } else {
    validacionActiva = false;
    calcularRecomendacionNutricional(false);
    limpiarErrores(camposDatosPersonales);
  }
  
}

function calcularRecomendacionNutricional(bloquearCampos) {
  const campos = camposDatosPersonales;

  if (!campos.recomendacionNutricionalAutomatica.checked) {
    if (bloquearCampos === true) {
      campos.kcalDiarias.disabled = true;
      campos.kcalDiarias.classList.add("disabled");
      campos.proteinas.disabled = true;
      campos.proteinas.classList.add("disabled");
      campos.carbohidratos.disabled = true;
      campos.carbohidratos.classList.add("disabled");
      campos.grasas.disabled = true;
      campos.grasas.classList.add("disabled");
    } else if (bloquearCampos === false) {
      campos.kcalDiarias.disabled = false;
      campos.kcalDiarias.classList.remove("disabled");
      campos.proteinas.disabled = false;
      campos.proteinas.classList.remove("disabled");
      campos.carbohidratos.disabled = false;
      campos.carbohidratos.classList.remove("disabled");
      campos.grasas.disabled = false;
      campos.grasas.classList.remove("disabled");
    }

    return;
  } else {
    campos.kcalDiarias.disabled = true;
    campos.kcalDiarias.classList.add("disabled");
    campos.proteinas.disabled = true;
    campos.proteinas.classList.add("disabled");
    campos.carbohidratos.disabled = true;
    campos.carbohidratos.classList.add("disabled");
    campos.grasas.disabled = true;
    campos.grasas.classList.add("disabled");
  }

  // Validar campos requeridos
  const camposValidos = [
    validarCampo(campos.edad),
    validarCampo(campos.peso),
    validarCampo(campos.altura),
    validarCampo(campos.nivelActividad),
    validarCampo(campos.objetivo),
    validarCampo(campos.tipoDieta)
  ];

  if (camposValidos.includes(false)) { 
    console.log("Campos vacíos, cancelado cálculo");
    return;
  }

  if (bloquearCampos === true) {
    campos.kcalDiarias.disabled = true;
    campos.kcalDiarias.classList.add("disabled");
    campos.proteinas.disabled = true;
    campos.proteinas.classList.add("disabled");
    campos.carbohidratos.disabled = true;
    campos.carbohidratos.classList.add("disabled");
    campos.grasas.disabled = true;
    campos.grasas.classList.add("disabled");
  } else if (bloquearCampos === false) {
    campos.kcalDiarias.disabled = false;
    campos.kcalDiarias.classList.remove("disabled");
    campos.proteinas.disabled = false;
    campos.proteinas.classList.remove("disabled");
    campos.carbohidratos.disabled = false;
    campos.carbohidratos.classList.remove("disabled");
    campos.grasas.disabled = false;
    campos.grasas.classList.remove("disabled");

    return;
  }

  // Calcular valores recomendados
  const edad = parseInt(campos.edad.value);
  const peso = parseFloat(campos.peso.value);
  const altura = parseFloat(campos.altura.value);
  const nivel = campos.nivelActividad.value;
  const objetivo = campos.objetivo.value;
  const tipoDieta = campos.tipoDieta.value;

  const tmb = calcularTMB(peso, altura, edad);
  const factor = obtenerFactorActividad(nivel);
  const kcalTotales = ajustarKcalPorObjetivo(tmb * factor, objetivo);
  const macros = calcularMacros(peso, kcalTotales, tipoDieta);

  // Rellenar campos
  campos.kcalDiarias.value = Math.round(kcalTotales);
  campos.proteinas.value = macros.proteinas;
  campos.carbohidratos.value = macros.carbohidratos;
  campos.grasas.value = macros.grasas;
}


function validarCampo(campo) {
  if (!validacionActiva) return true;

  const valor = (campo.value || "").toString().trim();
  let vacio = valor === "";

  // Validación específica para <select>
  if (campo.tagName === "SELECT") {
    const selectedOption = campo.options[campo.selectedIndex];
    if (selectedOption.disabled) {
      vacio = true;
    }
  }

  campo.classList.toggle("input-error", vacio);
  return !vacio;
}


// ONCLICKS

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('boton-menu-desplegable')?.addEventListener('click', menuDesplegable);
  document.getElementById('boton-cerrar-sesion')?.addEventListener('click', logout);
  document.getElementById('boton-cargar-vista-entrenamiento')?.addEventListener('click', cargarVistaEntrenamiento);
  document.getElementById('boton-cargar-vista-rutina')?.addEventListener('click', cargarVistaRutinas);
  document.getElementById('boton-cargar-vista-medidas')?.addEventListener('click', cargarVistaMedidas);
  document.getElementById('boton-cargar-vista-ejercicios')?.addEventListener('click', cargarVistaEjercicios);
  document.getElementById('boton-cargar-vista-ajustes')?.addEventListener('click', cargarVistaAjustes);

  document.getElementById('boton-guardar-medida')?.addEventListener('click', guardarMedida);

  document.getElementById('boton-cargar-vista-datos-personales')?.addEventListener('click', cargarVistaAjustesDatosPersonales);
  document.getElementById('boton-guardar-datos-personales')?.addEventListener('click', guardarDatosPersonales);
  document.getElementById('boton-volver-vista-ajustes')?.addEventListener('click', cargarVistaAjustes);

  document.getElementById("switch-recomendacion")?.addEventListener('click', calcularRecomendacionNutricionalAutomatica);
  

});

// Cierra el menú si haces clic fuera
window.addEventListener("click", (e) => {
  const menu = document.getElementById("contenedor-menu-principal");
  const boton = document.querySelector(".boton-principal");

  if (menu && !menu.contains(e.target) && !boton.contains(e.target)) {
      menu.classList.remove("activo");
      document.getElementById('overlay').classList.add('oculto');
  }
});

export { renderizarTablaMedidas };














let orientacionAnterior = window.innerWidth > window.innerHeight ? 'horizontal' : 'vertical';

function comprobarOrientacion() {
  const esHorizontal = window.innerWidth > window.innerHeight;
  const orientacionActual = esHorizontal ? 'horizontal' : 'vertical';

  // Lógica de visibilidad
  
  try {
    document.getElementById("container-principal").classList.toggle("oculto", esHorizontal);
  } catch(exception) {
    document.getElementById("contenedor-index").classList.toggle("oculto", esHorizontal);
  }

  // Detectar cambio de orientación
  if (orientacionActual !== orientacionAnterior) {
    document.getElementById("contenedor-temporal").classList.toggle("oculto", !esHorizontal);
  }

  orientacionAnterior = orientacionActual;
}

// Ejecutar al cargar y al rotar
window.addEventListener("load", comprobarOrientacion);
window.addEventListener("resize", comprobarOrientacion);


// Funciones de cálculo de KCAL

function calcularTMB(peso, altura, edad) {
  return 10 * peso + 6.25 * altura - 5 * edad + 5; // Hombre (puedo añadir versión mujer si lo necesitas)
}

function obtenerFactorActividad(nivel) {
  switch (nivel) {
    case "sedentario": return 1.2;
    case "ligero": return 1.375;
    case "moderado": return 1.55;
    case "intenso": return 1.725;
    case "muy-intenso": return 1.9;
    default: return 1.2;
  }
}

function ajustarKcalPorObjetivo(kcal, objetivo) {
  switch (objetivo) {
    case "ganar-masa-agresivo": return kcal + 600;
    case "ganar-masa-moderado": return kcal + 300;
    case "mantener": return kcal;
    case "perder-grasa-moderado": return kcal - 300;
    case "perder-grasa-agresivo": return kcal - 600;
    
    default: return kcal;
  }
}

function calcularMacros(peso, kcalTotales, tipoDieta) {
  let proteinasPorKg = 2;
  let grasasPorKg = 1;

  switch (tipoDieta) {
    case "alta-proteinas":
      proteinasPorKg = 2.5;
      grasasPorKg = 1;
      break;
    case "alta-carbohidratos":
      proteinasPorKg = 1.5;
      grasasPorKg = 0.8;
      break;
    case "equilibrada":
    default:
      proteinasPorKg = 2;
      grasasPorKg = 1.15;
      break;
  }

  const proteinas = peso * proteinasPorKg;
  const grasas = peso * grasasPorKg;

  const kcalProte = proteinas * 4;
  const kcalGrasas = grasas * 9;
  const kcalRestantes = kcalTotales - (kcalProte + kcalGrasas);
  const carbohidratos = Math.max(0, kcalRestantes / 4);

  return {
    proteinas: Math.round(proteinas),
    grasas: Math.round(grasas),
    carbohidratos: Math.round(carbohidratos)
  };
}

