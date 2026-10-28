# QBank Client — Frontend Documentation

QBank is an academic Question Bank & Practice Assessment System built using React 19, TypeScript, Vite, Tailwind CSS v4, React Router, and TanStack Query.

---

## 1. Quick Start

### Installation
```bash
cd client
npm install
```

### Running Locally
```bash
npm run dev
```
The application will be available at `http://localhost:5173`.

### Type Check & Production Build
```bash
npm run build
```

### Linting
```bash
npm run lint
```

---

## 2. Development-Only Preview Mode

Because backend and MongoDB integration is currently underway by backend teammates, a **Development-Only Preview Mode** is included so you can preview every role interface (`Student`, `Teacher`, `Administrator`) without credentials.

### Enabling / Disabling Preview Mode
In `client/.env`:
```env
# Enable Preview Mode (Default in DEV)
VITE_DEV_AUTH_BYPASS=true

# Disable Preview Mode (to test live API authentication)
VITE_DEV_AUTH_BYPASS=false
```

> **Security & Guard:** Preview mode is automatically inactive in production builds (`import.meta.env.DEV === false`), even if the environment variable is present.

### How to Permanently Remove Preview Mode Later
When the backend is deployed and preview mode is no longer needed:
1. Delete the isolated folder: `client/src/dev-preview/`
2. In [`client/src/components/layout/AppShell.tsx`](src/components/layout/AppShell.tsx), remove `<DevPreviewBanner />` and `<DevTriviaDrawer />`.
3. In [`client/src/features/auth/LoginPage.tsx`](src/features/auth/LoginPage.tsx), remove the dev preview card section.
4. Set `VITE_DEV_AUTH_BYPASS=false` in `.env`.

---

## 3. Connecting to the Backend

The frontend communicates with the backend via `VITE_API_BASE_URL` (default: `http://localhost:5000/api`).
All authentication relies on JWT sent via secure, HTTP-only SameSite cookies (`credentials: 'include'`).

For full backend requirements, database schemas, and endpoint specifications, refer to:
- [`../BACKEND_INSTRUCTIONS.md`](../BACKEND_INSTRUCTIONS.md)
- [`../docs/api-contract.md`](../docs/api-contract.md)
