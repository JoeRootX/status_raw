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
app/            rutas: / (panel), /aviso-de-privacidad, /terminos-y-condiciones
components/
  bloque/       un componente por bloque del panel
  legal/        nota de borrador compartida por las dos páginas legales
lib/
  fuente.ts     union discriminada listo | vacio | error
  datos.ts      única fuente de datos de la web
  enlaces.ts    enlaces del pie: internos, externos y sin destino
legacy/         el sitio estático anterior, archivado
public/         avatar e iconos
```

`lib/datos.ts` es el único sitio donde están los valores. Ningún componente lleva datos
escritos a mano, así que conectar una fuente real (GitHub, Spotify, Jira) se hace
cambiando una constante por una llamada, sin tocar las vistas.

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

## Verificación

75 comprobaciones en Firefox sobre el build de producción: estilos calculados del blur
y el flotado, hover y unhover sin parpadeo, teclado, `prefers-reduced-motion`, los
cuatro estados del formulario (inválido, enviando, enviado, error), trampa anti-bots,
las tres rutas con `noindex`, y ausencia de desbordes en 16 anchos.

## Pendiente

- **Texto legal.** Los corchetes (`[NOMBRE COMPLETO]`, `[DOMICILIO]`, `[CORREO]`,
  `[FECHA]`) son huecos reales. Ambas rutas salen con `robots: noindex` hasta que un
  abogado revise el texto.
- **Datos reales.** Todo está en `modo: 'manual'` con datos de ejemplo. Lo primero
  GitHub, luego Spotify. El token va siempre server-side; falta decidir dónde (Vercel
  tiene memoria efímera, así que el estado persistente va a necesitar Redis o KV).
- **Enlaces del pie.** `lib/enlaces.ts` los tiene en `href: null` y se pintan como
  texto plano, no como enlaces muertos.
- **`theme-color` es fijo.** El color del navegador podría seguir al estado.