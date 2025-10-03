# Audio Sharing SPA

A Svelte + TypeScript single-page application scaffolded with Vite. The project is organized around
functional cohesion to make it easy to evolve discrete product capabilities such as authentication,
playback, and notifications.

## Getting started

```bash
npm install
npm run dev
```

### Available scripts

- `npm run dev` – start the Vite development server
- `npm run build` – create a production build in `dist/`
- `npm run preview` – preview the production build locally
- `npm run lint` – run ESLint across TypeScript and Svelte source files
- `npm run check` – run `svelte-check` and the TypeScript compiler

## Project structure

```
src/
├── app/              # Root layout, global styles, application-level composition
├── features/         # Feature modules grouped by capability (auth, library, playlist, viewer, notifications)
└── shared/           # Cross-cutting utilities such as API clients, storage helpers, and UI primitives
```

Each feature folder exposes a `FeatureModule` definition so the root application can render cohesive
UI while keeping domain logic encapsulated.

Aliases are available for these entry points and can be imported as `@app`, `@features`, and
`@shared` respectively.

## Tooling

- **Vite** powers fast local development and builds.
- **ESLint** with the Svelte and TypeScript plugins enforces code quality.
- **Prettier** (via `prettier-plugin-svelte`) standardizes formatting.
- **EditorConfig** aligns editor defaults for consistent whitespace handling.
