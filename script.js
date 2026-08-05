/**
 * Telegram Hub Honduras
 * Lógica estática para GitHub Pages, sin frameworks ni dependencias de servidor.
 */

"use strict";

const CLAVE_EDAD = "age_verified_hn";
const URL_IMAGEN_LOCAL = (slug) => `./assets/images/perfiles/${encodeURIComponent(slug)}/portada.webp`;
const IMAGEN_RESPALDO_FALLBACK = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='500' height='700' viewBox='0 0 500 700'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop stop-color='%23141620'/%3E%3Cstop offset='1' stop-color='%230a0b10'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='500' height='700' fill='url(%23g)'/%3E%3Ccircle cx='250' cy='280' r='78' fill='%23252a38'/%3E%3Cpath d='M105 590c20-112 95-170 145-170s125 58 145 170' fill='%23252a38'/%3E%3Ctext x='250' y='650' text-anchor='middle' fill='%239ca3af' font-family='Arial,sans-serif' font-size='24'%3EImagen no disponible%3C/text%3E%3C/svg%3E";

const ORDEN_PERFILES = Object.freeze([
    "Soy Loruga",
    "La Tortuga HN",
    "La Queso",
    "La Condesa",
    "Desire Garcia",
    "Soy Nayensy",
    "Mi Flaca",
    "Fanny Cruz",
    "Sarca Biker",
    "Mary Guerra",
    "Sofia Pineda",
    "Paty Guzman",
    "Mia Millón",
    "Nala Rodríguez",
    "Vanessa Barahona",
    "Vanessa Yuri",
    "Sindy Lopez",
    "Yaritza Lopez",
    "Cesia Díaz",
    "La Niche",
    "Majo Ramirez",
    "Dany Villalobos",
    "Jelen Santos",
    "Luz Rodriguez",
    "Angie Carolina",
    "YOLY",
    "Yolanny Hernandez",
    "Desire Paz",
    "Andy Flores",
    "Desire Diaz",
    "Zamy Gaibor",
    "Dary Castañeda",
    "Jassmin Abrego",
    "Rubi Sandoval",
    "Meylin Cardenas",
    "Brisna Reyes",
    "Kensy Solis",
    "Lopez Herrera",
    "Misaela Castejón",
    "Step Reyes",
    "Yanny Fonseca",
    "Gabriela Rivas",
    "Lizeth Rodriguez",
    "Aline Fonseca",
    "Katherin Cota",
    "Daniella Cadenas",
    "Valeria Aguilar",
    "Ximena Alcalá",
    "Mellissa Anariba",
    "Lennis Garcia",
    "Bessy Mejia"
]);

const ORDEN_PERFILES_NORMALIZADO = ORDEN_PERFILES.map((nombre) => normalizarTexto(nombre));


const CANALES_DATOS = Object.freeze([
    { id: 1, nombre: "Brisna Reyes", imagen: "brisna-reyes", enlace: "https://t.me/+C2dX4D28U244ZDZh" },
    { id: 2, nombre: "Kensy Solis", imagen: "kensy-solis", enlace: "https://t.me/+rtSZIUKSkVBlNzIx" },
    { id: 3, nombre: "Valeria Aguilar", imagen: "valeria-aguilar", enlace: "https://t.me/+A0xn0NVjVuRjNjYx" },
    { id: 4, nombre: "Desire Diaz", imagen: "desire-diaz", enlace: "https://t.me/+MmIkwb1PoMk0Nzgx" },
    { id: 5, nombre: "Step Reyes", imagen: "step-reyes", enlace: "https://t.me/+H_am9c5lam00ZDgx" },
    { id: 6, nombre: "La Niche", imagen: "la-niche", enlace: "https://t.me/+SrhaczXTjJs2ZmFh" },
    { id: 7, nombre: "Jelen Santos", imagen: "jelen-santos", enlace: "https://t.me/+0EZ6euY5wYE2MWQx" },
    { id: 8, nombre: "Meylin Cardenas", imagen: "meylin-cardenas", enlace: "https://t.me/+2P1Wb7MxgMxlNzIx" },
    { id: 9, nombre: "Mary Guerra", imagen: "mary-guerra", enlace: "https://t.me/+fo_lHhph4iRmYzMx" },
    { id: 10, nombre: "Jassmin Abrego", imagen: "jassmin-abrego", enlace: "https://t.me/+k_FlZQM4ZQA4MjQx" },
    { id: 11, nombre: "Zamy Gaibor", imagen: "zamy-gaibor", enlace: "https://t.me/+2xvJ4qhEhwpjMWMx" },
    { id: 12, nombre: "Lopez Herrera", imagen: "lopez-herrera", enlace: "https://t.me/+U95RBZL1x5wxMmYx" },
    { id: 13, nombre: "Yanny Fonseca", imagen: "yanny-fonseca", enlace: "https://t.me/+fX9BmUO3vL00YTMx" },
    { id: 14, nombre: "Sofia Pineda", imagen: "sofia-pineda", enlace: "https://t.me/+WcHgGCPPa4gyY2Q5" },
    { id: 15, nombre: "Mia Millón", imagen: "mia-millon", enlace: "https://t.me/+1blGKmu2rLo3N2Vh" },
    { id: 16, nombre: "Mi Flaca", imagen: "mi-flaca", enlace: "https://t.me/+Lrd-I_FoJPEzMjIx" },
    { id: 17, nombre: "Vanessa Barahona", imagen: "vanessa-barahona", enlace: "https://t.me/+Z0-IqDIG3gBlMGUx" },
    { id: 18, nombre: "Sindy Lopez", imagen: "sindy-lopez", enlace: "https://t.me/+A6hV7VDZ4hJhZGEx" },
    { id: 19, nombre: "Nala Rodríguez", imagen: "nala-rodriguez", enlace: "https://t.me/+uKhpzIQ4IjFjZDgx" },
    { id: 20, nombre: "Gabriela Rivas", imagen: "gabriela-rivas", enlace: "https://t.me/+8fTN-OJqrgYwNmRh" },
    { id: 21, nombre: "Rubi Sandoval", imagen: "rubi-sandoval", enlace: "https://t.me/+enJWVflmbg0yMzUx" },
    { id: 22, nombre: "Daniella Cadenas", imagen: "daniella-cadenas", enlace: "https://t.me/+b58aNVWYD4djOGYx" },
    { id: 23, nombre: "Luz Rodriguez", imagen: "luz-rodriguez", enlace: "https://t.me/+ptgVgP-KahkyNGIx" },
    { id: 24, nombre: "Yaritza Lopez", imagen: "yaritza-lopez", enlace: "https://t.me/+O2Wn0aKMC8MzZWEx" },
    { id: 25, nombre: "Desire Garcia", imagen: "desire-garcia", enlace: "https://t.me/+Pb8EX6-bmNRhMjcx" },
    { id: 26, nombre: "Majo Ramirez", imagen: "majo-ramirez", enlace: "https://t.me/+yyO2gTTDgWU1NDEx" },
    { id: 27, nombre: "La Queso", imagen: "la-queso", enlace: "https://t.me/+h07etPuE9poxMjAx" },
    { id: 28, nombre: "Andy Flores", imagen: "andy-flores", enlace: "https://t.me/+Ys4csoNCypU3MWMx" },
    { id: 29, nombre: "Vanessa Yuri", imagen: "vanessa-yuri", enlace: "https://t.me/+2WVL_7Q4igEzY2Qx" },
    { id: 30, nombre: "La Condesa", imagen: "la-condesa", enlace: "https://t.me/+g86KLMXR7As5MThh" },
    { id: 31, nombre: "Cesia Díaz", imagen: "cesia-diaz", enlace: "https://t.me/+8PH4QKXiA_o0MWYx" },
    { id: 32, nombre: "Soy Nayensy", imagen: "soy-nayensy", enlace: "https://t.me/+txryRi0jpUdmNjhh" },
    { id: 33, nombre: "Dany Villalobos", imagen: "dany-villalobos", enlace: "https://t.me/+E5zPP4HjaDExYmMx" },
    { id: 34, nombre: "Soy Loruga", imagen: "soy-loruga", enlace: "https://t.me/+A3yqEaK9tZdmNWZh" },
    { id: 35, nombre: "Fanny Cruz", imagen: "fanny-cruz", enlace: "https://t.me/+sjPLsn8kedwzNjBh" },
    { id: 36, nombre: "Sarca Biker", imagen: "sarca-biker", enlace: "https://t.me/+ylPRFibcisRhNzJh" },
    { id: 37, nombre: "Dary Castañeda", imagen: "dary-castaneda", enlace: "https://t.me/+Oh4JUJ1tvks3YjUx" },
    { id: 38, nombre: "Misaela Castejón", imagen: "misaela-castejon", enlace: "https://t.me/+l2iw7ku8t7BkY2Nh" },
    { id: 39, nombre: "Katherin Cota", imagen: "katherin-cota", enlace: "https://t.me/+2qFAw0Noo_VlNjIx" },
    { id: 40, nombre: "Aline Fonseca", imagen: "aline-fonseca", enlace: "https://t.me/+hXHxTt_OsiFhNzYx" },
    { id: 41, nombre: "Ximena Alcalá", imagen: "ximena-alcala", enlace: "https://t.me/+fPbKcMqMQsM1MDEx" },
    { id: 42, nombre: "Lizeth Rodriguez", imagen: "lizeth-rodriguez", enlace: "https://t.me/+ODIHEY8jnDZhM2Jh" },
    { id: 43, nombre: "Mellissa Anariba", imagen: "mellissa-anariba", enlace: "https://t.me/+0vLZNBBpSRVhZjA5" },
    { id: 44, nombre: "Lennis Garcia", imagen: "lennis-garcia", enlace: "https://t.me/+0bsZh4s-0W4wOTgx" },
    { id: 45, nombre: "Desire Paz", imagen: "desire-paz", enlace: "https://t.me/+J73qtFC3PiVjODFh" },
    { id: 46, nombre: "Bessy Mejia", imagen: "bessy-mejia", enlace: "https://t.me/+2oUJhsslqu4wOTEx" },
    { id: 47, nombre: "La Tortuga HN", imagen: "la-tortuga-hn", enlace: "https://t.me/+TV3S6RWBwXRkNzFh" },
    { id: 48, nombre: "YOLY", imagen: "yoly", enlace: "https://t.me/+woE4hbjwEBw1YjNh" },
    { id: 49, nombre: "Yolanny Hernandez", imagen: "yolanny-hernandez", enlace: "https://t.me/+IvsLaFrlBgBmZTkx" },
    { id: 50, nombre: "Paty Guzman", imagen: "paty-guzman", enlace: "https://t.me/+0kdYx40dmbFkZjZh" },
    { id: 51, nombre: "Angie Carolina", imagen: "angie-carolina", enlace: "https://t.me/+feMLwBRugUVjMTUx" }
]);

const TEXTOS_LEGALES_FOOTER = Object.freeze({
    terminos: `<h3>1. Aceptación de condiciones</h3><p>Al navegar por este directorio informativo, el visitante acepta los presentes términos de uso. Si no está de acuerdo con ellos, debe interrumpir la navegación.</p><h3>2. Propósito del portal</h3><p>Este sitio funciona como un directorio independiente para facilitar la localización de canales disponibles en Telegram.</p><h3>3. Imágenes de portada</h3><p>El sitio almacena únicamente imágenes de portada utilizadas para identificar visualmente los perfiles. No aloja videos, publicaciones, archivos ni el contenido interno de los canales de Telegram.</p><h3>4. Responsabilidad del visitante</h3><p>El uso de los enlaces y las interacciones dentro de la plataforma de destino son responsabilidad exclusiva de cada visitante.</p>`,
    privacidad: `<h3>Política de privacidad</h3><p>Este portal estático no solicita nombres, correos electrónicos, números telefónicos, pagos ni otros datos personales mediante formularios o bases de datos.</p><p>Se utiliza únicamente localStorage para recordar si el visitante confirmó ser mayor de edad.</p><p>Las imágenes, los iconos, los estilos y los scripts principales se cargan desde los archivos locales del propio sitio. No se utilizan herramientas propias de analítica, publicidad ni seguimiento.</p><p>El alojamiento de GitHub Pages y Telegram mantienen sus propias políticas y pueden procesar datos técnicos necesarios para prestar sus servicios.</p>`,
    mayoridad: `<h3>Aviso de edad 18+</h3><p>Los canales organizados en este directorio están dirigidos exclusivamente a personas adultas.</p><p>Queda prohibido el ingreso de menores de edad. Los enlaces pueden retirarse ante reportes válidos de contenido no autorizado.</p>`,
    reportar: `<h3>Reportar contenido</h3><p>Para reportar un enlace roto, contenido no autorizado o cualquier problema relacionado con un perfil, comunícate mediante nuestro canal oficial de soporte.</p><p>Incluye el nombre del perfil, el enlace relacionado, el motivo del reporte y capturas o evidencia cuando corresponda.</p><a class="btn-soporte-telegram" href="https://t.me/SoporteTelegramHN" target="_blank" rel="noopener noreferrer">Abrir Soporte TelegramHN</a>`,
    eliminacion: `<h3>Solicitar eliminación</h3><p>El titular de una fotografía, nombre, perfil o enlace puede solicitar su revisión y eliminación mediante el canal oficial de soporte.</p><p>Incluye el nombre del perfil, el enlace relacionado, el motivo de la solicitud y evidencia que permita verificarla cuando corresponda.</p><a class="btn-soporte-telegram" href="https://t.me/SoporteTelegramHN" target="_blank" rel="noopener noreferrer">Solicitar eliminación en Telegram</a>`,
    contacto: `<h3>Contacto</h3><p>Para consultas administrativas, soporte, reportes o solicitudes de eliminación, utiliza el canal oficial Soporte TelegramHN.</p><a class="btn-soporte-telegram" href="https://t.me/SoporteTelegramHN" target="_blank" rel="noopener noreferrer">Contactar por Telegram</a>`
});

const SELECTORES_FOCO = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])"
].join(",");

let canalSeleccionadoTelegram = null;
let busquedaFiltroTexto = "";
let debounceTimerId = null;
let modalActivo = null;
let elementoFocoAnterior = null;

function obtenerElemento(id) {
    return document.getElementById(id);
}

function normalizarTexto(texto) {
    return String(texto ?? "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}


function obtenerIndiceOrden(nombreNormalizado) {
    const indice = ORDEN_PERFILES_NORMALIZADO.indexOf(nombreNormalizado);
    return indice === -1 ? Number.MAX_SAFE_INTEGER : indice;
}

function ordenarCanales(listaCanales) {
    return [...listaCanales].sort((canalA, canalB) => {
        const indiceA = obtenerIndiceOrden(normalizarTexto(canalA.nombre));
        const indiceB = obtenerIndiceOrden(normalizarTexto(canalB.nombre));

        if (indiceA !== indiceB) return indiceA - indiceB;
        return canalA.id - canalB.id;
    });
}

function actualizarIconos() {
    if (window.lucide && typeof window.lucide.createIcons === "function") {
        window.lucide.createIcons();
    }
}

function actualizarAñoFooter() {
    const elemento = obtenerElemento("auto-year");
    if (elemento) elemento.textContent = String(new Date().getFullYear());
}

function comprobarEdadConfirmada() {
    try {
        return localStorage.getItem(CLAVE_EDAD) === "true";
    } catch (error) {
        console.warn("No se pudo consultar la verificación de edad en localStorage.", error);
        return false;
    }
}

function guardarEdadConfirmada() {
    try {
        localStorage.setItem(CLAVE_EDAD, "true");
    } catch (error) {
        console.warn("No se pudo guardar la verificación de edad en localStorage.", error);
    }
}

function bloquearFondoPorEdad(bloquear) {
    document.documentElement.classList.toggle("edad-bloqueada", bloquear);
    document.body.classList.toggle("edad-bloqueada", bloquear);
}

function mostrarModalEdad() {
    const modal = obtenerElemento("modal-interceptor-edad");
    if (!modal) return;

    modal.classList.remove("oculto");
    modal.setAttribute("aria-hidden", "false");
    bloquearFondoPorEdad(true);

    requestAnimationFrame(() => {
        obtenerElemento("btn-age-gate-confirmar")?.focus({ preventScroll: true });
    });
}

function ocultarModalEdad() {
    const modal = obtenerElemento("modal-interceptor-edad");
    if (!modal) return;

    modal.classList.add("oculto");
    modal.setAttribute("aria-hidden", "true");
    bloquearFondoPorEdad(false);
}

function inicializarControlEdad() {
    if (comprobarEdadConfirmada()) {
        ocultarModalEdad();
    } else {
        mostrarModalEdad();
    }

    obtenerElemento("btn-age-gate-confirmar")?.addEventListener("click", () => {
        guardarEdadConfirmada();
        ocultarModalEdad();
    });

    obtenerElemento("btn-age-gate-salir")?.addEventListener("click", () => {
        window.location.replace("https://www.google.com/");
    });
}

function bloquearFondoPorModal(bloquear) {
    document.documentElement.classList.toggle("modal-abierto", bloquear);
    document.body.classList.toggle("modal-abierto", bloquear);
}

function abrirModal(modal, focoInicial = null) {
    if (!modal) return;

    elementoFocoAnterior = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    modalActivo = modal;
    modal.classList.remove("oculto");
    modal.setAttribute("aria-hidden", "false");
    bloquearFondoPorModal(true);

    requestAnimationFrame(() => {
        const destino = focoInicial || modal.querySelector(SELECTORES_FOCO) || modal.querySelector(".modal-box-glass");
        destino?.focus({ preventScroll: true });
    });
}

function cerrarModal(modal, restaurarFoco = true) {
    if (!modal || modal.classList.contains("oculto")) return;

    modal.classList.add("oculto");
    modal.setAttribute("aria-hidden", "true");

    if (modalActivo === modal) modalActivo = null;
    bloquearFondoPorModal(Boolean(document.querySelector(".modal-backdrop-sistema:not(.oculto):not(.age-gate-blocker)")));

    if (restaurarFoco && elementoFocoAnterior?.isConnected) {
        elementoFocoAnterior.focus({ preventScroll: true });
    }
    elementoFocoAnterior = null;
}

function controlarFocoModal(event) {
    if (event.key !== "Tab" || !modalActivo) return;

    const elementos = Array.from(modalActivo.querySelectorAll(SELECTORES_FOCO)).filter((elemento) => {
        return elemento instanceof HTMLElement && elemento.offsetParent !== null;
    });

    if (elementos.length === 0) {
        event.preventDefault();
        modalActivo.querySelector(".modal-box-glass")?.focus();
        return;
    }

    const primero = elementos[0];
    const ultimo = elementos[elementos.length - 1];

    if (event.shiftKey && document.activeElement === primero) {
        event.preventDefault();
        ultimo.focus();
    } else if (!event.shiftKey && document.activeElement === ultimo) {
        event.preventDefault();
        primero.focus();
    }
}

function crearTarjetaCanal(canal) {
    const tarjeta = document.createElement("article");
    tarjeta.className = "tarjeta-canal";

    const contenedorFoto = document.createElement("div");
    contenedorFoto.className = "contenedor-foto imagen-protegida";

    const imagen = document.createElement("img");
    imagen.src = canal.imagen ? URL_IMAGEN_LOCAL(canal.imagen) : IMAGEN_RESPALDO_FALLBACK;
    imagen.alt = `Fotografía de portada de ${canal.nombre}`;
    imagen.loading = canal.id <= 4 ? "eager" : "lazy";
    imagen.decoding = "async";
    imagen.width = 500;
    imagen.height = 700;
    imagen.draggable = false;
    imagen.referrerPolicy = "no-referrer";
    imagen.addEventListener("error", () => {
        if (imagen.src !== IMAGEN_RESPALDO_FALLBACK) {
            imagen.src = IMAGEN_RESPALDO_FALLBACK;
            imagen.alt = `Imagen no disponible para ${canal.nombre}`;
        }
    }, { once: true });

    const capaProteccion = document.createElement("div");
    capaProteccion.className = "capa-proteccion-imagen";
    capaProteccion.setAttribute("aria-hidden", "true");

    const wrapperBadges = document.createElement("div");
    wrapperBadges.className = "wrapper-badges-tarjeta";

    const badgeDestacado = document.createElement("div");
    badgeDestacado.className = "badge-destacado";
    badgeDestacado.textContent = "MÁS BUSCADA 🔥";
    wrapperBadges.appendChild(badgeDestacado);

    contenedorFoto.append(imagen, capaProteccion, wrapperBadges);

    const cuerpo = document.createElement("div");
    cuerpo.className = "info-cuerpo-tarjeta";

    const titulo = document.createElement("h2");
    titulo.className = "titulo-canal";

    const textoTitulo = document.createElement("span");
    textoTitulo.textContent = canal.nombre;

    const iconoVerificado = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    iconoVerificado.setAttribute("class", "icono-verificado-titulo");
    iconoVerificado.setAttribute("viewBox", "0 0 24 24");
    iconoVerificado.setAttribute("aria-hidden", "true");
    iconoVerificado.setAttribute("focusable", "false");

    const iconoPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    iconoPath.setAttribute("fill", "currentColor");
    iconoPath.setAttribute("d", "M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm4.3 7.6-5.2 6a1 1 0 0 1-1.5.1l-2.4-2.4a1 1 0 1 1 1.4-1.4l1.6 1.6 4.5-5.3a1 1 0 0 1 1.6 1.4z");
    iconoVerificado.appendChild(iconoPath);
    titulo.append(textoTitulo, iconoVerificado);

    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "btn-telegram-canal";
    boton.dataset.canalId = String(canal.id);
    boton.disabled = !canal.enlace;
    boton.setAttribute(
        "aria-label",
        canal.enlace
            ? `Unirse al canal de Telegram de ${canal.nombre}`
            : `Enlace de Telegram pendiente para ${canal.nombre}`
    );

    const icono = document.createElement("i");
    icono.setAttribute("data-lucide", "send");
    icono.setAttribute("aria-hidden", "true");

    const textoBoton = document.createElement("span");
    textoBoton.textContent = "Unirse al canal de Telegram";

    boton.append(icono, textoBoton);
    cuerpo.append(titulo, boton);
    tarjeta.append(contenedorFoto, cuerpo);

    return tarjeta;
}

function renderizarCanales(listaCanales) {
    const grid = obtenerElemento("grid-canales");
    const contador = obtenerElemento("contador-canales");
    const estadoVacio = obtenerElemento("estado-vacio");

    if (!grid) return;

    grid.replaceChildren();

    if (listaCanales.length === 0) {
        const titulo = obtenerElemento("estado-vacio-titulo");
        const subtexto = obtenerElemento("estado-vacio-subtexto");
        const boton = obtenerElemento("btn-limpiar-busqueda-vacio");

        if (titulo) titulo.textContent = "No encontramos canales que coincidan con tu búsqueda.";
        if (subtexto) subtexto.textContent = "Prueba escribiendo otro nombre o revisa la ortografía.";
        if (boton) boton.textContent = "Limpiar búsqueda";

        estadoVacio?.classList.remove("oculto");
        if (contador) contador.textContent = "0 canales disponibles.";
        actualizarIconos();
        return;
    }

    estadoVacio?.classList.add("oculto");

    const fragmento = document.createDocumentFragment();
    listaCanales.forEach((canal) => fragmento.appendChild(crearTarjetaCanal(canal)));
    grid.appendChild(fragmento);

    if (contador) {
        contador.textContent = `${listaCanales.length} ${listaCanales.length === 1 ? "canal disponible" : "canales disponibles"} en el directorio de Honduras.`;
    }

    actualizarIconos();
}

function filtrarYProcesarCanales() {
    try {
        const canalesFiltrados = CANALES_DATOS.filter((canal) => {
            return normalizarTexto(canal.nombre).includes(busquedaFiltroTexto);
        });

        renderizarCanales(ordenarCanales(canalesFiltrados));
    } catch (error) {
        console.error("No se pudo procesar el listado de canales.", error);
        desplegarPantallaErrorSistema();
    }
}

function limpiarBusquedaYMostrarTodos() {
    const input = obtenerElemento("buscador-input");
    const botonLimpiar = obtenerElemento("btn-clear-input");

    if (input) input.value = "";
    botonLimpiar?.classList.add("oculto");
    busquedaFiltroTexto = "";
    filtrarYProcesarCanales();
}

function abrirModalConfirmacionTelegram(idCanal) {
    const canal = CANALES_DATOS.find((elemento) => elemento.id === idCanal);
    if (!canal) return;

    canalSeleccionadoTelegram = canal;

    const nombre = obtenerElemento("dinamico-modal-canal-name");
    const mensaje = obtenerElemento("dinamico-modal-canal-msg");
    const modal = obtenerElemento("modal-confirmacion-telegram");

    if (nombre) nombre.textContent = `Canal privado de ${canal.nombre}`;
    if (mensaje) {
        mensaje.textContent = `Estás a punto de abrir el canal privado de Telegram de ${canal.nombre}. Presiona continuar para abrirlo en la aplicación o en Telegram Web.`;
    }

    abrirModal(modal, obtenerElemento("btn-modal-confirmar-telegram"));
}

function cerrarModalTelegram() {
    cerrarModal(obtenerElemento("modal-confirmacion-telegram"));
    canalSeleccionadoTelegram = null;
}

function continuarAlCanalTelegram() {
    const canal = canalSeleccionadoTelegram;
    if (!canal?.enlace) return;

    const enlace = document.createElement("a");
    enlace.href = canal.enlace;
    enlace.target = "_blank";
    enlace.rel = "noopener noreferrer";
    enlace.style.display = "none";
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();

    cerrarModalTelegram();
}

function abrirModalTextosLegalesFooter(claveLegal) {
    const modal = obtenerElemento("modal-textos-legales-footer");
    const titulo = obtenerElemento("modal-titulo-legal");
    const cuerpo = obtenerElemento("modal-cuerpo-legal-dinamico");

    if (!modal || !titulo || !cuerpo) return;

    const titulos = {
        terminos: "Términos y condiciones",
        privacidad: "Política de privacidad",
        mayoridad: "Aviso para mayores de 18 años",
        reportar: "Reportar contenido",
        eliminacion: "Solicitar eliminación",
        contacto: "Contacto"
    };

    titulo.textContent = titulos[claveLegal] || "Información legal";
    cuerpo.innerHTML = TEXTOS_LEGALES_FOOTER[claveLegal] || "<p>Contenido legal no disponible.</p>";
    cuerpo.scrollTop = 0;

    abrirModal(modal, obtenerElemento("btn-modal-cerrar-legal"));
}

function cerrarModalLegal() {
    cerrarModal(obtenerElemento("modal-textos-legales-footer"));
}

function activarProteccionVisualImagenes() {
    const esZonaProtegida = (objetivo) => {
        return objetivo instanceof Element && Boolean(objetivo.closest(".imagen-protegida"));
    };

    ["contextmenu", "dragstart", "selectstart", "copy"].forEach((tipoEvento) => {
        document.addEventListener(tipoEvento, (event) => {
            if (esZonaProtegida(event.target)) {
                event.preventDefault();
                event.stopPropagation();
            }
        }, { capture: true });
    });

    document.addEventListener("keydown", (event) => {
        const tecla = String(event.key || "").toLowerCase();
        const ctrlOCmd = event.ctrlKey || event.metaKey;
        const atajoGuardarVerImprimir = ctrlOCmd && ["s", "u", "p"].includes(tecla);
        const atajoHerramientas = ctrlOCmd && event.shiftKey && ["i", "j", "c"].includes(tecla);
        const teclaHerramientas = event.key === "F12";

        if (atajoGuardarVerImprimir || atajoHerramientas || teclaHerramientas) {
            event.preventDefault();
            event.stopImmediatePropagation();
        }
    }, { capture: true });
}

function desplegarPantallaErrorSistema() {
    const grid = obtenerElemento("grid-canales");
    const estadoVacio = obtenerElemento("estado-vacio");
    const contador = obtenerElemento("contador-canales");
    const titulo = obtenerElemento("estado-vacio-titulo");
    const subtexto = obtenerElemento("estado-vacio-subtexto");
    const boton = obtenerElemento("btn-limpiar-busqueda-vacio");

    grid?.replaceChildren();
    if (contador) contador.textContent = "No se pudo mostrar el listado.";
    if (titulo) titulo.textContent = "Ocurrió un error al mostrar los canales.";
    if (subtexto) subtexto.textContent = "Presiona el botón para volver a cargar el listado local.";
    if (boton) boton.textContent = "Intentar nuevamente";
    estadoVacio?.classList.remove("oculto");
}

function vincularListenersInterfazCompleta() {
    const inputBuscar = obtenerElemento("buscador-input");
    const botonLimpiarInline = obtenerElemento("btn-clear-input");

    inputBuscar?.addEventListener("input", (event) => {
        clearTimeout(debounceTimerId);

        const valor = event.currentTarget instanceof HTMLInputElement ? event.currentTarget.value : "";
        busquedaFiltroTexto = normalizarTexto(valor);
        botonLimpiarInline?.classList.toggle("oculto", valor.trim().length === 0);

        debounceTimerId = window.setTimeout(filtrarYProcesarCanales, 200);
    });

    inputBuscar?.addEventListener("search", () => {
        busquedaFiltroTexto = normalizarTexto(inputBuscar.value);
        botonLimpiarInline?.classList.toggle("oculto", inputBuscar.value.trim().length === 0);
        filtrarYProcesarCanales();
    });

    botonLimpiarInline?.addEventListener("click", () => {
        if (inputBuscar) inputBuscar.value = "";
        busquedaFiltroTexto = "";
        botonLimpiarInline.classList.add("oculto");
        filtrarYProcesarCanales();
        inputBuscar?.focus();
    });


    obtenerElemento("btn-limpiar-busqueda-vacio")?.addEventListener("click", limpiarBusquedaYMostrarTodos);

    obtenerElemento("grid-canales")?.addEventListener("click", (event) => {
        const objetivo = event.target instanceof Element ? event.target.closest(".btn-telegram-canal") : null;
        if (!(objetivo instanceof HTMLButtonElement)) return;

        const idCanal = Number.parseInt(objetivo.dataset.canalId || "", 10);
        if (Number.isInteger(idCanal)) abrirModalConfirmacionTelegram(idCanal);
    });

    obtenerElemento("btn-modal-cancelar-telegram")?.addEventListener("click", cerrarModalTelegram);
    obtenerElemento("btn-modal-confirmar-telegram")?.addEventListener("click", continuarAlCanalTelegram);
    obtenerElemento("btn-modal-cerrar-legal")?.addEventListener("click", cerrarModalLegal);

    obtenerElemento("modal-confirmacion-telegram")?.addEventListener("click", (event) => {
        if (event.target === event.currentTarget) cerrarModalTelegram();
    });

    obtenerElemento("modal-textos-legales-footer")?.addEventListener("click", (event) => {
        if (event.target === event.currentTarget) cerrarModalLegal();
    });

    document.querySelectorAll(".btn-footer-link").forEach((boton) => {
        boton.addEventListener("click", () => abrirModalTextosLegalesFooter(boton.dataset.modalLegal));
    });

    document.addEventListener("keydown", (event) => {
        controlarFocoModal(event);

        if (event.key !== "Escape") return;

        if (!obtenerElemento("modal-confirmacion-telegram")?.classList.contains("oculto")) {
            cerrarModalTelegram();
        } else if (!obtenerElemento("modal-textos-legales-footer")?.classList.contains("oculto")) {
            cerrarModalLegal();
        }
    });
}

function validarBaseDeDatos() {
    const ids = CANALES_DATOS.map((canal) => canal.id);
    const nombres = CANALES_DATOS.map((canal) => normalizarTexto(canal.nombre));
    const enlaces = CANALES_DATOS.map((canal) => canal.enlace).filter(Boolean);
    const imagenes = CANALES_DATOS.map((canal) => canal.imagen).filter(Boolean);
    const perfilesExcluidos = ["oruga hn", "soy la oruga", "jacky najera", "angie alvarado"];

    const errores = [];

    if (CANALES_DATOS.length !== 51) errores.push(`Se esperaban 51 canales y se encontraron ${CANALES_DATOS.length}.`);
    if (new Set(ids).size !== ids.length) errores.push("Existen IDs duplicados.");
    if (new Set(nombres).size !== nombres.length) errores.push("Existen nombres duplicados.");
    if (new Set(enlaces).size !== enlaces.length) errores.push("Existen enlaces de Telegram duplicados.");
    if (new Set(imagenes).size !== imagenes.length) errores.push("Existen rutas de imagen duplicadas.");
    if (!ids.every((id, indice) => id === indice + 1)) errores.push("Los IDs no están ordenados del 1 al 51.");
    if (!CANALES_DATOS.every((canal) => Boolean(canal.enlace))) errores.push("Todos los perfiles deben tener un enlace de Telegram.");
    if (nombres.some((nombre) => perfilesExcluidos.includes(nombre))) errores.push("Se encontró un perfil excluido dentro de la base de datos.");
    if (!nombres.includes("soy loruga")) errores.push("Falta el perfil válido Soy Loruga.");

    if (errores.length > 0) {
        console.error("Errores detectados en CANALES_DATOS:", errores);
        return false;
    }

    return true;
}

function inicializarAplicacion() {
    actualizarAñoFooter();
    inicializarControlEdad();
    vincularListenersInterfazCompleta();
    activarProteccionVisualImagenes();

    if (validarBaseDeDatos()) {
        filtrarYProcesarCanales();
    } else {
        desplegarPantallaErrorSistema();
    }

    actualizarIconos();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inicializarAplicacion, { once: true });
} else {
    inicializarAplicacion();
}
