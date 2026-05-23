# APEX

A production-ready monorepo containing the APEX frontend and backend services.

## Structure

```
apex/
├── frontend/          # Next.js 15 — TypeScript, Tailwind CSS, App Router
├── backend/           # Node.js + Express — TypeScript, REST API
├── .gitignore
└── README.md
```

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

## Getting Started

### Install dependencies

```bash
# Frontend
cd frontend && npm install

# Backend
cd backend && npm install
```

### Run in development

```bash
# Frontend (http://localhost:3000)
cd frontend && npm run dev

# Backend (http://localhost:3001)
cd backend && npm run dev
```

### Build for production

```bash
# Frontend
cd frontend && npm run build && npm run start

# Backend
cd backend && npm run build && npm run start
```

## Workspace scripts (from root)

```bash
npm run dev:frontend
npm run dev:backend
npm run build:frontend
npm run build:backend
```

## Services

| Service  | URL                    | Description                        |
|----------|------------------------|------------------------------------|
| Frontend | http://localhost:3000  | Next.js App Router application     |
| Backend  | http://localhost:3001  | Express REST API                   |
| Health   | http://localhost:3001/health | `{ "status": "ok" }`         |

## Docs

- [Frontend →](frontend/README.md)
- [Backend →](backend/README.md)
