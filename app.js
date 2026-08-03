/* ============================================================
   CUBRO · PROTOTIPO NAVEGABLE — app.js
   Capa compartida: datos de demo (SPEC §11), motor de presupuesto,
   lógica de rol (cliente / am), chrome global y toasts.
   ============================================================ */

/* ---------- 1 · utilidades ---------- */

const IVA = 0.21;

/* useGrouping:'always' porque el es-ES no agrupa 4 cifras por defecto (1180)
   y la identidad CUBRO pide siempre punto de miles (1.180 €). */
const eur  = n => new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0, useGrouping: 'always' }).format(Math.round(n)) + ' €';
const pct1 = n => new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 }).format(n * 100) + ' %';
const pct0 = n => new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(n * 100) + ' %';

let toastTimer = null;
function toast(msg, ms = 3000) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('on'), ms);
}

/* Stub: cualquier botón que en el sistema real dispararía otra pieza. */
function stub(msg) { toast(msg); }

/* ---------- 2 · datos de demo (SPEC §11) ---------- */

const DEMO = {
  cliente: {
    nombre: 'Carolina Méndez',
    email: 'carolina.mendez@gmail.com',
    telefono: '+34 655 41 22 09',
    ciudad: 'Madrid',
    perfil: 'Particular'
  },
  am: { nombre: 'Maider Etxebarria', rol: 'Account Manager' },
  de: { nombre: 'Lucía R.', rol: 'Design Expert' },
  tl: { nombre: 'Ignacio' },
  dir: { nombre: 'Alex' },
  deal: {
    id: 'D-4127',
    etapa: 'Presupuestación',
    propietario: 'Maider Etxebarria',
    creado: '12 jul 2026'
  },
  proyecto: {
    nombre: 'Cocina Chamberí',
    ref: 'P-2041',
    direccion: 'C/ Sagunto 14',
    cp: '28010',
    ciudad: 'Madrid',
    barrio: 'Chamberí',
    mercado: 'ES',
    modalidad: 'Full Service'
  },

  /* Base inmutable de cada versión. Los importes son los del §11:
     V3 es canónica y cuadra al euro; V1 y V2 se derivan con las mismas
     reglas del motor (el §11 autoriza ajustarlas para que cuadren).
     `coste` es interno — sólo se usa para el margen del AM. */
  versiones: {
    V1: {
      id: 'V1', fecha: '12 jul', fechaLarga: '12 de julio de 2026',
      autor: 'Carolina, desde Inspo',
      nota: 'Diseñada por la clienta sin acompañamiento. Solo cocina NPD, sin el armario del dormitorio.',
      firmadaDefault: false,
      descuentoDefault: 'ninguno',
      packDefault: 'bosch',
      mobiliario: {
        precio: 13900, coste: 7350,
        elementos: [
          '11 frentes de puerta NPD',
          '3 columnas (horno, despensa, frigorífico integrado)',
          '4 paneles laterales y de remate',
          '7 tapetas y perfiles de unión',
          '4,2 ml de zócalo aluminio negro'
        ]
      },
      estructura: { precio: 890, coste: 820, label: 'Estructura IKEA (Metod) — gestionada por CUBRO' },
      encimera:   { precio: 1980, coste: 1620, label: 'Encimera compacto · 2,4 m² + copete' },
      fg:         { precio: 415, coste: 290, label: 'Fregadero bajo encimera + grifería Schmidt' },
      montaje:    { precio: 1398, coste: 1075, desglose: 'medición 65 + bajos 4,2 ml × 115 + altos 2,6 ml × 155 + paneles 4 × 20 + electros 5 × 40 + 50 km × 2' },
      logistica:  { precio: 395, coste: 345, desglose: 'por peso, 1 origen (Schmidt)' },
      feeGestion: { precio: 275, coste: 170 }
    },
    V2: {
      id: 'V2', fecha: '19 jul', fechaLarga: '19 de julio de 2026',
      autor: 'Maider, tras la videollamada',
      nota: 'Duplicada de V1 en la cuenta de Carolina: se añade el armario PAX del dormitorio, el pack sube a Siemens y la encimera pasa a Dekton cotizado. Nada heredó de V1 — todo se re-seleccionó con toggles.',
      firmadaDefault: false,
      descuentoDefault: 'ninguno',
      packDefault: 'siemens',
      mobiliario: {
        precio: 15630, coste: 8159,
        elementos: [
          '13 frentes de puerta NPD',
          '4 columnas (horno, despensa, frigorífico integrado, escobero)',
          '5 paneles laterales y de remate',
          '8 tapetas y perfiles de unión',
          '4,2 ml de zócalo aluminio negro',
          '1 frente de armario PAX (dormitorio) · 6 puertas'
        ]
      },
      estructura: { precio: 1180, coste: 1085, label: 'Estructura IKEA (Metod + PAX) — gestionada por CUBRO' },
      encimera:   { precio: 2640, coste: 2130, label: 'Dekton cotizado · 2,4 m² + copete' },
      fg:         { precio: 415, coste: 290, label: 'Fregadero bajo encimera + grifería Schmidt' },
      montaje:    { precio: 1779, coste: 1370, desglose: 'medición 65 + bajos 4,2 ml × 115 + altos 3,3 ml × 155 + PAX 1,9 ml × 175 + paneles 5 × 20 + electros 5 × 40 + 50 km × 2' },
      logistica:  { precio: 465, coste: 406, desglose: 'por peso, 2 orígenes (Schmidt + IKEA)' },
      feeGestion: { precio: 275, coste: 170 }
    },
    V3: {
      id: 'V3', fecha: '28 jul', fechaLarga: '28 de julio de 2026',
      autor: 'Maider, ajuste final',
      nota: 'Ajuste final: una columna menos. Se aplica el descuento "Global producto — estándar" (aprobado por Ignacio) y se marca como versión final.',
      firmadaDefault: true,
      descuentoDefault: 'global_std',
      packDefault: 'siemens',
      mobiliario: {
        precio: 14850, coste: 7752,
        elementos: [
          '12 frentes de puerta NPD',
          '3 columnas (horno, despensa, frigorífico integrado)',
          '5 paneles laterales y de remate',
          '8 tapetas y perfiles de unión',
          '4,2 ml de zócalo aluminio negro',
          '1 frente de armario PAX (dormitorio) · 6 puertas'
        ]
      },
      estructura: { precio: 1180, coste: 1085, label: 'Estructura IKEA (Metod + PAX) — gestionada por CUBRO' },
      encimera:   { precio: 2640, coste: 2130, label: 'Dekton cotizado · 2,4 m² + copete' },
      fg:         { precio: 415, coste: 290, label: 'Fregadero bajo encimera + grifería Schmidt' },
      montaje:    { precio: 1664, coste: 1280, desglose: 'medición 65 + bajos 4,2 ml × 115 + altos 2,6 ml × 155 + PAX 1,9 ml × 175 + paneles 4 × 20 + electros 5 × 40 + 50 km × 2' },
      logistica:  { precio: 440, coste: 384, desglose: 'por peso, 2 orígenes (Schmidt + IKEA)' },
      feeGestion: { precio: 275, coste: 170 }
    }
  },

  /* Logística IKEA: informativa, la abona el cliente en IKEA. No suma al total CUBRO. */
  logisticaIkea: { precio: 100 }
};

/* ---------- 3 · catálogos ---------- */

const CATALOGO = {

  /* Selectores globales del hero (SPEC §6.2). Sin swatch de color:
     la identidad prohíbe el color decorativo, así que van en texto. */
  disenos: [
    { id: 'recto',   nombre: 'Recto',   delta: 0 },
    { id: 'moldura', nombre: 'Moldura', delta: 0.018 }
  ],
  acabados: [
    { id: 'smoked',  nombre: 'Smoked Oak',    delta: 0 },
    { id: 'roble',   nombre: 'Roble natural', delta: -0.015 },
    { id: 'salvia',  nombre: 'Verde salvia',  delta: 0.02 },
    { id: 'blanco',  nombre: 'Blanco 01',     delta: -0.02 }
  ],

  /* Packs de electrodomésticos. El cliente ve el pack; el AM ve y edita
     cada aparato con sus alternativas (SPEC §6.6). */
  packs: {
    bosch: {
      id: 'bosch', nombre: 'Bosch Essential',
      aparatos: [
        { slot: 'horno',  nombre: 'Horno Bosch Serie 4 multifunción',      precio: 590, coste: 490,
          alternativas: [{ id: 'h-up', nombre: 'Horno Bosch Serie 6 pirolítico', delta: 260, deltaCoste: 215 }] },
        { slot: 'placa',  nombre: 'Placa de inducción Bosch Serie 4 60 cm', precio: 660, coste: 548,
          alternativas: [{ id: 'p-up', nombre: 'Placa de inducción Bosch Serie 6 80 cm', delta: 290, deltaCoste: 240 }] },
        { slot: 'campana', nombre: 'Campana integrable Bosch Serie 2',      precio: 330, coste: 274,
          alternativas: [{ id: 'c-up', nombre: 'Campana integrable Bosch Serie 4 silenciosa', delta: 180, deltaCoste: 149 }] },
        { slot: 'frigo',  nombre: 'Frigorífico combi Bosch Serie 4 integrable', precio: 760, coste: 631,
          alternativas: [{ id: 'f-up', nombre: 'Frigorífico combi Bosch Serie 6 noFrost', delta: 340, deltaCoste: 281 }] },
        { slot: 'lavavajillas', nombre: 'Lavavajillas Bosch Serie 4 integrable', precio: 510, coste: 424,
          alternativas: [{ id: 'l-up', nombre: 'Lavavajillas Bosch Serie 6 silencioso', delta: 230, deltaCoste: 190 }] }
      ]
    },
    siemens: {
      id: 'siemens', nombre: 'Siemens Balance',
      aparatos: [
        { slot: 'horno',  nombre: 'Horno Siemens iQ500 con microondas',    precio: 690, coste: 570,
          alternativas: [
            { id: 'h-dn', nombre: 'Horno Siemens iQ300 multifunción',      delta: -180, deltaCoste: -149 },
            { id: 'h-up', nombre: 'Horno Siemens iQ700 pirolítico',        delta: 340, deltaCoste: 281 }
          ] },
        { slot: 'placa',  nombre: 'Placa de inducción Siemens iQ500 flexInduction', precio: 780, coste: 645,
          alternativas: [
            { id: 'p-dn', nombre: 'Placa de inducción Siemens iQ300 60 cm', delta: -210, deltaCoste: -174 },
            { id: 'p-up', nombre: 'Placa de inducción Siemens iQ700 flexInduction Plus', delta: 390, deltaCoste: 323 }
          ] },
        { slot: 'campana', nombre: 'Campana integrable Siemens iQ500',      precio: 380, coste: 315,
          alternativas: [
            { id: 'c-dn', nombre: 'Campana integrable Siemens iQ100',      delta: -140, deltaCoste: -116 },
            { id: 'c-up', nombre: 'Campana integrable Siemens iQ700 climateControl', delta: 260, deltaCoste: 215 }
          ] },
        { slot: 'frigo',  nombre: 'Frigorífico combi Siemens iQ500 noFrost', precio: 880, coste: 728,
          alternativas: [
            { id: 'f-dn', nombre: 'Frigorífico combi Siemens iQ300',        delta: -230, deltaCoste: -190 },
            { id: 'f-up', nombre: 'Frigorífico combi Siemens iQ700 hyperFresh', delta: 420, deltaCoste: 348 }
          ] },
        { slot: 'lavavajillas', nombre: 'Lavavajillas Siemens iQ500 integrable', precio: 560, coste: 462,
          alternativas: [
            { id: 'l-dn', nombre: 'Lavavajillas Siemens iQ300 integrable',  delta: -160, deltaCoste: -132 },
            { id: 'l-up', nombre: 'Lavavajillas Siemens iQ700 zeolith',     delta: 310, deltaCoste: 256 }
          ] }
        ]
    }
  },

  /* Add-ons de servicio: precio YA calculado para este proyecto y CP.
     Nunca "desde" (regla dura 9). Son servicio → no se descuentan (regla 5). */
  addons: [
    { id: 'desmontaje', nombre: 'Desmontaje y retirada de tu cocina antigua', precio: 384, coste: 250,
      desglose: 'bajos 4,2 ml × 40 + altos 2,6 ml × 35 + retirada a punto limpio 125' },
    { id: 'medicion', nombre: 'Medición técnica adicional', precio: 65, coste: 45,
      desglose: '1 visita × 65 (CP 28010, zona 1)' }
  ],

  /* Selector cerrado de descuentos (regla dura 6).
     `frentes` y `resto` son porcentajes; `resto` = estructura + encimera + electros.
     Montaje, logística y fee NUNCA se descuentan (regla dura 5). */
  descuentos: [
    { id: 'ninguno',     nombre: 'Sin descuento',                    tipo: 'pct', frentes: 0,    resto: 0,     aprob: 'ninguna' },
    { id: 'frentes_bas', nombre: 'Solo frentes — básico',            tipo: 'pct', frentes: 0.05, resto: 0,     aprob: 'ninguna' },
    { id: 'frentes_std', nombre: 'Solo frentes — estándar',          tipo: 'pct', frentes: 0.10, resto: 0,     aprob: 'tl' },
    { id: 'frentes_max', nombre: 'Solo frentes — máximo',            tipo: 'pct', frentes: 0.15, resto: 0,     aprob: 'tl+dir' },
    { id: 'global_bas',  nombre: 'Global producto — básico',         tipo: 'pct', frentes: 0.05, resto: 0.025, aprob: 'ninguna' },
    { id: 'global_std',  nombre: 'Global producto — estándar',       tipo: 'pct', frentes: 0.10, resto: 0.05,  aprob: 'tl' },
    { id: 'global_max',  nombre: 'Global producto — máximo',         tipo: 'pct', frentes: 0.15, resto: 0.075, aprob: 'tl+dir' },
    { id: 'libre',       nombre: 'Descuento libre (€)',              tipo: 'libre', aprob: 'tl+dir' }
  ],

  GM_MINIMO: 0.20
};

/* ---------- 4 · estado mutable ---------- */
/* Persiste en localStorage para que la demo a dos ventanas funcione:
   el AM duplica una versión y la clienta la ve al refrescar (SPEC §7, pasos 6-7).
   El ROL, en cambio, vive sólo en memoria + querystring (SPEC §0.2). */

const STATE_KEY = 'cubro_proto_v1';

function versionStateLimpio(v) {
  return {
    descuento: v.descuentoDefault,
    descuentoLibre: 0,
    aprobaciones: { tl: v.descuentoDefault !== 'ninguno', dir: false },
    acabado: 'smoked',
    diseno: 'recto',
    pack: v.packDefault,
    electros: {},          // { slot: idAlternativa }
    addons: {},            // { idAddon: true }
    extras: [],            // fuera de catálogo: { concepto, importe, nota }
    firmada: v.firmadaDefault
  };
}

function estadoInicial() {
  const st = { versionActual: 'V3', orden: ['V1', 'V2', 'V3'], versiones: {}, extra: {} };
  Object.keys(DEMO.versiones).forEach(vid => { st.versiones[vid] = versionStateLimpio(DEMO.versiones[vid]); });
  return st;
}

/* Duplicar = "guardar como": la nueva versión pasa a ser la actual y su quote
   se regenera LIMPIO. Nada manual hereda (regla dura 4): sin descuento,
   pack de entrada, add-ons desmarcados, acabado por defecto, sin firmar. */
function duplicarVersion() {
  const st = state();
  const origen = baseVersion(st.versionActual);
  const nuevoId = 'V' + (st.orden.length + 1);
  const hoy = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' }).format(new Date());

  st.extra[nuevoId] = JSON.parse(JSON.stringify({
    ...origen,
    id: nuevoId,
    fecha: hoy.replace('.', ''),
    fechaLarga: new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date()),
    autor: esAM() ? DEMO.am.nombre : DEMO.cliente.nombre,
    nota: `Duplicada de ${origen.id}. El quote se ha regenerado limpio: sin descuento, pack de entrada, add-ons desmarcados. Nada manual hereda — hay que re-seleccionarlo con los toggles.`,
    firmadaDefault: false,
    descuentoDefault: 'ninguno',
    packDefault: 'bosch'
  }));

  st.versiones[nuevoId] = versionStateLimpio(st.extra[nuevoId]);
  st.orden.push(nuevoId);
  st.versionActual = nuevoId;
  saveState();
  return nuevoId;
}

let _state = null;
function state() {
  if (_state) return _state;
  try {
    const raw = localStorage.getItem(STATE_KEY);
    _state = raw ? JSON.parse(raw) : estadoInicial();
  } catch (e) { _state = estadoInicial(); }
  return _state;
}
function saveState() {
  try { localStorage.setItem(STATE_KEY, JSON.stringify(_state)); } catch (e) { /* demo sin persistencia */ }
}
function resetState() {
  _state = estadoInicial();
  saveState();
}

/* Versiones duplicadas en caliente (V4, V5…): su base clona la actual. */
function baseVersion(vid) {
  if (DEMO.versiones[vid]) return DEMO.versiones[vid];
  return state().extra[vid];
}
function todasLasVersiones() { return state().orden; }
function versionActual() { return state().versionActual; }

/* ---------- 5 · motor de presupuesto ---------- */

function computeQuote(vid) {
  const v = baseVersion(vid);
  const s = state().versiones[vid];

  const acabado = CATALOGO.acabados.find(a => a.id === s.acabado);
  const diseno  = CATALOGO.disenos.find(d => d.id === s.diseno);
  const modMob  = 1 + acabado.delta + diseno.delta;

  const mobPrecio = Math.round(v.mobiliario.precio * modMob);
  const mobCoste  = v.mobiliario.coste;

  /* electrodomésticos: pack + alternativas elegidas por el AM */
  const pack = CATALOGO.packs[s.pack];
  const electros = pack.aparatos.map(ap => {
    const altId = s.electros[ap.slot];
    const alt = altId ? ap.alternativas.find(x => x.id === altId) : null;
    return {
      slot: ap.slot,
      nombre: alt ? alt.nombre : ap.nombre,
      precio: ap.precio + (alt ? alt.delta : 0),
      coste:  ap.coste  + (alt ? alt.deltaCoste : 0),
      alternativas: ap.alternativas,
      base: ap,
      elegida: altId || ''
    };
  });
  const electrosPrecio = electros.reduce((a, b) => a + b.precio, 0);
  const electrosCoste  = electros.reduce((a, b) => a + b.coste, 0);

  /* add-ons activos */
  const addons = CATALOGO.addons.map(a => ({ ...a, activo: !!s.addons[a.id] }));
  const addonsPrecio = addons.filter(a => a.activo).reduce((t, a) => t + a.precio, 0);
  const addonsCoste  = addons.filter(a => a.activo).reduce((t, a) => t + a.coste, 0);

  /* líneas fuera de catálogo (las mete el AM) */
  const extrasPrecio = s.extras.reduce((t, e) => t + e.importe, 0);

  const subtotal = mobPrecio + v.estructura.precio + v.encimera.precio + electrosPrecio
                 + v.fg.precio + v.montaje.precio + v.logistica.precio + v.feeGestion.precio
                 + addonsPrecio + extrasPrecio;

  /* descuento: sólo producto. Nunca servicios (regla dura 5).
     Se trunca a la baja para no sobre-descontar. */
  const d = CATALOGO.descuentos.find(x => x.id === s.descuento);
  const baseResto = v.estructura.precio + v.encimera.precio + electrosPrecio;
  let descuento = 0, descuentoFrentes = 0;
  if (d.tipo === 'pct') {
    descuentoFrentes = mobPrecio * d.frentes;
    descuento = Math.floor(descuentoFrentes + baseResto * d.resto);
  } else {
    descuento = Math.min(Math.floor(s.descuentoLibre || 0), mobPrecio);
    descuentoFrentes = descuento;   // el libre se prorratea a frentes (regla dura 6)
  }

  const base  = subtotal - descuento;
  const iva   = Math.round(base * IVA);
  const total = base + iva;

  /* margen — sólo AM */
  const costeTotal = mobCoste + v.estructura.coste + v.encimera.coste + electrosCoste
                   + v.fg.coste + v.montaje.coste + v.logistica.coste + v.feeGestion.coste
                   + addonsCoste;
  const gm = base > 0 ? (base - costeTotal) / base : 0;
  const mobTrasDesc = mobPrecio - descuentoFrentes;
  const gmFrentes = mobTrasDesc > 0 ? (mobTrasDesc - mobCoste) / mobTrasDesc : 0;

  return {
    vid, base: v, s, descuento: d,
    acabado, diseno,
    bloques: {
      mobiliario: { precio: mobPrecio, coste: mobCoste, elementos: v.mobiliario.elementos },
      estructura: v.estructura,
      encimera:   v.encimera,
      electros:   { precio: electrosPrecio, coste: electrosCoste, pack, aparatos: electros },
      fg:         v.fg,
      montaje:    v.montaje,
      logistica:  v.logistica,
      logisticaIkea: DEMO.logisticaIkea,
      feeGestion: v.feeGestion,
      addons,
      extras: s.extras
    },
    subtotal, importeDescuento: descuento, base_: base, iva, total,
    gm, gmFrentes, bloqueado: gm < CATALOGO.GM_MINIMO,
    firmada: s.firmada,
    aprobacionPendiente: aprobacionPendiente(s, d)
  };
}

function aprobacionPendiente(s, d) {
  if (d.aprob === 'ninguna') return [];
  const falta = [];
  if (!s.aprobaciones.tl) falta.push('tl');
  if (d.aprob === 'tl+dir' && !s.aprobaciones.dir) falta.push('dir');
  return falta;
}

/* ---------- 6 · rol ---------- */

let ROL = 'cliente';

function initRol() {
  const q = new URLSearchParams(location.search).get('role');
  ROL = q === 'am' ? 'am' : 'cliente';
  aplicarRol();
}
function setRol(r) {
  ROL = r;
  const u = new URL(location.href);
  u.searchParams.set('role', r);
  history.replaceState(null, '', u);
  aplicarRol();
  document.dispatchEvent(new CustomEvent('cubro:rol', { detail: r }));
}
function aplicarRol() {
  document.body.classList.toggle('role-am', ROL === 'am');
  document.querySelectorAll('.role-toggle button').forEach(b => {
    b.classList.toggle('on', b.dataset.rol === ROL);
  });
}
function esAM() { return ROL === 'am'; }

/* ---------- 7 · chrome global (SPEC §5.0) ---------- */

const NAV = [
  { id: 'home',     label: 'Home',        href: 'home.html' },
  { id: 'projects', label: 'My projects', href: 'projects.html', pendiente: true },
  { id: 'orders',   label: 'My orders',   href: 'orders.html',   pendiente: true },
  { id: 'inspo',    label: 'Inspo',       href: 'inspo.html',    pendiente: true },
  { id: 'profile',  label: 'My profile',  href: 'profile.html',  pendiente: true }
];

function href(base) {
  return base + '?role=' + ROL;
}

/* Inserta franja AM + topbar + toggle de rol. `activo` marca la entrada del menú. */
function renderChrome(activo) {
  const p = DEMO.proyecto;
  const strip = `
    <div class="am-strip">
      <span>Modo asesor · ${DEMO.am.nombre} · cliente: ${DEMO.cliente.nombre} · deal #${DEMO.deal.id}</span>
      <a href="deal.html" style="color:#fff;text-decoration:none">◄ Volver al deal</a>
    </div>`;

  const topbar = `
    <div class="topbar">
      <a class="logo" href="${href('home.html')}" style="text-decoration:none">CUBRO</a>
      <div class="tb-right">
        <button class="tb-item" onclick="stub('Carrito de muestras: fuera del alcance del prototipo v1.')">
          Muestras <span class="tb-badge num">0</span>
        </button>
        <a class="tb-item" href="${href('profile.html')}" onclick="return navPendiente(event,'My profile')">
          <span class="tb-avatar"></span> ${DEMO.cliente.nombre}
        </a>
      </div>
    </div>`;

  const toggle = `
    <div class="role-toggle">
      <button data-rol="cliente" onclick="setRol('cliente')">Cliente</button>
      <button data-rol="am" onclick="setRol('am')">AM</button>
    </div>`;

  document.body.insertAdjacentHTML('afterbegin', strip + topbar);
  document.body.insertAdjacentHTML('beforeend', toggle);

  const nav = document.querySelector('.sidenav');
  if (nav) {
    nav.innerHTML = NAV.map(n =>
      `<a href="${href(n.href)}" class="${n.id === activo ? 'active' : ''}"
          ${n.pendiente ? `onclick="return navPendiente(event,'${n.label}')"` : ''}>${n.label}</a>`
    ).join('');
  }
  aplicarRol();
}

/* Pantallas que llegan en la siguiente iteración de la sesión. */
function navPendiente(ev, nombre) {
  ev.preventDefault();
  toast(`«${nombre}» se construye en la siguiente iteración — la spec la tiene definida (§5).`);
  return false;
}

document.addEventListener('DOMContentLoaded', initRol);
