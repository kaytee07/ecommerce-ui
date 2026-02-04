# Repository Guidelines

## Project Structure & Module Organization
- `src/app`: Next.js App Router pages and layouts (storefront, auth, admin, account).
- `src/components`: Shared UI components.
- `src/lib`: API client, auth, utilities, stores, and validations.
- `src/types`: Shared TypeScript types.
- `public`: Static assets (images, icons).
- `src/middleware.ts`: Route protection and auth-related middleware.

## Build, Test, and Development Commands
- `npm run dev`: Start the local development server (Next.js).
- `npm run build`: Create a production build.
- `npm run start`: Run the production server from a build.
- `npm run lint`: Run ESLint checks (Next.js config).

## Coding Style & Naming Conventions
- Language: TypeScript + React (Next.js).
- Indentation: 2 spaces.
- Filenames: `kebab-case` for folders, `page.tsx` for route files.
- Components: `PascalCase` (e.g., `AdminProductsPage`).
- Hooks and utilities: `camelCase`.
- Styling: Tailwind CSS utility classes; prefer existing UI components in `src/components/ui`.

## Testing Guidelines
- No automated test framework is configured in this repo.
- For changes, rely on manual verification and `npm run lint`.
- If adding tests in future, align naming with `*.test.ts(x)` and colocate near source.

## Commit & Pull Request Guidelines
- Commit history suggests short, imperative messages (e.g., `add`).
- Keep commits focused and describe user-visible behavior.
- PRs should include:
  - Summary of changes.
  - Steps to verify (routes visited, API calls tested).
  - Screenshots for UI changes (storefront/admin).

## Configuration & Environment
- API base URL: `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:8080/api/v1`).
- Auth uses HttpOnly cookies; ensure backend is running for auth-protected routes.
- Use `/login?redirect=/path` for auth-required flows.

## Data Flow Discipline
- When adding or changing data fields (e.g., shipping address, inventory, discounts), update every read/write touchpoint in the same pass: API payloads, DTOs/types, UI forms, detail views, exports, and admin/storefront summaries.
- Do not wait for a follow-up prompt to propagate new fields; apply them everywhere they are relevant by default.
