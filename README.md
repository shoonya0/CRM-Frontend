## CS-CRM Frontend

A modern CRM frontend built with React, TypeScript, Vite, Tailwind CSS, and shadcn/ui. It connects to the Mini CRM backend (Express) to manage authentication, leads, users, and activities with a clean, responsive UI.

### Features

- Authentication with JWT (login, register, token verification)
- Role-based access (admin, sales_rep)
- Leads management (list, detail, create, edit, delete)
- Activities per lead (view, add)
- Dashboard with key stats and recent activity
- Conversion analytics with bar and pie charts
- Responsive layout with fixed sidebar and protected routes

### Tech Stack

- React + TypeScript + Vite
- Tailwind CSS
- shadcn/ui components
- Recharts (charts)
- @tanstack/react-query

### Getting Started

Prerequisites: Node.js >= 18 and npm.

1. Install dependencies

```sh
npm i
```

2. Run the backend (from project root or Backend folder)

```sh
cd ../Backend
npm i
npm run start
```

3. Run the frontend

```sh
cd ../Frontend
npm run dev
```

The frontend dev server proxies API requests to `http://localhost:5000` via Vite config.

### Environment & Config

- API base path: `/api` (configured in `src/services/api.ts` and proxied in `vite.config.ts`).
- Path alias `@` → `src/`.

### Project Structure

- `src/pages`: route pages (Dashboard, Leads, LeadDetail, LeadEdit, Users, Auth)
- `src/components`: layout and UI wrappers
- `src/contexts`: `AuthContext` for auth/token/claims
- `src/services/api.ts`: API client to backend
- `public/`: static assets (favicon, images)

## Backend

Express-based API that powers authentication, leads, activities, and users.

### Run Backend

```sh
cd Backend
npm i
npm run start
```

### Environment

- PORT (default 5000)
- JWT_SECRET (set in env for production)

### Key Endpoints

- Health: `GET /api/health`

- Auth:

  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `POST /api/auth/logout`
  - `GET /api/auth/verify`

- Leads:

  - `GET /api/leads`
  - `GET /api/leads/:id`
  - `POST /api/leads` (admin)
  - `PUT /api/leads/:id`
  - `DELETE /api/leads/:id` (admin)
  - Activities:
    - `GET /api/leads/:id/activities`
    - `POST /api/leads/:id/activities`

- Users (admin):
  - `GET /api/users`
  - `GET /api/users/:id`
  - `POST /api/users`
  - `PUT /api/users/:id`
  - `DELETE /api/users/:id`

### Auth & Roles

- JWT issued on login; include `Authorization: Bearer <token>` for protected routes.
- Roles: `admin`, `sales_rep`. Sales reps are limited to their assigned leads. Admins can manage users and all leads.

### Default Credentials (development)

- Admin: `admin / password123`
- Sales: `jane_doe / password123`, `john_smith / password123`

### Notes

- Sidebar is fixed and non-scrollable; content scrolls independently.
- JWT is decoded on the client to derive `user` and role.
- Admin-only pages (e.g., Users) are guarded by `ProtectedRoute` and decoded claims.

### Scripts

```json
{
  "dev": "vite",
  "build": "tsc -b && vite build",
  "preview": "vite preview --port 4173"
}
```

### License

Proprietary. All rights reserved.
