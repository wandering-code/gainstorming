function toggleMenu() {
    const menu = document.getElementById("menuOpciones");
    menu.classList.toggle("activo");
}

// Cierra el menú si haces clic fuera
window.addEventListener("click", (e) => {
    const menu = document.getElementById("menuOpciones");
    const boton = document.querySelector(".boton-principal");

    if (!menu.contains(e.target) && !boton.contains(e.target)) {
        menu.classList.remove("activo");
    }
});

function changeView(id, button) {
    document.querySelectorAll('.vista').forEach(el => {
        if (el.id === id) {
          el.classList.remove('oculto');
          document.getElementById("nombreSeccion").textContent = button.textContent.trim();
        } else {
          el.classList.add('oculto');
        }
      });

      const menu = document.getElementById("menuOpciones");
      menu.classList.remove("activo");
}