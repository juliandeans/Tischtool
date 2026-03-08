# Repository Guidelines

## Project Context

This repository contains the planning and implementation specs for a furniture-visualization web application built with SvelteKit and TypeScript.

The product goal is a minimalist web app that helps create fast customer-facing furniture mockups. The app has three core modes:

1. change the environment around a furniture image
2. change the material of a furniture image
3. place a furniture image into a customer room photo

This is not a CAD tool and not a photorealistic archviz platform. It is a controlled visualization tool for plausible demo images.

## Project Structure & Module Organization

This repository currently stores the planning pack. The numbered Markdown files define the source of truth for product, architecture, UI, data model, API contracts, and implementation order.

Important spec files include:

- `00_README.md`
- `03_DESIGNSYSTEM.md`
- `04_INFORMATIONSARCHITEKTUR_UND_SCREENS.md`
- `05_FRONTEND_ARCHITEKTUR_SVELTEKIT.md`
- `06_BACKEND_ARCHITEKTUR.md`
- `07_DATENMODELL_UND_STORAGE.md`
- `08_PROMPT_ENGINE_UND_VERTEX_AI_LOGIK.md`
- `10_ROOM_INSERT_FEATURE.md`
- `12_IMPLEMENTATION_PLAN_FUER_CODEX.md`
- `13_CODEX_PROMPTS.md`
- `16_REPO_STRUCTURE.md`
- `17_DRIZZLE_SCHEMA_SPEC.md`
- `18_API_CONTRACTS.md`
- `19_COMPONENT_CHECKLIST.md`
- `20_TESTING_STRATEGY.md`
- `21_ENV_AND_SETUP.md`
- `22_DEFINITION_OF_DONE_PRO_PHASE.md`

When implementing the app, follow the target runtime structure defined in `16_REPO_STRUCTURE.md`.

## Architectural Constraints

The application must remain a single SvelteKit project.

Do not create:

- a separate frontend app
- a separate backend server
- a monorepo
- microservices
- a second API service outside SvelteKit

All server logic must live inside the SvelteKit project, especially in:

- `src/lib/server/`
- `src/routes/api/`

Do not introduce alternative architectures unless explicitly asked.

## Product Constraints

The app must remain focused on these core workflows:

- environment editing
- material editing
- room insert into customer photos

Do not invent unrelated features.
Do not expand scope into:

- team collaboration
- comments
- approval workflows
- full auth systems beyond what is required
- CAD editing
- advanced 3D systems
- unrelated dashboards

Prefer a stable MVP over feature expansion.

## Build, Test, and Development Commands

The runtime scripts should follow `21_ENV_AND_SETUP.md`.

Expected scripts:

- `npm run dev` starts the local SvelteKit dev server
- `npm run build` creates the production build
- `npm run preview` serves the production build locally
- `npm run check` runs Svelte and TypeScript checks
- `npm run lint` validates formatting and code quality
- `npm run test` runs tests
- `npm run db:generate` generates Drizzle artifacts
- `npm run db:migrate` runs migrations
- `npm run db:studio` opens Drizzle Studio

If the scaffold does not exist yet, create it in a way that supports these scripts.

## Coding Style & Naming Conventions

Use TypeScript throughout.

Follow the planned SvelteKit structure and do not create parallel app structures.

Naming rules:

- Svelte components: PascalCase, e.g. `EditorCanvas.svelte`
- stores and utils: camelCase, e.g. `roomInsert.ts`, `format.ts`
- service modules: PascalCase filenames, e.g. `GenerationService.ts`
- route folders: SvelteKit conventions, e.g. `routes/editor/[imageId]/+page.svelte`

Keep modules small and feature-scoped.

Prefer explicit types over `any`.

Do not introduce unnecessary abstraction layers.

## Environment Variables

Never invent new environment variables.

Always read and use the variables defined in `.env.example`.

If something is missing, update `.env.example` instead of introducing undocumented variables.

Do not expose secrets in frontend code.

Google / Vertex credentials must only be used on the server side.

## Prompt Construction

Prompts for image generation must be deterministic.

Do not introduce a second AI model to rewrite prompts.

Do not create any prompt-rewriting assistant layer.

Prompt generation must be handled by the `PromptBuilder` service using fixed templates and structured input values from the UI, following `08_PROMPT_ENGINE_UND_VERTEX_AI_LOGIK.md`.

## Image Versioning

Image editing must be non-destructive.

Every generation must create a new image record.

Every derived image must be linked through `parentImageId` where applicable.

Never overwrite existing source or generated images.

## UI and Design Rules

Follow `03_DESIGNSYSTEM.md`.

Important visual constraints:

- very minimalist interface
- light border radius
- buttons, inputs, selects, and icon buttons must use a 2px inset shadow
- avoid heavy drop shadows
- Bauhaus colors are the only accent colors

Do not introduce decorative styles outside this system.

## Testing Guidelines

Follow `20_TESTING_STRATEGY.md`.

For the MVP, prioritize:

- unit tests for prompt builder logic
- unit tests for cost calculations
- validation tests for API inputs
- focused UI tests for important components

Do not build an oversized testing setup early.

## Working Style

Work in clearly scoped phases.

For each phase:

1. read the relevant spec files
2. plan the change
3. modify only the files needed for that phase
4. run checks if possible
5. summarize what was changed and what remains placeholder

Do not jump ahead to later phases unless explicitly asked.

Do not silently refactor unrelated parts of the project.

## Commit & Change Discipline

Keep changes focused.

Do not mix architecture changes, feature work, and cleanup work without reason.

If an implementation decision differs from the docs, update the relevant spec or clearly explain the deviation.
