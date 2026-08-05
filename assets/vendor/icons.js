/**
 * Local SVG icon renderer for TelegramHN.
 * Keeps the site independent from third-party icon CDNs.
 */
"use strict";

(() => {
    const ICONOS = Object.freeze({
        "send": '<path d="m22 2-7 20-4-9-9-4Z"></path><path d="M22 2 11 13"></path>',
        "search": '<circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path>',
        "x": '<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>',
        "alert-circle": '<circle cx="12" cy="12" r="10"></circle><path d="M12 8v4"></path><path d="M12 16h.01"></path>',
        "folder-plus": '<path d="M12 10v6"></path><path d="M9 13h6"></path><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"></path>',
        "shield-alert": '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.68-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path><path d="M12 8v4"></path><path d="M12 16h.01"></path>'
    });

    function crearIcono(elemento) {
        const nombre = elemento.getAttribute("data-lucide");
        const contenido = ICONOS[nombre];
        if (!contenido) return;

        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        for (const atributo of elemento.attributes) {
            if (atributo.name !== "data-lucide") {
                svg.setAttribute(atributo.name, atributo.value);
            }
        }
        svg.setAttribute("viewBox", "0 0 24 24");
        svg.setAttribute("fill", "none");
        svg.setAttribute("stroke", "currentColor");
        svg.setAttribute("stroke-width", "2");
        svg.setAttribute("stroke-linecap", "round");
        svg.setAttribute("stroke-linejoin", "round");
        svg.setAttribute("focusable", "false");
        svg.innerHTML = contenido;
        elemento.replaceWith(svg);
    }

    window.lucide = Object.freeze({
        createIcons() {
            document.querySelectorAll("[data-lucide]").forEach(crearIcono);
        }
    });
})();
