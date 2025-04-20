import { auth } from "../scripts/dataBaseManager.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "../index.html";
        return;
    }

 //   console.log("USUARIO CONECTADO:");
 //   console.log("UID:", user.uid);
 //   console.log("Email:", user.email);
 //   console.log("Verificado:", user.emailVerified);
 //   console.log("Nombre:", user.displayName);
 //   console.log("Foto:", user.photoURL);
});