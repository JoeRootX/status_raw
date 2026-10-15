# joerootX

Panel de estado personal: dónde está Joe ahora mismo, en qué ticket trabaja, qué hay
en la cola de Jira, qué está sonando y qué video se está viendo, más un formulario de
contacto por Telegram.

## Poner en marcha

```bash
npm install
npm run dev        # http://localhost:3000
```

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Sirve el build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint (flat config) |

## Stack

Next.js 16 (App Router) · React 19 · TypeScript 6 · CSS propio, sin framework.

Las versiones están fijadas a propósito y no se actualizan sin revisar:

- **`typescript@6.0.3`, no la 7.** `typescript-eslint` exige `>=4.8.4 <6.1.0`; la 7 ya
  es la `latest` de npm y el lint se rompe con ella.
- **`eslint@9`, no la 10.** `eslint-config-next@16` pide `>=9`.
- **`next@16.3.8`** requiere Node `>=20.9.0`.

## Estructura

```
app/
  api/          rutas dinámicas: telegram, rutina, estado, contacto,
                spotify, youtube, jira/{actual,cola}
  page.tsx      el panel, ISR 5 min, 6 fuentes en Promise.all
  globals.css   CSS completo (incluye .tag.alta / .tag.critica de Jira)
components/bloque/    un componente por bloque del panel
lib/
  fuente.ts     unión discriminada listo | vacío | error
  datos.ts      estados (chips + bot), constantes legales; los datos
                reales viven en cada lib (patrón mock-first)
  github.ts     último commit de todos los repos (GraphQL con alias)
  jira.ts       ticket en curso + cola (endpoint nuevo /search/jql)
  spotify.ts    canción actual (204 + respaldo recientes, token cacheado)
  youtube.ts    último video (RSS keyless, Data API de respaldo)
  telegram.ts   envío del formulario al chat privado
  estado.ts     el estado vive en Redis; lectura cacheada por etiqueta
  rutina.ts     horario laboral y avisos programados del bot
  validacion.ts reglas del formulario (compartidas cliente/servidor)
  tiempo.ts     "hace 2 horas" en español
  enlaces.ts    enlaces del pie: internos, externos y sin destino
legacy/         el sitio estático anterior, archivado
public/         avatar e iconos
```

Los ejemplos "mock-first" viven en cada `lib/*` de fuente (p. ej.
`COMMIT_DE_EJEMPLO` en `github.ts`): sin credenciales la tarjeta muestra ese
dato y con credenciales se vuelve real, sin tocar las vistas.

### Por qué `Fuente<T>` y no un valor pelado

Cada bloque pide una `Fuente<T>` en vez de `T` o `null`, porque "no hay ticket en curso"
y "la API de Jira se cayó" son cosas distintas y el visitante merece leerlo distinto.
`components/bloque/Estado.tsx` dibuja las tres ramas sin repetir el `if` en cada vista.

### Los chips son de solo lectura

El estado ya no lo cambia el visitante con un radio, lo cambia Joe con un bot de
Telegram. Por eso cada chip es un `<div>` y el activo lleva `[data-activo]`.

Eso tocó el CSS: el blur y el flotado de los inactivos estaban escritos sobre
`input:not(:checked)` y ahora son `:not([data-activo])`. El resto de reglas se
mantuvieron tal cual.

El grupo lleva `tabindex="0"` a propósito. Sin controles que enfocar, el teclado no
podría aclarar los chips; enfocando el grupo una vez, `.chips:focus-within` los aclara
todos. Un solo tabulador en vez de cinco.

## La fuente de GitHub

`lib/github.ts` trae el commit más reciente de **cualquiera de tus repos** (20 de ellos;
`status_raw` queda excluido para que el panel no se cuente a sí mismo).

Una sola petición HTTP, no 20: GraphQL admite alias, así que una query con 20 alias
devuelve el último commit de cada repo de golpe. La tarjeta se reválida cada 5 minutos.

Dos cosas que se probaron y documentan porque no son obvias:

- **`orderBy` en `refs` no ordena.** GraphQL lo ofrece y parece funcionar, pero con
  `last` devolvía las ramas *más antiguas* y con `first` las fechas salían sin orden
  ninguno. Por eso el orden lo pone `masReciente()` en nuestro código, no la API.
- **GraphQL exige token aunque los repos sean públicos.** Sin token responde 403.
  Por eso `GITHUB_TOKEN` es obligatorio para esta fuente, y sin él la tarjeta cae al
  dato de ejemplo (el resto de la web no se entero).

### Configurar el token

Un PAT clásico **sin scopes** basta para leer repos públicos y sube el límite de 60 a
5000 peticiones/hora. Créalo en GitHub → Settings → Developer settings → Personal
access tokens → Tokens (classic), sin marcar ninguna casilla de alcance.

```bash
vercel env add GITHUB_TOKEN   # tras conectar el repo a un proyecto de Vercel
```

El token solo se lee en el servidor: no lleva prefijo `NEXT_PUBLIC_`, así que Next ni lo
ofrece al bundle del cliente. Nunca lo pongas en un `.env` commiteado; `.env*` está en
`.gitignore` y `.env.example` documenta las variables sin valores.

Un detalle al desplegar: `/` es una ruta prerenderizada, así que el primer HTML lo
genera **el build**. Si el token no estuviera definido durante el build, esa primera
pinta saldría con el dato de ejemplo y se corregiría sola al pasar la ventana de
revalidación. Con el token puesto en Vercel no pasa.

## El estado, el bot y el horario laboral

El estado vive en Redis (Upstash). Lo cambia el bot (@status123121bot) con
comandos (`/trabajo`, `/personal`, `/libre`, `/comer`, `/junta` o `/estado <clave>`)
y con los botones de los avisos programados. Al guardar, el webhook purga el
caché con `revalidateTag(..., { expire: 0 })`: el cambio se ve al instante y el
poller de la página (`Refresco.tsx`) solo tiene que notar la diferencia.

El horario laboral (L-V: 9:00–17:00) también mueve el estado:

| Hora Jalisco | Qué pasa |
| --- | --- |
| 9:00 | El panel gira a Trabajo + aviso de arranque |
| 11, 13, 15 | Sondeo "¿Sigues trabajando?" con botones |
| 17:00 | Pregunta de salida (sin respuesta, el estado no cambia) |
| 19, 21 | Seguimiento "¿Sigues en *\<estado actual\>*?" |
| sáb, dom y 22:00–08:59 | Nada |

La lógica vive en `lib/rutina.ts` y el endpoint que dispara el cron externo es
`app/api/rutina/route.ts`. La hora SIEMPRE se calcula en `America/Mexico_City`
con `Intl` — el server de Vercel vive en UTC. El cron (schedule de QStash en la
consola de Upstash) apunta a `/api/rutina` con el header
`Authorization: Bearer <RUTINA_SECRETO>` y la expresión
`0 15,17,19,21,23,1,3 * * *` (UTC = las horas de Jalisco listadas arriba).

## Verificación

El proyecto tiene una cultura de verificación end-to-end: los rounds se corrigen
sobre el despliegue de producción y se contrastan contra las APIs directas
(GitHub sha por sha, Jira ticket por ticket, Spotify/YouTube contra `/api/*`).
La bitácora completa de cada ronda (qué se probó, qué se rompió y cómo se
arregló) vive en `CONTEXT.md`; el historial queda en los commits.

## Pendiente

- **Crear el schedule de QStash** (2 min en la consola de Upstash) para activar
  los avisos del horario laboral — ver la sección de arriba.
  El endpoint ya está en producción y probado (401 sin secreto, 200 dentro de
  horario).
- **Conectar GitHub ↔ Vercel** en el dashboard (Settings → Login Connections):
  mientras no exista, desplegar con `vercel --prod` a mano.
- **Enlaces de redes del pie.** `lib/enlaces.ts` los tiene en `href: null` y
  se pintan como texto plano, no como enlaces muertos.
- **Número de WhatsApp.** `WHATSAPP` en `lib/datos.ts` está vacío: al llenarlo
  aparece el botón de click-to-chat en el pie, solo.
- **Cola de Jira con paginación.** Hoy pide `maxResults=5`; con más tareas
  "To Do" habría que seguir `nextPageToken`.
- **Texto legal.** Ya está redactado y con datos reales; quedaría revisarlo con
  abogado si el proyecto algún día lo exige.
- **`theme-color` es fijo.** El color del navegador podría seguir al estado.