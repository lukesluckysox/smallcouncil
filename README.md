# Small Council

A private chamber for hard decisions. Submit a dilemma. Five advisors deliberate in two rounds. Record your ruling.

---

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL (Railway managed or self-hosted)
- **ORM/DB**: `pg` (raw SQL, no abstraction bloat)
- **Auth**: Custom — bcrypt passwords + HTTP-only session tokens in DB
- **AI**: Anthropic SDK (Claude)
- **Styles**: CSS Modules + global CSS

---

## Local Development

### 1. Prerequisites

- Node.js 18+
- PostgreSQL running locally (or a Railway PostgreSQL connection string)
- An Anthropic API key

### 2. Install Dependencies

```bash
cd small-council
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/small_council
ANTHROPIC_API_KEY=sk-ant-your-key-here
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
SESSION_SECRET=generate-with-openssl-rand-hex-32
APP_URL=http://localhost:3000
NODE_ENV=development
```

Generate a session secret:
```bash
openssl rand -hex 32
```

### 4. Initialize the Database

Create the database (if local):
```bash
createdb small_council
```

Run the schema:
```bash
psql $DATABASE_URL -f sql/schema.sql
# or if DATABASE_URL isn't in your shell env:
psql postgresql://postgres:password@localhost:5432/small_council -f sql/schema.sql
```

### 5. Run the Dev Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

---

## Railway Deployment

### 1. Create a Railway Project

1. Go to [railway.app](https://railway.app) and create a new project
2. Add a **PostgreSQL** service to the project
3. Add a **new service** from GitHub (connect your repo)

### 2. Set Environment Variables

In your Railway service's **Variables** tab, add:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Provided automatically by Railway if you link the PostgreSQL service |
| `ANTHROPIC_API_KEY` | Your Anthropic key |
| `ANTHROPIC_MODEL` | `claude-3-5-sonnet-20241022` (or update to latest) |
| `SESSION_SECRET` | `openssl rand -hex 32` output |
| `APP_URL` | Your Railway-generated domain, e.g. `https://small-council-production.up.railway.app` |
| `NODE_ENV` | `production` |

> **Railway tip**: If you link the PostgreSQL service to your app service via "Connect", Railway injects `DATABASE_URL` automatically. You do not need to copy it manually.

### 3. Initialize the Database on Railway

After first deploy, open the Railway **Shell** for your service and run:

```bash
psql $DATABASE_URL -f sql/schema.sql
```

Or use the Railway PostgreSQL service's **Query** tab and paste the contents of `sql/schema.sql`.

### 4. Deploy

Push to your GitHub repo's main branch. Railway will build and deploy automatically.

The `railway.json` is already configured to use Nixpacks and `npm start`.

---

## Project Structure

```
small-council/
├── app/
│   ├── page.tsx                     # Landing page
│   ├── layout.tsx                   # Root layout
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx               # Auth-protected layout
│   │   ├── dashboard/page.tsx       # Home/welcome
│   │   ├── dilemma/new/page.tsx     # Submit a dilemma
│   │   ├── session/[sessionId]/     # Council session view
│   │   └── archive/page.tsx         # Session history
│   └── api/
│       ├── auth/{login,signup,logout,me}/
│       ├── council/                 # Runs the full debate
│       └── sessions/[sessionId]/   # Get / update a session
├── components/
│   ├── Header.tsx
│   ├── AuthForm.tsx
│   ├── DilemmaForm.tsx
│   ├── VoiceCard.tsx                # Individual persona response
│   ├── CouncilChamber.tsx           # Tabbed session viewer
│   ├── SessionList.tsx
│   └── EmptyState.tsx
├── lib/
│   ├── auth/session.ts              # Session create/destroy/validate
│   ├── db/index.ts                  # pg pool + query helpers
│   ├── council/
│   │   ├── personas.ts              # System prompts + metadata
│   │   └── orchestrator.ts         # Two-round debate runner
│   └── types.ts                     # Shared TypeScript types
├── sql/
│   └── schema.sql                   # Full DB schema
├── styles/
│   └── globals.css                  # Design tokens + global styles
├── middleware.ts                    # Route protection
├── railway.json
└── .env.example
```

---

## Council Structure

**Round 1** — Five personas respond to the dilemma in parallel (`Promise.allSettled`). Each produces a stance, confidence score, two recommended actions, and a warning.

**Round 2** — Each persona challenges one specific other persona in sequence, using full Round 1 context:

| Challenger | Challenges |
|---|---|
| The Instinct | The Critic |
| The Critic | The Instinct |
| The Realist | The Sage |
| The Shadow | The Realist |
| The Sage | The Shadow |

**Council Summary** — A non-persona synthesis of major tensions, areas of agreement, and the core tradeoff.

---

## Updating the Claude Model

Set the `ANTHROPIC_MODEL` environment variable to any supported Anthropic model string. The default is `claude-3-5-sonnet-20241022`. Update this in `.env.local` (dev) or Railway variables (production) without redeploying the code.

---

## Adding the First User

Sign up via `/signup`. All sessions are private and scoped to the authenticated user's account.
