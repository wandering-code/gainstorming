import { guardarMedida, obtenerMedidas, eliminarMedida } from '../scripts/dataBaseManager.js';

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
  const menu = document.getElementById("menuOpciones");
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
    document.getElementById("nombreSeccion").textContent = titulo;

    document.querySelectorAll('.vista').forEach(el => {
      if (el.id !== vista) {
        el.classList.add('oculto');
      } else {
        el.classList.remove('oculto');
      }
    });

    document.getElementById("menuOpciones").classList.remove("activo");
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
  

});

// Cierra el menú si haces clic fuera
window.addEventListener("click", (e) => {
  const menu = document.getElementById("menuOpciones");
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
  
  document.getElementById("container-principal").classList.toggle("oculto", esHorizontal);

  // Detectar cambio de orientación
  if (orientacionActual !== orientacionAnterior) {
    document.getElementById("contenedor-temporal").classList.toggle("oculto", !esHorizontal);
  }

  orientacionAnterior = orientacionActual;
}

// Ejecutar al cargar y al rotar
window.addEventListener("load", comprobarOrientacion);
window.addEventListener("resize", comprobarOrientacion);