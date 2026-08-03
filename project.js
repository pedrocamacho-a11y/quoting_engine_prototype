/* ============================================================
   CUBRO · prototipo — project.js
   Pantalla reina: detalle de proyecto + QUOTE (SPEC §6).
   Todo se re-renderiza desde computeQuote(); no hay importes en el HTML.
   ============================================================ */

const abiertos = new Set(['servicios']);   /* acordeones abiertos, se conserva entre renders */

function toggleAcc(id) {
  abiertos.has(id) ? abiertos.delete(id) : abiertos.add(id);
  render();
}

/* ---------- helpers de plantilla ---------- */

function acc(id, titulo, sub, total, cuerpo, opts = {}) {
  const open = abiertos.has(id);
  const totalTxt = opts.informativo ? `<span class="muted">${total}</span>` : eur(total);
  return `
  <div class="acc ${open ? 'open' : ''}">
    <div class="acc-head" onclick="toggleAcc('${id}')">
      <div>
        <div class="acc-title">${titulo}</div>
        ${sub ? `<div class="acc-sub">${sub}</div>` : ''}
      </div>
      <div class="acc-total num">${totalTxt}</div>
      <div class="chev">${open ? '—' : '+'}</div>
    </div>
    <div class="acc-body">${cuerpo}</div>
  </div>`;
}

function linea(nombre, precio, sub = '', clase = '') {
  return `<div class="line ${clase}">
    <div>${nombre}${sub ? `<span class="sub">${sub}</span>` : ''}</div>
    <div class="price num">${precio}</div>
  </div>`;
}

/* Línea de producto sin precio unitario: política prime contractor (regla dura 2). */
function lineaSinPrecio(nombre, sub = '') {
  return linea(nombre, 'incluido', sub, 'sin-precio');
}

/* ---------- render ---------- */

function render() {
  const q = computeQuote(versionActual());
  const st = state();
  const p = DEMO.proyecto;
  const b = q.bloques;

  /* — 6.1 cabecera + selector de versiones — */
  const chips = st.orden.map(vid => {
    const v = baseVersion(vid);
    const esActual = vid === st.versionActual;
    return `<button class="vchip ${esActual ? 'on' : ''}" onclick="cambiarVersion('${vid}')">
      ${vid} · ${v.fecha}${esActual ? '<span class="dot">●</span>' : ''}</button>`;
  }).join('');

  const selloFirmada = q.firmada
    ? `<span class="badge firmada">Versión firmada por diseñador</span>`
    : `<span class="badge edicion">En edición</span>`;

  const cabecera = `
  <div class="proj-head">
    <div>
      <div class="proj-title">
        <h1>${p.nombre}</h1>
        <span class="proj-ref">Proyecto #${p.ref}</span>
      </div>
      <div class="proj-dir">
        Entrega: ${p.direccion} · ${p.cp} ${p.ciudad} (${p.barrio})
        <span class="muted"> — el CP determina IVA y logística</span>
      </div>
      <div class="proj-dir">Mercado ${p.mercado} · modalidad ${p.modalidad} · diseñadora: ${DEMO.de.nombre}</div>
    </div>
    <div class="proj-actions">
      <button class="btn secondary" onclick="stub('El planner 3D se abriría aquí: el diseño se edita ahí, nunca el presupuesto.')">✏️ Editar diseño en el planner</button>
      <button class="btn secondary" onclick="onDuplicar()">Duplicar versión</button>
    </div>
  </div>

  <div class="versions">${chips} <span style="margin-left:16px">${selloFirmada}</span></div>
  <div class="vmeta">
    <strong style="font-weight:400">${q.base.id} · ${q.base.fechaLarga}</strong> — ${q.base.autor}. ${q.base.nota}
  </div>`;

  /* — 6.2 hero con selectores globales — */
  const fichas = (lista, sel, fn) => lista.map(x =>
    `<button class="ficha ${x.id === sel ? 'on' : ''}" ${q.firmada ? 'disabled' : ''}
      onclick="${fn}('${x.id}')">${x.nombre}</button>`).join('');

  const hero = `
  <div class="hero">
    <div class="hero-img"><span>Render del diseño · ${q.acabado.nombre} / ${q.diseno.nombre}</span></div>
    <div class="hero-side">
      <span class="sel-label">Diseño</span>
      <div class="fichas">${fichas(CATALOGO.disenos, q.s.diseno, 'setDiseno')}</div>
      <span class="sel-label">Acabado</span>
      <div class="fichas">${fichas(CATALOGO.acabados, q.s.acabado, 'setAcabado')}</div>
      <p class="muted" style="font-size:12px">
        ${q.firmada
          ? 'Esta versión está firmada y congelada: para probar otro acabado, abre V1 o V2, o duplica la versión.'
          : 'Cambiar diseño o acabado revalora el proyecto completo al instante.'}
      </p>
    </div>
  </div>`;

  /* — 6.6 capa AM: margen + descuento — */
  const gmChip = `
    <div class="gm-chip ${q.bloqueado ? 'alerta' : ''}">
      GM teórico proyecto: <strong style="font-weight:400">${pct0(q.gm)}</strong> ·
      frentes: <strong style="font-weight:400">${pct0(q.gmFrentes)}</strong>
    </div>
    ${q.bloqueado ? `<span class="badge bloqueado">GM &lt; 20 % — proyecto bloqueado</span>` : ''}`;

  const opcionesDesc = CATALOGO.descuentos.map(d =>
    `<option value="${d.id}" ${d.id === q.s.descuento ? 'selected' : ''}>${d.nombre}</option>`).join('');

  const firmas = q.descuento.aprob === 'ninguna' ? '' : `
    <div class="firmas">
      <button class="firma ${q.s.aprobaciones.tl ? 'ok' : ''}" onclick="aprobar('tl')">
        ${q.s.aprobaciones.tl ? '✓' : '⏳'} TL (${DEMO.tl.nombre})</button>
      ${q.descuento.aprob === 'tl+dir' ? `
      <button class="firma ${q.s.aprobaciones.dir ? 'ok' : ''}" onclick="aprobar('dir')">
        ${q.s.aprobaciones.dir ? '✓' : '⏳'} ${DEMO.dir.nombre}</button>` : ''}
    </div>
    ${q.aprobacionPendiente.length
      ? `<div class="lock">🔒 Sin aprobación el deal no avanza de etapa ni se puede marcar la versión final.</div>`
      : ''}`;

  const campoLibre = q.descuento.tipo === 'libre' ? `
    <div class="am-row">
      <label class="inline" for="dlibre">Importe libre (€)</label>
      <input type="number" id="dlibre" min="0" step="10" value="${q.s.descuentoLibre || 0}"
             onchange="setDescuentoLibre(this.value)">
      <span class="muted" style="font-size:12px">se prorratea a frentes</span>
    </div>` : '';

  const capaAM = `
  <div class="am-only am-box">
    <h3>Capa asesor</h3>
    <div class="am-row gm-row">${gmChip}</div>
    <div class="am-row">
      <label class="inline" for="dsel">Descuento</label>
      <select id="dsel" onchange="setDescuento(this.value)" ${q.firmada ? 'disabled' : ''}>${opcionesDesc}</select>
      ${firmas}
    </div>
    ${campoLibre}
    <div class="am-row">
      <button class="btn secondary" onclick="abrirModalExtra()" ${q.firmada ? 'disabled' : ''}>＋ Añadir fuera de catálogo</button>
      <button class="btn secondary" onclick="stub('Valores enviados al deal #${DEMO.deal.id} — sincronizado hace 2 min.')">Guardar en CRM ✓</button>
      <span class="muted" style="font-size:12px">sincronizado hace 2 min</span>
    </div>
  </div>`;

  /* — 6.3 bloques del quote — */
  const bMobiliario = acc('mobiliario', 'Mobiliario CUBRO',
    `${q.acabado.nombre} · ${q.diseno.nombre} — obligatorio`, b.mobiliario.precio,
    b.mobiliario.elementos.map(e => lineaSinPrecio(e)).join('') +
    `<div class="am-line">Coste interno ${eur(b.mobiliario.coste)} · GM frentes ${pct0(q.gmFrentes)}</div>
     <div class="acc-note">Los elementos se valoran como conjunto: CUBRO no publica precios unitarios de fabricación.</div>`);

  const bEstructura = acc('estructura', 'Estructura de terceros', 'Obligatorio', b.estructura.precio,
    linea(b.estructura.label, eur(b.estructura.precio)) +
    `<div class="am-line">Coste interno ${eur(b.estructura.coste)}</div>
     <div class="acc-note">CUBRO actúa como contratista principal: la estructura va consolidada en una línea, sin desglose de SKU ni precios unitarios de terceros.</div>`);

  const bEncimera = acc('encimera', 'Encimera', 'Obligatorio', b.encimera.precio,
    linea(b.encimera.label, eur(b.encimera.precio)) +
    `<div class="am-line">Coste interno ${eur(b.encimera.coste)}</div>
     <div class="acc-note">El material definitivo se confirma con tu diseñadora.</div>`);

  const lineasElectros = b.electros.aparatos.map(ap => {
    const selects = ap.alternativas.map(alt =>
      `<option value="${alt.id}" ${ap.elegida === alt.id ? 'selected' : ''}>
        ${alt.nombre} (${alt.delta > 0 ? '+' : ''}${eur(alt.delta)})</option>`).join('');
    return `
      ${lineaSinPrecio(ap.nombre)}
      <div class="am-line">
        ${eur(ap.precio)} · coste ${eur(ap.coste)} · GM ${pct0((ap.precio - ap.coste) / ap.precio)}
        &nbsp;<select onchange="setElectro('${ap.slot}', this.value)" ${q.firmada ? 'disabled' : ''}>
          <option value="">${ap.base.nombre} (base)</option>${selects}
        </select>
      </div>`;
  }).join('');

  const bElectros = acc('electros', 'Electrodomésticos',
    `Pack ${b.electros.pack.nombre} — obligatorio`, b.electros.precio,
    lineasElectros +
    `<div class="am-line" style="padding-top:8px">Coste interno del pack ${eur(b.electros.coste)} · GM ${pct0((b.electros.precio - b.electros.coste) / b.electros.precio)}</div>
     <div class="acc-note">El pack se valora completo. Puedes cambiarlo con tu diseñadora en la videollamada.</div>`);

  const bFG = acc('fg', 'Fregadero y grifería', 'Obligatorio', b.fg.precio,
    linea(b.fg.label, eur(b.fg.precio)) +
    `<div class="am-line">Coste interno ${eur(b.fg.coste)}</div>`);

  /* — 6.4 servicios: el corazón — */
  const addonsHTML = b.addons.map(a => `
    <div class="addon ${a.activo ? 'added' : ''}">
      <div>
        <div class="a-name">${a.nombre}</div>
        <div class="am-line">Cálculo: ${a.desglose} · coste ${eur(a.coste)}</div>
      </div>
      <div style="display:flex;gap:14px;align-items:center">
        <span class="a-price num">${a.activo ? '' : '＋ '}${eur(a.precio)}</span>
        <button onclick="toggleAddon('${a.id}')">${a.activo ? 'Quitar' : 'Añadir'}</button>
      </div>
    </div>`).join('');

  const totalServicios = b.montaje.precio + b.logistica.precio
    + b.addons.filter(a => a.activo).reduce((t, a) => t + a.precio, 0);

  const bServicios = acc('servicios', 'Servicios · instalación y entrega',
    'Montaje y logística obligatorios en Full Service', totalServicios,
    linea('Montaje e instalación', eur(b.montaje.precio),
          'Mano de obra y coordinación — incluido en tu Full Service, no se puede quitar') +
    `<div class="am-line">Cálculo: ${b.montaje.desglose} · coste ${eur(b.montaje.coste)}</div>` +
    linea('Logística CUBRO', eur(b.logistica.precio), 'Transporte y entrega — obligatoria') +
    `<div class="am-line">Cálculo: ${b.logistica.desglose} · coste ${eur(b.logistica.coste)}</div>` +
    linea(`Logística IKEA <span class="badge informativo" style="margin-left:8px">informativo</span>`,
          eur(b.logisticaIkea.precio),
          'La abona IKEA en tu pedido — este importe no se paga a CUBRO', 'informativa') +
    `<div class="sub-block">
       <div class="sub-block-title">Añade a tu proyecto</div>
       ${addonsHTML}
     </div>
     <div class="acc-note">
       El montaje, la gestión y la logística CUBRO se pagan a CUBRO. La logística de IKEA se abona
       en tu pedido de IKEA.com y se muestra solo para que veas el coste total.
     </div>`);

  const bFee = acc('fee', 'Gestión de compra IKEA', 'Obligatorio si hay compra IKEA', b.feeGestion.precio,
    linea('Gestión del pedido de estructura en IKEA', eur(b.feeGestion.precio),
          'CUBRO configura, pide y coordina la entrega de la estructura') +
    `<div class="am-line">Coste interno ${eur(b.feeGestion.coste)}</div>`);

  const bExtras = b.extras.length ? acc('extras', 'Fuera de catálogo',
    'Líneas añadidas por tu diseñadora', b.extras.reduce((t, e) => t + e.importe, 0),
    b.extras.map((e, i) => linea(e.concepto, eur(e.importe)) +
      `<div class="am-line">Nota interna: ${e.nota} · <button class="firma" onclick="quitarExtra(${i})">Quitar</button></div>`).join('')) : '';

  /* — 6.5 resumen — */
  const filaDesc = q.importeDescuento > 0
    ? `<div class="sum-row"><div class="k">Descuento · ${q.descuento.nombre}</div>
         <div class="v">−${eur(q.importeDescuento)}</div></div>`
    : '';

  const resumen = `
  <h2 style="margin-top:34px">Resumen CUBRO</h2>
  <div class="sum">
    <div class="sum-row"><div class="k">Subtotal</div><div class="v">${eur(q.subtotal)}</div></div>
    ${filaDesc}
    <div class="sum-row"><div class="k">Base imponible</div><div class="v">${eur(q.base_)}</div></div>
    <div class="sum-row"><div class="k">IVA 21 %</div><div class="v">${eur(q.iva)}</div></div>
    <div class="sum-row total"><div class="k">Total</div><div class="v num">${eur(q.total)}</div></div>
    <div class="hitos">Pago por hitos: 50 % al confirmar · 50 % antes de entrar en producción.
      La logística de IKEA (${eur(b.logisticaIkea.precio)}) no está incluida en este total.</div>
  </div>

  <div class="ctas">
    <button class="btn" onclick="stub('Se abriría el calendario de tu diseñadora ${DEMO.de.nombre} para la videollamada.')">Hazlo realidad — agenda tu videollamada</button>
    <button class="btn secondary" onclick="stub('Solicitud enviada: un experto CUBRO revisa tu proyecto y te escribe.')">Pedir revisión de experto</button>
  </div>

  <div class="comentario">
    <span class="sel-label">Comentario para tu diseñadora</span>
    <textarea placeholder="Cuéntanos dudas, plazos o cambios que tengas en mente…"></textarea>
    <div style="margin-top:10px">
      <button class="btn secondary" onclick="stub('Comentario enviado a ${DEMO.de.nombre} y anotado en el deal.')">Enviar comentario</button>
    </div>
  </div>`;

  /* — 6.6 checkbox versión final (solo AM) — */
  const bloqueaFirma = q.aprobacionPendiente.length > 0;
  const finalBox = `
  <div class="am-only" style="margin-top:30px">
    <div class="final-box ${bloqueaFirma ? 'disabled' : ''}">
      <label>
        <input type="checkbox" ${q.firmada ? 'checked' : ''} ${bloqueaFirma ? 'disabled' : ''}
               onchange="onVersionFinal(this)">
        <span>
          Versión final
          <span class="hint">
            ${bloqueaFirma
              ? 'Bloqueado: falta la aprobación del descuento aplicado.'
              : 'Congela los valores al deal, dispara el email del 50 % y muestra a la clienta el sello “Versión firmada por diseñador”. Invisible para ella como checkbox.'}
          </span>
        </span>
      </label>
    </div>
    <div class="final-box disabled" style="margin-top:-1px">
      <label>
        <input type="checkbox" disabled>
        <span>Versión final DE<span class="hint">La marca Diseño al validar el proyecto.</span></span>
      </label>
    </div>
  </div>`;

  document.getElementById('proj').innerHTML =
    cabecera + hero + capaAM +
    bMobiliario + bEstructura + bEncimera + bElectros + bFG + bServicios + bFee + bExtras +
    resumen + finalBox;

  document.getElementById('proj').classList.toggle('congelada', q.firmada);
}

/* ---------- acciones ---------- */

function cambiarVersion(vid) {
  state().versionActual = vid;
  saveState();
  render();
  toast(`Cargando ${vid} · ${baseVersion(vid).fecha} — presupuesto recalculado.`);
}

function onDuplicar() {
  const nuevo = duplicarVersion();
  render();
  toast(`${nuevo} creada y marcada como actual. Nada heredó: sin descuento, pack de entrada, add-ons desmarcados.`);
}

function setDiseno(id)  { if (bloqueadoPorFirma()) return; state().versiones[versionActual()].diseno = id; saveState(); render(); toast('Recalculando tu proyecto…'); }
function setAcabado(id) { if (bloqueadoPorFirma()) return; state().versiones[versionActual()].acabado = id; saveState(); render(); toast('Recalculando tu proyecto…'); }

function bloqueadoPorFirma() {
  if (computeQuote(versionActual()).firmada) {
    toast('Versión firmada por diseñador: está congelada. Duplícala para hacer cambios.');
    return true;
  }
  return false;
}

function toggleAddon(id) {
  if (bloqueadoPorFirma()) return;
  const s = state().versiones[versionActual()];
  s.addons[id] ? delete s.addons[id] : (s.addons[id] = true);
  saveState();
  render();
  const a = CATALOGO.addons.find(x => x.id === id);
  toast(`${s.addons[id] ? 'Añadido' : 'Quitado'}: ${a.nombre} · total actualizado.`);
}

function setDescuento(id) {
  const s = state().versiones[versionActual()];
  s.descuento = id;
  s.aprobaciones = { tl: false, dir: false };
  saveState();
  render();
  const d = CATALOGO.descuentos.find(x => x.id === id);
  toast(d.aprob === 'ninguna'
    ? `Descuento aplicado: ${d.nombre}.`
    : `${d.nombre} requiere aprobación (${d.aprob === 'tl' ? 'TL' : 'TL + dirección'}).`);
}

function setDescuentoLibre(v) {
  state().versiones[versionActual()].descuentoLibre = Math.max(0, parseInt(v, 10) || 0);
  saveState();
  render();
}

function aprobar(quien) {
  const s = state().versiones[versionActual()];
  if (s.aprobaciones[quien]) return;
  s.aprobaciones[quien] = true;
  saveState();
  render();
  toast(`Aprobación registrada: ${quien === 'tl' ? 'TL ' + DEMO.tl.nombre : DEMO.dir.nombre}.`);
}

function setElectro(slot, altId) {
  if (bloqueadoPorFirma()) return;
  const s = state().versiones[versionActual()];
  altId ? (s.electros[slot] = altId) : delete s.electros[slot];
  saveState();
  render();
  toast('Aparato cambiado · pack, subtotal y margen recalculados.');
}

function onVersionFinal(el) {
  const s = state().versiones[versionActual()];
  if (el.checked) {
    if (!confirm('¿Marcar esta versión como final?\n\nSe congelan los valores al deal, se envía el email del 50 % y la clienta verá el sello "Versión firmada por diseñador".')) {
      el.checked = false;
      return;
    }
    s.firmada = true;
    saveState();
    render();
    toast('Valores congelados al deal #' + DEMO.deal.id + ' · email de pago del 50 % enviado.', 4200);
  } else {
    s.firmada = false;
    saveState();
    render();
    toast('Versión desmarcada: vuelve a estar editable.');
  }
}

/* — modal fuera de catálogo — */
function abrirModalExtra() {
  document.getElementById('modalExtra').classList.add('on');
  document.getElementById('mConcepto').value = '';
  document.getElementById('mImporte').value = '';
  document.getElementById('mNota').value = '';
  document.getElementById('mErr').classList.remove('on');
}
function cerrarModalExtra() { document.getElementById('modalExtra').classList.remove('on'); }

function guardarExtra() {
  const concepto = document.getElementById('mConcepto').value.trim();
  const importe  = parseInt(document.getElementById('mImporte').value, 10);
  const nota     = document.getElementById('mNota').value.trim();
  const err      = document.getElementById('mErr');

  if (!concepto || !importe || importe <= 0 || !nota) {
    err.textContent = 'Concepto, importe (> 0) y nota interna son obligatorios.';
    err.classList.add('on');
    return;
  }
  state().versiones[versionActual()].extras.push({ concepto, importe, nota });
  saveState();
  abiertos.add('extras');
  cerrarModalExtra();
  render();
  toast('Línea fuera de catálogo añadida y marcada para revisión.');
}

function quitarExtra(i) {
  state().versiones[versionActual()].extras.splice(i, 1);
  saveState();
  render();
}

/* ---------- arranque ---------- */
document.addEventListener('DOMContentLoaded', () => {
  renderChrome('projects');
  render();
});
document.addEventListener('cubro:rol', render);
