/* ============================================================
   CUBRO · prototipo — crear.js
   Flujo de creación de proyecto: los dos caminos de la §5.2 + el
   cuestionario mínimo que el pricing engine necesita para valorar.
   Se inyecta como overlay, así lo usan Home, My projects e Inspo.
   ============================================================ */

const CAMINOS = [
  { id: 'cubro', kicker: 'Diseñar desde cero', titulo: 'Abre el planner de CUBRO',
    sub: 'Dibujas tu espacio y ves el presupuesto actualizarse mientras diseñas. Sin saber de cocinas.',
    cta: 'Empezar a diseñar', accion: "abrirCrear('cubro')" },
  { id: 'ikea', kicker: 'Ya tengo un diseño', titulo: 'Trae tu diseño de IKEA',
    sub: 'Pega el enlace de tu planificador de IKEA. Lo leemos y te damos el precio con frentes CUBRO.',
    cta: 'Pegar mi enlace', accion: "abrirCrear('ikea')" }
];

/* Sólo pedimos lo que cambia el precio: país (IVA y modalidad) y código postal
   (zona logística y nombre del proyecto). La dirección exacta se pide después. */
let CREAR = { origen: 'cubro', plantilla: 'cubro_cero', paso: 2, escaneado: false };

function abrirCrear(origen = 'cubro') {
  CREAR = {
    origen,
    plantilla: origen === 'ikea' ? 'ikea_link' : 'cubro_cero',
    paso: 2, escaneado: false
  };
  pintarCrear();
}

function empezarDesdeInspo(plantillaId) {
  CREAR = { origen: 'inspo', plantilla: plantillaId, paso: 2, escaneado: true };
  toast(`Duplicando «${PLANTILLAS[plantillaId].nombre} — ${PLANTILLAS[plantillaId].barrio}» a tu cuenta…`);
  pintarCrear();
}

function cerrarCrear() {
  const el = document.getElementById('crearBg');
  if (el) el.classList.remove('on');
}

function contenedorCrear() {
  let el = document.getElementById('crearBg');
  if (!el) {
    el = document.createElement('div');
    el.id = 'crearBg';
    el.className = 'modal-bg';
    el.innerHTML = '<div class="modal wizard" id="crearBox"></div>';
    document.body.appendChild(el);
  }
  el.classList.add('on');
  return document.getElementById('crearBox');
}

function pintarCrear() {
  const box = contenedorCrear();
  box.innerHTML = CREAR.paso === 2 ? pasoDatos() : pasoHecho();
  if (CREAR.paso === 2) setTimeout(() => document.getElementById('cCp')?.focus(), 60);
}

/* — paso 2: el cuestionario — */
function pasoDatos() {
  const pl = PLANTILLAS[CREAR.plantilla];
  const kicker = CREAR.origen === 'ikea' ? 'Tu diseño de IKEA'
    : CREAR.origen === 'inspo' ? `Punto de partida: ${pl.nombre} — ${pl.barrio}`
    : 'Diseño desde cero en el planner CUBRO';

  const campoLink = CREAR.origen === 'ikea' ? `
    <div class="f">
      <label for="cLink">Enlace de tu planificador de IKEA</label>
      <div class="f-row">
        <input type="text" id="cLink" placeholder="https://www.ikea.com/es/es/planner/...">
        <button class="btn secondary" onclick="escanear()">Escanear</button>
      </div>
      <span class="f-hint" id="cLinkHint">${CREAR.escaneado
        ? '✓ Diseño leído: 12 frentes sobre estructura Metod.'
        : 'Pega el enlace y pulsa Escanear. Leemos las medidas y los módulos.'}</span>
    </div>` : '';

  return `
    <span class="w-kicker">${kicker}</span>
    <h2>¿Dónde montamos tu cocina?</h2>
    <p class="muted" style="margin-bottom:20px">Con el país y el código postal ya podemos darte el
      precio final, con IVA y logística incluidos. Nada de «desde».</p>

    ${campoLink}

    <div class="f">
      <label for="cPais">País de entrega</label>
      <select id="cPais" onchange="onPais()">
        ${Object.values(MERCADOS).map(m =>
          `<option value="${m.id}">${m.nombre} — IVA ${pct0(m.iva)} · ${m.modalidad}</option>`).join('')}
      </select>
      <span class="f-hint" id="cPaisHint">En España el montaje va siempre incluido en tu Full Service.</span>
    </div>

    <div class="f">
      <label for="cCp">Código postal</label>
      <input type="text" id="cCp" inputmode="numeric" maxlength="5" placeholder="28010"
             oninput="onCp()" onblur="onCp()">
      <span class="f-hint" id="cCpHint">Cinco dígitos. Determina el IVA y tu zona de logística.</span>
    </div>

    <div class="f" id="cCiudadF" style="display:none">
      <label for="cCiudad">Ciudad</label>
      <input type="text" id="cCiudad" placeholder="París">
      <span class="f-hint">No tenemos ese código postal en nuestra base todavía: dinos la ciudad.</span>
    </div>

    <div class="f">
      <label>¿Qué quieres reformar?</label>
      <div class="opts" id="cTipo">
        ${CATALOGO.tiposProyecto.map((t, i) => `
          <button class="opt ${i === 0 ? 'on' : ''}" data-tipo="${t.id}" onclick="pickTipo('${t.id}')">
            <span class="opt-t">${t.nombre}</span>
            <span class="opt-s">${t.sub}</span>
          </button>`).join('')}
      </div>
    </div>

    <div class="f">
      <label for="cDir">Dirección exacta <span class="muted">— opcional, puedes añadirla después</span></label>
      <input type="text" id="cDir" placeholder="C/ Sagunto 14">
    </div>

    <div class="err" id="cErr"></div>
    <div class="modal-actions">
      <button class="btn ghost" onclick="cerrarCrear()">Cancelar</button>
      <button class="btn" onclick="crear()">Crear mi proyecto</button>
    </div>`;
}

function escanear() {
  const link = document.getElementById('cLink').value.trim();
  if (!/^https?:\/\/.+/i.test(link)) {
    document.getElementById('cLinkHint').textContent = 'Eso no parece un enlace. Debe empezar por https://';
    document.getElementById('cLinkHint').classList.add('bad');
    return;
  }
  toast('Leyendo tu diseño… presupuesto en segundos.');
  CREAR.escaneado = true;
  const h = document.getElementById('cLinkHint');
  h.textContent = '✓ Diseño leído: 12 frentes sobre estructura Metod.';
  h.classList.remove('bad');
}

function onPais() {
  const m = MERCADOS[document.getElementById('cPais').value];
  const h = document.getElementById('cPaisHint');
  h.textContent = m.especificado
    ? 'En España el montaje va siempre incluido en tu Full Service.'
    : `En ${m.nombre} la modalidad es ${m.modalidad}: CUBRO entrega, el montaje no va incluido.`;
  onCp();
}

/* Validación de formato en vivo — el fail-safe que pide la §5.6. */
function onCp() {
  const inp = document.getElementById('cCp');
  const hint = document.getElementById('cCpHint');
  const pais = document.getElementById('cPais').value;
  const val = inp.value.trim();

  if (!val) {
    inp.classList.remove('bad', 'good');
    hint.className = 'f-hint';
    hint.textContent = 'Cinco dígitos. Determina el IVA y tu zona de logística.';
    return false;
  }
  if (!/^\d{5}$/.test(val)) {
    inp.classList.add('bad'); inp.classList.remove('good');
    hint.className = 'f-hint bad';
    hint.textContent = 'Un código postal son cinco dígitos, sin puntos ni letras.';
    return false;
  }
  const geo = resolverCP(pais, val);
  const conocido = !!geo.barrio;
  inp.classList.add('good'); inp.classList.remove('bad');
  hint.className = 'f-hint good';
  hint.textContent = conocido
    ? `${geo.barrio}, ${geo.ciudad} · zona logística ${geo.zona}`
    : `Zona logística ${geo.zona}`;

  /* Si el CP no está en la base, pedimos la ciudad: el proyecto se nombra con ella. */
  document.getElementById('cCiudadF').style.display = conocido ? 'none' : 'block';
  return true;
}

function pickTipo(id) {
  document.querySelectorAll('#cTipo .opt').forEach(b => b.classList.toggle('on', b.dataset.tipo === id));
}

function crear() {
  const err = document.getElementById('cErr');
  const pais = document.getElementById('cPais').value;
  const cp = document.getElementById('cCp').value.trim();
  const tipo = document.querySelector('#cTipo .opt.on').dataset.tipo;
  const direccion = document.getElementById('cDir').value.trim();

  if (CREAR.origen === 'ikea' && !CREAR.escaneado) {
    err.textContent = 'Pega el enlace de tu diseño de IKEA y pulsa Escanear.';
    err.classList.add('on'); return;
  }
  if (!onCp()) {
    err.textContent = 'Necesitamos un código postal válido para calcular tu precio.';
    err.classList.add('on'); return;
  }
  const pideCiudad = document.getElementById('cCiudadF').style.display !== 'none';
  const ciudad = pideCiudad ? document.getElementById('cCiudad').value.trim() : '';
  if (pideCiudad && !ciudad) {
    err.textContent = 'Dinos la ciudad: no tenemos ese código postal en nuestra base.';
    err.classList.add('on'); return;
  }
  err.classList.remove('on');

  const p = crearProyecto({ plantilla: CREAR.plantilla, pais, cp, tipo, direccion, ciudad, origen: CREAR.origen });
  CREAR.paso = 3;
  CREAR.proyecto = p.id;
  pintarCrear();
}

/* — paso 3: confirmación. El sistema nombra el proyecto (§5.2) — */
function pasoHecho() {
  const p = proyectos().find(x => x.id === CREAR.proyecto);
  const q = computeQuote(p, 'V1');
  const siguiente = CREAR.origen === 'cubro'
    ? 'Tu planner ya está creado y listo para que dibujes. Mientras diseñas, el presupuesto se recalcula solo.'
    : CREAR.origen === 'ikea'
      ? 'Hemos valorado el diseño que nos has traído. Revísalo y ajústalo con tu diseñadora.'
      : 'Hemos duplicado la cocina de Inspo a tu cuenta. Ya es tuya: cámbiale lo que quieras.';

  return `
    <span class="w-kicker">Proyecto creado</span>
    <h2>${p.nombre}</h2>
    <p class="muted">Le hemos puesto nombre por su ubicación y le hemos asignado la referencia
      <strong style="font-weight:400">#${p.ref}</strong>. ${siguiente}</p>

    <div class="sum" style="margin-top:20px">
      <div class="sum-row"><div class="k">Entrega</div><div class="v">${p.cp} ${p.ciudad}${p.barrio ? ` (${p.barrio})` : ''}</div></div>
      <div class="sum-row"><div class="k">Mercado</div><div class="v">${q.mercado.nombre} · ${p.modalidad} · IVA ${pct0(q.mercado.iva)}</div></div>
      <div class="sum-row total"><div class="k">Presupuesto V1</div><div class="v num">${eur(q.total)}</div></div>
    </div>

    <div class="modal-actions">
      ${CREAR.origen === 'cubro'
        ? `<button class="btn ghost" onclick="stub('Se abriría el planner 3D de CUBRO.')">Abrir el planner</button>` : ''}
      <button class="btn" onclick="irAlProyecto()">Ver mi presupuesto</button>
    </div>`;
}

function irAlProyecto() {
  abrirProyecto(CREAR.proyecto);
  location.href = href('project.html');
}
