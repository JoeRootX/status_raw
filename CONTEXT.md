# Contexto del proyecto joerootX

## Resumen ejecutivo
Sitio de estado personal en Next.js 16 + TypeScript 6.0.3. **Desplegado en Vercel**: https://status-raw.vercel.app (GitHub muestra datos reales en producción). Rama activa: `main`.

## Stack fijado
- Next.js 16.3.8 (App Router, ISR con `revalidate = 300`)
- React 19.3.0
- TypeScript 6.0.3 (no 7; `typescript-eslint` exige `<6.1.0`)
- ESLint 9 + `eslint-config-next@16.3.8`
- CSS nativo (sin Tailwind); `next/font` para JetBrains Mono + Inter

## Estructura clave
```
app/
  layout.tsx           # providers, metadata, viewport, next/font
  page.tsx             # async, revalidate=300, llama ultimoCommit()
  globals.css          # CSS completo migrado del HTML verificado
  aviso-de-privacidad/page.tsx
  terminos-y-condiciones/page.tsx
components/bloque/
  Identidad.tsx        # avatar + estado (aria-live)
  InfoCards.tsx        # Jira, cola, GitHub (recibe commit por prop)
  ChipsEstado.tsx      # 5 chips read-only, tabindex=0, blur/flote con :not([data-activo])
  Multimedia.tsx       # Spotify/YouTube en .hold
  ContactForm.tsx      # novalidate, 4 estados, honeypot, link legal fuera de label
  Reloj.tsx            # useSyncExternalStore, snapshot servidor fijo
  Footer.tsx           # enlaces internos/externos, redes sin href="#"
  Estado.tsx           # renderiza Senal<T> (listo|vacio|error)
components/legal/
  AvisoDelBorrador.tsx # nota común en páginas legales
lib/
  fuente.ts            # union discriminada listo|vacio|error + helpers
  datos.ts             # mock data (Jira, cola, multimedia, estados, legales)
  enlaces.ts           # enlaces internos/externos/sin-destino
  tiempo.ts            # haceCuando(iso) con Intl.RelativeTimeFormat('es')
  github.ts            # enumera repos, GraphQL con alias, ordena cliente, degradación sin token
legacy/
  index.html           # sitio estático archivado (465 líneas)
  aplicar_capa_d.py    # script de migración Capa D
public/
  avatar.jpg
capturas/              # 0375.png, 0768.png, 1440.png, legal.png
```

## Decisiones técnicas no obvias
1. **`orderBy` en `refs` no ordena**: probado — `last` devuelve las ramas más antiguas, `first` mezcla fechas sin orden. Solución: traer 50 refs/repo y ordenar en código (`masReciente()`).
2. **GraphQL exige token aunque repos sean públicos**: sin token → 403. REST aguanta sin token (60/h) pero en Vercel las IPs son compartidas → impredecible. PAT sin scopes obligatorio.
3. **Alias por índice, no por nombre**: sanitizar `a-b`/`a_b` colapsa en el mismo alias y pierde un repo en silencio.
4. **`haceCuando` en servidor**: `Intl.RelativeTimeFormat('es')` resuelto en build/ISR, llega como texto fijo → sin riesgo de hidratación.
5. **Chips read-only**: antes radios, ahora `div` con `[data-activo]`. CSS cambia `input:not(:checked)` → `:not([data-activo])`. Grupo `tabindex=0` para teclado.
6. **`/main--legal` anula grid de 3 columnas**: sin esto, a ≥1200px el texto legal caía en columna de 280px.

## Fuentes de datos
| Bloque | Estado | Fuente |
|--------|--------|--------|
| Estado/Jira/Cola | Mock | `lib/datos.ts` |
| Multimedia | Mock | `lib/datos.ts` |
| Formulario | Simulado | `SIMULAR='ok'` en componente |
| **GitHub** | **Real** | `lib/github.ts` → GraphQL 1 petición, 20 repos × 50 refs, `status_raw` excluido, `revalidate=300` |
| Spotify | Pendiente | — |
| YouTube | Pendiente | — |
| Jira real | Pendiente | — |
| Estado Telegram | Pendiente | — |

## GitHub (fuente real implementada)
- `lib/github.ts`: enumera repos del owner → filtra `GITHUB_EXCLUIR` (default `status_raw`) → GraphQL con 20 alias, `refs(first:50)` → aplanar → ordenar por `committedDate` descendente → mapear a `Commit` (mensaje, sha7, repo, rama, ticket si `SDT-\d+`, autor, `haceCuando(fecha)`, url).
- `ULTIMO_COMMIT` en `datos.ts` → eliminado; ahora `lib/github.ts` exporta `ultimoCommit(): Promise<Fuente<Commit>>`.
- `InfoCards` recibe `commit: Fuente<Commit>` por prop (presentacional puro).
- Sin `GITHUB_TOKEN`: `modo: 'manual'` + `COMMIT_DE_EJEMPLO`.
- Token inválido/fallo: `modo: 'auto'`, `senal: fallo('No se pudo consultar GitHub ahora mismo.')` → se ve con `role="alert"`, **no** cae al ejemplo.

## Verificación
- 89 checks Playwright en Firefox sobre build de producción (0 fallos):
  - Estilos calculados blur/flote, hover/unhover, teclado, reduced-motion
  - 4 estados formulario, honeypot, noindex legal, 16 anchos, 3 quiebres
  - GitHub: sha contrastado vs API, enlace commit correcto, `status_raw` ausente, tiempo relativo ES, sin token en HTML
  - 3 degradaciones: sin token → ejemplo; token inválido → error con `role="alert"` sin tumbar página; GitHub caído → error

## Configuración de despliegue
- Hosting: Vercel (requerido para server-side tokens + ISR)
- Build: `npm run build` → `npm run start`
- Env: `GITHUB_TOKEN` (PAT clásico sin scopes) + opcional `GITHUB_DUENIO`, `GITHUB_EXCLUIR=status_raw`
- ISR: `export const revalidate = 300` en `app/page.tsx`
- Primera pinta en Vercel usa datos del **build**; sin token en build → primera pinta con ejemplo, se corrige a los 5 min.

## Commits en `next` (sobre `main` @ `48ceb1b`)
1. `fa61f1c` Next.js + TypeScript sobre el HTML ya verificado (base + componentes + CSS)
2. `f39c563` Aviso y terminos pasan a rutas propias, con el texto legal como esta (rutas legales, .main--legal, pie sin href="#")
3. `c2e6aca` La tarjeta de GitHub ya lee la API de verdad (lib/github.ts, tiempo.ts, tipos, revalidate, .env.example)

## Archivos modificados/nuevos desde `main`
- `package.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `.gitignore` (con `!.env.example`)
- `app/`: `layout.tsx`, `page.tsx`, `globals.css`, `icon.svg`, `aviso-de-privacidad/page.tsx`, `terminos-y-condiciones/page.tsx`
- `components/bloque/`: 8 archivos nuevos
- `components/legal/`: `AvisoDelBorrador.tsx`
- `lib/`: `fuente.ts`, `datos.ts` (modificado), `enlaces.ts`, `tiempo.ts`, `github.ts`
- `.env.example`, `README.md` (actualizado), capturas regeneradas
- `legacy/`: `index.html`, `aplicar_capa_d.py` (movidos)

## Próximos pasos (Capa 3+)
1. Spotify (polling + cache) → YouTube → Jira real → Estado por Telegram (bot + webhook + Redis/KV).
2. Refresco en cliente (SSE o polling) sobre la misma caché.
3. Texto legal: revisar con abogado → quitar `noindex`.

## Despliegue (Vercel)
- Proyecto: `status-raw` (org `joeroot-x`), vinculado con `.vercel/project.json` (ignorado).
- URL: `https://status-raw.vercel.app` — **desplegado con `vercel --prod`**, prerenderizó con datos reales de GitHub (`bf21308`, `siiges-services · SDT-1768`).
- Env vars en producción: `GITHUB_TOKEN` (Secret, inyectado desde `gh auth token` por tubería), `GITHUB_DUENIO=JoeRootX`, `GITHUB_EXCLUIR=status_raw`. Faltan ahí: Spotify/YouTube/Jira/Telegram (dashboard o `vercel env add`).
- `vercel git connect` **no se pudo**: falta conectar GitHub como método de login en Vercel (dashboard → Settings → Login Connections). Mientras, desplegar manual: `vercel --prod`.
- Deployment Protection (Vercel Authentication) **activa por defecto**: para curl público usar `vercel curl`. Puede desactivarse en dashboard (Settings → Deployment Protection).
- Jira usa endpoint nuevo `POST /rest/api/3/search/jql` (el viejo `/search` devuelve 410).

## Estado actual del repo
- Rama activa: `main` (sincronizada con `origin`); `next` quedó fusionada en `85ba623`.
- `.next/`, `node_modules/`, `.vercel/`, `.env*` ignorados
- Token **nunca** en disco ni en commits; se inyecta vía `gh auth token` al proceso para pruebas y ya está como Secret en Vercel.
- Formulario: `/api/contacto` con entrega a Telegram (mock-first; sin `TELEGRAM_BOT_TOKEN` funciona simulado).