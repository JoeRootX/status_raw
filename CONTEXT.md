# Contexto del proyecto joerootX

## Resumen ejecutivo
Panel de estado personal en Next.js 16 + TypeScript 6.0.3. **Desplegado en Vercel**:
https://status-raw.vercel.app. Repo: https://github.com/JoeRootX/status_raw. Rama activa:
`main`. Última revisión: 26 de octubre de 2026.

## Stack fijado
- Next.js **16.4.3** (App Router, ISR con `revalidate = 300`)
- React 19.3.0
- TypeScript 6.0.3 (no 7; `typescript-eslint` exige `<6.1.0`)
- ESLint 9 + `eslint-config-next@16.4.3`
- Node `>=20.9.0` (`engines` en `package.json`)
- CSS nativo (sin Tailwind); `next/font` para JetBrains Mono + Inter
- Vercel (hosting) + Upstash Redis (estado y slots de la rutina)

## Estructura clave
```
app/
  layout.tsx                 # metadata, Open Graph, viewport, next/font
  page.tsx                   # async, revalidate=300, 6 fuentes en Promise.all
  globals.css                # CSS completo (incluye .tag.alta/.critica)
  icon.svg
  aviso-de-privacidad/page.tsx
  terminos-y-condiciones/page.tsx
  api/
    contacto/route.ts        # formulario → Telegram (validación + honeypot + rate limit)
    estado/route.ts          # GET barato para el poller del cliente
    jira/actual/route.ts
    jira/cola/route.ts
    rutina/route.ts          # cron de la rutina laboral
    spotify/route.ts
    telegram/route.ts        # webhook del bot (comandos + botones)
    youtube/route.ts
components/bloque/
  Identidad.tsx              # avatar + estado (aria-live)
  InfoCards.tsx              # Jira, cola, GitHub; tickets enlazados a Jira
  ChipsEstado.tsx            # 5 chips read-only, tabindex=0, blur/flote
  Multimedia.tsx             # Spotify/YouTube en .hold
  ContactForm.tsx            # novalidate, 4 estados, honeypot, link legal
  Reloj.tsx                  # useSyncExternalStore, hourCycle h23
  Footer.tsx                 # enlaces internos/externos, redes sin href="#"
  Estado.tsx                 # renderiza Senal<T> (listo|vacio|error)
  Refresco.tsx               # poller de /api/estado cada 30 s
lib/
  fuente.ts                  # union discriminada listo|vacio|error + helpers
  datos.ts                   # estados, legales, constantes; sin mocks duplicados
  enlaces.ts                 # enlaces internos/externos/sin-destino
  tiempo.ts                  # haceCuando(iso) con Intl.RelativeTimeFormat('es')
  github.ts                  # repos + GraphQL con alias, orden en cliente
  jira.ts                    # ticket actual + cola (search/jql)
  spotify.ts                 # canción actual + fallback a recientes
  youtube.ts                 # RSS keyless + Data API de respaldo
  estado.ts                  # Redis + cache etiquetado del estado
  rutina.ts                  # horario laboral y textos/teclados del bot
  telegram.ts                # envío del formulario a Telegram
  validacion.ts              # reglas compartidas cliente/servidor
scripts/cron-setup.mjs       # alternativa QStash para la rutina
.github/workflows/rutina.yml # cron real de la rutina (GitHub Actions)
legacy/                      # sitio estático anterior, archivado
public/avatar.jpg
capturas/                    # 0375.png, 0768.png, 1440.png, legal.png
```

## Decisiones técnicas no obvias
1. **`orderBy` en `refs` no ordena**: probado — `last` devuelve las ramas más
   antiguas y `first` mezcla fechas sin orden. Solución: traer 40 refs/repo y
   ordenar en código (`masReciente()`).
2. **GraphQL exige token aunque los repos sean públicos**: sin token → 403.
   REST aguanta sin token (60/h), pero en Vercel las IPs son compartidas →
   impredecible. PAT clásico sin scopes obligatorio.
3. **Alias por índice, no por nombre**: sanitizar `a-b`/`a_b` colapsa en el mismo
   alias y pierde un repo en silencio.
4. **`Fuente<T>` y no un valor pelado**: cada bloque distingue “hay datos”, “la
   fuente contestó vacío” y “la fuente falló”. `components/bloque/Estado.tsx`
   dibuja las tres ramas sin repetir el `if`.
5. **`haceCuando` en servidor**: `Intl.RelativeTimeFormat('es')` se resuelve en
   build/ISR y llega como texto fijo → sin riesgo de hidratación. El reloj usa
   `hourCycle: 'h23'` porque `es-MX` con `hour12:false` devuelve “24:00” a
   medianoche.
6. **Chips read-only**: antes radios, ahora `div` con `[data-activo]`. El CSS
   cambia `input:not(:checked)` → `:not([data-activo])`. El grupo lleva
   `tabindex=0` para que el teclado aclare los chips con un solo tabulador.
7. **`revalidateTag(TAG_ESTADO, { expire: 0 })`**: con `"max"` la primera
   petición tras cambiar el estado se servía stale y el poller veía el estado
   viejo un ciclo extra. Con `expire: 0` la siguiente petición bloquea hasta
   revalidar.
8. **`/main--legal` anula el grid de 3 columnas**: sin esto, a ≥1200px el texto
   legal caía en una columna de 280px.
9. **Spotify 204**: `currently-playing` contesta 204 con body vacío cuando no
   suena nada; `res.ok` da true y `json()` reventaba. Se corta por status antes
   de parsear y se cae a `recently-played`.
10. **Jira `GET /rest/api/3/search/jql`**: el endpoint nuevo; el viejo `/search`
    devuelve 410 Gone en Cloud. Se usa GET con query params (POST también vale).

## Fuentes de datos
| Bloque | Estado | Fuente / degradación |
| --- | --- | --- |
| Estado | Real | Bot de Telegram → Redis (`estado`) → ISR; sin Redis, `ESTADO_ACTUAL` |
| Jira actual | Real | `lib/jira.ts` + env; vacío = “No hay ningún ticket en curso.” |
| Cola Jira | Real | `lib/jira.ts`, `maxResults=5`; deuda: paginar `nextPageToken` |
| GitHub | Real | `lib/github.ts`: GraphQL 1 petición, 20 repos × 40 refs, `status_raw` excluido |
| Spotify | Real | `lib/spotify.ts`; sin credenciales → canción de ejemplo |
| YouTube | Real | RSS keyless (playlist o canal); Data API solo respaldo |
| Formulario | Real | `/api/contacto` → Telegram; sin token → modo simulado |
| Legales | Estático | `lib/datos.ts` + rutas propias |

Los ejemplos “mock-first” viven en cada `lib/*` de fuente. Sin credenciales la
tarjeta muestra ese dato; con credenciales se vuelve real. Un fallo de la API no
cae al ejemplo: muestra el estado de error.

## GitHub (fuente real)
- `lib/github.ts`: enumera repos del owner → filtra `GITHUB_EXCLUIR` (default
  `status_raw`) → GraphQL con alias por índice, `refs(first:40)` → aplana →
  ordena por `committedDate` descendente → mapea a `Commit` (mensaje, sha7, repo,
  rama, ticket si `SDT-\d+`, autor, `haceCuando(fecha)`, url).
- `InfoCards` recibe `commit: Fuente<Commit>` por prop (presentacional puro).
- Sin `GITHUB_TOKEN`: `modo: 'manual'` + `COMMIT_DE_EJEMPLO`.
- Token inválido/fallo: `modo: 'auto'`, `senal: fallo(...)` → `role="alert"`, sin
  caer al ejemplo.

## Estado, bot de Telegram y Redis
- Clave `estado` en Upstash Redis. La página la lee con cache etiquetado
  (`tags: ['estado']`, `revalidate: 300`); el webhook la purga al guardar.
- Bot: @status123121bot. Comandos `/estado`, `/estado <clave>`, `/trabajo`,
  `/personal`, `/libre`, `/comer`, `/junta`. Alias en español en el webhook.
- Webhook `/api/telegram` con 2 capas: header secreto de Telegram
  (`x-telegram-bot-api-secret-token`) + `chat.id` whitelisted.
- Botones inline de los avisos: `estado:<id>` cambia el estado; `estado:sigo`
  solo acusa recibo. Ambos pasan por `answerCallbackQuery`.
- `Refresco.tsx` sondea `/api/estado` cada 30 s solo con la pestaña visible y
  refresca al volver a ella.

## Rutina del horario laboral (L-V)
| Hora Jalisco | Acción |
| --- | --- |
| 9:00 | El panel pasa a `work` y avisa por Telegram |
| 11:00, 13:00, 15:00 | Sondeo “¿Sigues trabajando?” con botones |
| 17:00 | Pregunta de salida; sin respuesta el estado no cambia |
| 19:00, 21:00 | Seguimiento “¿Sigues en <estado actual>?” |
| 22:00–08:59 y sáb/dom | Nada |

- Hora siempre en `America/Mexico_City` vía `Intl` (offset fijo UTC-6 desde 2022;
  el servidor de Vercel vive en UTC).
- `app/api/rutina/route.ts`: capa 1 `Authorization: Bearer RUTINA_SECRETO`;
  capa 2 guardia de hora/día; luego reclama el slot (`rutina_ultimo`) para no
  duplicar avisos.
- Cron activo desde el 21 oct 2026: `.github/workflows/rutina.yml`, cron UTC
  `0 15,17,19,21,23,1,3 * * *` (= 9,11,13,15,17,19,21 de Jalisco). El workflow
  usa `curl --fail-with-body --retry 2` para que un 401/5xx marque el run en rojo.
- `scripts/cron-setup.mjs` (`npm run cron:setup`) queda como alternativa QStash
  si GitHub Actions dejara de servir.

## Seguridad
- Cabeceras en `next.config.ts`: CSP, `X-Frame-Options: DENY`, `nosniff`,
  `Referrer-Policy`, `Permissions-Policy`. La CSP necesita `style-src
  'unsafe-inline'` (thumb con background inline) y `script-src 'unsafe-inline'`
  (bootstrap de App Router); `img-src` cubre `i.scdn.co` e `i.ytimg.com`.
- Tokens solo en el servidor: ninguno con prefijo `NEXT_PUBLIC_`; `.env*` está
  en `.gitignore` y `.env.example` documenta las variables sin valores.
- Formulario: validación compartida cliente/servidor, honeypot, rate limit por
  IP (solo cuentan los envíos que pasan validación), escape HTML para Telegram.
- Webhook: si faltan `TELEGRAM_WEBHOOK_SECRET` o `TELEGRAM_CHAT_ID`, las capas se
  desactivan; en producción se avisa por `console.warn`.

## Despliegue (Vercel)
- Proyecto `status-raw` (org `joeroot-x`), vinculado con `.vercel/project.json`
  (ignorado). URL: https://status-raw.vercel.app.
- `vercel git connect` no se pudo: falta conectar GitHub como método de login en
  Vercel (dashboard → Settings → Login Connections). Mientras, desplegar manual:
  `vercel --prod`.
- Env vars en producción (nombres, nunca valores): `GITHUB_TOKEN`,
  `GITHUB_DUENIO`, `GITHUB_EXCLUIR`, `SPOTIFY_CLIENT_ID`,
  `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN`, `YOUTUBE_API_KEY`,
  `YOUTUBE_CHANNEL_ID`, `YOUTUBE_PLAYLIST_ID`, `JIRA_BASE_URL`, `JIRA_EMAIL`,
  `JIRA_API_TOKEN`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`,
  `TELEGRAM_WEBHOOK_SECRET`, `RUTINA_SECRETO`, `KV_REST_API_URL`,
  `KV_REST_API_TOKEN`.
- Las env Secret no se pueden leer de vuelta (`vercel env pull` trae
  `[SENSITIVE]`). Al cambiarlas, redeploy obligatorio.
- `/` es prerenderizada: la primera pinta la genera el build. Sin token en build,
  esa pinta sale con el ejemplo y se corrige en la siguiente revalidación.

## Verificación
- 89 checks Playwright en Firefox sobre build de producción (0 fallos): estilos
  calculados, teclado, reduced-motion, 4 estados del formulario, honeypot,
  16 anchos, GitHub sha vs API, 3 degradaciones.
- Ronda oct 2026 sobre producción (44/44): Jira contrastado ticket por ticket,
  GitHub sha vs API, Spotify/YouTube coherentes con `/api/*`, chips ↔
  `/api/estado`, formulario real, legales, anchos y reduced-motion.
- Revisión 26 oct 2026: `tsc --noEmit`, `eslint .`, `npm test` (10 checks) y
  `npm audit` limpios (0 vulnerabilidades); build de Next 16.4.3 verificado; `/`, `/api/estado`,
  `/api/jira/actual`, `/api/jira/cola`, `/api/spotify` y `/api/youtube`
  respondiendo en producción.

## Deuda técnica y pendientes
- Conectar GitHub ↔ Vercel para que un push a `main` despliegue solo.
- Enlaces de Instagram, LinkedIn y X en el pie (GitHub ya apunta al perfil).
- Número de WhatsApp en `lib/datos.ts` (vacío = sin botón).
- Paginación de la cola de Jira (`maxResults=5` hoy).
- Revisión del texto legal con abogado si el proyecto lo exige.
- `theme-color` fijo; podría seguir al estado.
- Ampliar la cobertura de tests (hoy `rutina`, `tiempo` y `validacion`; faltan
  fuentes con red y componentes).

## Historial de revisiones
- **15 oct 2026** — Ronda post-despliegue: `revalidateTag(expire:0)`, tags de
  prioridad Jira, 6 fuentes en paralelo, cache del token de Spotify, poller con
  `visibilitychange`, escape del webhook, cabeceras de seguridad, limpieza de
  rutas/mocks duplicados.
- **21 oct 2026** — Rutina laboral activada con GitHub Actions (9:00, 11:00,
  13:00, 15:00, 17:00, 19:00 y 21:00 de Jalisco); QStash nunca se creó y queda
  como alternativa.
- **26 oct 2026** — Revisión completa: Next 16.3.8 → 16.4.3 por aviso crítico;
  `npm audit fix` (zod); reloj a `hourCycle: h23`; `InfoCards` con estado real,
  tickets enlazados a Jira y cola sin HTML inválido; `engines` de Node; workflow
  con `curl --fail-with-body`; Open Graph/Twitter; enlace de GitHub en el pie;
  documentación y comentarios al día.
