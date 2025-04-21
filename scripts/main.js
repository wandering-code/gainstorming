import { guardarMedida, obtenerMedidas, eliminarMedida, obtenerDatosPersonales, 
  guardarDatosPersonales, obtenerComidas, registrarAlimento, obtenerAlimentos, 
  eliminarAlimento, actualizarAlimento, registrarAlimentoAComida, eliminarAlimentoDeComida } from '../scripts/dataBaseManager.js';

const Quagga = window.Quagga;

var camposDatosPersonales = {}
var validacionActiva = false;

window.addEventListener("DOMContentLoaded", function () {
  // cargarVistaAjustes();
  // cargarVista(localStorage.getItem("ultima-vista") || "");

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

export function cargarVista(vista) {
  switch (vista) {
    case "vista-entrenamiento":
      cargarVistaEntrenamiento();
      break;
    case "vista-rutinas":
      cargarVistaRutinas();
      break;
    case "vista-medidas":
      cargarVistaMedidas();
      break;
    case "vista-ejercicios":
      cargarVistaEjercicios();
      break;
    case "vista-comidas":
      cargarVistaComidas();
      break;
    case "vista-ajustes":
      cargarVistaAjustes();
      break;
    default:
      break;
  }
}

function cargarVistaEntrenamiento() {
  cambiarVista("vista-entrenamiento")
}

function cargarVistaRutinas() {
  cambiarVista("vista-rutinas");
}

async function cargarVistaMedidas() {
  cargando(true);

  cambiarVista("vista-medidas");

  await renderizarTablaMedidas();
}

function cargarVistaEjercicios() {
  cambiarVista("vista-ejercicios")
}

async function cargarVistaComidas() {
  cargando(true);

  cambiarVista("vista-comidas")

  actualizarTextoDia();

  await renderizarComidas();
}

function cargarVistaAjustes() {
  cargando(true);
  cambiarVista("vista-ajustes")
  setTimeout(() => {
    cargando(false);
  }, 300); // 300 ms de espera mínima
}

async function cargarVistaAjustesDatosPersonales() {
  document.getElementById("vista-ajustes-botones").classList.add('oculto');
  document.getElementById("vista-ajustes-datos-personales").classList.remove('oculto');

  cargando(true);

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

  cargando(false);
}

function cambiarVista(vista, callback = null) {
  var titulo;

  window.scrollTo(0, 0);

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

  localStorage.setItem("ultima-vista", vista);

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
  }, 300);
}

async function renderizarTablaMedidas() {
  cargando(true); // Asegúrate de mostrar el loader al inicio

  const listaMedidasDiv = document.getElementById("listaMedidas");
  listaMedidasDiv.innerHTML = "";

  try {
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

  } catch (error) {
    console.error("Error al renderizar tabla de medidas:", error);
  } finally {
    cargando(false); // Siempre se ejecuta, aunque haya error
  }
}


async function renderizarComidas() {
  cargando(true);
  const contenedor = document.getElementById("contenedor-comidas");
  contenedor.innerHTML = "";

  const fecha = document.getElementById("selector-calendario").value;
  const datos = await obtenerComidas(fecha);
  const personales = await obtenerDatosPersonales();
  const comidasGuardadas = datos?.comidas || {};
  const comidasActivas = personales?.cantidadComidas || 0;

  // Obtener el número máximo entre comidas guardadas y activas actuales
  const totalBloques = Math.max(Object.keys(comidasGuardadas).length, comidasActivas);

  for (let i = 1; i <= totalBloques; i++) {
    const nombreComida = `comida${i}`;
    const alimentos = comidasGuardadas[nombreComida] || [];

    const bloque = document.createElement("div");
    bloque.className = "bloque-comida";

    const titulo = document.createElement("h3");
    titulo.className = "titulo-comida";
    titulo.textContent = `Comida ${i}`;
    bloque.appendChild(titulo);

    const tabla = document.createElement("table");
    tabla.className = "tabla-alimentos";

    const thead = document.createElement("thead");
    thead.innerHTML = `
      <tr>
        <th>Alimento</th>
        <th>C</th>
        <th>P</th>
        <th>G</th>
        <th>Kcal</th>
        <th>Acción</th>
      </tr>
    `;
    tabla.appendChild(thead);

    const tbody = document.createElement("tbody");
    tbody.id = `cuerpo-${nombreComida}`;
    alimentos.forEach(al => {
      const fila = document.createElement("tr");
      fila.id = `fila-${al.id}`;
      fila.innerHTML = `
        <td>${al.nombre} (${al.peso}g)${al.marca ? `<br><span class="marca">${al.marca}</span>` : ''}</td>
        <td>${(al.carbos || 0).toFixed(1)}</td>
        <td>${(al.protes || 0).toFixed(1)}</td>
        <td>${(al.grasas || 0).toFixed(1)}</td>
        <td>${(al.kcal || 0).toFixed(1)}</td>
        <td>
          <button class="icono-btn" onclick="borrarAlimentoDeComida('${al.id}', '${fecha}', '${nombreComida}')">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M5.5 5.5a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm5 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
              <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1 0-2H5V1.5A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5V2h2.5a1 1 0 0 1 1 1zM6 1.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5V2H6v-.5zM4 4v9a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4H4z"/>
            </svg>
          </button>
        </td>
      `;
      tbody.appendChild(fila);
    });

    const totalCarbos = alimentos.reduce((sum, al) => sum + (al.carbos || 0), 0);
    const totalProtes = alimentos.reduce((sum, al) => sum + (al.protes || 0), 0);
    const totalGrasas = alimentos.reduce((sum, al) => sum + (al.grasas || 0), 0);
    const totalKcal = alimentos.reduce((sum, al) => sum + (al.kcal || 0), 0);

    const filaTotales = document.createElement("tr");
    filaTotales.className = "bg-gray-100 font-semibold";
    filaTotales.style = "background-color: #f7f7f7";

    filaTotales.innerHTML = `
      <td></td>
      <td>${totalCarbos.toFixed(1)}</td>
      <td>${totalProtes.toFixed(1)}</td>
      <td>${totalGrasas.toFixed(1)}</td>
      <td>${totalKcal.toFixed(1)}</td>
      <td></td>
    `;

    tbody.appendChild(filaTotales);

    tabla.appendChild(tbody);
    bloque.appendChild(tabla);

    const boton = document.createElement("button");
    boton.className = "boton-anadir";
    boton.textContent = "Añadir alimento";
    boton.onclick = () => abrirModalAlimentos(i);
    bloque.appendChild(boton);

    const hr = document.createElement("hr");
    hr.className = "separador-comida";
    bloque.appendChild(hr);

    contenedor.appendChild(bloque);
  }

  // Totales globales del día
  let totalDiaCarbos = 0;
  let totalDiaProtes = 0;
  let totalDiaGrasas = 0;
  let totalDiaKcal = 0;

  Object.values(comidasGuardadas).forEach(alimentos => {
    totalDiaCarbos += alimentos.reduce((sum, al) => sum + (al.carbos || 0), 0);
    totalDiaProtes += alimentos.reduce((sum, al) => sum + (al.protes || 0), 0);
    totalDiaGrasas += alimentos.reduce((sum, al) => sum + (al.grasas || 0), 0);
    totalDiaKcal += alimentos.reduce((sum, al) => sum + (al.kcal || 0), 0);
  });

  // Mostrar datos
  document.getElementById("carbohidratos-dia").textContent = `${totalDiaCarbos.toFixed(1)} / ${(Number(personales.carbohidratos) || 0).toFixed(1)} g`;
  document.getElementById("proteinas-dia").textContent = `${totalDiaProtes.toFixed(1)} / ${(Number(personales.proteinas) || 0).toFixed(1)} g`;
  document.getElementById("grasas-dia").textContent = `${totalDiaGrasas.toFixed(1)} / ${(Number(personales.grasas) || 0).toFixed(1)} g`;
  document.getElementById("kcal-dia").textContent = `${totalDiaKcal.toFixed(1)} / ${(Number(personales.kcal) || 0).toFixed(1)} kcal`;

  

  // Actualizar barras
  actualizarBarra("barra-carbohidratos", totalDiaCarbos, personales.carbohidratos || 1);
  actualizarBarra("barra-proteinas", totalDiaProtes, personales.proteinas || 1);
  actualizarBarra("barra-grasas", totalDiaGrasas, personales.grasas || 1);


  cargando(false);
}


async function borrarAlimentoDeComida(id, fecha, nombreComida) {
  cargando(true);
  console.log("Borrando ID:", id);
  await eliminarAlimentoDeComida(id, fecha, nombreComida);
  renderizarComidas();
}

window.borrarAlimentoDeComida = borrarAlimentoDeComida;

async function abrirModalAlimentos(comida) {
  cargando(true);

  const modal = document.getElementById("modal-registro-alimento");
  modal.classList.remove("oculto");

  document.getElementById("btn-escanear").onclick = () => {
    cargando(false);
    escanearAlimento(comida);
  };

  document.getElementById("btn-manual").onclick = () => {
    cargando(false);
    console.log("Añadienod alimento : " +comida)
    añadirAlimento(null, comida);
  };

  document.getElementById("btn-cerrar-modal").onclick = () => {
    modal.classList.add("oculto");
    cargando(false);
  };

  const contenedor = document.getElementById("formulario-manual");
  contenedor.innerHTML = "";
  contenedor.classList.remove("oculto");

  const buscador = document.createElement("input");
  buscador.type = "text";
  buscador.placeholder = "Buscar por nombre o marca";
  buscador.className = "buscador-alimentos";
  contenedor.appendChild(buscador);

  const tabla = document.createElement("table");
  tabla.className = "tabla-alimentos-modal";

  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th class="celda-nombre-th">Nombre</th>
      <th class="celda-macros-th">Info</th>
      <th class="celda-accion-th">Acción</th>
    </tr>
  `;

  const tbody = document.createElement("tbody");
  tbody.id = "tabla-alimentos-modal-body";

  tabla.appendChild(thead);
  tabla.appendChild(tbody);
  contenedor.appendChild(tabla);

  buscador.addEventListener("input", debounce(async () => {
    const texto = buscador.value.trim();
    const resultados = await obtenerAlimentos(texto);

    tbody.innerHTML = "";
    resultados.sort((a, b) => a.nombre.localeCompare(b.nombre));
    resultados.forEach(alimento => {
      const fila = crearFilaAlimento(alimento, comida);
      tbody.appendChild(fila);
    });
  }, 300));

  const alimentos = await obtenerAlimentos();
  alimentos.sort((a, b) => a.nombre.localeCompare(b.nombre));

  alimentos.forEach(alimento => {
    const fila = crearFilaAlimento(alimento, comida);
    tbody.appendChild(fila);
  });

  cargando(false);
}


async function añadirAlimentoAComida(alimento, comida) {
  console.log("Insertando alimento: ", alimento);

  await registrarAlimentoAComida({
    nombre: alimento.nombre,
    carbos: alimento.carbos,
    protes: alimento.protes,
    grasas: alimento.grasas,
    kcal: alimento.kcal,
    peso: alimento.peso
  }, comida);

  renderizarComidas();
}


function debounce(func, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
}

function crearFilaAlimento(alimento, comida) {
  const fila = document.createElement("tr");

  const tdNombre = document.createElement("td");
  tdNombre.className = "celda-nombre";
  tdNombre.textContent = `${alimento.nombre} ${alimento.marca ? '(' + alimento.marca + ')' : ''}`;

  const tdMacros = document.createElement("td");
  tdMacros.className = "celda-macros";
  tdMacros.innerHTML = `
    <div><span>C:</span> ${alimento.carbos}g</div>
    <div><span>P:</span> ${alimento.protes}g</div>
    <div><span>G:</span> ${alimento.grasas}g</div>
    <div><span>Kcal:</span> ${alimento.kcal}</div>
  `;

  const tdAccion = document.createElement("td");
  tdAccion.className = "celda-accion";

  const contenedorAccion = document.createElement("div");
  contenedorAccion.className = "accion-contenedor";

  const btnAñadir = document.createElement("button");
  btnAñadir.className = "icono-btn";
  btnAñadir.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
      <path d="M8 1a.5.5 0 0 1 .5.5V7h5.5a.5.5 0 0 1 0 1H8.5v5.5a.5.5 0 0 1-1 0V8H2a.5.5 0 0 1 0-1h5.5V1.5A.5.5 0 0 1 8 1z"/>
    </svg>`;
    btnAñadir.onclick = () => abrirModalSeleccionPeso(alimento, comida);

  const btnEditar = document.createElement("button");
  btnEditar.className = "icono-btn";
  btnEditar.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
      <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-9.5 9.5a.5.5 0 0 1-.168.11l-4 1.5a.5.5 0 0 1-.65-.65l1.5-4a.5.5 0 0 1 .11-.168l9.5-9.5zM11.207 2.5L13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zM10.5 3.207 2 11.707V13h1.293l8.5-8.5-1.293-1.293z"/>
    </svg>`;
  btnEditar.onclick = () => editarValoresAlimento(alimento.id);

  const btnBorrar = document.createElement("button");
  btnBorrar.className = "icono-btn";
  btnBorrar.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
      <path d="M5.5 5.5a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm5 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
      <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1 0-2H5V1.5A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5V2h2.5a1 1 0 0 1 1 1zM6 1.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5V2H6v-.5zM4 4v9a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4H4z"/>
    </svg>`;
  btnBorrar.onclick = () => borrarAlimento(alimento.id);

  contenedorAccion.appendChild(btnAñadir);
  contenedorAccion.appendChild(btnEditar);
  contenedorAccion.appendChild(btnBorrar);
  tdAccion.appendChild(contenedorAccion);

  fila.appendChild(tdNombre);
  fila.appendChild(tdMacros);
  fila.appendChild(tdAccion);

  return fila;
}

function abrirModalSeleccionPeso(alimento, comida) {
  const modalPrevio = document.getElementById("modal-seleccion-peso");
  if (modalPrevio) modalPrevio.remove();

  const modal = document.createElement("div");
  modal.id = "modal-seleccion-peso";
  modal.className = "modal";
  modal.innerHTML = `
    <div class="modal-contenido">
      <h2>Selecciona el peso (g)</h2>
      <input type="number" id="input-peso" value="100" placeholder="Ej: 100" class="input" min="1" />
      <div id="resumen-nutricional" class="resumen-nutricional"></div>
      <div class="botones-modal">
        <button id="btn-cancelar-peso" class="btn btn-secundario">Cancelar</button>
        <button id="btn-confirmar-peso" class="btn">Añadir</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  setTimeout(() => modal.classList.add("activo"), 10);

  const inputPeso = modal.querySelector("#input-peso");
  const resumen = modal.querySelector("#resumen-nutricional");

  const actualizarResumen = () => {
    let peso = parseFloat(inputPeso.value);
    if (isNaN(peso) || peso <= 0) peso = 100;
  
    const mult = peso / 100;
    const c = (alimento.carbos * mult).toFixed(1);
    const p = (alimento.protes * mult).toFixed(1);
    const g = (alimento.grasas * mult).toFixed(1);
    const kcal = Math.round(alimento.kcal * mult);
  
    resumen.innerHTML = `
      <div class="fila-resumen">
        <div><strong>${c}g</strong><br>Carbohidratos</div>
        <div><strong>${p}g</strong><br>Proteínas</div>
        <div><strong>${g}g</strong><br>Grasas</div>
        <div><strong>${kcal}</strong><br>Kcal</div>
      </div>
    `;
  };
  

  inputPeso.addEventListener("input", actualizarResumen);

  actualizarResumen(); // Llamada inicial al cargar el modal

  document.getElementById("btn-confirmar-peso").onclick = () => {
    cargando(true);

    const peso = parseInt(inputPeso.value);
    if (isNaN(peso) || peso <= 0) return alert("Introduce un peso válido.");
  
    console.log("Añadiendo peso a comida: " + comida);
  
    const factor = peso / 100;
  
    alimento.peso = peso;
    alimento.carbos = Math.round((alimento.carbos * factor) * 10) / 10;
    alimento.protes = Math.round((alimento.protes * factor) * 10) / 10;
    alimento.grasas = Math.round((alimento.grasas * factor) * 10) / 10;
    alimento.kcal   = Math.round((alimento.kcal * factor) * 10) / 10;
  
    añadirAlimentoAComida(alimento, comida);
    modal.remove();
  };

  document.getElementById("btn-cancelar-peso").onclick = () => {
    modal.remove();
  };
}






let escaneoEnCurso = false;

export async function escanearAlimento(comida) {
  const container = document.getElementById("scanner-container");
  container.classList.remove("oculto");

  console.log(comida);

  cargando(true);

  escaneoEnCurso = false; // reiniciar al abrir

  Quagga.init({
    inputStream: {
      name: "Live",
      type: "LiveStream",
      target: document.querySelector("#scanner"),
      constraints: {
        facingMode: "environment"
      }
    },
    decoder: {
      readers: ["ean_reader"]
    }
  }, function (err) {
    if (err) {
      alert(err);
      container.classList.add("oculto");
      return;
    }
    Quagga.start();
    cargando(false);
  });

  Quagga.onDetected(async function (data) {
    if (escaneoEnCurso) return;
    escaneoEnCurso = true;

    const codigoBarras = data.codeResult.code;
    console.log("Código detectado:", codigoBarras);

    Quagga.stop();
    container.classList.add("oculto");

    const resultados = await obtenerAlimentos(codigoBarras);

    if (resultados.length > 0) {
      // añadirAlimento(resultados[0]);
      console.log("Existe, se añade a la comida.");
      return;
    }

    const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${codigoBarras}.json`);
    const json = await res.json();

    if (json.status === 1) {
      const p = json.product;

      const nombre = p.product_name || "Sin nombre";
      const marca = p.brands || "Sin marca";
      const n = p.nutriments;
      const carbos = n.carbohydrates_100g || 0;
      const protes = n.proteins_100g || 0;
      const grasas = n.fat_100g || 0;
      const kcal = n["energy-kcal_100g"] || 0;

      añadirAlimento({
        nombre,
        marca,
        codigo: codigoBarras,
        carbos,
        protes,
        grasas,
        kcal
      });

      abrirModalAlimentos(comida);
    } else {
      alert("Producto no encontrado.");
    }
  });

  const cerrarBtn = document.getElementById("cerrar-scanner");
  cerrarBtn.onclick = () => {
    Quagga.stop();
    container.classList.add("oculto");
    abrirModalAlimentos(comida);
  };
}


async function añadirAlimento(datos, comida) {
  cargando(true);

  let modal = document.getElementById("modal-editar-alimento");
  if (modal) modal.remove();

  modal = document.createElement("div");
  modal.id = "modal-editar-alimento";
  modal.className = "modal-registrar";

  modal.innerHTML = `
    <div class="modal-contenido">
      <p class="modal-titulo">Añadir alimento</p>

      <div class="grupo-campo">
        <label for="edit-nombre">Nombre</label>
        <input id="edit-nombre" value="${datos?.nombre || ''}">
      </div>
      <div class="grupo-campo">
        <label for="edit-marca">Marca</label>
        <input id="edit-marca" value="${datos?.marca || ''}">
      </div>
      <div class="grupo-campo">
        <label for="edit-carbos">Carbohidratos</label>
        <input id="edit-carbos" type="number" value="${datos?.carbos ?? ''}">
      </div>
      <div class="grupo-campo">
        <label for="edit-protes">Proteínas</label>
        <input id="edit-protes" type="number" value="${datos?.protes ?? ''}">
      </div>
      <div class="grupo-campo">
        <label for="edit-grasas">Grasas</label>
        <input id="edit-grasas" type="number" value="${datos?.grasas ?? ''}">
      </div>
      <div class="grupo-campo">
        <label for="edit-kcal">Kcal</label>
        <input id="edit-kcal" type="number" value="${datos?.kcal ?? ''}">
      </div>

      <div class="separador-bloque"></div>

      <button id="btn-guardar-edicion" class="modal-confirmar">Guardar</button>
      <button id="btn-cerrar-edicion" class="modal-cerrar">Cancelar</button>
    </div>
  `;

  document.body.appendChild(modal);
  modal.classList.remove("oculto");

  cargando(false);

  document.getElementById("btn-cerrar-edicion").onclick = () => {
    modal.remove();
    abrirModalAlimentos(comida);
  };

  document.getElementById("btn-guardar-edicion").onclick = async () => {
    cargando(true);

    const nuevoAlimento = {
      nombre: document.getElementById("edit-nombre").value.trim() || 'Sin nombre',
      marca: document.getElementById("edit-marca").value.trim() || 'Sin marca',
      carbos: parseFloat(document.getElementById("edit-carbos").value) || 0,
      protes: parseFloat(document.getElementById("edit-protes").value) || 0,
      grasas: parseFloat(document.getElementById("edit-grasas").value) || 0,
      kcal: parseFloat(document.getElementById("edit-kcal").value) || 0,
      codigo: null
    };

    await registrarAlimento(nuevoAlimento);
    modal.remove();

    cargando(false);
    abrirModalAlimentos(comida);
  };
}



async function editarValoresAlimento(id) {
  cargando(true);

  const datos = (await obtenerAlimentos(id))[0];

  console.log("datos:", datos);


  // Eliminar modal anterior si ya existe
  let modal = document.getElementById("modal-editar-alimento");
  if (modal) modal.remove();

  // Crear modal
  modal = document.createElement("div");
  modal.id = "modal-editar-alimento";
  modal.className = "modal-registrar"; // reutiliza estilos existentes
  modal.innerHTML = `
  <div class="modal-contenido">
    <p class="modal-titulo">Editar alimento</p>

    <div class="grupo-campo">
      <label for="edit-nombre">Nombre</label>
      <input id="edit-nombre" value="${datos.nombre ?? ''}">
    </div>
    <div class="grupo-campo">
      <label for="edit-marca">Marca</label>
      <input id="edit-marca" value="${datos.marca ?? ''}">
    </div>
    <div class="grupo-campo">
      <label for="edit-carbos">Carbohidratos</label>
      <input id="edit-carbos" type="number" value="${datos.carbos ?? 0}">
    </div>
    <div class="grupo-campo">
      <label for="edit-protes">Proteínas</label>
      <input id="edit-protes" type="number" value="${datos.protes ?? 0}">
    </div>
    <div class="grupo-campo">
      <label for="edit-grasas">Grasas</label>
      <input id="edit-grasas" type="number" value="${datos.grasas ?? 0}">
    </div>
    <div class="grupo-campo">
      <label for="edit-kcal">Kcal</label>
      <input id="edit-kcal" type="number" value="${datos.kcal ?? 0}">
    </div>

    <div class="separador-bloque"></div>

    <button id="btn-guardar-edicion" class="modal-confirmar">Guardar</button>
    <button id="btn-cerrar-edicion" class="modal-cerrar">Cancelar</button>
  </div>
`;
  document.body.appendChild(modal);

  modal.classList.remove("oculto");

  // Cancelar
  document.getElementById("btn-cerrar-edicion").onclick = () => modal.remove();

  // Guardar
  document.getElementById("btn-guardar-edicion").onclick = async () => {
    cargando(true);

    const alimentoActualizado = {
      id,
      nombre: document.getElementById("edit-nombre").value.trim(),
      marca: document.getElementById("edit-marca").value.trim(),
      carbos: parseFloat(document.getElementById("edit-carbos").value),
      protes: parseFloat(document.getElementById("edit-protes").value),
      grasas: parseFloat(document.getElementById("edit-grasas").value),
      kcal: parseFloat(document.getElementById("edit-kcal").value)
    };

    await actualizarAlimento(alimentoActualizado);
    modal.remove();

    cargando(false);

    abrirModalAlimentos(); // recarga la tabla
  };
}


function borrarAlimento(id) {
  eliminarAlimento(id);

  abrirModalAlimentos();
}

function abrirFormularioManual() {}

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

let fechaActual = new Date();

function actualizarTextoDia() {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const comparar = new Date(fechaActual);
  comparar.setHours(0, 0, 0, 0);

  const texto = (comparar.getTime() === hoy.getTime())
    ? "Hoy"
    : fechaActual.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });

  document.getElementById("texto-dia").textContent = texto.charAt(0).toUpperCase() + texto.slice(1);
  document.getElementById("selector-calendario").value = fechaActual.toISOString().split("T")[0];
}

function actualizarBarra(idBarra, valor, objetivo) {
  const barra = document.getElementById(idBarra);
  if (!barra) return;

  const porcentaje = Math.min((valor / objetivo) * 100, 100);
  barra.style.width = porcentaje + "%";

  if (valor > objetivo) {
    barra.classList.add("bg-red-500");
  } else {
    barra.classList.remove("bg-red-500");
  }
}



// ONCLICKS
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('boton-menu-desplegable')?.addEventListener('click', menuDesplegable);
  document.getElementById('boton-cerrar-sesion')?.addEventListener('click', logout);
  document.getElementById('boton-cargar-vista-entrenamiento')?.addEventListener('click', cargarVistaEntrenamiento);
  document.getElementById('boton-cargar-vista-rutina')?.addEventListener('click', cargarVistaRutinas);
  document.getElementById('boton-cargar-vista-medidas')?.addEventListener('click', cargarVistaMedidas);
  document.getElementById('boton-cargar-vista-ejercicios')?.addEventListener('click', cargarVistaEjercicios);
  document.getElementById('boton-cargar-vista-comidas')?.addEventListener('click', cargarVistaComidas);
  document.getElementById('boton-cargar-vista-ajustes')?.addEventListener('click', cargarVistaAjustes);
  document.getElementById('boton-guardar-medida')?.addEventListener('click', guardarMedida);
  document.getElementById('boton-cargar-vista-datos-personales')?.addEventListener('click', cargarVistaAjustesDatosPersonales);
  document.getElementById('boton-guardar-datos-personales')?.addEventListener('click', guardarDatosPersonales);
  document.getElementById('boton-volver-vista-ajustes')?.addEventListener('click', cargarVistaAjustes);
  document.getElementById("switch-recomendacion")?.addEventListener('click', calcularRecomendacionNutricionalAutomatica);
  
  document.getElementById("dia-anterior")?.addEventListener("click", () => {
    fechaActual.setDate(fechaActual.getDate() - 1);
    actualizarTextoDia();
    renderizarComidas();
  });
  
  document.getElementById("dia-siguiente")?.addEventListener("click", () => {
    fechaActual.setDate(fechaActual.getDate() + 1);
    actualizarTextoDia();
    renderizarComidas();
  });
  
  document.getElementById("texto-dia")?.addEventListener("click", () => {
    document.getElementById("selector-calendario").click();
  });
  
  document.getElementById("selector-calendario")?.addEventListener("change", (e) => {
    cargando(true);
    fechaActual = new Date(e.target.value);
    actualizarTextoDia();
    renderizarComidas();
  });
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

function cargando(estado) {
  const loader = document.getElementById("loader");
  if (!loader) return;

  if (estado) {
    loader.classList.remove("oculto");
  } else {
    loader.classList.add("oculto");
  }
}






export { renderizarTablaMedidas, calcularTMB, obtenerFactorActividad, ajustarKcalPorObjetivo, calcularMacros };