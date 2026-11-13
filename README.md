<![CDATA[<div align="center">

# 🏢 CMS TechSonance

### **Enterprise Content & Operations Management System**

A production-grade, multi-tenant CMS and internal operations platform built for **TechSonance InfoTech LLP**. Manages HR, projects, finance, attendance, helpdesk, and client relationships — all from a single unified dashboard.

[![Next.js](https://img.shields.io/badge/Next.js-15.3-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?logo=tailwindcss)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)](https://www.docker.com/)

</div>

---

## 📚 Technical Audit & Handover Documentation Suite

A comprehensive, read-only architectural audit and handover documentation suite has been compiled in `docs/`:

1. [**System Architecture & Data Flow**](docs/ARCHITECTURE.md) — Multi-tenancy isolation model, Edge middleware pipeline, Mermaid topology.
2. [**Complete Technology Stack**](docs/TECH_STACK.md) — Verified dependencies, versions, runtime engines, and build tools.
3. [**Feature & Module Inventory**](docs/FEATURE_INVENTORY.md) — Exhaustive catalog of all 43 modules, 107 pages, and permission rules.
4. [**Data Source & Persistence Audit**](docs/DATA_SOURCE_AUDIT.md) — Live DB vs mock data breakdown, simulated endpoints, and local storage states.
5. [**Complete API Reference**](docs/API_REFERENCE.md) — 268 unique API routes and 556 registered HTTP method endpoints.
6. [**Database Schema & Models**](docs/DATABASE_SCHEMA.md) — 187 defined tables across 64 migrations (171 verified live, 16 missing).
7. [**Auth, RBAC & Security**](docs/AUTH_AND_SECURITY.md) — Hybrid Supabase + Better-Auth architecture, 23 roles, and security headers.
8. [**Deployment & Operations Guide**](docs/DEPLOYMENT.md) — Environment variables catalog, Docker instructions, and migration steps.
9. [**Bugs & Technical Debt Catalog**](docs/BUGS_AND_TECH_DEBT.md) — Confirmed defects (TypeScript errors, Dockerfile issues) and prioritized roadmap.
10. [**Testing & Verification Status**](docs/TESTING_STATUS.md) — Test suite results, runtime verifications, and coverage gaps.
11. [**Changelog & Ownership Handover**](docs/CHANGELOG_AND_HANDOVER.md) — Git commit history, contributor ownership, and onboarding checklist.
12. [**Black Box QA Testing Guide**](docs/BLACK_BOX_TESTING_GUIDE.md) — Step-by-step 37-case manual test execution flows across all 43 modules.

---

## 📑 Table of Contents

- [Technical Handover Documentation](#-technical-audit--handover-documentation-suite)
- [Overview](#-overview)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Feature Modules](#-feature-modules)
- [Role-Based Access Control](#-role-based-access-control)
- [Security](#-security)
- [API Documentation](#-api-documentation)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Docker Deployment](#-docker-deployment)
- [CI/CD Pipeline](#-cicd-pipeline)
- [Project Structure](#-project-structure)
- [Challenges & Solutions](#-challenges--solutions)
- [Advantages](#-advantages)

---

## 🔭 Overview

CMS TechSonance is a **full-stack enterprise management platform** that consolidates daily operations into one unified application. It serves as both an internal operations hub (HRIS, attendance, payroll, task management) and a client-facing project management tool — all secured behind a granular **Role-Based Access Control (RBAC)** system with **multi-tenant isolation**.

### Key Highlights (Audited Metrics)

- **Multi-Tenant Architecture** — Logical tenant isolation via `tenant_id` and Supabase PostgreSQL Row-Level Security (RLS)
- **43 Functional Modules & 107 Pages** — From Employee Lifecycle & Attendance to Project PMO, CRM Inbox, and Financial Ledgers
- **268 Unique API Routes (556 HTTP Endpoints)** — Full RESTful suite with Zod validation, rate limiting, and OpenAPI 3.0 specs
- **187 Database Tables** — Defined across 64 SQL migrations, with 171 tables confirmed active in the live schema cache
- **23 User Roles** — From Super Admin and CEO to Developers and Interns, with dynamic permission overrides
- **Dual Dashboard System** — Admin-level system command center + Employee-level personal workspace
- **Advanced Attendance** — NFC reader integration, GPS geofencing, IP whitelisting, rotational shifts
- **Auto-generated OpenAPI/Swagger** — Specification automatically synchronized at build time via AST parsing

---

## 🛠 Tech Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| **Next.js** | 15.3 | App Router, SSR, API Routes, Turbopack |
| **React** | 19 | UI rendering with latest concurrent features |
| **TypeScript** | 5 | End-to-end type safety |
| **Tailwind CSS** | 4 | Utility-first styling with PostCSS |
| **Radix UI** | Latest | 30+ accessible, unstyled primitives |
| **Framer Motion** | 12 | Animations and transitions |
| **Recharts** | 3 | Dashboard data visualizations |
| **React Hook Form** | 7 | Form state management |
| **Zod** | 4 | Schema validation (shared client/server) |
| **Lucide React** | Latest | Icon library |
| **shadcn/ui** | Latest | 55+ pre-built UI components |
| **Sonner** | 2 | Toast notifications |

### Backend

| Technology | Version | Purpose |
|---|---|---|
| **Next.js API Routes** | 15.3 | RESTful API layer with App Router handlers |
| **Supabase** | 2.x | PostgreSQL database, auth, storage, RLS |
| **MongoDB** | 7 | Telemetry, audit logs, analytics |
| **Firebase** | 12 | Push notifications (FCM) |
| **Nodemailer** | 6 | Transactional email (SMTP) |
| **bcrypt** | 6 | Password hashing |
| **better-auth** | 1.3 | Authentication framework |
| **Stripe** | 19 | Payment processing |
| **jsPDF** | 4 | Server-side PDF generation |

### DevOps & Tooling

| Technology | Purpose |
|---|---|
| **Docker** | Multi-stage containerized builds |
| **Docker Compose** | Local development environment (Postgres, Redis, MailHog) |
| **GitHub Actions** | CI pipeline (lint, typecheck, test, build, Docker) |
| **ESLint** | Code quality and consistency |
| **Node.js Test Runner** | Native test framework with coverage |
| **OpenAPI Generator** | Auto-generated Swagger docs from AST parsing |

---

## 🏗 Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     CLIENT (Browser)                      │
│  React 19 · Next.js App Router · Tailwind 4 · Radix UI   │
└────────────────────────┬─────────────────────────────────┘
                         │ HTTPS
┌────────────────────────┴─────────────────────────────────┐
│                   MIDDLEWARE LAYER                         │
│  Rate Limiting · CORS · Security Headers · Auth Guard     │
│  CSP · HSTS · X-Frame-Options · Correlation IDs          │
└────────────────────────┬─────────────────────────────────┘
                         │
┌────────────────────────┴─────────────────────────────────┐
│                  API ROUTE HANDLERS                        │
│  53+ RESTful endpoints · Zod validation · RBAC guards     │
│  withApiHandler() wrapper · Standardized responses        │
└───────┬──────────┬──────────┬───────────┬────────────────┘
        │          │          │           │
   ┌────┴───┐ ┌───┴────┐ ┌──┴───┐  ┌───┴─────┐
   │Supabase│ │MongoDB │ │ SMTP │  │Firebase │
   │  (PG)  │ │Telemetr│ │ Mail │  │  FCM    │
   └────────┘ └────────┘ └──────┘  └─────────┘
```

### Key Architectural Patterns

- **Multi-Tenant Isolation** — Every database query is scoped by `tenant_id`; Supabase RLS enforces at the database level
- **Centralized API Handler** — `withApiHandler()` wraps all routes with auth, error handling, logging, and RBAC
- **Dual Auth Provider** — Supabase Auth for session management with legacy user ID mapping
- **Audit Trail** — Every mutation writes to `audit_logs` table and MongoDB telemetry
- **Standardized Response Envelope** — `{ success, data, message, errors, meta }`

---

## 📦 Feature Modules

### 1. 📊 Dashboard & Analytics
- **Admin Dashboard** — Active clients, projects, revenue, team count, workforce hub, financial run-rate charts, pending approval queue, global activity feed, management shortcuts
- **Employee Dashboard** — Monthly/yearly hours, active projects, assigned tasks, due-today counters, attendance history charts, report history, task distribution, announcements & alerts
- **Performance Charts** — Recharts-powered visualizations for attendance trends, report submission rates, and task distribution

### 2. 👥 Team & Employee Management
- Complete employee directory with CRUD operations
- Department-based organization
- Employee status tracking (active, on_leave, resigned)
- Profile management with avatar uploads via Supabase Storage
- Employee detail pages with work history

### 3. 📋 Attendance System
- **Dual-source tracking** — NFC reader-based + legacy manual check-in/check-out
- **Advanced check-in methods** — GPS geofencing, IP whitelisting, NFC tag UID
- **Overtime computation** — Automatic calculation against configurable standard work hours
- **Weekend attendance** — Approval workflow with mandatory notes
- **Violation detection** — IP mismatch and geofence breach flagging with admin notifications
- **Tenant-level settings** — Office coordinates, geofence radius, allowed IPs, standard hours
- **NFC Reader management** — Device registration and enrollment tracking

### 4. 📝 Daily Reports & Updates
- Daily work report submission by employees
- Project-level report tagging
- Admin review and compliance tracking
- Missing report detection on the admin dashboard
- Status tracking: present, half_day, early_leave, on_leave

### 5. 🗂 Project Management
- Full project lifecycle: planned → in_progress → completed → on_hold → cancelled
- Project member assignment with role mapping
- Sprint management with milestone tracking
- Project document management via Supabase Storage
- Priority-based sorting (low, medium, high, urgent)

### 6. ✅ Task Management
- Kanban-style task board with status flow: todo → in_progress → in_review → done
- Task assignment to team members
- Priority levels with due date tracking
- Tasks-due-today counter on employee dashboard
- Enterprise-grade task schema with sprint linkage

### 7. 💰 Finance & Invoicing
- **Invoice Management** — Draft → Sent → Paid → Overdue → Cancelled lifecycle
- **Invoice line items** with quantity, rate, and tax calculations
- **Payment tracking** with Stripe integration
- **Expense management** with categorized tracking
- **Financial run-rate charts** on admin dashboard
- Revenue aggregation and reporting

### 8. 💳 Payroll Processing
- Payroll generation with configurable pay periods
- Status workflow: draft → approved → paid
- Bulk payroll processing with pagination (50 records/page)
- Payroll document storage via Supabase Storage
- Server-side payroll computation engine

### 9. 🧾 Reimbursements & Expense Claims
- Claim submission with receipt uploads
- Categorized expenses (Travel, Meal, Lodging, Office Supplies, Internet/Phone, Other)
- Auto-seeded reimbursement categories per tenant
- Multi-step approval workflow: draft → submitted → approved → rejected
- Admin approval queue integration on dashboard

### 10. 🏖 Leave Management
- Leave request submission and approval workflow
- Leave types: sick, casual, vacation, unpaid
- Leave policy configuration per organization
- Company holiday calendar management
- Leave balance tracking and policy enforcement

### 11. 🎫 Help Desk & Ticketing
- Ticket creation with priority levels (low, medium, high, urgent)
- Status tracking: open → in_progress → resolved → closed
- Ticket response/comment thread with attachments
- Chat-style messaging on tickets
- File attachments via Supabase Storage

### 12. 📰 Content Management (CMS)
- Blog post creation and management
- Media library with file upload/management
- Portfolio management for company showcase
- Page builder capabilities
- SEO-friendly content structure

### 13. 🤝 Client Relationship Management (CRM)
- Client directory with active/inactive status
- Client communication logs and history
- Inquiry management and feed tracking
- Client-to-project linkage
- Client document management
- Business development pipeline

### 14. 🏢 Vendor & Procurement
- Vendor directory management
- Purchase order tracking
- Procurement validation schemas

### 15. ⚙️ Settings & Configuration
- **Company Settings** — Organization profile, branding
- **Business Settings** — Operational parameters
- **Tenant Attendance Settings** — Geofence, IP whitelist, work hours
- **Leave Policies** — Per-organization leave rules

### 16. 🔔 Notifications
- Real-time notification system
- Firebase Cloud Messaging (FCM) push notifications
- In-app notification center
- Auto-notifications for attendance violations, approvals, and system events

### 17. 📊 Activity Logging & Audit Trail
- Comprehensive audit log for all mutations
- MongoDB-powered auth telemetry (login, logout, refresh, password change)
- IP address and user-agent tracking
- Correlation ID tracing across request lifecycle

---

## 🔐 Role-Based Access Control

The system supports **23 distinct user roles** with permissions across **13 modules**:

### Role Hierarchy

| Tier | Roles | Access Level |
|---|---|---|
| **Executive** | Super Admin, Admin, CEO, CTO, Director | Full access to all modules |
| **Management** | HR Manager, CMS Administrator, Management | Full access to all modules |
| **Finance** | Accountant | Full finance + dashboard; view-only on others |
| **Operations** | Project Manager | Full projects, tasks, daily updates, help desk |
| **Sales** | Business Development | Full inquiry; edit clients; view-only dashboards |
| **Engineering** | Developer, Frontend/Backend/Fullstack/Mobile Dev, QA, DevOps, Architect | Full tasks; edit daily updates; view-only projects |
| **Creative** | UI/UX Designer, Digital Marketing | Content access; edit daily updates and tasks |
| **Analytics** | Business Analyst | View-only with task and report editing |
| **Entry** | Intern | View + create only (no edit/delete) |
| **External** | Client | View-only projects, tasks, finance; create help tickets |

### Permission Matrix (per module)

Each role has four permission levels per module:
- `canView` — Read access
- `canCreate` — Create new records
- `canEdit` — Modify existing records
- `canDelete` — Remove records
- `canApprove` — Approve/reject workflows

---

## 🛡 Security

| Feature | Implementation |
|---|---|
| **Authentication** | Supabase Auth with JWT access/refresh tokens |
| **Session Management** | HTTP-only refresh token cookies with persistence toggle |
| **Password Security** | bcrypt hashing (12 rounds configurable) |
| **Account Lockout** | Auto-lock after 5 failed attempts for 15 minutes |
| **Rate Limiting** | Per-IP, per-minute limits (20 public / 100 authenticated) |
| **CSRF Protection** | SameSite cookies + CORS headers |
| **Security Headers** | CSP, HSTS, X-Frame-Options (DENY), X-Content-Type-Options |
| **Row-Level Security** | Supabase RLS policies enforce tenant isolation at DB level |
| **Input Validation** | Zod schemas on every API endpoint |
| **Audit Logging** | Every mutation logged with actor, IP, user-agent, correlation ID |
| **OTP-based Password Reset** | Time-limited OTP with configurable TTL |
| **Correlation IDs** | UUID-based request tracing across middleware → handler → DB |

---

## 📖 API Documentation

The project includes **auto-generated OpenAPI/Swagger documentation**:

- **Swagger JSON**: `public/docs/swagger.json` (344KB)
- **Swagger YAML**: `public/docs/swagger.yaml` (252KB)
- **Generation**: `npm run generate:openapi` — parses API route AST to extract endpoints
- **Pre-build hook**: Automatically regenerates before `npm run build`

### API Endpoint Categories (53+ routes)

| Category | Endpoints |
|---|---|
| Auth | `/api/auth/*` (login, logout, refresh, me, password reset) |
| Employees | `/api/employees`, `/api/employees/[id]` |
| Attendance | `/api/attendance`, `/api/attendance/[id]`, `/api/attendance/checkout` |
| Readers | `/api/readers`, `/api/readers/[id]` |
| Enrollments | `/api/enrollments`, `/api/enrollments/[id]` |
| Daily Reports | `/api/daily-reports`, `/api/daily-report-projects` |
| Projects | `/api/projects`, `/api/project-members`, `/api/project-documents` |
| Milestones | `/api/milestones` |
| Sprints | `/api/sprints` |
| Tasks | `/api/tasks` |
| Clients | `/api/clients`, `/api/client-communications` |
| Invoices | `/api/invoices`, `/api/invoice-items` |
| Payments | `/api/payments` |
| Expenses | `/api/expenses`, `/api/expense-categories` |
| Payroll | `/api/payroll` |
| Reimbursements | `/api/reimbursements`, `/api/reimbursement-categories` |
| Leave | `/api/leave-requests`, `/api/leave-policies`, `/api/company-holidays` |
| Help Desk | `/api/tickets`, `/api/ticket-responses`, `/api/chat-messages` |
| Content | `/api/blogs`, `/api/pages`, `/api/portfolio`, `/api/media-library` |
| CRM | `/api/inquiries`, `/api/inquiry-feeds` |
| Vendors | `/api/vendors`, `/api/purchases` |
| Notifications | `/api/notifications` |
| Settings | `/api/company-settings`, `/api/business-settings`, `/api/tenants` |
| Dashboard | `/api/dashboard/stats/admin`, `/api/dashboard/stats/employee` |
| System | `/api/users`, `/api/sessions`, `/api/activity-logs`, `/api/rbac` |
| Upload | `/api/upload` |
| Firebase | `/api/firebase` |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 20
- **npm** ≥ 10
- **Supabase** project (PostgreSQL + Auth + Storage)
- **MongoDB** instance (for telemetry)
- **Firebase** project (optional, for push notifications)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd cms-techsonance

# Install dependencies
npm ci

# Copy environment variables
cp .env.example .env
# Edit .env with your credentials

# Generate OpenAPI docs
npm run generate:openapi

# Run database migrations
# Apply SQL files from supabase/migrations/ in order

# Start development server (with Turbopack)
npm run dev
```

### Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with Turbopack |
| `npm run build` | Production build (auto-generates OpenAPI first) |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | TypeScript type checking |
| `npm test` | Run test suite |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run generate:openapi` | Regenerate Swagger docs from API routes |

---

## 🔧 Environment Variables

```bash
# ─── Core ─────────────────────────────────────
NODE_ENV=development
APP_BASE_URL=http://localhost:3000

# ─── Supabase (Primary Database + Auth) ───────
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# ─── Supabase Storage Buckets ─────────────────
SUPABASE_STORAGE_BUCKET_AVATARS=avatars
SUPABASE_STORAGE_BUCKET_PAYROLL=payroll
SUPABASE_STORAGE_BUCKET_EXPENSES=expenses
SUPABASE_STORAGE_BUCKET_PROJECTS=project-files

# ─── Auth Configuration ──────────────────────
JWT_ACCESS_SECRET=<32+ character secret>
AUTH_ACCESS_TOKEN_TTL_MINUTES=15
AUTH_REFRESH_TOKEN_TTL_DAYS=7
AUTH_LOCKOUT_ATTEMPTS=5
AUTH_LOCKOUT_MINUTES=15
PASSWORD_RESET_OTP_TTL_MINUTES=10
BCRYPT_ROUNDS=12
BETTER_AUTH_SECRET=<sync secret>

# ─── Rate Limiting ───────────────────────────
PUBLIC_RATE_LIMIT_PER_MINUTE=20
AUTH_RATE_LIMIT_PER_MINUTE=100
CRON_SECRET=<cron secret>

# ─── MongoDB (Telemetry & Audit) ─────────────
MONGODB_URI=
MONGODB_DB_NAME=cms_telemetry

# ─── SMTP (Email) ────────────────────────────
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM_EMAIL=
SMTP_FROM_NAME=TechSonance InfoTech LLP

# ─── Firebase (Push Notifications) ───────────
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_DATABASE_URL=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

---

## 🐳 Docker Deployment

### Single Container

```bash
docker build -t cms-techsonance .
docker run -p 3000:3000 --env-file .env cms-techsonance
```

### Full Stack (Docker Compose)

```bash
docker-compose up -d
```

Services included:
- **app** — Next.js application (port 3000)
- **postgres** — PostgreSQL 16 Alpine (port 5432)
- **redis** — Redis 7 Alpine (port 6379)
- **mailhog** — Email testing UI (SMTP: 1025, Web: 8025)

The Dockerfile uses a **multi-stage build** (builder → production) with:
- Non-root user (`app`) for security
- `npm ci --omit=dev` for minimal production image
- OpenAPI generation during build phase

---

## 🔄 CI/CD Pipeline

GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every push:

```
Checkout → Setup Node 20 → Install → Generate OpenAPI → Lint → Typecheck → Test with Coverage → Build → Build Docker Image
```

---

## 📁 Project Structure

```
cms-techsonance/
├── .github/workflows/       # CI/CD pipeline
├── docs/                    # RBAC documentation and guides
├── public/                  # Static assets (including generated Swagger spec)
├── scripts/                 # Build & utility scripts
├── supabase/migrations/     # Database migration SQL files
├── tests/                   # Test suite
├── src/
│   ├── app/
│   │   ├── api/             # 53+ REST API route handlers
│   │   │   ├── auth/        # Authentication endpoints
│   │   │   ├── attendance/  # Attendance CRUD + checkout
│   │   │   ├── employees/   # Employee management
│   │   │   ├── projects/    # Project CRUD
│   │   │   ├── tasks/       # Task management
│   │   │   ├── invoices/    # Invoice generation
│   │   │   ├── payroll/     # Payroll processing
│   │   │   ├── tickets/     # Help desk
│   │   │   ├── blogs/       # Content management
│   │   │   └── ...          # 40+ more endpoint groups
│   │   ├── dashboard/       # Dashboard pages
│   │   │   ├── attendance/  # Attendance tracker UI
│   │   │   ├── clients/     # Client directory
│   │   │   ├── content/     # CMS pages
│   │   │   ├── daily-update/# Daily report submission
│   │   │   ├── finance/     # Finance & invoicing
│   │   │   ├── help-desk/   # Ticketing UI
│   │   │   ├── inquiry/     # CRM inquiries
│   │   │   ├── leaves/      # Leave management
│   │   │   ├── payroll/     # Payroll UI
│   │   │   ├── projects/    # Project management
│   │   │   ├── reimbursements/ # Expense claims
│   │   │   ├── settings/    # Organization config
│   │   │   ├── tasks/       # Task board
│   │   │   ├── team/        # Employee directory
│   │   │   └── profile/     # User profile
│   │   ├── login/           # Authentication pages
│   │   └── forgot-password/ # Password reset flow
│   ├── components/
│   │   ├── ui/              # 55+ shadcn/ui components
│   │   ├── dashboard/       # Dashboard-specific components
│   │   ├── clients/         # Client module components
│   │   ├── finance/         # Finance components
│   │   ├── payroll/         # Payroll components
│   │   ├── projects/        # Project components
│   │   ├── reimbursements/  # Reimbursement components
│   │   ├── tasks/           # Task components
│   │   ├── team/            # Team components
│   │   └── providers/       # Context providers
│   ├── hooks/               # Custom React hooks
│   ├── lib/
│   │   ├── permissions.ts   # RBAC permission matrix (608 lines)
│   │   ├── constants.ts     # Centralized constants & enums
│   │   ├── auth.ts          # Client auth utilities
│   │   ├── rbac/            # RBAC configuration
│   │   ├── forms/           # Form schemas
│   │   └── supabase/        # Client-side Supabase helpers
│   ├── server/
│   │   ├── auth/            # Auth service, sessions, tokens, password reset
│   │   ├── config/          # Environment validation
│   │   ├── http/            # Request handler, errors, pagination, responses
│   │   ├── logging/         # Structured logging + MongoDB telemetry
│   │   ├── mail/            # Email service (Nodemailer)
│   │   ├── payroll/         # Payroll computation engine
│   │   ├── rbac/            # Server-side RBAC middleware & service
│   │   ├── supabase/        # Admin client, storage, RLS helpers
│   │   ├── utils/           # Geolocation, date helpers
│   │   └── validation/      # 29 Zod schema files
│   ├── types/               # TypeScript type declarations
│   └── middleware.ts        # Rate limiting, security headers, auth guard
├── Dockerfile               # Multi-stage production build
├── docker-compose.yml       # Full local dev environment
├── package.json
└── tsconfig.json
```

---

## 🧩 Challenges & Solutions

### 1. Multi-Tenant Data Isolation
**Challenge**: Ensuring complete data separation between organizations sharing the same database.  
**Solution**: Supabase Row-Level Security (RLS) policies on every table + application-level `tenant_id` scoping on every query. The `withApiHandler` wrapper automatically injects tenant context.

### 2. Dual Attendance Source Merging
**Challenge**: The system migrated from a legacy attendance table to a modern NFC-based system, requiring unified queries across both.  
**Solution**: Parallel queries to both `attendance` and `attendance_records` tables, normalized into a common schema, deduplicated by `employeeId + date`, and merged with NFC records taking precedence.

### 3. Weekend & Out-of-Bounds Attendance
**Challenge**: Employees logging attendance on weekends or from unauthorized locations/IPs needed special handling.  
**Solution**: Automatic routing to an approval queue (`attendance_requests` table) with violation flags, mandatory notes for weekends, and push notifications to admin users.

### 4. Database Sequence Inconsistencies
**Challenge**: PostgreSQL identity sequences getting out of sync after bulk imports, causing insert failures.  
**Solution**: Application-level `MAX(id) + 1` computation before inserts as a resilient fallback, with dedicated SQL fix scripts for sequence repair.

### 5. Multipart Upload Boundary Stripping
**Challenge**: Next.js middleware was stripping `Content-Type` boundaries from `multipart/form-data` requests, breaking file uploads.  
**Solution**: Absolute middleware bypass for `/api/upload` routes and early return for any `multipart/form-data` content type before header injection.

### 6. Rate Limiting Without External Dependencies
**Challenge**: Implementing rate limiting without Redis in the default deployment.  
**Solution**: In-memory `Map`-based rate limiter in middleware with per-IP bucketing, separate limits for authenticated (100/min) vs public (20/min) requests, and automatic bucket expiry.

### 7. 23-Role Permission Matrix
**Challenge**: Managing fine-grained permissions across 23 roles and 13 modules without becoming unmaintainable.  
**Solution**: Centralized permission matrix in `permissions.ts` using composable permission presets (`fullAccess`, `viewOnly`, `viewAndCreate`, `viewEditCreate`) with utility functions for runtime checks.

### 8. OpenAPI Documentation Drift
**Challenge**: Keeping API documentation in sync with rapidly evolving API routes.  
**Solution**: Custom AST parser (`scripts/generate-openapi.mjs`) that reads all API route files and auto-generates Swagger JSON/YAML, hooked into the build pipeline via `prebuild`.

---

## ✅ Advantages

- **🔒 Enterprise-Grade Security** — Multi-layered auth, RLS, rate limiting, CSP headers, audit trails
- **🏢 True Multi-Tenancy** — Complete organizational isolation at database + application level
- **📱 Responsive Design** — Mobile-first UI with 55+ polished components
- **⚡ Performance** — Turbopack dev server, optimized builds, lazy loading
- **🔌 Extensible** — Modular architecture with 29 validation schemas and composable handlers
- **📊 Full Observability** — MongoDB telemetry, structured logging, correlation IDs
- **🐳 Container-Ready** — Production Docker image with non-root user
- **📖 Self-Documenting** — Auto-generated OpenAPI specs, 10+ RBAC documentation files
- **🧪 Tested** — CI pipeline with linting, type checking, test coverage, and Docker build verification
- **🎨 Modern UI/UX** — Glassmorphism effects, gradient cards, smooth animations, dark mode support

---

## 📄 License

This is a proprietary project of **TechSonance InfoTech LLP**. All rights reserved.

---

<div align="center">

**Built with ❤️ by [TechSonance InfoTech LLP](https://techsonance.com)**

</div>
]]>
