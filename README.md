# HMD CRM

AI-native CRM for the HMD Secure sales hackathon. Next.js runs as the application server — business logic and data processing live in API routes and server components, not the browser.

## Stack

- **Next.js 15** (App Router, standalone output for Azure)
- **PostgreSQL 16** via Docker
- **Drizzle ORM** + **Zod** validation
- **Biome** lint/format with [pre-commit](https://pre-commit.com) hook
- **Tailwind CSS 3**

Requires **Node.js 20+** (Docker image uses Node 22). Entra ID JWT auth is stubbed in `src/lib/auth.ts` — wire it up before Azure deployment.

## Quick start

### With Docker (recommended)

```bash
cp .env.example .env
docker compose up --build
```

- App: http://localhost:3000
- Postgres: `localhost:5433` (user `hmd`, password `hmd`, db `hmd_crm`)
- Health check: http://localhost:3000/api/health

### Local dev (Postgres in Docker, Next.js on host)

```bash
docker compose up postgres -d
cp .env.example .env
npm install
npm run db:push
npm run dev
```

## Database

Schema covers the hackathon brief: accounts, contacts, deals (direct/reseller stages, 3-yr forecast), cases, offers + approvals, products/services catalog, notes, notifications, activity log.

```bash
npm run db:generate   # create migrations from schema changes
npm run db:migrate    # apply migrations
npm run db:push       # push schema directly (dev)
npm run db:studio     # Drizzle Studio GUI
```

## API routes (server-side)

| Route           | Methods   | Description            |
| --------------- | --------- | ---------------------- |
| `/api/health`   | GET       | App + DB connectivity  |
| `/api/accounts` | GET, POST | List / create accounts |
| `/api/deals`    | GET, POST | List / create deals    |

All POST bodies are validated with Zod before hitting Drizzle.

## Linting

```bash
npm run lint        # check
npm run lint:fix    # check + auto-fix
npm run format      # format only
```

Install the git hook once (pick one):

# or distro package (Ubuntu 24.04+)

sudo apt install pre-commit
pre-commit install

# macOS

brew install pre-commit
pre-commit install

```

On each commit, `.pre-commit-config.yaml` runs Biome on staged files.

## Project structure

```

src/
app/ # Pages + API routes (server)
db/ # Drizzle client + schema
lib/ # Zod validators, API helpers

```

```
