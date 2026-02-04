# Ecommerce Engine Frontend

## Architecture Overview
Next.js App Router frontend with a storefront, account area, and admin dashboard.
State is managed with Zustand; API calls use Axios with HttpOnly cookie auth.

## Project Structure
- `src/app`: routes (storefront, auth, account, admin)
- `src/components`: UI components
- `src/lib`: API client, auth, stores, utilities, validations
- `src/types`: shared TypeScript types

## How to Run Locally
1) Install deps: `npm install`
2) Start dev server: `npm run dev`
3) App runs at `http://localhost:3000`

## Configuration
- `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:8080/api/v1`)
- Auth uses HttpOnly cookies set by backend.

## Auth Model
- Login sets access/refresh cookies.
- On 401, frontend calls `/auth/refresh` and retries.
- Middleware guards `/account` and `/admin`.

## API Contracts
Expect `{ status, data, message }` shape for all API responses.
Use defensive fallback handling (`data?.content || []`, etc.).

## Testing
No test runner configured. Use `npm run lint` and manual checks.

## Deployment Notes
Build with `npm run build`, run with `npm run start`.
