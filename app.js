// --- CONFIGURACIÓN GLOBAL Y ESTADO DE LA APP ---
const API_URL = ""; // Vacío si los archivos PHP están en la misma carpeta
let usuarioActual = null;
let ticketSeleccionadoId = null;
let intervalTickets = null;
let intervalComentarios = null;
let intervalNotificaciones = null;
let calificacionesSeleccionadas = 0;
let tecnicosCache = [];

// --- EFECTO DE FONDO INTERACTIVO (VANTA.JS NET) ---
document.addEventListener("DOMContentLoaded", () => {
    if (typeof VANTA !== 'undefined') {
        VANTA.NET({
            el: "#vanta-bg",
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.00,
            minWidth: 200.00,
            scale: 1.00,
            scaleMobile: 1.00,
            color: 0x00ff41,          // Verde Matrix/Terminal
            backgroundColor: 0x0a0a0a, // Fondo ultra oscuro
            points: 12.00,
            maxDistance: 22.00,
            spacing: 16.00
        });
    }
    inicializarNavegacion();
    inicializarMenuMovil();
    inicializarEncuestas();
});

// --- MENÚ MÓVIL (SIDEBAR RESPONSIVE) ---
function inicializarMenuMovil() {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebar-overlay");
    const btnAbrir = document.getElementById("btn-menu-movil");
    const btnCerrar = document.getElementById("btn-cerrar-sidebar");

    if (!sidebar || !overlay || !btnAbrir || !btnCerrar) return;

    function abrirSidebar() {
        sidebar.classList.add("sidebar-open");
        overlay.classList.add("active");
        btnAbrir.classList.add("hidden");
    }

    function cerrarSidebar() {
        sidebar.classList.remove("sidebar-open");
        overlay.classList.remove("active");
        btnAbrir.classList.remove("hidden");
    }

    btnAbrir.addEventListener("click", abrirSidebar);
    btnCerrar.addEventListener("click", cerrarSidebar);
    overlay.addEventListener("click", cerrarSidebar);

    // Cerrar automáticamente el menú al elegir una sección (en móvil)
    document.querySelectorAll(".nav-item").forEach(btn => {
        btn.addEventListener("click", () => {
            if (window.innerWidth <= 900) cerrarSidebar();
        });
    });
}

// --- MENU DE NAVEGACIÓN ---
function inicializarNavegacion() {
    const navButtons = document.querySelectorAll(".nav-item");
    const tabContents = document.querySelectorAll(".view");

    navButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            navButtons.forEach(b => b.classList.remove("active"));
            tabContents.forEach(c => {
                c.classList.remove("active-view");
                c.classList.add("hidden");
            });

            btn.classList.add("active");
            const target = btn.getAttribute("data-target");
            const targetView = document.getElementById(target);
            targetView.classList.remove("hidden");
            targetView.classList.add("active-view");

            // Recargas específicas al entrar en secciones
            if (target === "vista-faq") cargarFAQs();
            if (target === "vista-inventario") cargarInventario();
            if (target === "vista-metricas") cargarMetricasCompleto();
        });
    });

    // Notificaciones Dropdown Toggle
    const btnNotif = document.getElementById("btn-notificaciones");
    const dropdownNotif = document.getElementById("dropdown-notificaciones");
    btnNotif.addEventListener("click", (e) => {
        e.stopPropagation();
        dropdownNotif.classList.toggle("hidden");
    });

    document.addEventListener("click", () => {
        dropdownNotif.classList.add("hidden");
    });

    dropdownNotif.addEventListener("click", (e) => {
        e.stopPropagation();
    });

    document.getElementById("btn-limpiar-notif").addEventListener("click", limpiarNotificaciones);
}

// --- CALIFICACIÓN POR ESTRELLAS (ENCUESTA) ---
function inicializarEncuestas() {
    const stars = document.querySelectorAll(".estrellas-rating .star");
    stars.forEach(star => {
        star.addEventListener("click", () => {
            const val = parseInt(star.getAttribute("data-value"));
            calificacionesSeleccionadas = val;
            document.getElementById("calificacion-valor").value = val;
            
            // Actualizar interfaz de estrellas
            stars.forEach(s => {
                const sVal = parseInt(s.getAttribute("data-value"));
                if (sVal <= val) {
                    s.classList.add("selected");
                } else {
                    s.classList.remove("selected");
                }
            });
        });
    });

    document.getElementById("btn-enviar-encuesta").addEventListener("click", enviarEncuesta);
}

// --- 1. MANEJO DE AUTENTICACIÓN (LOGIN / LOGOUT) ---
document.getElementById("form-login").addEventListener("submit", async (e) => {
    e.preventDefault();
    const correo = document.getElementById("login-correo").value;
    const contrasena = document.getElementById("login-pas").value;

    try {
        const response = await fetch(`${API_URL}login.php`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ correo, contrasena })
        });
        const data = await response.json();

        if (data.error) {
            alert(data.error);
        } else {
            usuarioActual = data;
            inicializarPanel();
        }
    } catch (error) {
        console.error("Error en login:", error);
    }
});

document.getElementById("btn-logout").addEventListener("click", () => {
    usuarioActual = null;
    ticketSeleccionadoId = null;
    if (intervalTickets) clearInterval(intervalTickets);
    if (intervalComentarios) clearInterval(intervalComentarios);
    if (intervalNotificaciones) clearInterval(intervalNotificaciones);
    document.getElementById("app").classList.add("hidden");
    document.getElementById("seccion-login").classList.remove("hidden");
    document.getElementById("form-login").reset();
});

// --- 2. CONFIGURAR INTERFAZ SEGÚN EL ROL ---
function inicializarPanel() {
    document.getElementById("seccion-login").classList.add("hidden");
    document.getElementById("app").classList.remove("hidden");
    document.getElementById("nombre-usuario").textContent = usuarioActual.nombre;
    document.getElementById("rol-usuario").textContent = usuarioActual.rol;

    // Mostrar/Ocultar elementos del menú según rol
    const staffBtns = document.querySelectorAll(".staff-only");
    const miniDash = document.getElementById("mini-dashboard");
    if (usuarioActual.rol === "Solicitante") {
        document.getElementById("area-crear-ticket").classList.remove("hidden");
        document.getElementById("gestion-ticket-roles").classList.add("hidden");
        document.getElementById("crear-faq-admin").classList.add("hidden");
        document.getElementById("crear-activo-admin").classList.add("hidden");
        staffBtns.forEach(b => b.classList.add("hidden"));
        if (miniDash) miniDash.classList.add("hidden");
    } else {
        document.getElementById("area-crear-ticket").classList.add("hidden");
        document.getElementById("gestion-ticket-roles").classList.remove("hidden");
        document.getElementById("crear-faq-admin").classList.remove("hidden");
        document.getElementById("crear-activo-admin").classList.remove("hidden");
        staffBtns.forEach(b => b.classList.remove("hidden"));
        if (miniDash) miniDash.classList.remove("hidden");

        // Ocultar campo de asignar técnico si es Técnico puro
        const campoAdmin = document.querySelector(".id-admin-only");
        if (usuarioActual.rol === "Técnico") {
            campoAdmin.classList.add("hidden");
        } else {
            campoAdmin.classList.remove("hidden");
        }

        cargarTecnicosParaAsignar();
    }

    // Resetear a la pestaña de tickets
    document.querySelector(".nav-item[data-target='vista-tickets']").click();

    cargarTickets();
    cargarActivosParaTickets();
    cargarNotificaciones();

    // Recargas automáticas periódicas
    if (intervalTickets) clearInterval(intervalTickets);
    intervalTickets = setInterval(cargarTickets, 5000);

    if (intervalNotificaciones) clearInterval(intervalNotificaciones);
    intervalNotificaciones = setInterval(cargarNotificaciones, 5000);
}

// --- 3. CARGAR Y FILTRAR TICKETS ---
async function cargarTickets() {
    const estadoFiltro = document.getElementById("filtro-estado").value;
    const prioridadFiltro = document.getElementById("filtro-prioridad").value;

    try {
        const url = `${API_URL}tickets.php?id_usuario=${usuarioActual.id}&rol=${usuarioActual.rol}&estado=${estadoFiltro}&prioridad=${prioridadFiltro}`;
        const response = await fetch(url);
        const tickets = await response.json();

        // Renderizar la lista de tickets
        const listaTicketsHTML = document.getElementById("lista-tickets");
        listaTicketsHTML.innerHTML = "";
        if (tickets.length === 0) {
            listaTicketsHTML.innerHTML = '<p style="color: var(--text-muted);">No hay tickets disponibles.</p>';
        } else {
            tickets.forEach(ticket => {
                const div = document.createElement("div");
                div.className = "ticket-item";
                
                // Color del borde según el estado
                let colorBorde = "#64748b";
                if(ticket.estado === 'Abierto') colorBorde = "#ef4444";
                if(ticket.estado === 'En Proceso') colorBorde = "#f59e0b";
                if(ticket.estado === 'Resuelto') colorBorde = "#10b981";
                div.style.borderLeftColor = colorBorde;

                // SLA Badge en miniatura
                const slaObj = calcularSLADetallado(ticket);

                div.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <strong>${ticket.titulo}</strong>
                        <span class="badge badge-${ticket.estado.toLowerCase().replace(" ", "")}">${ticket.estado}</span>
                    </div>
                    <p style="font-size:14px; color:var(--text-muted); margin-top:5px;">Cat: ${ticket.categoria} | Prio: ${ticket.prioridad}</p>
                    ${usuarioActual.rol !== "Solicitante" ? `<p style="font-size:12px; color:var(--text-muted);">👤 Abierto por: ${ticket.solicitante}</p>` : ""}
                    <p style="font-size:12px; color:var(--text-muted);">Asignado a: ${ticket.tecnico || 'Sin asignar'}</p>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top: 5px;">
                        <span style="font-size:11px; color:var(--text-muted);">${ticket.activo_nombre ? '💻 ' + ticket.activo_nombre : ''}</span>
                        <span class="sla-badge ${slaObj.clase}" style="font-size:10px; padding: 2px 6px;">${slaObj.texto}</span>
                    </div>
                `;
                div.addEventListener("click", () => verDetalleTicket(ticket));
                listaTicketsHTML.appendChild(div);
            });
        }

        // Actualizar mini-dashboard y pestaña métricas si no es solicitante
        if (usuarioActual.rol !== "Solicitante") {
            const total = tickets.length;
            const abiertos = tickets.filter(t => t.estado === "Abierto").length;
            const proceso = tickets.filter(t => t.estado === "En Proceso").length;
            const resueltos = tickets.filter(t => t.estado === "Resuelto").length;

            // Mini-dashboard (pestaña Tickets)
            const mTotal = document.getElementById("m-total");
            const mAbiertos = document.getElementById("m-abiertos");
            const mProceso = document.getElementById("m-proceso");
            const mResueltos = document.getElementById("m-resueltos");
            if (mTotal) mTotal.textContent = total;
            if (mAbiertos) mAbiertos.textContent = abiertos;
            if (mProceso) mProceso.textContent = proceso;
            if (mResueltos) mResueltos.textContent = resueltos;

            // Dashboard extendido (pestaña Métricas)
            const mtTotal = document.getElementById("mt-total");
            const mtAbiertos = document.getElementById("mt-abiertos");
            const mtProceso = document.getElementById("mt-proceso");
            const mtResueltos = document.getElementById("mt-resueltos");
            if (mtTotal) mtTotal.textContent = total;
            if (mtAbiertos) mtAbiertos.textContent = abiertos;
            if (mtProceso) mtProceso.textContent = proceso;
            if (mtResueltos) mtResueltos.textContent = resueltos;
        }

    } catch (error) {
        console.error("Error al cargar tickets:", error);
    }
}

// Escuchar cambios en los filtros de la lista de tickets
document.getElementById("filtro-estado").addEventListener("change", cargarTickets);
document.getElementById("filtro-prioridad").addEventListener("change", cargarTickets);

// --- 4. CREAR NUEVO TICKET (SOLICITANTE) ---
document.getElementById("form-ticket").addEventListener("submit", async (e) => {
    e.preventDefault();
    const ticketData = {
        titulo: document.getElementById("t-titulo").value,
        descripcion: document.getElementById("t-desc").value,
        categoria: document.getElementById("t-cat").value,
        prioridad: document.getElementById("t-prio").value,
        id_solicitante: usuarioActual.id,
        id_activo: document.getElementById("t-activo").value
    };

    try {
        const response = await fetch(`${API_URL}tickets.php`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(ticketData)
        });
        const data = await response.json();
        if (data.success) {
            alert(data.success);
            document.getElementById("form-ticket").reset();
            cargarTickets();
        } else if (data.error) {
            alert("Error al crear ticket: " + data.error);
        }
    } catch (error) {
        console.error("Error al crear ticket:", error);
        alert("Error de conexión al servidor al crear ticket.");
    }
});

// --- CARGAR TÉCNICOS/ADMIN PARA EL SELECTOR DE ASIGNACIÓN ---
async function cargarTecnicosParaAsignar() {
    try {
        const response = await fetch(`${API_URL}usuarios.php`);
        const usuarios = await response.json();
        if (!Array.isArray(usuarios)) return;
        tecnicosCache = usuarios;

        const select = document.getElementById("asignar-tecnico");
        const valorActual = select.value;
        select.innerHTML = '<option value="">Sin asignar</option>';
        usuarios.forEach(u => {
            const opt = document.createElement("option");
            opt.value = u.id;
            opt.textContent = `${u.nombre} (${u.rol})`;
            select.appendChild(opt);
        });
        select.value = valorActual;
    } catch (error) {
        console.error("Error al cargar técnicos:", error);
    }
}

// --- 5. VER DETALLE DEL TICKET Y COMENTARIOS ---
function verDetalleTicket(ticket) {
    ticketSeleccionadoId = ticket.id;
    document.getElementById("detalle-ticket").classList.remove("hidden");
    document.getElementById("det-titulo").textContent = ticket.titulo;
    document.getElementById("det-desc").textContent = ticket.descripcion;

    // Quién abrió el ticket y técnico asignado (útil para Técnico/Admin)
    const personasInfo = document.getElementById("det-personas");
    personasInfo.textContent = `👤 Solicitante: ${ticket.solicitante} · 🛠️ Técnico asignado: ${ticket.tecnico || 'Sin asignar'}`;
    
    // Activo asignado
    const activoInfo = document.getElementById("det-activo-info");
    if (ticket.activo_nombre) {
        activoInfo.textContent = `💻 Equipo vinculado: ${ticket.activo_nombre}`;
    } else {
        activoInfo.textContent = "";
    }

    // Configurar SLA
    const slaBadge = document.getElementById("det-sla");
    const slaObj = calcularSLADetallado(ticket);
    slaBadge.textContent = slaObj.texto;
    slaBadge.className = `sla-badge ${slaObj.clase}`;

    // Configurar formulario de gestión interna
    document.getElementById("cambiar-estado").value = ticket.estado;
    document.getElementById("asignar-tecnico").value = ticket.id_tecnico_asignado || "";

    // Encuesta de satisfacción si corresponde
    const seccionEncuesta = document.getElementById("seccion-encuesta");
    if (usuarioActual.rol === "Solicitante" && ticket.estado === "Resuelto") {
        seccionEncuesta.classList.remove("hidden");
        // Resetear rating
        calificacionesSeleccionadas = 0;
        document.getElementById("calificacion-valor").value = 0;
        document.getElementById("comentario-encuesta").value = "";
        document.querySelectorAll(".estrellas-rating .star").forEach(s => s.classList.remove("selected"));
    } else {
        seccionEncuesta.classList.add("hidden");
    }

    cargarComentarios();

    if (intervalComentarios) clearInterval(intervalComentarios);
    intervalComentarios = setInterval(cargarComentarios, 5000);
}

// --- 6. CÁLCULO DE SLA ---
function calcularSLADetallado(ticket) {
    if (ticket.estado === 'Resuelto' || ticket.estado === 'Cerrado') {
        return { texto: 'SLA Cumplido', clase: 'sla-ok' };
    }

    // Reglas: Alta = 4h, Media = 24h, Baja = 72h
    const limiteHoras = ticket.prioridad === 'Alta' ? 4 : ticket.prioridad === 'Media' ? 24 : 72;
    const fechaCreacion = new Date(ticket.fecha_creacion.replace(/-/g, "/"));
    const fechaLimite = new Date(fechaCreacion.getTime() + limiteHoras * 60 * 60 * 1000);
    const ahora = new Date();

    const diffMs = fechaLimite - ahora;
    if (diffMs < 0) {
        const horasVencidas = Math.abs(Math.floor(diffMs / (1000 * 60 * 60)));
        return { texto: `SLA Vencido (${horasVencidas}h)`, clase: 'sla-vencido' };
    } else {
        const horasRestantes = Math.floor(diffMs / (1000 * 60 * 60));
        const minutosRestantes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        
        // Si queda menos del 20% del tiempo original, es advertencia
        const esCritico = (diffMs / (limiteHoras * 60 * 60 * 1000)) < 0.2;
        
        return { 
            texto: `Quedan ${horasRestantes}h ${minutosRestantes}m`, 
            clase: esCritico ? 'sla-advertencia' : 'sla-ok' 
        };
    }
}

// --- 7. CARGAR COMENTARIOS ---
async function cargarComentarios() {
    if (!ticketSeleccionadoId) return;
    try {
        const response = await fetch(`${API_URL}comentarios.php?id_ticket=${ticketSeleccionadoId}`);
        const comentarios = await response.json();
        
        const chatBox = document.getElementById("chat-comentarios");
        chatBox.innerHTML = "";

        comentarios.forEach(c => {
            const div = document.createElement("div");
            div.className = "comentario";
            div.innerHTML = `
                <span><strong>${c.autor}</strong> (${c.rol}) - ${c.fecha_creacion}</span>
                <p style="margin-top:5px;">${c.comentario}</p>
            `;
            chatBox.appendChild(div);
        });
        chatBox.scrollTop = chatBox.scrollHeight;
    } catch (error) {
        console.error("Error al cargar comentarios:", error);
    }
}

// --- 8. ACTUALIZAR ESTADO / ASIGNACIÓN ---
document.getElementById("btn-guardar-cambios-ticket").addEventListener("click", async () => {
    const estado = document.getElementById("cambiar-estado").value;
    const idTecnicoInput = document.getElementById("asignar-tecnico").value;

    let id_tecnico_asignado;
    if (usuarioActual.rol === "Administrador") {
        // El Admin decide a qué técnico asignar (puede escribir el ID)
        id_tecnico_asignado = idTecnicoInput || null;
    } else if (usuarioActual.rol === "Técnico") {
        // El Técnico que gestiona el ticket queda asignado automáticamente
        id_tecnico_asignado = usuarioActual.id;
    } else {
        id_tecnico_asignado = null;
    }

    const datosActualizar = {
        id_ticket: ticketSeleccionadoId,
        estado: estado,
        id_tecnico_asignado: id_tecnico_asignado
    };

    try {
        const response = await fetch(`${API_URL}tickets.php`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datosActualizar)
        });
        const data = await response.json();
        if (data.success) {
            alert(data.success);
            cargarTickets();
            // Cerrar detalle o refrescar
            document.getElementById("detalle-ticket").classList.add("hidden");
            ticketSeleccionadoId = null;
        }
    } catch (error) {
        console.error("Error al actualizar ticket:", error);
    }
});

document.getElementById("btn-tomar-ticket").addEventListener("click", async () => {
    if (!ticketSeleccionadoId) return;
    try {
        const response = await fetch(`${API_URL}tickets.php`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id_ticket: ticketSeleccionadoId,
                estado: document.getElementById("cambiar-estado").value,
                id_tecnico_asignado: usuarioActual.id
            })
        });
        const data = await response.json();
        if (data.success) {
            document.getElementById("asignar-tecnico").value = usuarioActual.id;
            alert(`Ticket asignado a ${usuarioActual.nombre}`);
            cargarTickets();
        }
    } catch (error) {
        console.error("Error al tomar el ticket:", error);
    }
});

// --- 9. ENVIAR COMENTARIO ---
document.getElementById("form-comentario").addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = document.getElementById("nuevo-comentario");
    const comentario = input.value;

    if (!ticketSeleccionadoId) return;

    try {
        const response = await fetch(`${API_URL}comentarios.php`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id_ticket: ticketSeleccionadoId,
                id_usuario: usuarioActual.id,
                comentario: comentario
            })
        });
        const data = await response.json();
        if (data.success) {
            input.value = "";
            cargarComentarios();
        }
    } catch (error) {
        console.error("Error al enviar comentario:", error);
    }
});

// --- 10. BASE DE CONOCIMIENTOS (FAQ) ---
async function cargarFAQs() {
    const buscar = document.getElementById("buscador-faq").value;
    try {
        const response = await fetch(`${API_URL}faq.php?buscar=${encodeURIComponent(buscar)}`);
        const faqs = await response.json();

        const listaFAQ = document.getElementById("lista-faq");
        listaFAQ.innerHTML = "";

        if (faqs.length === 0) {
            listaFAQ.innerHTML = "<p style='color: var(--text-muted);'>No se encontraron artículos.</p>";
            return;
        }

        faqs.forEach(f => {
            const div = document.createElement("div");
            div.className = "faq-item";
            div.innerHTML = `
                <div class="faq-pregunta">
                    <span>[${f.categoria}] ${f.pregunta}</span>
                    <span>▼</span>
                </div>
                <div class="faq-respuesta hidden">${f.respuesta}</div>
            `;
            // Lógica expandir/colapsar
            div.querySelector(".faq-pregunta").addEventListener("click", () => {
                div.querySelector(".faq-respuesta").classList.toggle("hidden");
            });
            listaFAQ.appendChild(div);
        });
    } catch (error) {
        console.error("Error al cargar FAQ:", error);
    }
}

document.getElementById("buscador-faq").addEventListener("input", cargarFAQs);

document.getElementById("form-faq").addEventListener("submit", async (e) => {
    e.preventDefault();
    const faqData = {
        pregunta: document.getElementById("faq-pregunta").value,
        respuesta: document.getElementById("faq-respuesta").value,
        categoria: document.getElementById("faq-categoria").value
    };

    try {
        const response = await fetch(`${API_URL}faq.php`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(faqData)
        });
        const data = await response.json();
        if (data.success) {
            alert(data.success);
            document.getElementById("form-faq").reset();
            cargarFAQs();
        }
    } catch (error) {
        console.error("Error al crear FAQ:", error);
    }
});

// --- 11. INVENTARIO ---
async function cargarInventario() {
    try {
        const response = await fetch(`${API_URL}inventario.php?id_usuario=${usuarioActual.id}&rol=${usuarioActual.rol}`);
        const items = await response.json();

        const tbody = document.getElementById("tabla-inventario-body");
        tbody.innerHTML = "";

        if (items.length === 0) {
            tbody.innerHTML = "<tr><td colspan='5' style='text-align:center; color:var(--text-muted); padding: 15px;'>No hay equipos registrados.</td></tr>";
            return;
        }

        items.forEach(i => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td style="padding: 10px;">${i.id}</td>
                <td style="padding: 10px; font-weight:bold;">${i.nombre}</td>
                <td style="padding: 10px;">${i.tipo}</td>
                <td style="padding: 10px; font-family: monospace;">${i.numero_serie}</td>
                <td style="padding: 10px; color: var(--verde);">${i.usuario_nombre || 'Sin asignar'}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error("Error al cargar inventario:", error);
    }
}

async function cargarActivosParaTickets() {
    try {
        const response = await fetch(`${API_URL}inventario.php?id_usuario=${usuarioActual.id}&rol=${usuarioActual.rol}`);
        const items = await response.json();

        const select = document.getElementById("t-activo");
        select.innerHTML = '<option value="">Ninguno / No Aplica</option>';

        items.forEach(i => {
            const opt = document.createElement("option");
            opt.value = i.id;
            opt.textContent = `[${i.tipo}] ${i.nombre} - ${i.numero_serie}`;
            select.appendChild(opt);
        });
    } catch (error) {
        console.error("Error al cargar activos:", error);
    }
}

document.getElementById("form-inventario").addEventListener("submit", async (e) => {
    e.preventDefault();
    const activeData = {
        nombre: document.getElementById("inv-nombre").value,
        tipo: document.getElementById("inv-tipo").value,
        numero_serie: document.getElementById("inv-serie").value,
        id_usuario_asignado: document.getElementById("inv-usuario-id").value
    };

    try {
        const response = await fetch(`${API_URL}inventario.php`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(activeData)
        });
        const data = await response.json();
        if (data.success) {
            alert(data.success);
            document.getElementById("form-inventario").reset();
            cargarInventario();
            cargarActivosParaTickets();
        }
    } catch (error) {
        console.error("Error al registrar activo:", error);
    }
});

// --- 12. NOTIFICACIONES ---
async function cargarNotificaciones() {
    if (!usuarioActual) return;
    try {
        const response = await fetch(`${API_URL}notificaciones.php?id_usuario=${usuarioActual.id}`);
        const notificaciones = await response.json();

        const badge = document.getElementById("notif-badge");
        const lista = document.getElementById("lista-notificaciones");
        
        const noLeidas = notificaciones.filter(n => n.leido == 0).length;
        badge.textContent = noLeidas;
        if (noLeidas > 0) {
            badge.classList.remove("hidden");
        } else {
            badge.classList.add("hidden");
        }

        lista.innerHTML = "";
        if (notificaciones.length === 0) {
            lista.innerHTML = "<p style='color: var(--text-muted); font-size:12px; padding:5px;'>Sin notificaciones</p>";
            return;
        }

        notificaciones.forEach(n => {
            const div = document.createElement("div");
            div.className = `notif-item ${n.leido == 0 ? 'no-leida' : ''}`;
            div.innerHTML = `
                <div style="font-weight: 500;">${n.mensaje}</div>
                <div style="font-size: 10px; color: var(--text-muted); margin-top:2px;">${n.fecha_creacion}</div>
            `;
            lista.appendChild(div);
        });
    } catch (error) {
        console.error("Error al cargar notificaciones:", error);
    }
}

async function limpiarNotificaciones() {
    if (!usuarioActual) return;
    try {
        await fetch(`${API_URL}notificaciones.php`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id_usuario: usuarioActual.id })
        });
        cargarNotificaciones();
    } catch (error) {
        console.error("Error al limpiar notificaciones:", error);
    }
}

// --- 13. ENCUESTA DE SATISFACCIÓN (CALIFICAR) ---
async function enviarEncuesta() {
    if (calificacionesSeleccionadas === 0) {
        alert("Por favor selecciona una calificación de 1 a 5 estrellas.");
        return;
    }

    const payload = {
        id_ticket: ticketSeleccionadoId,
        calificacion: calificacionesSeleccionadas,
        comentario: document.getElementById("comentario-encuesta").value
    };

    try {
        const response = await fetch(`${API_URL}encuestas.php`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (data.success) {
            alert(data.success);
            document.getElementById("seccion-encuesta").classList.add("hidden");
            // Marcar ticket como cerrado
            await fetch(`${API_URL}tickets.php`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id_ticket: ticketSeleccionadoId, estado: 'Cerrado' })
            });
            cargarTickets();
            document.getElementById("detalle-ticket").classList.add("hidden");
            ticketSeleccionadoId = null;
        } else {
            alert(data.error);
        }
    } catch (error) {
        console.error("Error al enviar encuesta:", error);
    }
}

// --- 14. REPORTES EXPORTABLES ---
document.getElementById("btn-buscar-reporte").addEventListener("click", cargarReportes);

async function cargarReportes() {
    const fInicio = document.getElementById("rep-fecha-inicio").value;
    const fFin = document.getElementById("rep-fecha-fin").value;
    const estado = document.getElementById("rep-estado").value;
    const prioridad = document.getElementById("rep-prioridad").value;

    try {
        const url = `${API_URL}tickets.php?id_usuario=${usuarioActual.id}&rol=Administrador&estado=${estado}&prioridad=${prioridad}`;
        const response = await fetch(url);
        let tickets = await response.json();

        // Filtrar por fecha en el cliente para mayor simplicidad
        if (fInicio) {
            tickets = tickets.filter(t => new Date(t.fecha_creacion) >= new Date(fInicio + "T00:00:00"));
        }
        if (fFin) {
            tickets = tickets.filter(t => new Date(t.fecha_creacion) <= new Date(fFin + "T23:59:59"));
        }

        const tbody = document.getElementById("tabla-reporte-body");
        tbody.innerHTML = "";

        if (tickets.length === 0) {
            tbody.innerHTML = "<tr><td colspan='8' style='text-align:center; padding:15px; color:var(--text-muted);'>No se encontraron registros.</td></tr>";
            document.getElementById("reporte-chart-card").classList.add("hidden");
            return;
        }

        tickets.forEach(t => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td style="padding:10px;">${t.id}</td>
                <td style="padding:10px; font-weight:bold;">${t.titulo}</td>
                <td style="padding:10px;">${t.categoria}</td>
                <td style="padding:10px;">${t.prioridad}</td>
                <td style="padding:10px;"><span class="badge badge-${t.estado.toLowerCase().replace(" ", "")}">${t.estado}</span></td>
                <td style="padding:10px;">${t.solicitante}</td>
                <td style="padding:10px;">${t.tecnico || 'Sin asignar'}</td>
                <td style="padding:10px; font-size:12px;">${t.fecha_creacion}</td>
            `;
            tbody.appendChild(tr);
        });

        renderGraficoReporte(tickets);

    } catch (error) {
        console.error("Error al cargar reportes:", error);
    }
}

// --- Gráfico de resumen del reporte (por estado) ---
let chartReporte = null;
function renderGraficoReporte(tickets) {
    const estados = ["Abierto", "En Proceso", "Resuelto", "Cerrado"];
    const conteos = estados.map(e => tickets.filter(t => t.estado === e).length);
    const colores = ["#ef4444", "#f59e0b", "#10b981", "#64748b"];

    document.getElementById("reporte-chart-card").classList.remove("hidden");
    const ctx = document.getElementById("chart-reporte").getContext("2d");

    if (chartReporte) chartReporte.destroy();
    chartReporte = new Chart(ctx, {
        type: "bar",
        data: {
            labels: estados,
            datasets: [{ label: "Tickets", data: conteos, backgroundColor: colores }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
        }
    });
}

// Exportar a Excel (Formato CSV)
document.getElementById("btn-exportar-excel").addEventListener("click", () => {
    const table = document.getElementById("tabla-reporte");
    let csv = [];
    const rows = table.querySelectorAll("tr");
    
    for (let i = 0; i < rows.length; i++) {
        const row = [], cols = rows[i].querySelectorAll("td, th");
        
        for (let j = 0; j < cols.length; j++) {
            // Limpiar texto de comas o saltos de línea
            let data = cols[j].innerText.replace(/(\r\n|\n|\r)/gm, "").replace(/(\s\s)/gm, " ");
            data = data.replace(/"/g, '""');
            row.push('"' + data + '"');
        }
        csv.push(row.join(","));
    }
    
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + csv.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Reporte_Tickets_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

// Imprimir / Guardar PDF
document.getElementById("btn-exportar-pdf").addEventListener("click", () => {
    const printContent = document.getElementById("tabla-reporte").outerHTML;
    const win = window.open("", "", "width=900,height=700");
    win.document.write(`
        <html>
        <head>
            <title>Reporte de Tickets - Help Desk</title>
            <style>
                body { font-family: sans-serif; padding: 20px; color: #333; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { padding: 10px; border: 1px solid #ddd; text-align: left; }
                th { background-color: #f2f2f2; }
                h2 { margin-bottom: 5px; }
                .badge { padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; text-transform: uppercase; background:#eee; }
            </style>
        </head>
        <body>
            <h2>Reporte de Historial de Tickets</h2>
            <p>Generado el: ${new Date().toLocaleString()}</p>
            ${printContent}
            <script>
                window.onload = function() { window.print(); window.close(); }
            </script>
        </body>
        </html>
    `);
    win.document.close();
});

// --- 15. METRICAS COMPLETO & ENCUESTAS (SOLO ADMIN/TECH) ---
async function cargarMetricasCompleto() {
    try {
        // Traer todos los tickets para las gráficas (independiente de las encuestas)
        const responseT = await fetch(`${API_URL}tickets.php?id_usuario=${usuarioActual.id}&rol=Administrador&estado=&prioridad=`);
        const ticketsData = await responseT.json();
        if (Array.isArray(ticketsData)) {
            renderGraficasMetricas(ticketsData);
        }
    } catch (error) {
        console.error("Error al cargar gráficas de métricas:", error);
    }

    try {
        // Cargar calificación promedio
        const responseE = await fetch(`${API_URL}encuestas.php`);
        const encuestas = await responseE.json();

        const listaEncuestas = document.getElementById("lista-encuestas");
        listaEncuestas.innerHTML = "";

        if (encuestas.length === 0) {
            document.getElementById("m-satisfaccion").textContent = "0.0 ★";
            listaEncuestas.innerHTML = "<p style='color: var(--text-muted);'>No se han recibido encuestas de satisfacción aún.</p>";
            return;
        }

        // Calcular promedio
        const suma = encuestas.reduce((acc, curr) => acc + parseInt(curr.calificacion), 0);
        const prom = (suma / encuestas.length).toFixed(1);
        document.getElementById("m-satisfaccion").textContent = `${prom} ★`;

        encuestas.forEach(e => {
            const div = document.createElement("div");
            div.className = "comentario";
            div.style.borderLeft = "4px solid #f59e0b";
            div.innerHTML = `
                <div style="display:flex; justify-content:space-between;">
                    <strong>${e.solicitante_nombre}</strong>
                    <span style="color:#f59e0b; font-weight:bold;">${"★".repeat(e.calificacion)}</span>
                </div>
                <div style="font-size:12px; color:var(--text-muted); margin-top:2px;">Ticket: ${e.ticket_titulo}</div>
                <p style="margin-top: 5px; font-style: italic;">"${e.comentario || 'Sin comentarios'}"</p>
            `;
            listaEncuestas.appendChild(div);
        });
    } catch (error) {
        console.error("Error al cargar métricas y encuestas:", error);
    }
}

// --- Gráficas del Dashboard de Métricas ---
let chartEstado = null;
let chartCategoria = null;
let chartTecnico = null;

function renderGraficasMetricas(tickets) {
    // Por Estado (doughnut)
    const estados = ["Abierto", "En Proceso", "Resuelto", "Cerrado"];
    const conteoEstados = estados.map(e => tickets.filter(t => t.estado === e).length);
    const ctxEstado = document.getElementById("chart-estado").getContext("2d");
    if (chartEstado) chartEstado.destroy();
    chartEstado = new Chart(ctxEstado, {
        type: "doughnut",
        data: {
            labels: estados,
            datasets: [{ data: conteoEstados, backgroundColor: ["#ef4444", "#f59e0b", "#10b981", "#64748b"] }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom", labels: { color: "#e6edf3" } } } }
    });

    // Por Categoría (doughnut)
    const categorias = ["Hardware", "Software", "Red", "Otros"];
    const conteoCategorias = categorias.map(c => tickets.filter(t => t.categoria === c).length);
    const ctxCategoria = document.getElementById("chart-categoria").getContext("2d");
    if (chartCategoria) chartCategoria.destroy();
    chartCategoria = new Chart(ctxCategoria, {
        type: "doughnut",
        data: {
            labels: categorias,
            datasets: [{ data: conteoCategorias, backgroundColor: ["#3b82f6", "#8b5cf6", "#f59e0b"] }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom", labels: { color: "#e6edf3" } } } }
    });

    // Carga de trabajo por Técnico (barras horizontales)
    const nombresTecnicos = [...new Set(tickets.map(t => t.tecnico || "Sin asignar"))];
    const conteoTecnicos = nombresTecnicos.map(nombre =>
        tickets.filter(t => (t.tecnico || "Sin asignar") === nombre).length
    );
    const ctxTecnico = document.getElementById("chart-tecnico").getContext("2d");
    if (chartTecnico) chartTecnico.destroy();
    chartTecnico = new Chart(ctxTecnico, {
        type: "bar",
        data: {
            labels: nombresTecnicos,
            datasets: [{ label: "Tickets asignados", data: conteoTecnicos, backgroundColor: "#00ff41" }]
        },
        options: {
            indexAxis: "y",
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { beginAtZero: true, ticks: { precision: 0, color: "#e6edf3" } },
                y: { ticks: { color: "#e6edf3" } }
            }
        }
    });
}