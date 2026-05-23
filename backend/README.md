# APEX Backend

Node.js + Express REST API built with TypeScript.

## Stack

- **Runtime**: Node.js 18+
- **Framework**: Express 4
- **Language**: TypeScript 5
- **Config**: dotenv
- **Dev server**: ts-node-dev

## Structure

```
backend/
├── src/
│   ├── controllers/     # Route handler logic
│   │   └── healthController.ts
│   ├── middleware/      # Express middleware
│   │   └── errorHandler.ts
│   ├── routes/          # Route definitions
│   │   └── health.ts
│   ├── utils/           # Shared utilities
│   │   └── logger.ts
│   └── index.ts         # App entry point
├── dist/                # Compiled output (git-ignored)
├── .env.example         # Environment variable template
├── .eslintrc.json
├── package.json
└── tsconfig.json
```

## Setup

```bash
# Copy env template
cp .env.example .env

# Install dependencies
npm install
```

## Scripts

| Command         | Description                          |
|-----------------|--------------------------------------|
| `npm run dev`   | Start dev server with hot reload     |
| `npm run build` | Compile TypeScript to `dist/`        |
| `npm run start` | Run compiled production build        |
| `npm run lint`  | Lint TypeScript files                |
| `npm run type-check` | Run tsc without emitting files  |

## Environment Variables

| Variable   | Default       | Description        |
|------------|---------------|--------------------|
| `PORT`     | `3001`        | HTTP server port   |
| `NODE_ENV` | `development` | Runtime environment |

## Endpoints

| Method | Path      | Response              |
|--------|-----------|-----------------------|
| GET    | `/health` | `{ "status": "ok" }` |
