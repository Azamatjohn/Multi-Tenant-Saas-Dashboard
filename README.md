**Live demo:** https://multi-tenant-saas-dashboard-hazel.vercel.app
**API:** https://multi-tenant-saas-dashboard-q6s2.onrender.com/docs



# NexusHQ — Multi-Tenant SaaS Dashboard

A full-stack SaaS platform built from scratch with production-grade architecture. Teams can create isolated workspaces, manage members with role-based access control, track API usage analytics, and handle subscriptions — all through a clean, modern dashboard.

**Live demo:** coming soon · **Backend:** FastAPI · **Frontend:** Next.js

---

## What it does

NexusHQ is a multi-tenant workspace platform. Each company or team registers and gets their own completely isolated workspace. Inside that workspace:

- Owners can invite members via signed email tokens
- Roles (owner, admin, member) control what each person can do
- API usage is tracked per workspace and visualized in charts
- Subscription plans (Starter, Pro, Enterprise) gate features via Stripe
- Every significant action is written to an audit log

---

## Architecture

The hardest problem in SaaS is **tenant isolation** — ensuring Company A can never see Company B's data, even under failure conditions. NexusHQ solves this at the database level using **PostgreSQL Row-Level Security (RLS)**, not just application-level checks.

```
┌─────────────────────────────────────────────────┐
│                  Next.js Frontend                │
│     Auth zone · App zone · Workspace routing     │
└────────────────────┬────────────────────────────┘
                     │ REST API
┌────────────────────▼────────────────────────────┐
│                 FastAPI Backend                  │
│                                                  │
│  ┌─────────────┐  ┌──────────┐  ┌────────────┐  │
│  │ Auth service│  │ Workspace│  │  Billing   │  │
│  │ JWT + RBAC  │  │ + Members│  │  (Stripe)  │  │
│  └─────────────┘  └──────────┘  └────────────┘  │
│                                                  │
│  Middleware pipeline:                            │
│  Tenant resolver → Permission check → Audit log  │
└────────────────────┬────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────┐
│              PostgreSQL + Redis                  │
│                                                  │
│  Row-Level Security policies on all tenant data  │
│  Redis counters → Celery flush → usage_records   │
└─────────────────────────────────────────────────┘
```

### Key architectural decisions

**Multi-tenancy with RLS** — Every request sets `app.workspace_id` as a Postgres session variable. RLS policies on `workspace_members`, `invites`, and `subscriptions` enforce that queries only return rows matching that workspace ID. No application-level filtering required.

**JWT with refresh token rotation** — Access tokens expire in 30 minutes. Refresh tokens rotate on every use (30-day expiry). The frontend intercepts 401s and transparently refreshes without logging the user out.

**Usage tracking via Redis** — Instead of writing to Postgres on every API call, a middleware increments a Redis counter per workspace per day. A Celery Beat job flushes counters to `usage_records` every hour via an upsert. This prevents database writes on every request.

**Stripe webhook-driven billing** — Subscription state is never trusted from the frontend. All plan changes flow through Stripe webhooks (`checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`), which update the local `subscriptions` table.

**RBAC via dependency injection** — Routes are protected with `Depends(require_role(MemberRole.owner, MemberRole.admin))`. Features are gated with `Depends(require_plan(PlanName.pro))`. Both are composable FastAPI dependencies.

---

## Tech stack

### Backend
| Layer | Technology |
|---|---|
| Framework | FastAPI + Python 3.9 |
| ORM | SQLAlchemy 2.0 (async) |
| Database | PostgreSQL with Row-Level Security |
| Migrations | Alembic |
| Auth | PyJWT + passlib[bcrypt] |
| Cache | Redis |
| Background jobs | Celery + Celery Beat |
| Payments | Stripe Python SDK |
| Email | Resend |
| Rate limiting | SlowAPI |
| Validation | Pydantic v2 |

### Frontend
| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui |
| Data fetching | TanStack Query |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| State | Zustand |
| HTTP | Axios |

---

## Features

### Auth system
- Email + password registration with workspace creation
- JWT access tokens (30 min) + refresh token rotation (30 days)
- Signed invite tokens with 7-day expiry
- Password hashing with bcrypt

### Workspace management
- Each workspace has a unique URL slug
- Workspace settings (name, slug, logo)
- Full audit log of member actions

### Role-based access control
- Three roles: **Owner**, **Admin**, **Member**
- Owners cannot be demoted or removed
- Route-level enforcement via FastAPI dependencies
- Plan-level gating (402 for features above plan)

### Member management
- Invite members by email with role assignment
- View and remove members
- Accept invite via signed token URL
- Pending invites list with expiry tracking

### Billing (Stripe)
- Three plans: Starter (free), Pro ($29/mo), Enterprise ($99/mo)
- Stripe Checkout for upgrades
- Stripe Customer Portal for self-serve management
- Webhook-driven subscription state sync
- Usage limits enforced per plan

### Analytics
- Per-workspace API call tracking via Redis
- Daily usage records flushed hourly via Celery
- 7 / 30 / 90 day breakdowns
- Per-member usage attribution
- Peak day detection

### Security
- Row-Level Security on all tenant-scoped tables
- Rate limiting: 5 register/min, 10 login/min
- Global error handler with consistent JSON format
- Audit log for all sensitive actions
- CORS restricted to frontend origin

---

## Project structure

```
saas-platform/
├── backend/
│   └── app/
│       ├── core/           # security, dependencies, audit
│       ├── middleware/      # tenant resolver, usage tracking, rate limiting
│       ├── models/          # SQLAlchemy models (users, workspaces, members, billing, analytics, audit)
│       ├── routers/         # auth, workspaces, members, billing, analytics, user
│       ├── schemas/         # Pydantic request/response models
│       ├── services/        # billing service (Stripe)
│       ├── tasks/           # Celery tasks (usage flush)
│       ├── migrations/      # Alembic migrations
│       ├── worker.py        # Celery app + beat schedule
│       ├── database.py      # async SQLAlchemy engine
│       ├── config.py        # pydantic-settings
│       └── main.py          # FastAPI app + middleware registration
└── frontend/
    └── src/
        ├── app/
        │   ├── (auth)/      # login, register
        │   └── (app)/       # [workspace] dashboard, members, analytics, billing, settings
        ├── components/
        │   ├── layout/      # Sidebar, Topbar
        │   └── ui/          # shadcn components
        ├── lib/             # axios client
        ├── store/           # Zustand auth store
        └── types/           # TypeScript interfaces
```

---

## API endpoints

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
GET    /api/auth/me

GET    /api/workspaces                           ← list user's workspaces
GET    /api/workspaces/{slug}
PATCH  /api/workspaces/{slug}
GET    /api/workspaces/{slug}/audit

GET    /api/workspaces/{slug}/members
PATCH  /api/workspaces/{slug}/members/{id}/role
DELETE /api/workspaces/{slug}/members/{id}

POST   /api/workspaces/{slug}/invites
GET    /api/workspaces/{slug}/invites
POST   /api/workspaces/{slug}/invites/{token}/accept

GET    /api/workspaces/{slug}/billing
POST   /api/workspaces/{slug}/billing/checkout
POST   /api/workspaces/{slug}/billing/portal
POST   /api/webhooks/stripe

GET    /api/workspaces/{slug}/analytics

GET    /health
```

---

## Running locally

### Prerequisites
- Python 3.9+
- Node.js 18+
- PostgreSQL
- Redis

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# copy and fill in your env vars
cp .env.example .env

# run migrations
alembic upgrade head

# start the API
uvicorn app.main:app --reload

# start Celery worker (separate terminal)
celery -A app.worker worker --loglevel=info

# start Celery Beat scheduler (separate terminal)
celery -A app.worker beat --loglevel=info
```

### Frontend

```bash
cd frontend
npm install

# copy and fill in your env vars
cp .env.local.example .env.local

npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Database schema

| Table | Description |
|---|---|
| `users` | Registered users |
| `workspaces` | Tenant workspaces |
| `workspace_members` | User ↔ workspace membership with role |
| `invites` | Pending workspace invitations |
| `subscriptions` | Stripe subscription state per workspace |
| `usage_records` | Daily API call counts per workspace |
| `audit_logs` | Action history for compliance |

RLS is enabled on `workspace_members`, `invites`, and `subscriptions`.

---

## Environment variables

### Backend (`.env`)
```env
DATABASE_URL=postgresql+asyncpg://user@localhost:5432/saas_platform_db
SYNC_DATABASE_URL=postgresql://user@localhost:5432/saas_platform_db
SECRET_KEY=your-secret-key
REDIS_URL=redis://localhost:6379
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_ENTERPRISE_PRICE_ID=price_...
RESEND_API_KEY=re_...
FRONTEND_URL=http://localhost:3000
```

### Frontend (`.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

---

## What I learned building this

This project taught me how real SaaS products are architected — not just how to write code that works, but how to design systems that are secure by default, scalable by architecture, and maintainable by structure.

The most valuable concepts: database-level tenant isolation with RLS, webhook-driven state management with Stripe, async background job patterns with Celery and Redis, and how JWT refresh token rotation works in practice.

---

Built by [Azamat](https://github.com/Azamatjohn) · [GitHub repo](https://github.com/Azamatjohn/Multi-Tenant-Saas-Dashboard)
