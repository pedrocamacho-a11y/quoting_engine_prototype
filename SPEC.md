# PROTOTIPO CUBRO · SPEC MAESTRA
**v1.0 · 2-ago-2026 · dueño: Pedro Camacho** · Fuentes: ingeniería inversa de Plum Living (Claude in Chrome, 31-jul) + prototipos de Jorge (Quoting ACTUAL / NPD) + working pages WP-2/3/4/7 del Notion + CONTEXTO v2.1.

---

## 0 · CÓMO USAR ESTE ARCHIVO (instrucciones para Claude Code)

Eres Claude Code y vas a construir un **prototipo navegable estático** (HTML/CSS/JS vanilla, sin frameworks, sin build) del portal de venta de CUBRO. Este archivo es tu única fuente de verdad; si algo no está aquí, pregunta antes de inventar.

**Reglas de construcción:**
1. Un archivo HTML por pantalla (rutas abajo, §4). CSS compartido: `cubro-identity.css` (se entrega junto a este archivo — contiene la tipografía Favorit real embebida y todos los tokens; **no sustituyas la fuente ni añadas border-radius jamás**). JS compartido: `app.js` con los datos de demo (§11) y la lógica de rol.
2. **Dos roles sobre las mismas pantallas**: `?role=cliente` (default) y `?role=am`. El rol se guarda en una variable JS en memoria y añade la clase `role-am` al `<body>`. Todo lo interno lleva clase `am-only`. Hay un toggle flotante de rol (clase `.role-toggle` del kit) SOLO para la demo.
3. Los datos viven en `app.js` como objeto `DEMO` (§11). Nada hardcodeado en el HTML que esté en los datos.
4. Interacciones que DEBEN funcionar de verdad: navegación entre páginas, acordeones del quote, selector de versiones, add-ons de servicio (añadir/quitar recalcula subtotal, descuento, IVA y total en vivo), selector de escenario de descuento (vista AM, recalcula), checkbox "versión final" (vista AM → aparece el sello "Versión firmada por diseñador" y se bloquea la edición visual), toggle de rol.
5. Todo lo demás (planner 3D, pagos, HubSpot real) son **stubs**: botones que muestran un toast explicando qué haría el sistema real. Toast = barra negra inferior, 3 segundos.
6. Idioma: español de España para el copy de cliente. Números con punto de miles y coma decimal (14.850 €). IVA 21%.
7. Responsive razonable (usable en un portátil y presentable en móvil), sin obsesionarse.

---

## 1 · CONTEXTO DE NEGOCIO (léelo: explica cada decisión de UI)

**CUBRO** vende cocinas y mobiliario en dos familias: **NPD** (producto propio fabricado por Schmidt, se diseña en un planner 3D de la web de CUBRO) y **producto actual / P2** (frentes y paneles CUBRO montados sobre estructuras de IKEA — Metod cocinas, PAX armarios). Ticket medio 6.000–7.000 €: la gente **no compra sin hablar con alguien**, así que el checkout no cobra: el CTA es **"Hazlo realidad"** → videollamada con un diseñador.

**La arquitectura**: el cliente diseña en el **planner** → el **Pricing Engine** valora el diseño → el presupuesto aterriza en su **portal/carrito** organizado en bloques → **HubSpot** recibe los eventos (negocio, valores congelados, carritos abandonados). Una sola cuenta CUBRO por cliente.

**El AM (Account Manager, vendedor) no tiene herramienta aparte**: entra **desde el deal de HubSpot al portal DEL CLIENTE** y ve las mismas pantallas con botones extra. Este es el principio rector del prototipo y el motivo de los dos roles.

**Versionado**: 1 cliente = 1 contacto · 1 proyecto = 1 deal · 1 versión = 1 planner con su quote · 1 proyecto = n versiones. Duplicar = "guardar como": la nueva pasa a ser la actual, nada manual hereda (descuentos, packs, add-ons se re-seleccionan con toggles). El AM marca la buena con un **checkbox "versión final"** (invisible para el cliente) → el cliente la ve como **"Versión firmada por diseñador"** y se congela.

**Política "Prime contractor"**: CUBRO nunca transparenta precios unitarios de mercancía de terceros. La estructura de IKEA va **consolidada en una línea**. (Anti-patrón deliberado contra Plum, que lista 90 ítems de IKEA con SKU y precio unitario.)

---

## 2 · IDENTIDAD VISUAL (resumen; el detalle está en el CSS)

- **Tipografía**: Favorit (Light como base, Regular como "negrita" de CUBRO). Embebida en el kit. Prohibido sustituir.
- **Paleta**: blanco y negro. Gris #F5F5F4 para fondos secundarios. **El color existe solo en badges de estado**: azul #1958DF (en edición), verde #3DA650 (firmada/ok), naranja #FF8D28 (revisar/pendiente), rojo #E11D1D (bloqueado). Nunca decorativo.
- **Sin border-radius en nada.** Bordes de 1px. Block-headers negros con texto en mayúsculas y letter-spacing.
- Botón primario: negro, texto blanco, uppercase. Secundario: borde negro sobre blanco.
- Densidad serena: mucho blanco, líneas finas, números tabulares.

---

## 3 · LA SIMULACIÓN COMERCIAL (contexto del demo — los datos exactos en §11)

**La clienta:** *Carolina Méndez*, Madrid (Chamberí), CP de entrega **28010** → mercado **España**, modalidad **Full Service** (en España el FS siempre lleva montaje). Proyecto: **"Cocina Chamberí"** — reforma de cocina NPD + un armario PAX del dormitorio aprovechando el viaje.

**El AM:** *Maider Etxebarria* (gestiona ~5 proyectos/día — la UI debe serle rápida). **La DE (Design Expert):** *Lucía R.* **El deal:** `#D-4127` en HubSpot, etapa "Presupuestación".

**La historia en 3 versiones** (es el guion del Loom y del selector de versiones):
- **V1** (12-jul): Carolina diseña sola desde Inspo ("usar como punto de partida"). Solo cocina NPD, pack de electros Bosch de entrada. Guarda y no avanza → *carrito abandonado* → tarea a ventas → Maider la llama.
- **V2** (19-jul): tras la videollamada, Maider duplica V1 EN LA CUENTA DE CAROLINA: añade el PAX del dormitorio, sube el pack a Siemens, encimera pasa a Dekton cotizado. Nada heredó: re-seleccionó los toggles en un minuto (ese es el mensaje).
- **V3** (28-jul, **versión actual y firmada**): ajuste final (una columna menos), Maider aplica descuento **"Global producto — estándar"** (10% frentes + 5% resto; requiere solo TL: aprobado por Ignacio), marca el **checkbox versión final** → sello "Versión firmada por diseñador", valores congelados al deal, email del 50% enviado.

**Estados al abrir la demo:** V3 firmada y actual; V1 y V2 de consulta. El pedido aún no existe (My orders muestra el estado post-pago como preview si se pulsa el stub de pago).

---

## 4 · ARQUITECTURA DEL PROTOTIPO — archivos y las DOS ENTRADAS

```
/index.html      → login del cliente (entrada 1)
/deal.html       → mock del deal de HubSpot (entrada 2, la del AM)
/home.html       → Home del portal
/projects.html   → My projects
/project.html    → detalle de proyecto + QUOTE (la página reina)
/orders.html     → My orders
/inspo.html      → Inspo
/profile.html    → My profile
/cubro-identity.css · /app.js
```

**Entrada 1 — la clienta:** `index.html` = login CUBRO minimal (logo, email+contraseña pre-rellenos con carolina@..., botón ENTRAR) → `home.html?role=cliente`.

**Entrada 2 — el AM "entrando al dashboard desde CUBRO":** `deal.html` simula la ficha del deal en HubSpot: cabecera HubSpot-ish sobria (no clonar HubSpot: una barra gris "HubSpot · Deals" basta), datos del deal #D-4127 (Carolina Méndez · Cocina Chamberí · etapa Presupuestación · Valor 27.726 € · propiedades "Valores € AM" congeladas visibles), y el botón grande **"ABRIR DASHBOARD DEL CLIENTE ↗"** → `project.html?role=am`. Así el Loom muestra literalmente la frase de la spec: *el AM entra desde el deal al portal del cliente*.

**Para la sesión de prototipado en pareja**: dos ventanas del navegador lado a lado — izquierda `index.html` (cliente), derecha `deal.html` (AM). Mismos datos, mismas pantallas, capas distintas.

---

## 5 · ESPEC PÁGINA POR PÁGINA (base Plum → cambios CUBRO)

### 5.0 Chrome global (todas las páginas del portal)
- **Topbar**: logo CUBRO (izq) · derecha: icono cuenta + nombre, icono carrito de muestras (stub, badge "0"). En rol AM se añade una **franja gris oscura** encima: "MODO ASESOR · Maider Etxebarria · cliente: Carolina Méndez · deal #D-4127 [VOLVER AL DEAL]".
- **Menú lateral del portal** (5 entradas, NO 6 como Plum): Home · My projects · My orders · **Inspo** (sustituye a Favourites) · My profile. **Sin "My addresses"** — la dirección vive en el proyecto. Activa en negro, resto gris.

### 5.1 `home.html` — Home
Como el dashboard de Plum pero con nuestro CTA:
1. Saludo: "Hola, Carolina" (rol AM: se mantiene — el AM está EN la cuenta de la clienta).
2. **Card CTA principal**: "Hazlo realidad — agenda una videollamada con tu diseñador" + 3 ventajas en una línea (diseñador dedicado · plan verificado antes de fabricar · renders 3D). Botón AGENDAR (stub).
3. "Tus proyectos": cards con render placeholder (rect gris con nombre), nombre, **badge de versión** ("V3 · firmada por diseñador" en verde), importe, fecha. Kebab: Duplicar · Copiar link · Eliminar (stubs).
4. *(am-only)* Bloque "Acciones del deal": GUARDAR EN CRM · VER VALORES CONGELADOS · AGENDAR SEGUIMIENTO (stubs con toast).

### 5.2 `projects.html` — My projects
1. Botón **+ NUEVO PROYECTO** desplegable con **los dos caminos** (idéntico patrón a Plum, que valida nuestro diseño): **"Diseñar desde cero"** (stub: "el sistema crea y nombra tu planner") y **"Ya tengo un diseño de IKEA"** (abre input de link + botón ESCANEAR, stub con toast "leyendo tu diseño… presupuesto en segundos").
2. Tabs: En curso · Pedidos · Archivados.
3. Card del proyecto "Cocina Chamberí": render, dirección de entrega (Chamberí, 28010), **V3 · firmada**, total, "3 versiones", CTA VER PROYECTO.
4. Bloque "Renders 3D": card con "Pide el render fotorrealista de tu diseño" (stub) — heredado de Plum, gusta a Jorge.
5. *(am-only)* Buscador de cliente arriba: "estás viendo los proyectos de: Carolina Méndez [cambiar]" (stub).

### 5.3 `project.html` — DETALLE DE PROYECTO + QUOTE (la página reina; ver §6 completo)

### 5.4 `orders.html` — My orders
Vacío por defecto con estado bonito: "Aún no tienes pedidos — cuando confirmes tu proyecto, aquí seguirás su viaje". Si se llega tras el stub de pago: pedido con **etapas** (Pago inicial ✓ → Diseño validado ✓ → Producción/Compra ● → Entrega ○), documentos (Proforma PDF · Factura — stubs), dirección de entrega del proyecto. *(am-only)*: fila extra con "Cobro final: se solicita antes del calendario de producción" + botón FORZAR RECORDATORIO (stub).

### 5.5 `inspo.html` — Inspo
Grid de 6 proyectos CUBRO reales (placeholders con nombre: "Roble y piedra — Malasaña", etc.), cada card con **"USAR COMO PUNTO DE PARTIDA"** (stub: "duplicando esta cocina a tu cuenta…"). Nota arriba: curado por el equipo CUBRO.

### 5.6 `profile.html` — My profile
Formulario: nombre, email, teléfono, idioma/mercado. Campo **"¿Particular o profesional?"** con select (Particular · Arquitecto · Interiorista · Promotor · Retailer) — el selector de prescriptores, copiado de Plum. Sección **Datos de facturación**: NIF/CIF, dirección, CP — con **validación de formato en vivo** (borde rojo + mensaje si metes "." o basura: demostrar el fail-safe) y, si profesional, campo IVA intracomunitario con botón VALIDAR EN VIES (stub que responde ✓ verde).

---

## 6 · LA PANTALLA DEL QUOTE (fusión Plum + prototipos de Jorge + WP-3)

`project.html`, de arriba a abajo:

**6.1 Cabecera del proyecto**: título editable "Cocina Chamberí" + "PROYECTO #P-2041" · dirección de entrega con CP (28010 · Madrid — determina IVA y logística) · **selector de versiones**: `V1 · 12 jul` `V2 · 19 jul` `V3 · 28 jul ●` — la actual resaltada; si la versión está firmada, badge verde **"VERSIÓN FIRMADA POR DISEÑADOR"** junto al selector. Cambiar de versión recarga los datos del quote. Botón **DUPLICAR VERSIÓN** (crea "V4 · hoy" con quote regenerado limpio: sin descuento, pack por defecto, add-ons desmarcados — demostrar "nada hereda"). Botón **✏️ EDITAR DISEÑO EN EL PLANNER** (stub) — recordatorio: el cliente edita el diseño ahí, nunca el quote.

**6.2 Hero**: render placeholder grande del diseño + selectores globales estilo Plum *(decisión default: SÍ entran)*: **Diseño** (recto · moldura) y **Acabado** (Smoked Oak · Roble natural · Verde salvia · Blanco 01…) como fichas; cambiar acabado dispara toast "recalculando tu proyecto…" y varía el total ±2% — el momento wow.

**6.3 Los bloques del quote** — acordeones con subtotal (patrón Jorge/Plum), en este orden y con **cuatro estados posibles según mercado × modalidad** (obligatorio · opcional-addon · informativo · no existe — aquí ES+FS):

| Bloque | Contenido en la demo (V3) | Estado |
|---|---|---|
| **Mobiliario CUBRO** | elementos listados (frentes, columnas, paneles, tapetas, zócalos) SIN precio unitario; precio de bloque | obligatorio |
| **Estructura de terceros** | **UNA línea**: "Estructura IKEA (Metod + PAX) — gestionada por CUBRO" | obligatorio |
| **Encimera** | "Dekton cotizado · 2,4 m² + copete", nota "material definitivo se confirma con tu diseñadora" (copy de Jorge) | obligatorio |
| **Electrodomésticos** | Pack "Siemens Balance" desplegable con sus 5 aparatos (sin precio por aparato para cliente) | obligatorio (pack elegible) |
| **Fregadero y grifería** | pieza Schmidt + precio | obligatorio |
| **Servicios · instalación y entrega** | ACORDEÓN especial, ver 6.4 | mixto |
| **Gestión de compra IKEA** | fee como línea de servicio digna *(decisión default: visible)* | obligatorio si hay compra IKEA |
| Descuento | "Global producto — estándar · −1.840 €" (solo el nombre e importe para cliente) | — |
| IVA 21% + TOTAL | desglose y total grande | — |

**6.4 El bloque Servicios (el corazón, según los prototipos de Jorge):** acordeón "SERVICIOS · instalación y entrega" con desglose interior:
- **Montaje e instalación** — mano de obra + coordinación (en ES-FS: **obligatorio**, incluido, no se puede quitar; mostrar "incluido en tu Full Service").
- **Logística CUBRO** — transporte y entrega: obligatoria.
- **Logística IKEA** — línea **INFORMATIVA** en gris: "100 € · la abona IKEA en tu pedido — este importe no se paga a CUBRO" (copy literal de Jorge). NO suma al total CUBRO.
- **Add-ons opcionales** (patrón e-commerce, precio YA calculado para su proyecto y CP, nunca "desde"): en la demo ES-FS mostrar **"＋ Desmontaje y retirada de tu cocina antigua · 384 €"** y **"＋ Medición técnica adicional · 65 €"** como `.addon`; añadir/quitar **recalcula subtotal, descuento, IVA y total en vivo**.
- Pie del bloque (copy Jorge adaptado): "El montaje, la gestión y la logística CUBRO se pagan a CUBRO. La logística de IKEA se abona en tu pedido de IKEA.com y se muestra solo para que veas el coste total."

**6.5 Resumen y CTAs**: "Resumen CUBRO" (subtotal · descuento · IVA · **TOTAL 27.726 €**) + nota de pago por hitos ("50% al confirmar · 50% antes de producción"). CTA primario **HAZLO REALIDAD — AGENDA TU VIDEOLLAMADA**; secundario "Pedir revisión de experto". Campo de comentario al diseñador (patrón Plum). **Nunca botón de pagar** en V1.

**6.6 Capa AM sobre esta misma página** *(am-only, se enciende con el rol)*:
- **Franja de margen**: chip "GM teórico proyecto: 31% · frentes: 42%" + aviso rojo si un cambio lo bajara de 20% ("GM < 20% — proyecto bloqueado").
- **Selector de descuento**: dropdown con los 7 (Solo Frentes b/e/m · Global b/e/m · Descuento libre €). Al elegir "máximo" o "libre": badges de firmas "⏳ TL (Ignacio)" "⏳ Alex" y el candado "sin aprobación no avanza de etapa" (stub que se aprueba con clic para la demo). El libre abre campo € y se prorratea a frentes.
- **Packs de electros editables**: dentro del acordeón, cada aparato con select de alternativas (cambiar horno → recalcula; mostrar coste/margen de la línea solo en AM).
- **＋ AÑADIR FUERA DE CATÁLOGO**: modal simple (concepto, importe, nota obligatoria) → entra como línea marcada.
- **Add-ons**: el AM ve además el desglose de la calculadora en cada uno (ml, uds, km).
- **CHECKBOX "VERSIÓN FINAL"** grande al pie: al marcarlo → confirmación → sello verde "Versión firmada por diseñador" visible también en rol cliente, edición visualmente bloqueada (controles disabled), toast "Valores congelados al deal · email de pago 50% enviado". Segundo checkbox atenuado "Versión final DE" con nota "la marca Diseño al validar".
- Botón **GUARDAR EN CRM ✓** (estado: sincronizado hace 2 min).

---

## 7 · JOURNEY GUIONADO — las dos pantallas en paralelo (guion del Loom, ~6 min)

| # | CLIENTE (ventana izq.) | AM (ventana der.) |
|---|---|---|
| 1 | Login → Home: saludo + CTA Hazlo realidad | — |
| 2 | Inspo → "Usar como punto de partida" → nace V1 | — |
| 3 | Project: juega con acabados globales (wow), ve bloques, añade add-on desmontaje → total recalcula | — |
| 4 | Cierra sin pagar | HubSpot detecta carrito abandonado → `deal.html`: tarea en el deal |
| 5 | — | **Desde el deal → ABRIR DASHBOARD DEL CLIENTE** → misma página de Carolina, franja MODO ASESOR |
| 6 | — | Duplica → V2: nada heredó; re-selecciona pack Siemens y add-ons con 3 toggles (contar en voz alta: "quince segundos") |
| 7 | Carolina refresca: ve V2 como actual, compara con V1 | — |
| 8 | — | V3: aplica "Global — estándar" → firma TL ✓ → GM visible sigue >20% |
| 9 | — | **Checkbox VERSIÓN FINAL** → sello + congelación + email 50% |
| 10 | Ve el sello "Versión firmada por diseñador" + el descuento con nombre | Vuelve al deal: propiedades "Valores € AM" pobladas |
| 11 | (Stub pago) → My orders: etapas del pedido | Orders AM: "cobro final antes de producción" |
| 12 | Cierre: "mismas pantallas, dos capas — cero herramienta paralela" | — |

---

## 8 · REGLAS DURAS que el prototipo debe respetar (del spec real)

1. El cliente **jamás** edita el quote; su edición es el planner. 2. Precio unitario de terceros: nunca; precio por bloque: siempre. 3. Estructura de terceros = una línea. 4. **Nada manual hereda al duplicar** — todo se re-selecciona con toggles. 5. Montaje y logística nunca se descuentan (el descuento no los toca al recalcular). 6. El descuento se elige de un selector cerrado; el libre es € y va a frentes. 7. IVA 21% (la demo no usa reducido); electros y F&G siempre 21%. 8. Checkboxes de versión final: solo agentes; cliente ve el sello. 9. Los add-ons muestran precio calculado, jamás "desde". 10. Informativo ≠ cobrado: la logística IKEA no suma al total CUBRO.

## 9 · FUERA DE ALCANCE del prototipo v1
Checkout/pago real · carrito de muestras (queda fuera; el icono es decorativo) · buscador real de clientes · planner 3D · páginas de Alemania/Francia (la matriz de presencia se demuestra con ES-FS; si sobra tiempo, un select "simular mercado: FR-DIY" que oculte bloques es bonus) · emails reales.

## 10 · DECISIONES POR DEFECTO TOMADAS EN ESTA SPEC (Pedro puede voltearlas)
(a) Selectores globales de diseño/acabado: **SÍ entran** (momento wow). (b) Carrito de muestras: **fuera** de v1. (c) Fee de gestión de compra: **visible** como servicio. (d) Datos de demo: proyecto único rico (Cocina Chamberí) + Inspo con 6 plantillas; las "4 cocinas de Jorge" se cargan en v1.1 cuando Pedro pase los diseños.

## 11 · DATOS DE DEMO (implementar como objeto `DEMO` en app.js)

Cliente: Carolina Méndez · carolina.mendez@gmail.com · Madrid · profesional: Particular. AM: Maider Etxebarria. Deal: #D-4127 · etapa Presupuestación. Proyecto: Cocina Chamberí · #P-2041 · entrega: C/ Sagunto 14, 28010 Madrid.

**V3 (actual · firmada · 28-jul)** — mercado ES · Full Service:
| Bloque | Importe |
|---|---|
| Mobiliario CUBRO (NPD Smoked Oak) | 14.850 € |
| Estructura de terceros (Metod + PAX, línea única) | 1.180 € |
| Encimera Dekton cotizada | 2.640 € |
| Electrodomésticos — pack Siemens Balance | 3.290 € |
| Fregadero y grifería (Schmidt) | 415 € |
| Montaje e instalación (obligatorio FS) | 1.664 € *(AM ve: medición 65 + bajos 4,2ml×115 + altos 2,6ml×155 + PAX 1,9ml×175 + paneles 4×20 + electros 5×40 + 50km×2)* |
| Logística CUBRO | 440 € *(AM ve: por peso, 2 orígenes)* |
| Logística IKEA — **informativa** | (100 €, no suma) |
| Gestión de compra IKEA (fee) | 275 € |
| **Subtotal** | **24.754 €** |
| Descuento "Global producto — estándar" (10% frentes · 5% IKEA/electros/encimera) | −1.840 € |
| Base | 22.914 € |
| IVA 21% | 4.812 € |
| **TOTAL** | **27.726 €** |
| Add-on disponible: Desmontaje y retirada | +384 € (recalcula todo si se añade) |
| GM teórico (solo AM) | proyecto 31% · frentes 42% |

**V2 (19-jul)**: igual sin descuento; pack Siemens; total 26.966 € aprox (recalcular con las mismas reglas). **V1 (12-jul)**: sin PAX (−1.180 estructura, mobiliario 13.900), pack Bosch Essential 2.850, sin descuento; montaje 1.398; logística 395; total ≈ 24.100 €. (Los valores de V1/V2 pueden ajustarse para que cuadren con las reglas; la V3 es canónica.)

## 12 · WORKFLOW DE LA SESIÓN
1. Pedro crea repo GitHub `cubro-quoter-prototipo` y lo conecta a Vercel (ya operativo tras el fix de DNS). 2. Claude Code recibe: este MD + `cubro-identity.css`. Construye en local; Pedro revisa en el navegador. 3. Iteración por pantalla en este orden: project.html (la reina) → deal.html → home → projects → resto. 4. `git push` → Vercel publica → URL para Jorge. 5. Loom con el guion del §7. Cambios de spec: se editan AQUÍ y se le repasa el archivo a Claude Code — este MD es la fuente de verdad del prototipo.
