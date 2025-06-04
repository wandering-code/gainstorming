import { guardarMedida, obtenerMedidas, eliminarMedida, obtenerDatosPersonales, 
  guardarDatosPersonales, obtenerComidas, registrarAlimento, obtenerAlimentos, 
  eliminarAlimento, actualizarAlimento, registrarAlimentoAComida, eliminarAlimentoDeComida,
  actualizarAlimentoDeComida, obtenerMacrosAlmacenados } from '../scripts/dataBaseManager.js';

const Quagga = window.Quagga;

var camposDatosPersonales = {}
var validacionActiva = false;

let ultimaComidaEditada = null;

window.addEventListener("DOMContentLoaded", function () {
  // cargarVistaAjustes();
  // cargarVista(localStorage.getItem("ultima-vista") || "");

  camposDatosPersonales = {
    nombreUsuario: document.getElementById("input-nombre-usuario"),
    email: document.getElementById("input-email"),
    fechaNacimiento: document.getElementById("input-fecha-nacimiento"),
    sexo: document.getElementById("input-sexo"),
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
    camposDatosPersonales.fechaNacimiento?.id,
    camposDatosPersonales.peso?.id,
    camposDatosPersonales.sexo?.id,
    camposDatosPersonales.altura?.id,
    camposDatosPersonales.nivelActividad?.id,
    camposDatosPersonales.objetivo?.id,
    camposDatosPersonales.tipoDieta?.id
  ].filter(id => id);

  camposParaRecalculo.forEach(id => {
    const campo = document.getElementById(id);
    if (campo) {
      const evento = id === "input-fecha-nacimiento" ? "change" : (campo.tagName === "SELECT" ? "change" : "input");
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
    camposDatosPersonales.fechaNacimiento.value = datos.fechaNacimiento || "";
    camposDatosPersonales.sexo.value = datos.sexo || "";
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
    case "vista-comidas":
      titulo = "Comidas";
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
        boton.className = "bg-black-500 hover:bg-red-600 text-white px-3 py-1 rounded";
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
  console.time("renderizarComidas: total");
  cargando(true);
  const contenedor = document.getElementById("contenedor-comidas");
  contenedor.innerHTML = "";

  const fecha = document.getElementById("selector-calendario").value;

  console.time("renderizarComidas: obtener datos");
  const [datos, personales, macrosAlmacenados] = await Promise.all([
    obtenerComidas(fecha),
    obtenerDatosPersonales(),
    obtenerMacrosAlmacenados(fecha)
  ]);
  console.timeEnd("renderizarComidas: obtener datos");

  const comidasGuardadas = datos?.comidas || {};
  const cantidadComidas = macrosAlmacenados?.cantidadComidasObjetivo || personales?.cantidadComidas || 0;

  console.log("Comidas: " + cantidadComidas);

  const carbosObjetivo = macrosAlmacenados?.carbosObjetivo || Number(personales?.carbohidratos) || 0;
  const protesObjetivo = macrosAlmacenados?.protesObjetivo || Number(personales?.proteinas) || 0;
  const grasasObjetivo = macrosAlmacenados?.grasasObjetivo || Number(personales?.grasas) || 0;
  const kcalObjetivo = macrosAlmacenados?.kcalObjetivo || Number(personales?.kcalDiarias) || 0;

  console.time("renderizarComidas: generar bloques");
  for (let i = 1; i <= cantidadComidas; i++) {
    const nombreComida = `comida${i}`;
    const alimentos = comidasGuardadas[nombreComida] || [];

    const bloque = document.createElement("div");
    bloque.className = "bloque-comida";

    const header = document.createElement("div");
    header.className = "titulo-comida-header";

    const titulo = document.createElement("h3");
    titulo.className = "titulo-comida";
    titulo.textContent = `Comida ${i}`;
    header.appendChild(titulo);

    const menuBtn = document.createElement("button");
    menuBtn.className = "menu-comida-btn";
    menuBtn.innerHTML = "⋮";
    menuBtn.onclick = (e) => {
      e.stopPropagation();
      mostrarMenuOpciones(nombreComida, i, e.currentTarget, bloque);
    };
    header.appendChild(menuBtn);

    bloque.appendChild(header);

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
        <th>&nbsp;</th>
      </tr>
    `;
    tabla.appendChild(thead);

    const tbody = document.createElement("tbody");
    tbody.id = `cuerpo-${nombreComida}`;
    alimentos.forEach(al => {
      const fila = document.createElement("tr");
      fila.id = `fila-${al.id}`;
      fila.innerHTML = `
        <td>
          <span class="nombre-alimento" style="cursor:pointer;" onclick='abrirModalSeleccionPeso(${JSON.stringify(al)}, "${nombreComida}", true)'>
            ${al.nombre} (${al.peso}g)
          </span>
          ${al.marca ? `<br><span class="marca">${al.marca}</span>` : ''}
        </td>
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

    requestAnimationFrame(() => {
      if (ultimaComidaEditada !== null && Number.isInteger(ultimaComidaEditada) && ultimaComidaEditada > 0) {
        const bloque = document.querySelector(`.bloque-comida:nth-child(${ultimaComidaEditada})`);
        if (bloque) {
          bloque.scrollIntoView({ behavior: "smooth", block: "start" });
          setTimeout(() => {
            window.scrollBy(0, -60);
          }, 300);
        }
      }
      ultimaComidaEditada = null;
    });
  }
  console.timeEnd("renderizarComidas: generar bloques");

  console.time("renderizarComidas: totales globales");
  let totalDiaCarbos = 0, totalDiaProtes = 0, totalDiaGrasas = 0, totalDiaKcal = 0;
  Object.values(comidasGuardadas).forEach(alimentos => {
    totalDiaCarbos += alimentos.reduce((sum, al) => sum + (al.carbos || 0), 0);
    totalDiaProtes += alimentos.reduce((sum, al) => sum + (al.protes || 0), 0);
    totalDiaGrasas += alimentos.reduce((sum, al) => sum + (al.grasas || 0), 0);
    totalDiaKcal += alimentos.reduce((sum, al) => sum + (al.kcal || 0), 0);
  });
  console.timeEnd("renderizarComidas: totales globales");

  document.getElementById("carbohidratos-dia").textContent = `${totalDiaCarbos.toFixed(1)} / ${carbosObjetivo.toFixed(1)} g`;
  document.getElementById("proteinas-dia").textContent = `${totalDiaProtes.toFixed(1)} / ${protesObjetivo.toFixed(1)} g`;
  document.getElementById("grasas-dia").textContent = `${totalDiaGrasas.toFixed(1)} / ${grasasObjetivo.toFixed(1)} g`;
  document.getElementById("kcal-dia").textContent = `${totalDiaKcal.toFixed(1)} / ${kcalObjetivo.toFixed(1)} kcal`;

  actualizarBarra("barra-carbohidratos", totalDiaCarbos, carbosObjetivo || 1);
  actualizarBarra("barra-proteinas", totalDiaProtes, protesObjetivo || 1);
  actualizarBarra("barra-grasas", totalDiaGrasas, grasasObjetivo || 1);
  actualizarBarra("barra-kcal", totalDiaKcal, kcalObjetivo || 1);

  cargando(false);
  console.timeEnd("renderizarComidas: total");
}



function esAlimentoDuplicado(alimentoApi, listaLocales) {
  const normalizar = str => (str || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  return listaLocales.some(local => {
    return (
      normalizar(local.nombre) === normalizar(alimentoApi.nombre) &&
      Math.round(local.carbos * 10) / 10 === Math.round(alimentoApi.carbos * 10) / 10 &&
      Math.round(local.protes * 10) / 10 === Math.round(alimentoApi.protes * 10) / 10 &&
      Math.round(local.grasas * 10) / 10 === Math.round(alimentoApi.grasas * 10) / 10 &&
      Math.round(local.kcal * 10) / 10 === Math.round(alimentoApi.kcal * 10) / 10
    );
  });
}

async function borrarAlimentoDeComida(id, fecha, nombreComida) {
  cargando(true);
  console.log("Borrando ID:", id);
  await eliminarAlimentoDeComida(id, fecha, nombreComida);
  renderizarComidas();
}

window.borrarAlimentoDeComida = borrarAlimentoDeComida;
window.abrirModalSeleccionPeso = abrirModalSeleccionPeso;

window.copiarComida = copiarComida;
window.pegarComida = pegarComida;



async function abrirModalAlimentos(comida) {
  console.time("abrirModalAlimentos: total");
  cargando(true);

  const modal = document.getElementById("modal-registro-alimento");
  modal.classList.remove("oculto");

  const btnEscanear = document.getElementById("btn-escanear");
  const btnManual = document.getElementById("btn-manual");
  const btnCerrar = document.getElementById("btn-cerrar-modal");

  btnEscanear.onclick = () => {
    cargando(false);
    escanearAlimento(comida);
  };

  btnManual.onclick = () => {
    cargando(false);
    añadirAlimento(null, comida);
  };

  btnCerrar.onclick = () => {
    modal.classList.add("oculto");
    cargando(false);
  };

  const contenedor = document.getElementById("formulario-manual");
  contenedor.innerHTML = "";
  contenedor.classList.remove("oculto");

  const searchContainer = document.createElement("div");
  searchContainer.className = "buscador-contenedor";
  contenedor.appendChild(searchContainer);

  const buscador = document.createElement("input");
  buscador.type = "text";
  buscador.placeholder = "Buscar por nombre o marca";
  buscador.className = "buscador-alimentos";
  searchContainer.appendChild(buscador);

  const apiToggleContainer = document.createElement("div");
  apiToggleContainer.classList.add("api-toggle");

  const apiToggleLabel = document.createElement("label");
  apiToggleLabel.setAttribute("for", "apiToggle");
  apiToggleLabel.textContent = "API";

  const apiToggle = document.createElement("input");
  apiToggle.type = "checkbox";
  apiToggle.id = "apiToggle";

  apiToggleContainer.appendChild(apiToggleLabel);
  apiToggleContainer.appendChild(apiToggle);
  searchContainer.appendChild(apiToggleContainer);

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
    const buscarEnApi = apiToggle.checked;
    cargando(true);

    console.time("Tiempo total búsqueda");
    tbody.innerHTML = "";

    let resultadosLocal = [];

    if (!texto) {
      resultadosLocal = await obtenerAlimentos();
    } else {
      console.time("Tiempo búsqueda Firebase");
      resultadosLocal = await obtenerAlimentos(texto);
      console.timeEnd("Tiempo búsqueda Firebase");
    }

    resultadosLocal.sort((a, b) => a.nombre.localeCompare(b.nombre));
    const fragmentoLocal = document.createDocumentFragment();
    resultadosLocal.forEach(alimento => {
      const fila = crearFilaAlimento(alimento, comida, false);
      fragmentoLocal.appendChild(fila);
    });
    tbody.appendChild(fragmentoLocal);

    if (buscarEnApi && texto) {
      console.time("Tiempo búsqueda API externa");
      try {
        const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(texto)}&search_simple=1&action=process&json=1&page_size=10`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);

        if (res.ok) {
          const data = await res.json();
          if (data.products) {
            const fragmentoApi = document.createDocumentFragment();
            data.products.forEach(p => {
              const n = p.nutriments || {};
              const alimentoExterno = {
                nombre: p.product_name || "Sin nombre",
                marca: p.brands || "Sin marca",
                carbos: n.carbohydrates_100g || 0,
                protes: n.proteins_100g || 0,
                grasas: n.fat_100g || 0,
                kcal: n["energy-kcal_100g"] || 0,
                externo: true
              };
              if (!esAlimentoDuplicado(alimentoExterno, resultadosLocal)) {
                const fila = crearFilaAlimento(alimentoExterno, comida, true);
                fila.style.backgroundColor = "#f0f0f0";
                fragmentoApi.appendChild(fila);
              }
            });
            tbody.appendChild(fragmentoApi);
          }
        } else {
          console.warn("[DEBUG] Respuesta API no OK:", res.status);
        }
      } catch (e) {
        if (e.name === "AbortError") {
          console.warn("[DEBUG] Timeout: API abortada");
        } else {
          console.error("[DEBUG] Error al consultar API externa", e);
        }
      }
      console.timeEnd("Tiempo búsqueda API externa");
    }

    cargando(false);
    console.timeEnd("Tiempo total búsqueda");
  }, 300));

  console.time("abrirModalAlimentos: carga inicial alimentos");
  const alimentos = await obtenerAlimentos();
  alimentos.sort((a, b) => a.nombre.localeCompare(b.nombre));
  const fragmentoInicial = document.createDocumentFragment();
  alimentos.forEach(alimento => {
    const fila = crearFilaAlimento(alimento, comida, false);
    fragmentoInicial.appendChild(fila);
  });
  tbody.appendChild(fragmentoInicial);
  console.timeEnd("abrirModalAlimentos: carga inicial alimentos");

  cargando(false);
  console.timeEnd("abrirModalAlimentos: total");
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
    btnAñadir.onclick = () => abrirModalSeleccionPeso(alimento, comida, false);

  const btnEditar = document.createElement("button");
  btnEditar.className = "icono-btn";
  btnEditar.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
      <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-9.5 9.5a.5.5 0 0 1-.168.11l-4 1.5a.5.5 0 0 1-.65-.65l1.5-4a.5.5 0 0 1 .11-.168l9.5-9.5zM11.207 2.5L13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zM10.5 3.207 2 11.707V13h1.293l8.5-8.5-1.293-1.293z"/>
    </svg>`;
  btnEditar.onclick = () => editarValoresAlimento(alimento.id, comida);

  const btnBorrar = document.createElement("button");
  btnBorrar.className = "icono-btn";
  btnBorrar.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
      <path d="M5.5 5.5a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm5 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
      <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1 0-2H5V1.5A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5V2h2.5a1 1 0 0 1 1 1zM6 1.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5V2H6v-.5zM4 4v9a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4H4z"/>
    </svg>`;
  btnBorrar.onclick = () => borrarAlimento(alimento.id, comida);

  contenedorAccion.appendChild(btnAñadir);

  if (!alimento.externo) {
    contenedorAccion.appendChild(btnEditar);
    contenedorAccion.appendChild(btnBorrar);
  }
  tdAccion.appendChild(contenedorAccion);

  fila.appendChild(tdNombre);
  fila.appendChild(tdMacros);
  fila.appendChild(tdAccion);

  return fila;
}

function abrirModalSeleccionPeso(alimento, comida, modificacion) {
  const modalPrevio = document.getElementById("modal-seleccion-peso");
  if (modalPrevio) modalPrevio.remove();

  const modal = document.createElement("div");
  modal.id = "modal-seleccion-peso";
  modal.className = "modal";
  modal.innerHTML = `
    <div class="modal-contenido">
      <h2>Selecciona el peso (g)</h2>
      <input type="number" id="input-peso" value="` + (modificacion ? alimento.peso : 100)+ `" placeholder="Ej: 100" class="input" min="1" />
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
    
    const alimentoBase = {
      ...alimento,
      carbos: alimento.carbos * (100 / (alimento.peso ? alimento.peso : 100) ),
      protes: alimento.protes * (100 / (alimento.peso ? alimento.peso : 100)),
      grasas: alimento.grasas * (100 / (alimento.peso ? alimento.peso : 100)),
      kcal: alimento.kcal * (100 / (alimento.peso ? alimento.peso : 100))
    };
  
    const mult = peso / 100;
    const c = (alimentoBase.carbos * mult).toFixed(1);
    const p = (alimentoBase.protes * mult).toFixed(1);
    const g = (alimentoBase.grasas * mult).toFixed(1);
    const kcal = (alimentoBase.kcal * mult).toFixed(1);
  
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

  document.getElementById("btn-confirmar-peso").onclick = async () => {
    cargando(true);
  
    const peso = parseInt(inputPeso.value);
    if (isNaN(peso) || peso <= 0) return alert("Introduce un peso válido.");
  
    console.log("Añadiendo peso a comida: " + comida);
  
    const factor = peso / 100;
  
    const alimentoOriginal = { ...alimento }; // copia antes de modificar
    const alimentoBase = {
      ...alimento,
      carbos: alimento.carbos * (100 / (alimento.peso ? alimento.peso : 100)),
      protes: alimento.protes * (100 / (alimento.peso ? alimento.peso : 100)),
      grasas: alimento.grasas * (100 / (alimento.peso ? alimento.peso : 100)),
      kcal: alimento.kcal * (100 / (alimento.peso ? alimento.peso : 100))
    };

    
    alimento.peso = peso;
    alimento.carbos = Math.round((alimentoBase.carbos * factor) * 10) / 10;
    alimento.protes = Math.round((alimentoBase.protes * factor) * 10) / 10;
    alimento.grasas = Math.round((alimentoBase.grasas * factor) * 10) / 10;
    alimento.kcal   = Math.round((alimentoBase.kcal * factor) * 10) / 10;
  
    if (modificacion) {
      actualizarAlimentoDeComida(alimento, comida);
      renderizarComidas();
    } else {
      añadirAlimentoAComida(alimento, comida);
  
      if (alimento.externo) {
        console.log("Es externo: ", alimentoOriginal);
        await registrarAlimento(alimentoOriginal);
      }
    }
  
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
      cargando(false);
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
      }, comida);

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
        <input id="edit-carbos" type="number" value="${datos?.carbos.toFixed(1) ?? ''}">
      </div>
      <div class="grupo-campo">
        <label for="edit-protes">Proteínas</label>
        <input id="edit-protes" type="number" value="${datos?.protes.toFixed(1) ?? ''}">
      </div>
      <div class="grupo-campo">
        <label for="edit-grasas">Grasas</label>
        <input id="edit-grasas" type="number" value="${datos?.grasas.toFixed(1) ?? ''}">
      </div>
      <div class="grupo-campo">
        <label for="edit-kcal">Kcal</label>
        <input id="edit-kcal" type="number" value="${datos?.kcal.toFixed(1) ?? ''}">
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



async function editarValoresAlimento(id, comida) {
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

    abrirModalAlimentos(comida); // recarga la tabla
  };
}


function borrarAlimento(id, comida) {
  eliminarAlimento(id);

  abrirModalAlimentos(comida);
}


// Cierra cualquier menú abierto antes de crear uno nuevo
function cerrarMenuGlobal() {
  document.querySelectorAll(".menu-opciones").forEach(menu => menu.remove());
}

function mostrarMenuOpciones(nombreComida, comidaIndex, boton, bloque) {
  cerrarMenuGlobal(); // Cierra cualquier otro menú

  const menu = document.createElement("div");
  menu.className = "menu-opciones";
  menu.innerHTML = `
    <button onclick="copiarComida('${nombreComida}')">Copiar comida</button>
    <button onclick="pegarComida('${comidaIndex}')">Pegar comida</button>
    <button onclick="vaciarComida('${comidaIndex}')">Vaciar comida</button>
  `;

  menu.style.position = "absolute";
  const rect = boton.getBoundingClientRect();
  const bloqueRect = bloque.getBoundingClientRect();
  const offsetTop = rect.bottom - bloqueRect.top;
  let offsetLeft = rect.left - bloqueRect.left;

  const menuWidth = 150;
  if (rect.left + menuWidth > window.innerWidth) {
    offsetLeft = rect.right - bloqueRect.left - menuWidth;
  }

  menu.style.top = `${offsetTop}px`;
  menu.style.left = `${offsetLeft}px`;

  bloque.style.position = "relative";
  bloque.appendChild(menu);
}

// Cerrar el menú si haces scroll o clic en cualquier parte
document.addEventListener("click", cerrarMenuGlobal);
window.addEventListener("scroll", cerrarMenuGlobal, { passive: true });


let comidaCopiada = null;

async function copiarComida(nombreComida) {
  const fecha = document.getElementById("selector-calendario").value;
  const datos = await obtenerComidas(fecha);

  const comidas = datos?.comidas;
  const alimentos = comidas?.[nombreComida];

  if (!Array.isArray(alimentos) || alimentos.length === 0) return;

  comidaCopiada = alimentos.map(al => ({ ...al })); // copia profunda
  document.querySelector(".menu-opciones")?.remove();
}



async function pegarComida(destinoIndex) {
  if (!comidaCopiada || comidaCopiada.length === 0) {
    return;
  }

  ultimaComidaEditada = parseInt(destinoIndex, 10);

  cargando(true);
  for (let alimento of comidaCopiada) {
    await registrarAlimentoAComida(alimento, destinoIndex);
  }
  cargando(false);

  document.querySelector(".menu-opciones")?.remove();
  renderizarComidas(); // Recargar la vista
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
    validarCampo(campos.fechaNacimiento),
    validarCampo(campos.sexo),
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
  const fechaNacimiento = parseInt(campos.fechaNacimiento.value);
  const peso = parseFloat(campos.peso.value);
  const sexo = parseFloat(campos.sexo.value);
  const altura = parseFloat(campos.altura.value);
  const nivel = campos.nivelActividad.value;
  const objetivo = campos.objetivo.value;
  const tipoDieta = campos.tipoDieta.value;

  console.log("SEX: " + calcularEdadDesdeFechaNacimiento(fechaNacimiento));


  const tmb = calcularTMB(peso, altura, calcularEdadDesdeFechaNacimiento(fechaNacimiento), sexo);
  const factor = obtenerFactorActividad(nivel);
  const kcalTotales = ajustarKcalPorObjetivo(tmb * factor, objetivo);
  const macros = calcularMacros(peso, kcalTotales, tipoDieta);

  // Rellenar campos
  campos.kcalDiarias.value = Math.round(kcalTotales);
  campos.proteinas.value = macros.proteinas;
  campos.carbohidratos.value = macros.carbohidratos;
  campos.grasas.value = macros.grasas;
}

function calcularEdadDesdeFechaNacimiento(fechaNacimientoStr) {
  if (!fechaNacimientoStr) return null;

  // Si es solo un año, añade -01-01
  if (/^\d{4}$/.test(fechaNacimientoStr)) {
    fechaNacimientoStr = `${fechaNacimientoStr}-01-01`;
  }

  const hoy = new Date();
  const fechaNacimiento = new Date(fechaNacimientoStr);

  let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
  const mes = hoy.getMonth() - fechaNacimiento.getMonth();

  if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNacimiento.getDate())) {
    edad--;
  }

  return edad;
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

function calcularTMB(peso, altura, edad, sexo) {
  if (sexo === 'mujer') {
    return 10 * peso + 6.25 * altura - 5 * edad - 161;
  } else {
    return 10 * peso + 6.25 * altura - 5 * edad + 5;
  }
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


async function vaciarComida(comidaIndex) {
  const confirmacion = confirm("¿Seguro que quieres vaciar esta comida?");
  if (!confirmacion) return;

  const user = auth.currentUser;
  if (!user) return;

  const fecha = document.getElementById("selector-calendario").value;
  const nombreComida = `comida${comidaIndex}`.trim();
  const alimentosRef = collection(db, `usuarios/${user.uid}/comidas/${fecha}/comidas/${nombreComida}/alimentos`);
  const snapshot = await getDocs(alimentosRef);

  if (snapshot.empty) {
    alert("No hay alimentos para vaciar");
    return;
  }

  cargando(true);

  try {
    const eliminaciones = snapshot.docs.map(doc => eliminarAlimentoDeComida(doc.id, fecha, nombreComida));
    await Promise.all(eliminaciones);
  } catch (e) {
    console.error("Error al vaciar comida:", e);
    alert("Ocurrió un error al vaciar la comida.");
  }

  ultimaComidaEditada = Number(comidaIndex);
  await renderizarComidas();
  cargando(false);
}


window.vaciarComida = vaciarComida;




export { renderizarTablaMedidas, calcularTMB, obtenerFactorActividad, ajustarKcalPorObjetivo, calcularMacros };