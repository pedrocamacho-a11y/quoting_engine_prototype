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

## El journey del cliente, completo

El portal arranca **vacío**: no hay proyectos hasta que el cliente crea uno. Ese es el
recorrido que se puede grabar de principio a fin:

1. `index.html` — entra.
2. `home.html` — estado vacío que hace de onboarding, con los dos caminos.
3. Creación — cuestionario mínimo y el sistema nombra el proyecto.
4. `project.html` — su presupuesto vivo: acabados, add-ons, versiones.
5. Abandona sin pagar → el asesor entra desde `deal.html` al mismo portal.
6. El asesor duplica, ajusta, aplica descuento con firmas y marca la versión final.
7. El cliente ve el sello, paga el 50 % → `orders.html` con las etapas del pedido.

## Qué hay construido

| Pantalla | Qué hace |
|---|---|
| `index.html` | Entrada del cliente, entrada del asesor y los dos estados de la demo |
| `home.html` | Estado vacío de onboarding, o saludo + CTA + tarjetas de proyecto |
| `projects.html` | Listado con pestañas, creación de proyecto y bloque de renders 3D |
| `project.html` | Detalle + quote: la página reina, en sus dos capas (§6) |
| `orders.html` | Vacío por defecto; con pedido, las cuatro etapas y los documentos |
| `inspo.html` | Las seis cocinas CUBRO con «usar como punto de partida» |
| `profile.html` | Datos, perfil de prescriptor y facturación con validación en vivo |
| `deal.html` | Prop de HubSpot: sólo la barra y el botón de entrada del asesor |

## Archivos compartidos

- **`cubro-identity.css`** — kit de identidad. Trae la Favorit embebida. **No se toca.**
- **`app.css`** — sólo maquetación (layout, modal, toast). Ni un color nuevo ni un radius.
- **`app.js`** — mercados, plantillas, motor de presupuesto, estado y chrome.
- **`crear.js`** — flujo de creación de proyecto, compartido por tres pantallas.
- **`project.js`** — render e interacciones de la página reina.

## El cuestionario de creación

Sólo se pregunta lo que cambia el precio, y en este orden:

1. **País** — fija el IVA (ES 21 % · FR 20 % · DE 19 %) y la modalidad. En España
   Full Service, con montaje siempre incluido; fuera, DIY.
2. **Código postal** — fija la zona logística y el nombre del proyecto. Validado en
   vivo: cinco dígitos, sin puntos ni letras. Si el CP no está en nuestra base, se
   pide la ciudad.
3. **Qué se reforma** — cocina, cocina + armario, o solo armario. Cambia qué bloques
   existen en el presupuesto.
4. **Dirección exacta** — opcional. Se puede completar después, desde el proyecto.

La dirección exacta no hace falta para dar precio, así que no se pide antes de darlo.
El proyecto lo **nombra el sistema** con la ubicación: CP 28010 → «Cocina Chamberí».

## El motor de presupuesto

Vive en `computeQuote()` (`app.js`). Recalcula en vivo subtotal, descuento, base, IVA
y total, más el margen teórico del asesor. Respeta las diez reglas duras de la §8:

- El descuento sólo toca producto (frentes, estructura, encimera, electros). Montaje,
  logística y fee de gestión nunca se descuentan.
- La estructura de terceros va en una línea, sin precios unitarios.
- La logística de IKEA es informativa: se muestra y **no suma** al total CUBRO.
- Duplicar regenera el quote limpio: nada manual hereda.
- Los add-ons muestran precio ya calculado para este proyecto y CP, nunca «desde».

Los bloques son una **lista**, no campos fijos: así el mercado y el tipo de proyecto
pueden hacer que un bloque **no exista** —que es lo que pide la §6.3— en vez de que
valga cero. En Francia el bloque de montaje desaparece; en un proyecto de solo armario
desaparecen encimera, electrodomésticos y fregadero.

V3 del proyecto sembrado es la versión canónica y cuadra al euro con la §11: subtotal
24.754 € · descuento −1.840 € · base 22.914 € · IVA 4.812 € · **total 27.726 €**.

## El copy del estado vacío

El Home sin proyectos **no se titula con la negación**. La práctica establecida es
tratar el estado vacío como un momento de onboarding: quien llega a un contenedor
vacío sin indicaciones se va, y la pantalla en blanco baja la confianza en el producto.
De ahí las tres decisiones:

- El titular es la invitación —«Hola, Carolina. Empecemos tu cocina»— y no «No tienes
  proyectos». La frase de orientación («un proyecto guarda tu diseño…») va debajo,
  explicando para qué sirve este espacio.
- Los dos caminos son la acción principal, con verbos, no etiquetas.
- Debajo, seis cocinas de Inspo: ofrecer opciones ya hechas es lo que mejor combate la
  parálisis del lienzo en blanco, y encaja con que CUBRO ya tenga proyectos que enseñar.

## Estado de la demo

El estado se guarda en el `localStorage` del navegador, para que el asesor duplique una
versión y la clienta la vea al refrescar en la otra ventana (SPEC §7). El rol vive en la
querystring (`?role=am`).

`index.html` ofrece los dos puntos de partida:

- **Portal vacío** — para grabar el journey completo desde el principio.
- **Cocina Chamberí con sus 3 versiones** — atajo al final del guion, con V3 firmada.

## Servidor local

```bash
python3 -m http.server 8321 --directory .
```
