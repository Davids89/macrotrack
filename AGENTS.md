# AGENTS.md

MacroTrack: PWA local-first de calorías y macros. Lee el `README.md` para qué hace
y qué archivo es cada cosa. Esto es cómo trabajar en el repo.

## Regla nº 1: nada sale del dispositivo

La app es privada por diseño. Los datos viven en IndexedDB (Dexie) y `localStorage`,
en el navegador del usuario.

- **Prohibido** añadir backend, cuentas, sync, telemetría, analytics, Sentry, fuentes o
  scripts de CDN, o cualquier petición que lleve datos del usuario.
- La **única** llamada de red permitida es OpenFoodFacts en `src/lib/openfoodfacts.ts`,
  y solo envía un código de barras. Si necesitas otra, pregunta antes.
- Dependencias nuevas: se instalan (no CDN), y solo si el punto 5 de "Cómo añadir" falla.

## Stack y comandos

SvelteKit 5 (runes, SPA + `adapter-static`) · Tailwind 4 + shadcn-svelte · Dexie ·
`@zxing/library` · Node 22 (`.nvmrc`).

```bash
npm run dev      # desarrollo
npm run check    # typecheck (svelte-check) — obligatorio antes de commit
npm run test     # node --test sobre src/lib/*.test.ts
npm run build    # build estático a build/
```

`npm run check` y `npm run test` tienen que pasar. No hay linter ni formateador: copia el
estilo del archivo que tocas (tabs, comillas simples, sin punto y coma omitido).

## Cómo añadir una función

Por orden; para en el primer punto que resuelva:

1. ¿Hace falta? Si es especulativo, no se escribe.
2. ¿Ya existe aquí? `fmt`/`toNumber` (`format.ts`), `cn` (`utils.ts`), `weekDates`/
   `summarizeDays` (`weekly.ts`), `computeGoals`/`sumTotals` (`macros.ts`),
   `FoodForm`/`FoodPicker`/`MacroBar`/`MacroChart`/`ConfirmDialog` (`lib/components`).
3. ¿Lo hace la plataforma? `<input type="date">`, `<dialog>`, CSS, Intl, índice de Dexie.
4. ¿Lo hace algo ya instalado? shadcn-svelte / bits-ui / lucide.
5. Solo entonces: el código mínimo que funciona.

Lógica pura (cálculos, fechas, parsing, matching) va a `src/lib/*.ts` con su
`*.test.ts` al lado (`node:test` + `assert/strict`, en español, sin frameworks).
Los `.svelte` son presentación: si algo se puede testear, sácalo del componente.

## Reglas del código

**Estado**: runes de Svelte 5 (`$state`, `$derived`, `$effect`). El estado global vive en
`src/lib/stores.svelte.ts`; no crees otro store si encaja ahí.

**Base de datos** (`src/lib/db.ts`): el esquema es versionado e **inmutable**. Nunca edites
un `db.version(n)` existente: añade `db.version(n+1)` con su `.upgrade()` si hay que migrar
datos. Los usuarios tienen bases reales en el móvil; una migración rota pierde su historial.
Las escrituras que tocan varias tablas van en `db.transaction('rw', ...)`.

**Idioma**: todo de cara al usuario en español (textos, etiquetas, errores). Fechas como
`YYYY-MM-DD` en hora local (`toLocaleDateString('en-CA')`, nunca `toISOString()`).
Números con `fmt()` (coma decimal `es-ES`) y entrada con `toNumber()` (acepta coma).

**Orden de macros**, siempre igual en toda la app: Calorías, Grasas, Hidratos, Fibra, Proteína.

**UI**: móvil primero (iPhone), tema oscuro, tokens de `src/app.css` — usa `bg-card`,
`text-muted-foreground`, etc., no colores a pelo. Respeta `safe-area-inset-*` y objetivos
táctiles grandes. Iconos con `@lucide/svelte/icons/<nombre>` (import por icono).

**Offline**: cualquier ruta o asset nuevo tiene que seguir funcionando sin red; si añades
algo que el service worker deba cachear, revisa `src/service-worker.ts`.

## Commits

`tipo(ámbito): descripción en español, imperativo y en minúscula`, como en el historial:
`feat(diario):`, `fix(pwa):`, `refactor(perfil):`, `style(diario):`. Ámbitos habituales:
diario, estadisticas, alimentos, escaner, perfil, pwa, i18n. Un cambio por commit.

## Al terminar

`npm run check` + `npm run test` en verde, y di qué dejaste fuera a propósito.
