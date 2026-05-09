# Daily Field Reporting — App Plan

Upstream oil and gas daily field reporting platform, built as a multi-tenant SaaS product targeting operated companies in the US market.

---

## Product Overview

A web-based daily reporting tool for upstream O&G operations. Field personnel fill out structured daily reports for active Jobs on Wells. Reports are automatically distributed as branded PDFs each morning to operators, partners, and service companies. Office users review, approve, and monitor progress against AFE budgets. AI assists Editors with data entry, document import, and operational decision support.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (React) + TypeScript |
| Backend | Next.js API routes or Fastify + TypeScript |
| Database | PostgreSQL |
| Auth | Email/password via Clerk, Auth0, or Supabase Auth |
| AI | Claude API (Anthropic) |
| PDF Generation | Puppeteer or equivalent |
| API Docs | OpenAPI / Swagger (auto-generated) |
| Units | Imperial (v1) — abstracted for future metric support |

---

## Multi-Tenancy

- Each operating company is an isolated **Tenant**
- Manual provisioning for v1 (no self-serve signup)
- All data is scoped to `tenant_id` at the database level
- Tenant settings are managed by the tenant's Admin users

---

## Data Hierarchy

```
Tenant (Operating Company)
└── Site  (pad / surface location)
    └── Well  (single borehole penetration — PPDM definition)
        └── Job  (an instance of a reporting module, e.g. Drilling Job #1)
            └── Daily Report  (one per reporting day)
```

- A Site contains one or more Wells
- A Well has a sequential history of Jobs; only one Job is active at a time
- Each Job has its own Chart of Accounts, AFE, and distribution list
- Wells and Sites are fixed once created (no reassignment)

---

## Reporting Day

- Default: **midnight to midnight** (recommended)
- Configurable per tenant: custom rollover time (e.g. 6am–6am)
- Partial-day reports are supported

---

## User Roles

### Admin
Office users with full control over tenant configuration.
- CRUD all users (Editors, Viewers, Partner Companies)
- Manage system settings (branding, rollover time, units)
- Create and manage master objects (Sites, Wells)
- Create and configure Jobs (module, COA, AFE, distribution list)
- Manage tenant-wide Vendor List
- Review and approve submitted daily reports

### Editor
Field personnel (company men, field supervisors) on-site.
- Fill out and submit daily reports for their assigned active Job
- Each report section shows a clear completion indicator (required fields status)
- Access AI assistant for time log entry, data import, and decision support
- Receive email notification if a submitted report is rejected

### Operated Viewer
Internal office viewers.
- Read-only access to all operated Wells, Jobs, and reports
- No editing capability

### Partner Company
Non-operated working interest partners.
- Organized as a **Partner Company** with one or more **Partner Users** underneath
- Partner Users see only Wells they have working interest in
- Data visibility is configurable at two levels:
  - Tenant-wide defaults (set by Admin)
  - Per Partner User overrides
- Visible data is limited: key metrics, operational summary, days vs. AFE — no sensitive formation or proprietary drilling data
- All users under a Partner Company automatically receive the daily PDF when that company is on a Job's distribution list

---

## Reporting Modules (Job Types)

Each module produces a daily report with a **common structure** plus a **module-specific body**.

- Location Construction
- Drilling
- Completions
- Production Facilities Install
- Workovers
- Re-completions
- Logging / Testing / Science
- Artificial Lift Installation

### Common Report Structure

**Header (all modules)**
- Tenant logo, well info, site info, Job name
- Report date and reporting period
- Daily narrative / operational summary

**Cost Report (all modules)**
- Chart of Accounts line items (configured per Job)
- Daily actuals entered by Editor
- Cumulative actuals vs. AFE budget
- Variance tracking (days vs. AFE)

**Module-Specific Body**
- Fully custom per Job type
- Configured at the module level (not per tenant)

---

## Workflow

```
Editor fills report
       ↓
Editor submits  →  Admin notified via email
       ↓
PDF generated + distributed (6–8am local time)
       ↓
Admin reviews  →  Approved (report locked, read-only)
                  Rejected  →  Editor notified via email with reason
```

- Distribution happens on schedule regardless of approval status
- Approval is an async, post-distribution audit step
- Rejected reports can be corrected and resubmitted

---

## PDF Distribution

- Branded with tenant logo
- Sent on a morning schedule (default 6–8am, per Job configuration)
- Distribution list per Job:
  - Manually managed internal and third-party contacts
  - All users under any assigned Partner Companies are auto-included
  - New Partner Users added to a company are automatically included going forward

---

## Admin Settings

### Tenant-Wide
| Setting | Description |
|---|---|
| Branding | Company logo for PDF reports |
| Reporting day rollover | Default midnight; configurable time |
| Vendor List | Master list of service companies / vendors |
| Partner Companies | Create companies and manage their users |
| Module configuration | Which Job types are available to this tenant |

### Per Job
| Setting | Description |
|---|---|
| Chart of Accounts | Cost line items for this Job type |
| AFE | Budget amounts per COA line item |
| Distribution list | Email recipients for daily PDF |

---

## AI Features (Claude API)

Editors have access to an AI assistant within the report interface:

- **Time log entry** — natural language input converted to structured time logs
  - *"We drilled from 14,200 to 14,450 ft between 6am and 2pm, then had a 3-hour connection"*
- **Document import + parsing** — upload service company records and auto-populate report fields
- **Decision support** — analyze operational data and assist with field decisions

### Supported Import Formats
`PDF` `XLSX` `CSV` `XML` `WITSML` `JSON` `LAS`

> Real-time WITSML streaming is a v2 feature. File import only for v1.

---

## Notifications (v1)

| Trigger | Recipient | Method |
|---|---|---|
| Report submitted | Admin | Email |
| Report rejected | Editor | Email + rejection note |

---

## API

- Robust REST API with full OpenAPI / Swagger documentation
- All tenant data isolated via `tenant_id`
- API-first design — all app functionality exposed via API

---

## Out of Scope for v1

- Self-serve tenant signup and billing (Stripe integration)
- Native mobile app (responsive web covers v1)
- Real-time WITSML streaming from rig systems
- Metric unit support (abstracted in data model, not exposed in UI)
- SSO / Microsoft / Google authentication
- Advanced partner data permissions beyond tenant defaults + per-user overrides
