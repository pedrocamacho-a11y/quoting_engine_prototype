/* ============================================================
   CUBRO · prototipo — project.js
   Pantalla reina: detalle de proyecto + QUOTE (SPEC §6).
   Todo se re-renderiza desde computeQuote(); no hay importes en el HTML.
   ============================================================ */

const abiertos = new Set(['servicios']);

function toggleAcc(id) { abiertos.has(id) ? abiertos.delete(id) : abiertos.add(id); render(); }

function linea(l) {
  const precio = l.sinPrecio ? 'incluido' : eur(l.precio);
  return `<div class="line ${l.sinPrecio ? 'sin-precio' : ''} ${l.informativa ? 'informativa' : ''}">
      <div>${l.nombre}${l.informativa ? ' <span class="badge informativo" style="margin-left:8px">informativo</span>' : ''}
        ${l.sub ? `<span class="sub">${l.sub}</span>` : ''}</div>
      <div class="price num">${precio}</div>
    </div>
    ${l.desglose ? `<div class="am-line">Cálculo: ${l.desglose} · coste ${eur(l.coste)}</div>` : ''}
    ${l.nota !== undefined && l.idx !== undefined
      ? `<div class="am-line">Nota interna: ${l.nota} · <button class="firma" onclick="quitarExtra(${l.idx})">Quitar</button></div>` : ''}`;
}

function render() {
  const p = proyectoActual();
  if (!p) { location.href = href('home.html'); return; }

  const q = computeQuote(p, p.versionActual);
  const b = q.bloques;

  /* — 6.1 cabecera + selector de versiones — */
  const chips = p.orden.map(vid => {
    const on = vid === p.versionActual;
    return `<button class="vchip ${on ? 'on' : ''}" onclick="cambiarVersion('${vid}')">
      ${vid} · ${p.bases[vid].fecha}${on ? '<span class="dot">●</span>' : ''}</button>`;
  }).join('');

  const sello = q.firmada
    ? '<span class="badge firmada">Versión firmada por diseñador</span>'
    : '<span class="badge edicion">En edición</span>';

  const dirTxt = p.direccion
    ? `${p.direccion} · ${p.cp} ${p.ciudad}${p.barrio ? ` (${p.barrio})` : ''}`
    : `${p.cp} ${p.ciudad}${p.barrio ? ` (${p.barrio})` : ''} — <button class="lnk" onclick="pedirDireccion()">añadir dirección exacta</button>`;

  const cabecera = `
  <div class="proj-head">
    <div>
      <div class="proj-title"><h1>${p.nombre}</h1><span class="proj-ref">Proyecto #${p.ref}</span></div>
      <div class="proj-dir">Entrega: ${dirTxt}
        <span class="muted"> — el CP determina IVA y logística</span></div>
      <div class="proj-dir">Mercado ${q.mercado.nombre} (${p.pais}) · modalidad ${p.modalidad} ·
        IVA ${pct0(q.mercado.iva)} · zona logística ${p.zona} · diseñadora: ${DEMO.de.nombre}</div>
    </div>
    <div class="proj-actions">
      <button class="btn secondary" onclick="stub('Se abriría el planner: el diseño se edita ahí, nunca el presupuesto.')">✏️ Editar diseño en el planner</button>
      <button class="btn secondary" onclick="onDuplicar()">Duplicar versión</button>
    </div>
  </div>
  <div class="versions">${chips} <span style="margin-left:16px">${sello}</span></div>
  <div class="vmeta"><strong style="font-weight:400">${q.base.id} · ${q.base.fechaLarga}</strong> — ${q.base.autor}. ${q.base.nota}</div>`;

  /* — 6.2 hero — */
  const fichas = (lista, sel, fn) => lista.map(x =>
    `<button class="ficha ${x.id === sel ? 'on' : ''}" ${q.firmada ? 'disabled' : ''} onclick="${fn}('${x.id}')">${x.nombre}</button>`).join('');

  const hero = `
  <div class="hero">
    <div class="hero-img"><span>Render del diseño · ${q.acabado.nombre} / ${q.diseno.nombre}</span></div>
    <div class="hero-side">
      <span class="sel-label">Diseño</span>
      <div class="fichas">${fichas(CATALOGO.disenos, q.s.diseno, 'setDiseno')}</div>
      <span class="sel-label">Acabado</span>
      <div class="fichas">${fichas(CATALOGO.acabados, q.s.acabado, 'setAcabado')}</div>
      <p class="muted" style="font-size:12px">${q.firmada
        ? 'Esta versión está firmada y congelada: para probar otro acabado, abre una versión anterior o duplica esta.'
        : 'Cambiar diseño o acabado revalora el proyecto completo al instante.'}</p>
    </div>
  </div>`;

  /* — 6.6 capa AM — */
  const opciones = CATALOGO.descuentos.map(d =>
    `<option value="${d.id}" ${d.id === q.s.descuento ? 'selected' : ''}>${d.nombre}</option>`).join('');

  const firmas = q.descuento.aprob === 'ninguna' ? '' : `
    <div class="firmas">
      <button class="firma ${q.s.aprobaciones.tl ? 'ok' : ''}" onclick="aprobar('tl')">${q.s.aprobaciones.tl ? '✓' : '⏳'} TL (${DEMO.tl.nombre})</button>
      ${q.descuento.aprob === 'tl+dir' ? `<button class="firma ${q.s.aprobaciones.dir ? 'ok' : ''}" onclick="aprobar('dir')">${q.s.aprobaciones.dir ? '✓' : '⏳'} ${DEMO.dir.nombre}</button>` : ''}
    </div>
    ${q.aprobacionPendiente.length ? '<div class="lock">🔒 Sin aprobación el deal no avanza de etapa ni se puede marcar la versión final.</div>' : ''}`;

  const capaAM = `
  <div class="am-only am-box">
    <h3>Capa asesor</h3>
    <div class="am-row gm-row">
      <div class="gm-chip ${q.bloqueado ? 'alerta' : ''}">GM teórico proyecto:
        <strong style="font-weight:400">${pct0(q.gm)}</strong> · frentes:
        <strong style="font-weight:400">${pct0(q.gmFrentes)}</strong></div>
      ${q.bloqueado ? '<span class="badge bloqueado">GM &lt; 20 % — proyecto bloqueado</span>' : ''}
    </div>
    <div class="am-row">
      <label class="inline" for="dsel">Descuento</label>
      <select id="dsel" onchange="setDescuento(this.value)" ${q.firmada ? 'disabled' : ''}>${opciones}</select>
      ${firmas}
    </div>
    ${q.descuento.tipo === 'libre' ? `
    <div class="am-row">
      <label class="inline" for="dlibre">Importe libre (€)</label>
      <input type="number" id="dlibre" min="0" step="10" value="${q.s.descuentoLibre || 0}" onchange="setDescuentoLibre(this.value)">
      <span class="muted" style="font-size:12px">se prorratea a frentes</span>
    </div>` : ''}
    <div class="am-row">
      <button class="btn secondary" onclick="abrirModalExtra()" ${q.firmada ? 'disabled' : ''}>＋ Añadir fuera de catálogo</button>
      <button class="btn secondary" onclick="stub('Valores enviados al deal #${DEMO.deal.id} — sincronizado.')">Guardar en CRM ✓</button>
      <span class="muted" style="font-size:12px">sincronizado hace 2 min</span>
    </div>
  </div>`;

  /* — 6.3 / 6.4 bloques — */
  const bloquesHTML = b.map(bl => {
    const open = abiertos.has(bl.id);
    let cuerpo = bl.lineas.map(linea).join('');

    if (bl.id === 'electros') {
      cuerpo = bl.electros.aparatos.map(ap => `
        ${linea({ nombre: ap.nombre, sinPrecio: true })}
        <div class="am-line">${eur(ap.precio)} · coste ${eur(ap.coste)} · GM ${pct0((ap.precio - ap.coste) / ap.precio)}
          &nbsp;<select onchange="setElectro('${ap.slot}', this.value)" ${q.firmada ? 'disabled' : ''}>
            <option value="">${ap.base.nombre} (base)</option>
            ${ap.alternativas.map(a => `<option value="${a.id}" ${ap.elegida === a.id ? 'selected' : ''}>${a.nombre} (${a.delta > 0 ? '+' : ''}${eur(a.delta)})</option>`).join('')}
          </select></div>`).join('');
    }

    if (bl.addons && bl.addons.length) {
      cuerpo += `<div class="sub-block"><div class="sub-block-title">Añade a tu proyecto</div>` +
        bl.addons.map(a => `
          <div class="addon ${a.activo ? 'added' : ''}">
            <div>
              <div class="a-name">${a.nombre}</div>
              <div class="am-line">Cálculo: ${a.desglose} · coste ${eur(a.coste)}</div>
            </div>
            <div style="display:flex;gap:14px;align-items:center">
              <span class="a-price num">${a.activo ? '' : '＋ '}${eur(a.precio)}</span>
              <button onclick="toggleAddon('${a.id}')">${a.activo ? 'Quitar' : 'Añadir'}</button>
            </div>
          </div>`).join('') + `</div>`;
    }

    if (bl.coste) cuerpo += `<div class="am-line" style="padding-top:8px">Coste interno del bloque ${eur(bl.coste)} · GM ${pct0((bl.precio - bl.coste) / bl.precio)}</div>`;
    if (bl.nota) cuerpo += `<div class="acc-note">${bl.nota}</div>`;

    return `
    <div class="acc ${open ? 'open' : ''}">
      <div class="acc-head" onclick="toggleAcc('${bl.id}')">
        <div>
          <div class="acc-title">${bl.titulo}</div>
          <div class="acc-sub">${bl.sub ? bl.sub + ' — ' : ''}${bl.estado}</div>
        </div>
        <div class="acc-total num">${eur(bl.precio)}</div>
        <div class="chev">${open ? '—' : '+'}</div>
      </div>
      <div class="acc-body">${cuerpo}</div>
    </div>`;
  }).join('');

  /* — 6.5 resumen — */
  const resumen = `
  <h2 style="margin-top:34px">Resumen CUBRO</h2>
  <div class="sum">
    <div class="sum-row"><div class="k">Subtotal</div><div class="v">${eur(q.subtotal)}</div></div>
    ${q.importeDescuento > 0 ? `<div class="sum-row"><div class="k">Descuento · ${q.descuento.nombre}</div><div class="v">−${eur(q.importeDescuento)}</div></div>` : ''}
    <div class="sum-row"><div class="k">Base imponible</div><div class="v">${eur(q.base_)}</div></div>
    <div class="sum-row"><div class="k">IVA ${pct0(q.mercado.iva)}</div><div class="v">${eur(q.iva)}</div></div>
    <div class="sum-row total"><div class="k">Total</div><div class="v num">${eur(q.total)}</div></div>
    <div class="hitos">Pago por hitos: 50 % al confirmar · 50 % antes de entrar en producción.${
      q.base.estructura ? ' La logística de IKEA (100 €) no está incluida en este total.' : ''}</div>
  </div>

  <div class="ctas">
    <button class="btn" onclick="stub('Se abriría el calendario de ${DEMO.de.nombre} para la videollamada.')">Hazlo realidad — agenda tu videollamada</button>
    <button class="btn secondary" onclick="stub('Solicitud enviada: un experto CUBRO revisa tu proyecto y te escribe.')">Pedir revisión de experto</button>
    ${q.firmada ? `<button class="btn secondary" onclick="onPagar()">Pagar el 50 % y confirmar</button>` : ''}
  </div>

  <div class="comentario">
    <span class="sel-label">Comentario para tu diseñadora</span>
    <textarea placeholder="Cuéntanos dudas, plazos o cambios que tengas en mente…"></textarea>
    <div style="margin-top:10px">
      <button class="btn secondary" onclick="stub('Comentario enviado a ${DEMO.de.nombre} y anotado en el deal.')">Enviar comentario</button>
    </div>
  </div>`;

  const bloqueaFirma = q.aprobacionPendiente.length > 0;
  const finalBox = `
  <div class="am-only" style="margin-top:30px">
    <div class="final-box ${bloqueaFirma ? 'disabled' : ''}">
      <label><input type="checkbox" ${q.firmada ? 'checked' : ''} ${bloqueaFirma ? 'disabled' : ''} onchange="onVersionFinal(this)">
        <span>Versión final<span class="hint">${bloqueaFirma
          ? 'Bloqueado: falta la aprobación del descuento aplicado.'
          : 'Congela los valores al deal, dispara el email del 50 % y muestra a la clienta el sello “Versión firmada por diseñador”. Invisible para ella como checkbox.'}</span></span></label>
    </div>
    <div class="final-box disabled" style="margin-top:-1px">
      <label><input type="checkbox" disabled>
        <span>Versión final DE<span class="hint">La marca Diseño al validar el proyecto.</span></span></label>
    </div>
  </div>`;

  document.getElementById('proj').innerHTML = cabecera + hero + capaAM + bloquesHTML + resumen + finalBox;
  document.getElementById('proj').classList.toggle('congelada', q.firmada);
}

/* ---------- acciones ---------- */

const pv = () => proyectoActual().versiones[proyectoActual().versionActual];

function cambiarVersion(vid) {
  const p = proyectoActual(); p.versionActual = vid; saveState(); render();
  toast(`Cargando ${vid} · ${p.bases[vid].fecha} — presupuesto recalculado.`);
}
function onDuplicar() {
  const nuevo = duplicarVersion(); render();
  toast(`${nuevo} creada y marcada como actual. Nada heredó: sin descuento, pack de entrada, add-ons desmarcados.`, 4200);
}
function congelada() {
  const p = proyectoActual();
  if (computeQuote(p, p.versionActual).firmada) {
    toast('Versión firmada por diseñador: está congelada. Duplícala para hacer cambios.');
    return true;
  }
  return false;
}
function setDiseno(id)  { if (congelada()) return; pv().diseno = id; saveState(); render(); toast('Recalculando tu proyecto…'); }
function setAcabado(id) { if (congelada()) return; pv().acabado = id; saveState(); render(); toast('Recalculando tu proyecto…'); }

function toggleAddon(id) {
  if (congelada()) return;
  const s = pv();
  s.addons[id] ? delete s.addons[id] : (s.addons[id] = true);
  saveState(); render();
  const a = CATALOGO.addons.find(x => x.id === id);
  toast(`${s.addons[id] ? 'Añadido' : 'Quitado'}: ${a.nombre} · total actualizado.`);
}
function setDescuento(id) {
  const s = pv(); s.descuento = id; s.aprobaciones = { tl: false, dir: false };
  saveState(); render();
  const d = CATALOGO.descuentos.find(x => x.id === id);
  toast(d.aprob === 'ninguna' ? `Descuento aplicado: ${d.nombre}.`
    : `${d.nombre} requiere aprobación (${d.aprob === 'tl' ? 'TL' : 'TL + dirección'}).`);
}
function setDescuentoLibre(v) { pv().descuentoLibre = Math.max(0, parseInt(v, 10) || 0); saveState(); render(); }
function aprobar(quien) {
  const s = pv(); if (s.aprobaciones[quien]) return;
  s.aprobaciones[quien] = true; saveState(); render();
  toast(`Aprobación registrada: ${quien === 'tl' ? 'TL ' + DEMO.tl.nombre : DEMO.dir.nombre}.`);
}
function setElectro(slot, altId) {
  if (congelada()) return;
  const s = pv(); altId ? (s.electros[slot] = altId) : delete s.electros[slot];
  saveState(); render(); toast('Aparato cambiado · pack, subtotal y margen recalculados.');
}

function onVersionFinal(el) {
  const s = pv();
  if (el.checked) {
    if (!confirm('¿Marcar esta versión como final?\n\nSe congelan los valores al deal, se envía el email del 50 % y la clienta verá el sello "Versión firmada por diseñador".')) {
      el.checked = false; return;
    }
    s.firmada = true; saveState(); render();
    toast(`Valores congelados al deal #${DEMO.deal.id} · email de pago del 50 % enviado.`, 4200);
  } else {
    s.firmada = false; saveState(); render();
    toast('Versión desmarcada: vuelve a estar editable.');
  }
}

function pedirDireccion() {
  const p = proyectoActual();
  const d = prompt('Dirección exacta de entrega (calle y número):', '');
  if (d && d.trim()) { p.direccion = d.trim(); saveState(); render(); toast('Dirección guardada en el proyecto.'); }
}

/* Stub de pago: crea el pedido y lleva a My orders (SPEC §5.4). */
function onPagar() {
  const p = proyectoActual();
  const q = computeQuote(p, p.versionActual);
  state().pedido = {
    ref: 'O-' + p.ref.split('-')[1], proyecto: p.id, nombre: p.nombre,
    total: q.total, pagado: Math.round(q.total / 2), fecha: hoyLargo(),
    direccion: p.direccion || `${p.cp} ${p.ciudad}`, etapa: 2
  };
  saveState();
  toast('Pago del 50 % simulado. En el sistema real aquí entraría la pasarela.', 4000);
  setTimeout(() => location.href = href('orders.html'), 900);
}

/* — modal fuera de catálogo — */
function abrirModalExtra() {
  document.getElementById('modalExtra').classList.add('on');
  ['mConcepto', 'mImporte', 'mNota'].forEach(i => document.getElementById(i).value = '');
  document.getElementById('mErr').classList.remove('on');
}
function cerrarModalExtra() { document.getElementById('modalExtra').classList.remove('on'); }
function guardarExtra() {
  const concepto = document.getElementById('mConcepto').value.trim();
  const importe = parseInt(document.getElementById('mImporte').value, 10);
  const nota = document.getElementById('mNota').value.trim();
  const err = document.getElementById('mErr');
  if (!concepto || !importe || importe <= 0 || !nota) {
    err.textContent = 'Concepto, importe (> 0) y nota interna son obligatorios.';
    err.classList.add('on'); return;
  }
  pv().extras.push({ concepto, importe, nota });
  saveState(); abiertos.add('extras'); cerrarModalExtra(); render();
  toast('Línea fuera de catálogo añadida y marcada para revisión.');
}
function quitarExtra(i) { pv().extras.splice(i, 1); saveState(); render(); }

document.addEventListener('DOMContentLoaded', () => { renderChrome('projects'); render(); });
document.addEventListener('cubro:rol', render);
