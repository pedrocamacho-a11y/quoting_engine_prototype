# quoting_engine_prototype

Prototipo navegable del portal de venta de CUBRO. HTML/CSS/JS vanilla, sin frameworks
y sin build: se abre con doble clic o se publica en Vercel tal cual.

Fuente de verdad: [SPEC.md](SPEC.md). Si algo no está ahí, no está decidido.

## Las dos entradas (SPEC §4)

| Entrada | Archivo | Quién |
|---|---|---|
| Portal del cliente | `index.html` → `home.html` → `project.html` | Carolina Méndez |
| Deal de HubSpot | `deal.html` → `project.html?role=am` | Maider Etxebarria (AM) |

Para la sesión de prototipado en pareja: dos ventanas lado a lado, `index.html` a la
izquierda y `deal.html` a la derecha. Mismos datos, mismas pantallas, capas distintas.

## Qué hay construido

- **`project.html`** — detalle de proyecto + quote (la página reina, SPEC §6), completa
  en sus dos capas: cliente y asesor.
- **`deal.html`** — mock del deal en HubSpot, con la tarea de carrito abandonado y las
  propiedades «Valores € AM» que se pueblan al firmar.
- **`home.html`** — Home del portal con el CTA «Hazlo realidad».
- **`index.html`** — login del cliente + acceso del asesor + reinicio de la demo.

Pendientes de la siguiente iteración (definidas en la spec §5): `projects.html`,
`orders.html`, `inspo.html`, `profile.html`. Sus entradas del menú avisan con un toast.

## Archivos compartidos

- **`cubro-identity.css`** — kit de identidad. Trae la Favorit embebida. **No se toca.**
- **`app.css`** — sólo maquetación (layout, modal, toast). Ni un color nuevo ni un radius.
- **`app.js`** — datos de demo (§11), motor de presupuesto, lógica de rol, chrome, toasts.
- **`project.js`** — render e interacciones de la página reina.

## El motor de presupuesto

Vive en `computeQuote()` (`app.js`). Recalcula en vivo subtotal, descuento, base, IVA
y total, más el margen teórico del asesor. Respeta las diez reglas duras de la §8:

- El descuento sólo toca producto (frentes, estructura, encimera, electros). Montaje,
  logística y fee de gestión nunca se descuentan.
- La estructura de terceros va en una línea, sin precios unitarios.
- La logística de IKEA es informativa: se muestra y **no suma** al total CUBRO.
- Duplicar regenera el quote limpio: nada manual hereda.
- Los add-ons muestran precio ya calculado para este proyecto y CP, nunca «desde».

V3 es la versión canónica y cuadra al euro con la §11: subtotal 24.754 € · descuento
−1.840 € · base 22.914 € · IVA 4.812 € · **total 27.726 €**.

## Estado de la demo

El estado (versiones, descuentos, add-ons, firmas) se guarda en el `localStorage` del
navegador, para que el asesor duplique una versión y la clienta la vea al refrescar en
la otra ventana (SPEC §7, pasos 6-7). El rol vive en la querystring (`?role=am`).

Para volver al punto de partida —V3 firmada y actual, V1 y V2 de consulta— usa
«Reiniciar datos de la demo» en `index.html`.

## Servidor local

```bash
python3 -m http.server 8321 --directory .
```
