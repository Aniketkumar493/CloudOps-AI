# High-Level Design — CloudOps-AI

## 1. Architecture Philosophy

CloudOps-AI is built as a **modular Django monolith** — a single deployable Django application divided into well-scoped internal apps. This approach prioritises:

- **Simplicity**: One codebase, one database, one deployment unit.
- **Maintainability**: Django's app system enforces clear module boundaries without the ops overhead of microservices.
- **Scalability**: Celery workers scale independently from the web process; the database can be promoted to a managed RDS instance without code changes.

There is **no API Gateway, no message broker beyond Redis, no service mesh, no separate auth server**.

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CloudOps-AI                                │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              React + Vite + Tailwind (Frontend)             │   │
│  │         (served separately, talks to Django via REST)       │   │
│  └──────────────────────────┬──────────────────────────────────┘   │
│                             │  HTTP/REST + WebSocket                │
│  ┌──────────────────────────▼──────────────────────────────────┐   │
│  │              Django + Django REST Framework                  │   │
│  │                                                             │   │
│  │  ┌───────────┐ ┌───────────┐ ┌────────────┐ ┌──────────┐  │   │
│  │  │  accounts │ │  metrics  │ │  alerting  │ │ healing  │  │   │
│  │  │  (auth +  │ │  (AWS CW  │ │  (rules +  │ │ (runbook │  │   │
│  │  │   RBAC)   │ │  ingest)  │ │  notifs)   │ │  engine) │  │   │
│  │  └───────────┘ └───────────┘ └────────────┘ └──────────┘  │   │
│  │                                                             │   │
│  │  ┌───────────┐ ┌───────────┐ ┌────────────┐               │   │
│  │  │   audit   │ │  infra    │ │    api     │               │   │
│  │  │  (action  │ │  (EC2 +   │ │  (shared   │               │   │
│  │  │   log)    │ │   IAM)    │ │  routers)  │               │   │
│  │  └───────────┘ └───────────┘ └────────────┘               │   │
│  └─────────────────────────┬───────────────────────────────────┘   │
│                            │                                        │
│          ┌─────────────────┼─────────────────┐                     │
│          ▼                 ▼                 ▼                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │  PostgreSQL  │  │    Redis     │  │   Celery     │             │
│  │  (primary    │  │  (cache +    │  │  Workers     │             │
│  │   datastore) │  │   broker)    │  │  (async jobs)│             │
│  └──────────────┘  └──────────────┘  └──────┬───────┘             │
│                                             │                      │
│                            ┌────────────────┤                      │
│                            ▼                ▼                      │
│                    ┌──────────────┐  ┌──────────────┐             │
│                    │  AWS boto3   │  │  Prometheus  │             │
│                    │  EC2 / CW /  │  │  + Grafana   │             │
│                    │  IAM         │  │  (platform   │             │
│                    └──────────────┘  │   metrics)   │             │
│                                      └──────────────┘             │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Django App Breakdown

The Django project lives at `backend/` and is named `cloudops_backend`. Each Django app below is a folder under `backend/apps/`.

### 3.1 `accounts` — Authentication & RBAC
- **Responsibilities**: User registration, login, JWT issuance, role management.
- **Auth**: `djangorestframework-simplejwt` — access + refresh token pair.
- **Roles**: `viewer`, `operator`, `admin` (stored as Django groups).
- **Key Models**: `User` (extends `AbstractUser`), `Team`
- **Key Endpoints**:
  - `POST /api/auth/token/` — obtain token pair
  - `POST /api/auth/token/refresh/` — refresh access token
  - `GET  /api/auth/me/` — current user profile

### 3.2 `infra` — AWS Infrastructure Management
- **Responsibilities**: Connects to AWS via `boto3`. Discovers, lists, and caches EC2 instances and IAM roles. Stores a snapshot of cloud resource state in PostgreSQL.
- **Key Models**: `AWSCredential` (encrypted), `EC2Instance`, `IAMRole`
- **Key Celery Tasks**:
  - `sync_ec2_instances` — polls EC2 describe-instances every N minutes
  - `sync_iam_roles` — refreshes IAM role inventory
- **Key Endpoints**:
  - `GET /api/infra/instances/` — list EC2 instances with status
  - `GET /api/infra/instances/{id}/` — detail view
  - `POST /api/infra/instances/{id}/reboot/` — trigger EC2 reboot

### 3.3 `metrics` — CloudWatch Metrics Ingestion
- **Responsibilities**: Pulls metrics from AWS CloudWatch via `boto3` on a schedule. Stores metric data points in PostgreSQL. Exposes a query API to the frontend.
- **Key Models**: `MetricDefinition`, `MetricDataPoint`
- **Key Celery Tasks**:
  - `fetch_cloudwatch_metrics` — periodic pull for all registered metric definitions
- **Key Endpoints**:
  - `GET /api/metrics/` — list metric definitions
  - `POST /api/metrics/` — register a new metric to track
  - `GET /api/metrics/{id}/data/` — retrieve time-series data points (with `start`, `end`, `period` query params)

### 3.4 `alerting` — Alert Rules & Notifications
- **Responsibilities**: Evaluates alert rules against ingested metrics. Manages alert state machine. Dispatches notifications via Slack and email.
- **Key Models**: `AlertRule`, `Alert` (state machine), `NotificationChannel`
- **Alert States**: `pending → firing → resolved`
- **Key Celery Tasks**:
  - `evaluate_alert_rules` — runs periodically, checks each rule against latest metric data
  - `dispatch_notification` — sends Slack / email for state transitions
- **Key Endpoints**:
  - `GET/POST /api/alerts/rules/` — manage alert rules
  - `GET /api/alerts/` — list active and historical alerts
  - `POST /api/alerts/{id}/acknowledge/` — operator acknowledges alert
  - `GET/POST /api/alerts/channels/` — manage notification channels

### 3.5 `healing` — Auto-Healing Engine
- **Responsibilities**: Maps alert events to remediation runbooks. Executes actions (EC2 reboot, Auto Scaling Group adjustment) via `boto3`. Supports human approval gates.
- **Key Models**: `HealingPolicy`, `HealingAction` (execution record)
- **Action Types** (V1):
  - `REBOOT_INSTANCE` — reboot EC2 instance
  - `STOP_INSTANCE` — stop EC2 instance
  - `SCALE_ASG` — adjust Auto Scaling Group desired capacity
  - `NOTIFY_ONLY` — alert the team, no automated action
- **Key Celery Tasks**:
  - `trigger_healing_action` — called when an alert fires and a matching policy exists
- **Key Endpoints**:
  - `GET/POST /api/healing/policies/` — manage healing policies
  - `GET /api/healing/actions/` — healing action history
  - `POST /api/healing/actions/{id}/approve/` — approve a pending high-risk action
  - `POST /api/healing/actions/{id}/reject/` — reject a pending action

### 3.6 `audit` — Immutable Audit Log
- **Responsibilities**: Records every significant event — alert state change, healing action executed, config change, user login. Append-only; no row is ever updated or deleted.
- **Key Models**: `AuditEvent` (`actor`, `action`, `resource`, `detail`, `timestamp`)
- **Key Endpoints**:
  - `GET /api/audit/` — paginated audit log (filter by actor, resource type, date range)

---

## 4. Technology Stack

| Layer | Technology | Version |
|---|---|---|
| **Backend language** | Python | 3.12 |
| **Web framework** | Django | 5.x |
| **REST API** | Django REST Framework | 3.15.x |
| **Authentication** | djangorestframework-simplejwt | 5.x |
| **Async tasks** | Celery | 5.x |
| **Task broker / cache** | Redis | 7.x |
| **Primary database** | PostgreSQL | 16 |
| **AWS SDK** | boto3 | latest |
| **Frontend framework** | React 18 + TypeScript | - |
| **Frontend build tool** | Vite | 5.x |
| **CSS framework** | Tailwind CSS | 3.x |
| **Containerisation** | Docker + Docker Compose | - |
| **Orchestration** | Kubernetes | 1.30+ |
| **CI/CD** | GitHub Actions | - |
| **Platform metrics** | Prometheus + Grafana | - |
| **API docs** | drf-spectacular (OpenAPI 3) | - |

---

## 5. Data Flow

### 5.1 Metrics Ingestion
```
Celery Beat (scheduler)
    │  every 5 minutes
    ▼
fetch_cloudwatch_metrics task
    │  boto3.get_metric_statistics()
    ▼
AWS CloudWatch API
    │
    ▼
MetricDataPoint rows → PostgreSQL
    │
    ▼
evaluate_alert_rules task triggered
```

### 5.2 Alert → Auto-Heal
```
evaluate_alert_rules (Celery)
    │  threshold breached
    ▼
Alert created/updated → PostgreSQL
    │
    ├── dispatch_notification task → Slack / Email
    │
    └── trigger_healing_action task
              │
              ├── Find matching HealingPolicy
              │
              ├── Risk: LOW  → execute immediately via boto3
              │
              └── Risk: HIGH → create HealingAction(status=PENDING)
                                    │
                              Operator approves via dashboard
                                    │
                              execute via boto3 → record outcome
                                    │
                              AuditEvent written
```

### 5.3 Frontend Data Flow
```
React App
    │  JWT in Authorization header
    ▼
Django REST Framework
    │  queries PostgreSQL (cached via Redis where appropriate)
    ▼
JSON Response
    │
    ▼
React state → Recharts / Tailwind UI
```

---

## 6. API Design

- Base URL: `/api/v1/`
- All responses are JSON.
- Auth: `Authorization: Bearer <access_token>` header on every request.
- Errors follow a consistent envelope:
  ```json
  { "error": "string", "detail": "string", "code": "string" }
  ```
- Pagination: `{ "count": N, "next": "url", "previous": "url", "results": [...] }`
- OpenAPI 3 spec auto-generated via `drf-spectacular`, served at `/api/schema/` and `/api/docs/`.

---

## 7. Security

| Concern | Approach |
|---|---|
| **Authentication** | JWT (SimpleJWT) — short-lived access tokens (15 min), long-lived refresh tokens (7 days) |
| **Authorisation** | Django groups-based RBAC enforced per view via DRF permission classes |
| **AWS credentials** | Stored encrypted in DB (`AWSCredential`); loaded into `boto3` session at runtime |
| **CORS** | `django-cors-headers` configured to allow only known frontend origins |
| **HTTPS** | Enforced via K8s Ingress + cert-manager (Let's Encrypt) in production |
| **Secrets** | Environment variables via `.env` in dev; Kubernetes Secrets in prod |
| **Audit** | All mutations and auth events written to append-only `AuditEvent` table |

---

## 8. Background Task Schedule (Celery Beat)

| Task | Schedule | Description |
|---|---|---|
| `sync_ec2_instances` | Every 5 min | Refresh EC2 instance inventory from AWS |
| `sync_iam_roles` | Every 30 min | Refresh IAM role inventory |
| `fetch_cloudwatch_metrics` | Every 5 min | Pull metric data points for all registered metrics |
| `evaluate_alert_rules` | Every 1 min | Check all active alert rules against latest data |
| `cleanup_old_metric_data` | Daily 00:00 UTC | Delete metric data points older than retention period |

---

## 9. Deployment Topology

### Development (Docker Compose)
```
docker-compose.yml
├── web          (Django dev server, port 8000)
├── celery       (Celery worker)
├── celery-beat  (Celery scheduler)
├── frontend     (Vite dev server, port 5173)
├── postgres     (port 5432)
├── redis        (port 6379)
├── prometheus   (port 9090)
└── grafana      (port 3000)
```

### Production (Kubernetes)
```
Namespace: cloudops
├── Deployment: cloudops-web        (Django + gunicorn)
├── Deployment: cloudops-celery     (Celery worker, replicas=3)
├── Deployment: cloudops-beat       (Celery beat, replicas=1)
├── Deployment: cloudops-frontend   (Nginx serving React build)
├── StatefulSet: postgres
├── StatefulSet: redis
├── Deployment: prometheus
├── Deployment: grafana
└── Ingress: cloudops-ingress       (HTTPS via cert-manager)
```

---

## 10. Folder Structure

```
CloudOps-AI/
├── docs/
│   ├── product-vision.md
│   ├── high-level-design.md
│   └── adr/                          # Architecture Decision Records
│
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── cloudops_backend/             # Django project settings
│   │   ├── settings/
│   │   │   ├── base.py
│   │   │   ├── development.py
│   │   │   └── production.py
│   │   ├── urls.py
│   │   ├── celery.py
│   │   └── wsgi.py
│   └── apps/
│       ├── accounts/                 # Auth + RBAC
│       ├── infra/                    # EC2 + IAM via boto3
│       ├── metrics/                  # CloudWatch ingestion
│       ├── alerting/                 # Alert rules + notifications
│       ├── healing/                  # Auto-healing engine
│       └── audit/                    # Immutable audit log
│
├── frontend/
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── package.json
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── api/                      # Axios API client
│       ├── components/               # Shared UI components
│       ├── pages/                    # Route-level page components
│       ├── hooks/                    # Custom React hooks
│       └── store/                    # Zustand global state
│
├── kubernetes/
│   ├── namespace.yaml
│   ├── web-deployment.yaml
│   ├── celery-deployment.yaml
│   ├── beat-deployment.yaml
│   ├── frontend-deployment.yaml
│   ├── postgres-statefulset.yaml
│   ├── redis-statefulset.yaml
│   └── ingress.yaml
│
├── monitoring/
│   ├── prometheus/
│   │   └── prometheus.yml
│   └── grafana/
│       └── dashboards/
│
├── .github/
│   └── workflows/
│       ├── ci.yml                    # Lint + test on every PR
│       └── cd.yml                    # Build + deploy on merge to main
│
├── docker-compose.yml
├── .env.example
└── Makefile
```
