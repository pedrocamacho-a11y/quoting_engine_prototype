/* ============================================================
   CUBRO · PROTOTIPO NAVEGABLE — app.js
   Capa compartida: mercados, plantillas, motor de presupuesto,
   estado multi-proyecto, lógica de rol, chrome global y toasts.
   Fuente de verdad: SPEC.md
   ============================================================ */

/* ---------- 1 · utilidades ---------- */

/* useGrouping:'always' porque el es-ES no agrupa 4 cifras por defecto (1180)
   y la identidad CUBRO pide siempre punto de miles (1.180 €). */
const eur  = n => new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0, useGrouping: 'always' }).format(Math.round(n)) + ' €';
const pct0 = n => new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(n * 100) + ' %';

let toastTimer = null;
function toast(msg, ms = 3000) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast'; el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('on'), ms);
}
function stub(msg) { toast(msg); }

const hoyCorto = () => new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' }).format(new Date()).replace('.', '');
const hoyLargo = () => new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());

/* ---------- 2 · mercados y geografía ---------- */
/* El país fija IVA y modalidad; el CP fija zona logística y el nombre del proyecto.
   ES-Full Service es el único mercado especificado en la spec (§6.3): en DIY el
   bloque de montaje NO EXISTE, no es que valga cero. */

const MERCADOS = {
  ES: { id: 'ES', nombre: 'España',   iva: 0.21, modalidad: 'Full Service', montaje: true,  especificado: true },
  FR: { id: 'FR', nombre: 'Francia',  iva: 0.20, modalidad: 'DIY',          montaje: false, especificado: false },
  DE: { id: 'DE', nombre: 'Alemania', iva: 0.19, modalidad: 'DIY',          montaje: false, especificado: false }
};

const CP_TABLA = {
  '28010': { ciudad: 'Madrid',    barrio: 'Chamberí',      zona: 1 },
  '28004': { ciudad: 'Madrid',    barrio: 'Malasaña',      zona: 1 },
  '28001': { ciudad: 'Madrid',    barrio: 'Salamanca',     zona: 1 },
  '08010': { ciudad: 'Barcelona', barrio: 'Eixample',      zona: 2 },
  '08012': { ciudad: 'Barcelona', barrio: 'Gràcia',        zona: 2 },
  '46004': { ciudad: 'Valencia',  barrio: 'Ruzafa',        zona: 2 },
  '48011': { ciudad: 'Bilbao',    barrio: 'Indautxu',      zona: 2 },
  '41010': { ciudad: 'Sevilla',   barrio: 'Triana',        zona: 3 }
};

function resolverCP(pais, cp) {
  if (!/^\d{5}$/.test(cp)) return null;
  if (pais === 'ES' && CP_TABLA[cp]) return { cp, ...CP_TABLA[cp] };
  const zona = pais === 'ES' ? 3 : 3;
  return { cp, ciudad: pais === 'ES' ? 'España' : MERCADOS[pais].nombre, barrio: '', zona };
}

/* El sistema nombra el proyecto (SPEC §5.2): "Cocina" + barrio, o ciudad si no hay barrio. */
function nombrarProyecto(geo, tipo) {
  const raiz = tipo === 'armario' ? 'Armario' : 'Cocina';
  return `${raiz} ${geo.barrio || geo.ciudad}`;
}

/* ---------- 3 · calculadoras de servicio ---------- */

function calcMontaje(p, zona) {
  const km = zona === 1 ? 50 : zona === 2 ? 120 : 220;
  const partes = [
    ['medición', 65],
    [`bajos ${String(p.bajos).replace('.', ',')} ml × 115`, p.bajos * 115],
    [`altos ${String(p.altos).replace('.', ',')} ml × 155`, p.altos * 155],
    ...(p.pax ? [[`PAX ${String(p.pax).replace('.', ',')} ml × 175`, p.pax * 175]] : []),
    [`paneles ${p.paneles} × 20`, p.paneles * 20],
    [`electros ${p.electros} × 40`, p.electros * 40],
    [`${km} km × 2`, km * 2]
  ];
  const precio = Math.round(partes.reduce((t, x) => t + x[1], 0));
  return { precio, coste: Math.round(precio * 0.769), desglose: partes.map(x => x[0]).join(' + ') };
}

function calcLogistica(zona, origenes) {
  const base = zona === 1 ? 180 : zona === 2 ? 240 : 320;
  const precio = base + origenes * 130;
  return { precio, coste: Math.round(precio * 0.873),
           desglose: `zona ${zona} (${base}) + ${origenes} ${origenes === 1 ? 'origen' : 'orígenes'} × 130` };
}

/* ---------- 4 · catálogos ---------- */

const CATALOGO = {
  disenos: [
    { id: 'recto',   nombre: 'Recto',   delta: 0 },
    { id: 'moldura', nombre: 'Moldura', delta: 0.018 }
  ],
  acabados: [
    { id: 'smoked', nombre: 'Smoked Oak',    delta: 0 },
    { id: 'roble',  nombre: 'Roble natural', delta: -0.015 },
    { id: 'salvia', nombre: 'Verde salvia',  delta: 0.02 },
    { id: 'blanco', nombre: 'Blanco 01',     delta: -0.02 }
  ],
  packs: {
    bosch: {
      id: 'bosch', nombre: 'Bosch Essential',
      aparatos: [
        { slot: 'horno', nombre: 'Horno Bosch Serie 4 multifunción', precio: 590, coste: 490,
          alternativas: [{ id: 'h-up', nombre: 'Horno Bosch Serie 6 pirolítico', delta: 260, deltaCoste: 215 }] },
        { slot: 'placa', nombre: 'Placa de inducción Bosch Serie 4 60 cm', precio: 660, coste: 548,
          alternativas: [{ id: 'p-up', nombre: 'Placa de inducción Bosch Serie 6 80 cm', delta: 290, deltaCoste: 240 }] },
        { slot: 'campana', nombre: 'Campana integrable Bosch Serie 2', precio: 330, coste: 274,
          alternativas: [{ id: 'c-up', nombre: 'Campana integrable Bosch Serie 4 silenciosa', delta: 180, deltaCoste: 149 }] },
        { slot: 'frigo', nombre: 'Frigorífico combi Bosch Serie 4 integrable', precio: 760, coste: 631,
          alternativas: [{ id: 'f-up', nombre: 'Frigorífico combi Bosch Serie 6 noFrost', delta: 340, deltaCoste: 281 }] },
        { slot: 'lavavajillas', nombre: 'Lavavajillas Bosch Serie 4 integrable', precio: 510, coste: 424,
          alternativas: [{ id: 'l-up', nombre: 'Lavavajillas Bosch Serie 6 silencioso', delta: 230, deltaCoste: 190 }] }
      ]
    },
    siemens: {
      id: 'siemens', nombre: 'Siemens Balance',
      aparatos: [
        { slot: 'horno', nombre: 'Horno Siemens iQ500 con microondas', precio: 690, coste: 570,
          alternativas: [
            { id: 'h-dn', nombre: 'Horno Siemens iQ300 multifunción', delta: -180, deltaCoste: -149 },
            { id: 'h-up', nombre: 'Horno Siemens iQ700 pirolítico', delta: 340, deltaCoste: 281 }] },
        { slot: 'placa', nombre: 'Placa de inducción Siemens iQ500 flexInduction', precio: 780, coste: 645,
          alternativas: [
            { id: 'p-dn', nombre: 'Placa de inducción Siemens iQ300 60 cm', delta: -210, deltaCoste: -174 },
            { id: 'p-up', nombre: 'Placa de inducción Siemens iQ700 flexInduction Plus', delta: 390, deltaCoste: 323 }] },
        { slot: 'campana', nombre: 'Campana integrable Siemens iQ500', precio: 380, coste: 315,
          alternativas: [
            { id: 'c-dn', nombre: 'Campana integrable Siemens iQ100', delta: -140, deltaCoste: -116 },
            { id: 'c-up', nombre: 'Campana integrable Siemens iQ700 climateControl', delta: 260, deltaCoste: 215 }] },
        { slot: 'frigo', nombre: 'Frigorífico combi Siemens iQ500 noFrost', precio: 880, coste: 728,
          alternativas: [
            { id: 'f-dn', nombre: 'Frigorífico combi Siemens iQ300', delta: -230, deltaCoste: -190 },
            { id: 'f-up', nombre: 'Frigorífico combi Siemens iQ700 hyperFresh', delta: 420, deltaCoste: 348 }] },
        { slot: 'lavavajillas', nombre: 'Lavavajillas Siemens iQ500 integrable', precio: 560, coste: 462,
          alternativas: [
            { id: 'l-dn', nombre: 'Lavavajillas Siemens iQ300 integrable', delta: -160, deltaCoste: -132 },
            { id: 'l-up', nombre: 'Lavavajillas Siemens iQ700 zeolith', delta: 310, deltaCoste: 256 }] }
      ]
    }
  },

  /* Add-ons: precio ya calculado para este proyecto y CP, nunca "desde" (regla 9).
     Son servicio → no se descuentan (regla 5). Sólo existen donde hay instalación. */
  addons: [
    { id: 'desmontaje', nombre: 'Desmontaje y retirada de tu cocina antigua',
      calc: (v, geo) => {
        const precio = Math.round(v.montajeParams.bajos * 40 + v.montajeParams.altos * 35 + (geo.zona === 1 ? 125 : 165));
        return { precio, coste: Math.round(precio * 0.65),
          desglose: `bajos ${String(v.montajeParams.bajos).replace('.', ',')} ml × 40 + altos ${String(v.montajeParams.altos).replace('.', ',')} ml × 35 + retirada a punto limpio ${geo.zona === 1 ? 125 : 165}` };
      }, soloConMontaje: true },
    { id: 'medicion', nombre: 'Medición técnica adicional',
      calc: (v, geo) => ({ precio: geo.zona === 1 ? 65 : 95, coste: geo.zona === 1 ? 45 : 68,
        desglose: `1 visita × ${geo.zona === 1 ? 65 : 95} (CP ${geo.cp}, zona ${geo.zona})` }), soloConMontaje: true }
  ],

  /* Selector cerrado (regla 6). `resto` = estructura + encimera + electros. */
  descuentos: [
    { id: 'ninguno',     nombre: 'Sin descuento',              tipo: 'pct', frentes: 0,    resto: 0,     aprob: 'ninguna' },
    { id: 'frentes_bas', nombre: 'Solo frentes — básico',      tipo: 'pct', frentes: 0.05, resto: 0,     aprob: 'ninguna' },
    { id: 'frentes_std', nombre: 'Solo frentes — estándar',    tipo: 'pct', frentes: 0.10, resto: 0,     aprob: 'tl' },
    { id: 'frentes_max', nombre: 'Solo frentes — máximo',      tipo: 'pct', frentes: 0.15, resto: 0,     aprob: 'tl+dir' },
    { id: 'global_bas',  nombre: 'Global producto — básico',   tipo: 'pct', frentes: 0.05, resto: 0.025, aprob: 'ninguna' },
    { id: 'global_std',  nombre: 'Global producto — estándar', tipo: 'pct', frentes: 0.10, resto: 0.05,  aprob: 'tl' },
    { id: 'global_max',  nombre: 'Global producto — máximo',   tipo: 'pct', frentes: 0.15, resto: 0.075, aprob: 'tl+dir' },
    { id: 'libre',       nombre: 'Descuento libre (€)',        tipo: 'libre', aprob: 'tl+dir' }
  ],

  tiposProyecto: [
    { id: 'cocina',         nombre: 'Solo cocina',              sub: 'Frentes, columnas, encimera y electrodomésticos' },
    { id: 'cocina_armario', nombre: 'Cocina + armario',         sub: 'Aprovechas el mismo viaje y el mismo montaje' },
    { id: 'armario',        nombre: 'Solo armario',             sub: 'Frentes CUBRO sobre estructura PAX' }
  ],

  perfiles: ['Particular', 'Arquitecto', 'Interiorista', 'Promotor', 'Retailer'],

  GM_MINIMO: 0.20
};

/* ---------- 5 · plantillas de diseño ---------- */
/* Cada plantilla es un diseño CUBRO real que el pricing engine sabe valorar.
   Las 6 primeras son la parrilla de Inspo (§5.5). */

const PLANTILLAS = {
  malasana: { nombre: 'Roble y piedra', barrio: 'Malasaña', acabado: 'roble',
    mobiliario: { precio: 13900, coste: 7350 }, encimera: { precio: 1980, coste: 1620, label: 'Encimera compacto · 2,4 m² + copete' },
    pack: 'bosch', montajeParams: { bajos: 4.2, altos: 2.6, pax: 0, paneles: 4, electros: 5 },
    frentes: 11, columnas: 3, paneles: 4, tapetas: 7, zocalo: 4.2 },
  salamanca: { nombre: 'Lino y latón', barrio: 'Salamanca', acabado: 'blanco',
    mobiliario: { precio: 17400, coste: 9100 }, encimera: { precio: 3180, coste: 2550, label: 'Dekton cotizado · 3,1 m² + copete' },
    pack: 'siemens', montajeParams: { bajos: 5.4, altos: 3.4, pax: 0, paneles: 6, electros: 5 },
    frentes: 15, columnas: 4, paneles: 6, tapetas: 9, zocalo: 5.4 },
  gracia: { nombre: 'Verde salvia', barrio: 'Gràcia', acabado: 'salvia',
    mobiliario: { precio: 11200, coste: 5980 }, encimera: { precio: 1740, coste: 1420, label: 'Encimera compacto · 2,0 m² + copete' },
    pack: 'bosch', montajeParams: { bajos: 3.4, altos: 2.2, pax: 0, paneles: 3, electros: 4 },
    frentes: 9, columnas: 2, paneles: 3, tapetas: 6, zocalo: 3.4 },
  ruzafa: { nombre: 'Blanco mate', barrio: 'Ruzafa', acabado: 'blanco',
    mobiliario: { precio: 9800, coste: 5250 }, encimera: { precio: 1480, coste: 1210, label: 'Encimera compacto · 1,8 m² + copete' },
    pack: 'bosch', montajeParams: { bajos: 3.0, altos: 1.8, pax: 0, paneles: 3, electros: 4 },
    frentes: 8, columnas: 2, paneles: 3, tapetas: 5, zocalo: 3.0 },
  indautxu: { nombre: 'Nogal y piedra', barrio: 'Indautxu', acabado: 'smoked',
    mobiliario: { precio: 15600, coste: 8180 }, encimera: { precio: 2860, coste: 2300, label: 'Dekton cotizado · 2,7 m² + copete' },
    pack: 'siemens', montajeParams: { bajos: 4.8, altos: 3.0, pax: 0, paneles: 5, electros: 5 },
    frentes: 13, columnas: 3, paneles: 5, tapetas: 8, zocalo: 4.8 },
  triana: { nombre: 'Roble claro', barrio: 'Triana', acabado: 'roble',
    mobiliario: { precio: 12400, coste: 6600 }, encimera: { precio: 1880, coste: 1540, label: 'Encimera compacto · 2,2 m² + copete' },
    pack: 'bosch', montajeParams: { bajos: 3.8, altos: 2.4, pax: 0, paneles: 4, electros: 5 },
    frentes: 10, columnas: 3, paneles: 4, tapetas: 7, zocalo: 3.8 },

  /* Caminos que no vienen de Inspo */
  cubro_cero: { nombre: 'Diseño propio', barrio: '', acabado: 'smoked', desdeCero: true,
    mobiliario: { precio: 12800, coste: 6790 }, encimera: { precio: 1920, coste: 1570, label: 'Encimera compacto · 2,2 m² + copete' },
    pack: 'bosch', montajeParams: { bajos: 3.9, altos: 2.5, pax: 0, paneles: 4, electros: 5 },
    frentes: 10, columnas: 3, paneles: 4, tapetas: 7, zocalo: 3.9 },
  ikea_link: { nombre: 'Diseño importado de IKEA', barrio: '', acabado: 'roble', importado: true,
    mobiliario: { precio: 8900, coste: 4680 }, encimera: { precio: 1640, coste: 1340, label: 'Encimera compacto · 2,1 m² + copete' },
    pack: 'bosch', montajeParams: { bajos: 3.6, altos: 2.3, pax: 0, paneles: 3, electros: 5 },
    frentes: 12, columnas: 0, paneles: 3, tapetas: 6, zocalo: 3.6 }
};

const INSPO = ['malasana', 'salamanca', 'gracia', 'ruzafa', 'indautxu', 'triana'];

/* El armario PAX se añade como incremento sobre cualquier plantilla. */
const ARMARIO = { mobiliario: 2100, coste: 1150, estructura: 290, estructuraCoste: 265, pax_ml: 1.9, puertas: 6 };

/* Genera la base de la V1 de un proyecto nuevo. Esto es el pricing engine:
   valora el diseño en función de la plantilla, el tipo y la geografía. */
function generarVersionBase(plantillaId, proyecto, tipo) {
  const pl = PLANTILLAS[plantillaId];
  const geo = { cp: proyecto.cp, ciudad: proyecto.ciudad, barrio: proyecto.barrio, zona: proyecto.zona };
  const conArmario = tipo === 'cocina_armario' || tipo === 'armario';
  const soloArmario = tipo === 'armario';

  const elementos = [];
  if (!soloArmario) {
    elementos.push(`${pl.frentes} frentes de puerta ${pl.importado ? 'CUBRO sobre Metod' : 'NPD'}`);
    if (pl.columnas) elementos.push(`${pl.columnas} columnas (horno, despensa, frigorífico integrado)`);
    elementos.push(`${pl.paneles} paneles laterales y de remate`);
    elementos.push(`${pl.tapetas} tapetas y perfiles de unión`);
    elementos.push(`${String(pl.zocalo).replace('.', ',')} ml de zócalo aluminio negro`);
  }
  if (conArmario) elementos.push(`1 frente de armario PAX · ${ARMARIO.puertas} puertas`);

  const mobiliario = {
    precio: (soloArmario ? 0 : pl.mobiliario.precio) + (conArmario ? ARMARIO.mobiliario : 0),
    coste:  (soloArmario ? 0 : pl.mobiliario.coste)  + (conArmario ? ARMARIO.coste : 0),
    elementos
  };

  const partesEstructura = [];
  if (!soloArmario) partesEstructura.push('Metod');
  if (conArmario) partesEstructura.push('PAX');
  const estructura = {
    precio: (soloArmario ? 0 : 890) + (conArmario ? ARMARIO.estructura : 0),
    coste:  (soloArmario ? 0 : 820) + (conArmario ? ARMARIO.estructuraCoste : 0),
    label: `Estructura IKEA (${partesEstructura.join(' + ')}) — gestionada por CUBRO`
  };

  const montajeParams = {
    ...pl.montajeParams,
    bajos: soloArmario ? 0 : pl.montajeParams.bajos,
    altos: soloArmario ? 0 : pl.montajeParams.altos,
    paneles: soloArmario ? 0 : pl.montajeParams.paneles,
    electros: soloArmario ? 0 : pl.montajeParams.electros,
    pax: conArmario ? ARMARIO.pax_ml : 0
  };

  return {
    id: 'V1', fecha: hoyCorto(), fechaLarga: hoyLargo(),
    autor: DEMO.cliente.nombre,
    nota: pl.importado
      ? 'Diseño leído del enlace de IKEA y valorado por el pricing engine de CUBRO.'
      : pl.desdeCero
        ? 'Diseño creado en el planner de CUBRO y valorado al guardar.'
        : `Punto de partida: «${pl.nombre} — ${pl.barrio}», una cocina CUBRO de Inspo duplicada a tu cuenta.`,
    plantilla: plantillaId,
    firmadaDefault: false, descuentoDefault: 'ninguno', packDefault: pl.pack, acabadoDefault: pl.acabado,
    mobiliario,
    estructura: estructura.precio > 0 ? estructura : null,
    encimera: soloArmario ? null : { ...pl.encimera },
    electros: !soloArmario,
    fg: soloArmario ? null : { precio: 415, coste: 290, label: 'Fregadero bajo encimera + grifería Schmidt' },
    montajeParams,
    origenes: estructura.precio > 0 ? 2 : 1,
    feeGestion: estructura.precio > 0 ? { precio: 275, coste: 170 } : null
  };
}

/* ---------- 6 · personas y el proyecto canónico de la demo ---------- */

const DEMO = {
  cliente: { nombre: 'Carolina Méndez', email: 'carolina.mendez@gmail.com', telefono: '+34 655 41 22 09' },
  am: { nombre: 'Maider Etxebarria', rol: 'Account Manager' },
  de: { nombre: 'Lucía R.', rol: 'Design Expert' },
  tl: { nombre: 'Ignacio' },
  dir: { nombre: 'Alex' },
  deal: { id: 'D-4127', etapa: 'Presupuestación' }
};

/* Las tres versiones canónicas de la §11. V3 cuadra al euro con la spec. */
const CHAMBERI = {
  V1: {
    id: 'V1', fecha: '12 jul', fechaLarga: '12 de julio de 2026', autor: 'Carolina, desde Inspo',
    nota: 'Punto de partida: «Roble y piedra — Malasaña», de Inspo. Solo cocina, sin el armario del dormitorio.',
    plantilla: 'malasana',
    firmadaDefault: false, descuentoDefault: 'ninguno', packDefault: 'bosch', acabadoDefault: 'roble',
    mobiliario: { precio: 13900, coste: 7350, elementos: [
      '11 frentes de puerta NPD', '3 columnas (horno, despensa, frigorífico integrado)',
      '4 paneles laterales y de remate', '7 tapetas y perfiles de unión', '4,2 ml de zócalo aluminio negro'] },
    estructura: { precio: 890, coste: 820, label: 'Estructura IKEA (Metod) — gestionada por CUBRO' },
    encimera: { precio: 1980, coste: 1620, label: 'Encimera compacto · 2,4 m² + copete' },
    electros: true,
    fg: { precio: 415, coste: 290, label: 'Fregadero bajo encimera + grifería Schmidt' },
    montajeParams: { bajos: 4.2, altos: 2.6, pax: 0, paneles: 4, electros: 5 },
    origenes: 2, feeGestion: { precio: 275, coste: 170 }
  },
  V2: {
    id: 'V2', fecha: '19 jul', fechaLarga: '19 de julio de 2026', autor: 'Maider, tras la videollamada',
    nota: 'Duplicada de V1 en la cuenta de Carolina: se añade el armario PAX, el pack sube a Siemens y la encimera pasa a Dekton cotizado. Nada heredó — todo se re-seleccionó con toggles.',
    plantilla: 'malasana',
    firmadaDefault: false, descuentoDefault: 'ninguno', packDefault: 'siemens', acabadoDefault: 'smoked',
    mobiliario: { precio: 15630, coste: 8159, elementos: [
      '13 frentes de puerta NPD', '4 columnas (horno, despensa, frigorífico integrado, escobero)',
      '5 paneles laterales y de remate', '8 tapetas y perfiles de unión', '4,2 ml de zócalo aluminio negro',
      '1 frente de armario PAX · 6 puertas'] },
    estructura: { precio: 1180, coste: 1085, label: 'Estructura IKEA (Metod + PAX) — gestionada por CUBRO' },
    encimera: { precio: 2640, coste: 2130, label: 'Dekton cotizado · 2,4 m² + copete' },
    electros: true,
    fg: { precio: 415, coste: 290, label: 'Fregadero bajo encimera + grifería Schmidt' },
    montajeParams: { bajos: 4.2, altos: 3.3, pax: 1.9, paneles: 5, electros: 5 },
    origenes: 2, feeGestion: { precio: 275, coste: 170 }
  },
  V3: {
    id: 'V3', fecha: '28 jul', fechaLarga: '28 de julio de 2026', autor: 'Maider, ajuste final',
    nota: 'Ajuste final: una columna menos. Se aplica el descuento «Global producto — estándar» (aprobado por Ignacio) y se marca como versión final.',
    plantilla: 'malasana',
    firmadaDefault: true, descuentoDefault: 'global_std', packDefault: 'siemens', acabadoDefault: 'smoked',
    mobiliario: { precio: 14850, coste: 7752, elementos: [
      '12 frentes de puerta NPD', '3 columnas (horno, despensa, frigorífico integrado)',
      '5 paneles laterales y de remate', '8 tapetas y perfiles de unión', '4,2 ml de zócalo aluminio negro',
      '1 frente de armario PAX · 6 puertas'] },
    estructura: { precio: 1180, coste: 1085, label: 'Estructura IKEA (Metod + PAX) — gestionada por CUBRO' },
    encimera: { precio: 2640, coste: 2130, label: 'Dekton cotizado · 2,4 m² + copete' },
    electros: true,
    fg: { precio: 415, coste: 290, label: 'Fregadero bajo encimera + grifería Schmidt' },
    montajeParams: { bajos: 4.2, altos: 2.6, pax: 1.9, paneles: 4, electros: 5 },
    origenes: 2, feeGestion: { precio: 275, coste: 170 }
  }
};

/* ---------- 7 · estado ---------- */
/* Persiste en localStorage para que la demo a dos ventanas funcione: el asesor
   duplica y la clienta lo ve al refrescar (SPEC §7). El ROL vive en la querystring. */

const STATE_KEY = 'cubro_proto_v2';

function estadoVersion(base) {
  return {
    descuento: base.descuentoDefault, descuentoLibre: 0,
    aprobaciones: { tl: base.descuentoDefault !== 'ninguno', dir: false },
    acabado: base.acabadoDefault || 'smoked', diseno: 'recto',
    pack: base.packDefault, electros: {}, addons: {}, extras: [],
    firmada: base.firmadaDefault
  };
}

function estadoInicial() {
  return {
    proyectos: [], proyectoActual: null, refSiguiente: 2041, pedido: null,
    perfil: {
      nombre: DEMO.cliente.nombre, email: DEMO.cliente.email, telefono: DEMO.cliente.telefono,
      pais: 'ES', tipoCliente: 'Particular', nif: '', dirFact: '', cpFact: '', vies: false
    }
  };
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
function saveState() { try { localStorage.setItem(STATE_KEY, JSON.stringify(_state)); } catch (e) {} }
function resetState() { _state = estadoInicial(); saveState(); }

function proyectos() { return state().proyectos; }
function proyectoActual() {
  const st = state();
  return st.proyectos.find(p => p.id === st.proyectoActual) || st.proyectos[0] || null;
}
function abrirProyecto(id) { state().proyectoActual = id; saveState(); }

/* Crea el proyecto: el sistema lo nombra y le asigna referencia (§5.2). */
function crearProyecto({ plantilla, pais, cp, tipo, direccion, ciudad, origen }) {
  const st = state();
  const geo = resolverCP(pais, cp);
  if (ciudad) geo.ciudad = ciudad;   // CP fuera de nuestra base: la ciudad la da el cliente
  const m = MERCADOS[pais];
  const p = {
    id: 'p' + (st.proyectos.length + 1),
    ref: 'P-' + st.refSiguiente++,
    nombre: nombrarProyecto(geo, tipo),
    pais, cp: geo.cp, ciudad: geo.ciudad, barrio: geo.barrio, zona: geo.zona,
    direccion: direccion || '', tipo, origen, modalidad: m.modalidad,
    creado: hoyLargo(), archivado: false,
    orden: ['V1'], versionActual: 'V1', bases: {}, versiones: {}
  };
  p.bases.V1 = generarVersionBase(plantilla, p, tipo);
  p.versiones.V1 = estadoVersion(p.bases.V1);
  st.proyectos.push(p);
  st.proyectoActual = p.id;
  saveState();
  return p;
}

/* Duplicar = "guardar como" (regla 4): la nueva es la actual y NADA hereda. */
function duplicarVersion() {
  const p = proyectoActual();
  const origen = p.bases[p.versionActual];
  const id = 'V' + (p.orden.length + 1);
  p.bases[id] = JSON.parse(JSON.stringify({
    ...origen, id, fecha: hoyCorto(), fechaLarga: hoyLargo(),
    autor: esAM() ? DEMO.am.nombre : DEMO.cliente.nombre,
    nota: `Duplicada de ${origen.id}. El quote se ha regenerado limpio: sin descuento, pack de entrada, add-ons desmarcados. Nada manual hereda — hay que re-seleccionarlo con los toggles.`,
    firmadaDefault: false, descuentoDefault: 'ninguno', packDefault: 'bosch', acabadoDefault: 'smoked'
  }));
  p.versiones[id] = estadoVersion(p.bases[id]);
  p.orden.push(id);
  p.versionActual = id;
  saveState();
  return id;
}

/* Estado de cierre para saltar directo al final del guion (o para el deal). */
function sembrarDemoCompleta() {
  resetState();
  const st = state();
  const geo = resolverCP('ES', '28010');
  const p = {
    id: 'p1', ref: 'P-2041', nombre: 'Cocina Chamberí',
    pais: 'ES', cp: geo.cp, ciudad: geo.ciudad, barrio: geo.barrio, zona: geo.zona,
    direccion: 'C/ Sagunto 14', tipo: 'cocina_armario', origen: 'inspo',
    modalidad: 'Full Service', creado: '12 de julio de 2026', archivado: false,
    orden: ['V1', 'V2', 'V3'], versionActual: 'V3', bases: {}, versiones: {}
  };
  ['V1', 'V2', 'V3'].forEach(v => {
    p.bases[v] = JSON.parse(JSON.stringify(CHAMBERI[v]));
    p.versiones[v] = estadoVersion(p.bases[v]);
  });
  st.proyectos = [p];
  st.proyectoActual = 'p1';
  st.refSiguiente = 2042;
  saveState();
  return p;
}

/* ---------- 8 · motor de presupuesto ---------- */
/* Devuelve los bloques como lista: así el mercado × modalidad puede hacer que un
   bloque NO EXISTA (no que valga cero), que es lo que pide la §6.3. */

function computeQuote(proj, vid) {
  const v = proj.bases[vid];
  const s = proj.versiones[vid];
  const m = MERCADOS[proj.pais];
  const geo = { cp: proj.cp, ciudad: proj.ciudad, barrio: proj.barrio, zona: proj.zona };

  const acabado = CATALOGO.acabados.find(a => a.id === s.acabado);
  const diseno  = CATALOGO.disenos.find(d => d.id === s.diseno);
  const modMob  = 1 + acabado.delta + diseno.delta;

  const bloques = [];

  /* mobiliario */
  const mobPrecio = Math.round(v.mobiliario.precio * modMob);
  bloques.push({ id: 'mobiliario', titulo: 'Mobiliario CUBRO', estado: 'obligatorio',
    sub: `${acabado.nombre} · ${diseno.nombre}`, precio: mobPrecio, coste: v.mobiliario.coste,
    descontable: 'frentes', lineas: v.mobiliario.elementos.map(e => ({ nombre: e, sinPrecio: true })),
    nota: 'Los elementos se valoran como conjunto: CUBRO no publica precios unitarios de fabricación.' });

  /* estructura de terceros — una sola línea (regla 3) */
  if (v.estructura) bloques.push({ id: 'estructura', titulo: 'Estructura de terceros', estado: 'obligatorio',
    precio: v.estructura.precio, coste: v.estructura.coste, descontable: 'resto',
    lineas: [{ nombre: v.estructura.label, precio: v.estructura.precio }],
    nota: 'CUBRO actúa como contratista principal: la estructura va consolidada en una línea, sin desglose de SKU ni precios unitarios de terceros.' });

  /* encimera */
  if (v.encimera) bloques.push({ id: 'encimera', titulo: 'Encimera', estado: 'obligatorio',
    precio: v.encimera.precio, coste: v.encimera.coste, descontable: 'resto',
    lineas: [{ nombre: v.encimera.label, precio: v.encimera.precio }],
    nota: 'El material definitivo se confirma con tu diseñadora.' });

  /* electrodomésticos */
  let electros = null;
  if (v.electros) {
    const pack = CATALOGO.packs[s.pack];
    const aparatos = pack.aparatos.map(ap => {
      const alt = s.electros[ap.slot] ? ap.alternativas.find(x => x.id === s.electros[ap.slot]) : null;
      return { slot: ap.slot, nombre: alt ? alt.nombre : ap.nombre,
        precio: ap.precio + (alt ? alt.delta : 0), coste: ap.coste + (alt ? alt.deltaCoste : 0),
        alternativas: ap.alternativas, base: ap, elegida: s.electros[ap.slot] || '' };
    });
    electros = { pack, aparatos,
      precio: aparatos.reduce((t, a) => t + a.precio, 0),
      coste: aparatos.reduce((t, a) => t + a.coste, 0) };
    bloques.push({ id: 'electros', titulo: 'Electrodomésticos', estado: 'obligatorio',
      sub: `Pack ${pack.nombre}`, precio: electros.precio, coste: electros.coste, descontable: 'resto',
      electros, lineas: aparatos.map(a => ({ nombre: a.nombre, sinPrecio: true })),
      nota: 'El pack se valora completo. Puedes cambiarlo con tu diseñadora en la videollamada.' });
  }

  /* fregadero y grifería */
  if (v.fg) bloques.push({ id: 'fg', titulo: 'Fregadero y grifería', estado: 'obligatorio',
    precio: v.fg.precio, coste: v.fg.coste, descontable: null,
    lineas: [{ nombre: v.fg.label, precio: v.fg.precio }] });

  /* servicios: montaje sólo existe donde hay instalación (mercado × modalidad) */
  const montaje = m.montaje ? calcMontaje(v.montajeParams, geo.zona) : null;
  const logistica = calcLogistica(geo.zona, v.origenes);
  const addons = CATALOGO.addons
    .filter(a => !a.soloConMontaje || m.montaje)
    .map(a => { const c = a.calc(v, geo); return { ...a, ...c, activo: !!s.addons[a.id] }; });
  const addonsActivos = addons.filter(a => a.activo);

  const lineasServicio = [];
  if (montaje) lineasServicio.push({ nombre: 'Montaje e instalación', precio: montaje.precio,
    sub: `Mano de obra y coordinación — incluido en tu ${m.modalidad}, no se puede quitar`, desglose: montaje.desglose, coste: montaje.coste });
  lineasServicio.push({ nombre: 'Logística CUBRO', precio: logistica.precio,
    sub: 'Transporte y entrega — obligatoria', desglose: logistica.desglose, coste: logistica.coste });
  if (v.estructura) lineasServicio.push({ nombre: 'Logística IKEA', precio: 100, informativa: true,
    sub: 'La abona IKEA en tu pedido — este importe no se paga a CUBRO' });

  bloques.push({ id: 'servicios', titulo: 'Servicios · instalación y entrega',
    estado: m.montaje ? 'mixto' : 'parcial',
    sub: m.montaje ? `Montaje y logística obligatorios en ${m.modalidad}` : `Mercado ${m.nombre} · ${m.modalidad}: el montaje no lo presta CUBRO`,
    precio: (montaje ? montaje.precio : 0) + logistica.precio + addonsActivos.reduce((t, a) => t + a.precio, 0),
    coste: (montaje ? montaje.coste : 0) + logistica.coste + addonsActivos.reduce((t, a) => t + a.coste, 0),
    descontable: null, lineas: lineasServicio, addons,
    nota: m.montaje
      ? 'El montaje, la gestión y la logística CUBRO se pagan a CUBRO. La logística de IKEA se abona en tu pedido de IKEA.com y se muestra solo para que veas el coste total.'
      : 'La matriz de servicios de este mercado está pendiente de definir en la spec: aquí sólo se muestra la logística.' });

  /* fee de gestión de compra */
  if (v.feeGestion) bloques.push({ id: 'fee', titulo: 'Gestión de compra IKEA', estado: 'obligatorio',
    precio: v.feeGestion.precio, coste: v.feeGestion.coste, descontable: null,
    lineas: [{ nombre: 'Gestión del pedido de estructura en IKEA', precio: v.feeGestion.precio,
      sub: 'CUBRO configura, pide y coordina la entrega de la estructura' }] });

  /* fuera de catálogo */
  if (s.extras.length) bloques.push({ id: 'extras', titulo: 'Fuera de catálogo', estado: 'manual',
    sub: 'Líneas añadidas por tu diseñadora', precio: s.extras.reduce((t, e) => t + e.importe, 0),
    coste: 0, descontable: null,
    lineas: s.extras.map((e, i) => ({ nombre: e.concepto, precio: e.importe, nota: e.nota, idx: i })) });

  /* totales */
  const subtotal = bloques.reduce((t, x) => t + x.precio, 0);
  const d = CATALOGO.descuentos.find(x => x.id === s.descuento);
  const baseFrentes = bloques.filter(x => x.descontable === 'frentes').reduce((t, x) => t + x.precio, 0);
  const baseResto   = bloques.filter(x => x.descontable === 'resto').reduce((t, x) => t + x.precio, 0);

  let descuento = 0, descuentoFrentes = 0;
  if (d.tipo === 'pct') {
    descuentoFrentes = baseFrentes * d.frentes;
    descuento = Math.floor(descuentoFrentes + baseResto * d.resto);
  } else {
    descuento = Math.min(Math.floor(s.descuentoLibre || 0), baseFrentes);
    descuentoFrentes = descuento;
  }

  const base  = subtotal - descuento;
  const iva   = Math.round(base * m.iva);
  const total = base + iva;

  const costeTotal = bloques.reduce((t, x) => t + (x.coste || 0), 0);
  const gm = base > 0 ? (base - costeTotal) / base : 0;
  const mobTrasDesc = baseFrentes - descuentoFrentes;
  const gmFrentes = mobTrasDesc > 0 ? (mobTrasDesc - v.mobiliario.coste) / mobTrasDesc : 0;

  return {
    proj, vid, base: v, s, mercado: m, geo, acabado, diseno, bloques, descuento: d,
    subtotal, importeDescuento: descuento, base_: base, iva, total,
    gm, gmFrentes, bloqueado: gm < CATALOGO.GM_MINIMO,
    firmada: s.firmada, aprobacionPendiente: aprobacionPendiente(s, d)
  };
}

function aprobacionPendiente(s, d) {
  if (d.aprob === 'ninguna') return [];
  const falta = [];
  if (!s.aprobaciones.tl) falta.push('tl');
  if (d.aprob === 'tl+dir' && !s.aprobaciones.dir) falta.push('dir');
  return falta;
}

/* ---------- 9 · rol ---------- */

let ROL = 'cliente';
function initRol() {
  ROL = new URLSearchParams(location.search).get('role') === 'am' ? 'am' : 'cliente';
  aplicarRol();
}
function setRol(r) {
  ROL = r;
  const u = new URL(location.href); u.searchParams.set('role', r); history.replaceState(null, '', u);
  aplicarRol();
  document.dispatchEvent(new CustomEvent('cubro:rol', { detail: r }));
}
function aplicarRol() {
  document.body.classList.toggle('role-am', ROL === 'am');
  document.querySelectorAll('.role-toggle button').forEach(b => b.classList.toggle('on', b.dataset.rol === ROL));
}
function esAM() { return ROL === 'am'; }
function href(base) { return base + '?role=' + ROL; }

/* ---------- 10 · chrome global (SPEC §5.0) ---------- */

const NAV = [
  { id: 'home',     label: 'Home',        href: 'home.html' },
  { id: 'projects', label: 'My projects', href: 'projects.html' },
  { id: 'orders',   label: 'My orders',   href: 'orders.html' },
  { id: 'inspo',    label: 'Inspo',       href: 'inspo.html' },
  { id: 'profile',  label: 'My profile',  href: 'profile.html' }
];

function renderChrome(activo) {
  const p = proyectoActual();
  document.body.insertAdjacentHTML('afterbegin', `
    <div class="am-strip">
      <span>Modo asesor · ${DEMO.am.nombre} · cliente: ${state().perfil.nombre} · deal #${DEMO.deal.id}</span>
      <a href="deal.html">◄ Volver al deal</a>
    </div>
    <div class="topbar">
      <a class="logo" href="${href('home.html')}" style="text-decoration:none">CUBRO</a>
      <div class="tb-right">
        <button class="tb-item" onclick="stub('Carrito de muestras: fuera del alcance del prototipo v1.')">
          Muestras <span class="tb-badge num">0</span></button>
        <a class="tb-item" href="${href('profile.html')}"><span class="tb-avatar"></span> ${state().perfil.nombre}</a>
      </div>
    </div>`);

  document.body.insertAdjacentHTML('beforeend', `
    <div class="role-toggle">
      <button data-rol="cliente" onclick="setRol('cliente')">Cliente</button>
      <button data-rol="am" onclick="setRol('am')">AM</button>
    </div>`);

  const nav = document.querySelector('.sidenav');
  if (nav) nav.innerHTML = NAV.map(n =>
    `<a href="${href(n.href)}" class="${n.id === activo ? 'active' : ''}">${n.label}</a>`).join('');

  aplicarRol();
}

document.addEventListener('DOMContentLoaded', initRol);
