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
  datos.ts      datos que aun no tienen fuente real (Jira, multimedia, estado)
  github.ts     consulta a la API de GitHub
  tiempo.ts     "hace 2 horas" en español
  enlaces.ts    enlaces del pie: internos, externos y sin destino
legacy/         el sitio estático anterior, archivado
public/         avatar e iconos
```

`lib/datos.ts` es el único sitio donde están los valores sin fuente real. Ningún
componente lleva datos escritos a mano, así que conectar una fuente (Jira, Spotify)
se hace cambiando una constante por una llamada, sin tocar las vistas.

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

## Verificación

89 comprobaciones en Firefox sobre el build de producción: estilos calculados del blur
y el flotado, hover y unhover sin parpadeo, teclado, `prefers-reduced-motion`, los
cuatro estados del formulario (inválido, enviando, enviado, error), trampa anti-bots,
las tres rutas con `noindex`, ausencia de desbordes en 16 anchos, y la tarjeta de GitHub
con datos reales contrastados contra la API (sha correcto, sin token en el HTML,
`status_raw` ausente).

Se probaron además las tres degradaciones: sin token sale el ejemplo, con token inválido
sale el aviso de error con su `role="alert"` sin tumbar el resto de la página.

## Pendiente

- **Texto legal.** Los corchetes (`[NOMBRE COMPLETO]`, `[DOMICILIO]`, `[CORREO]`,
  `[FECHA]`) son huecos reales. Ambas rutas salen con `robots: noindex` hasta que un
  abogado revise el texto.
- **Más fuentes reales.** Spotify, YouTube y Jira, en ese orden. El estado por Telegram
  es el que necesita bot, webhook HTTPS y almacenamiento persistente, porque la memoria
  de Vercel es efímera y no sirve.
- **Refresco en cliente.** Ahora el dato solo se refresca al revalidar el servidor.
- **Enlaces del pie.** `lib/enlaces.ts` los tiene en `href: null` y se pintan como
  texto plano, no como enlaces muertos.
- **`theme-color` es fijo.** El color del navegador podría seguir al estado.