# Product Vision — CloudOps-AI

## Mission Statement

> **Empower engineering teams to achieve zero unplanned downtime on AWS** by providing a unified platform that continuously monitors EC2 infrastructure and CloudWatch metrics, detects anomalies in real time, and automatically remediates known failure patterns — without human intervention.

---

## Problem Statement

Modern cloud environments are:

- **Complex**: AWS environments span dozens of EC2 instances, IAM roles, and CloudWatch metrics that are difficult to correlate manually.
- **Opaque**: Logs, metrics, and traces exist in silos. Engineers waste hours correlating data from different tools.
- **Reactive**: Teams are paged after something breaks. Root-cause analysis happens post-incident.
- **Expensive to operate**: Every minute of downtime costs money and trust. Manual remediation is slow and error-prone.

Current solutions either require massive operational overhead (self-hosted OSS stacks) or are too rigid (closed SaaS products that don't integrate with custom workflows).

---

## Vision

**CloudOps-AI** is a production-ready **AWS Cloud Infrastructure Monitoring and Auto-Healing Platform** that:

1. **Centralises AWS observability** — pulls EC2 health and CloudWatch metrics into a single React dashboard, eliminating the need to switch between AWS Console screens.
2. **Detects anomalies proactively** — threshold-based alert rules evaluate ingested CloudWatch data every minute via Celery, firing before users are impacted.
3. **Heals EC2 infrastructure automatically** — a policy-driven engine reboots, stops, or scales EC2 instances via boto3 the moment a matching alert fires, with human approval gates for high-risk actions.
4. **Explains its actions** — every automated remediation is logged, auditable, and explainable through an immutable audit trail. No black-box healing.
5. **Notifies the right people** — email notifications are dispatched on alert state transitions so on-call engineers are always informed.

---

## Target Users

| Persona | Role | Primary Pain |
|---|---|---|
| **Site Reliability Engineer (SRE)** | Owns uptime SLOs on AWS | Toil from manually restarting EC2 instances and investigating CloudWatch alarms |
| **DevOps Engineer** | Manages EC2, IAM, and deployments | Late detection of instance failures and no automated remediation |
| **Platform Engineer** | Builds internal tooling on AWS | No single pane of glass for EC2 health and CloudWatch metrics |
| **Engineering Manager** | Reports on system reliability | No clear, queryable history of incidents and automated actions |
| **Security Engineer** | Audits AWS infrastructure changes | No immutable audit trail of who triggered what remediation and when |

---

## Core Value Propositions

### 1. 🔭 Unified AWS Observability
A single React dashboard surfaces EC2 instance health, CloudWatch metric time-series, and IAM role inventory — all in one place. No more navigating the AWS Console across multiple services.

### 2. ⚡ Automated EC2 Remediation (Auto-Healing)
A policy-driven engine maps alert conditions to remediation actions (`REBOOT_INSTANCE`, `STOP_INSTANCE`, `SCALE_ASG`) executed via boto3. Low-risk actions fire automatically; high-risk actions require operator approval through the dashboard.

### 3. 📋 Full Audit Trail
Every automated and manual action is recorded in an append-only audit log: what triggered it, what was executed, what the outcome was. Filterable by actor, resource, and date range.

### 4. 🔔 Timely Email Notifications
On-call engineers receive email alerts on every state transition (`pending → firing → resolved`), dispatched asynchronously via Celery so the web process is never blocked.

### 5. 📊 Platform-Level Monitoring
Prometheus scrapes Django application metrics and Celery task metrics. Grafana dashboards provide visibility into platform health, task queue depth, and alert evaluation latency.

---

## Success Metrics (KPIs)

| Metric | Target |
|---|---|
| Mean Time to Detect (MTTD) | < 2 minutes |
| Mean Time to Remediate (MTTR) | < 5 minutes for known failures |
| Alert Fatigue Reduction | ≥ 60% fewer actionable pages vs. baseline |
| Auto-healing Success Rate | ≥ 85% of known failure patterns resolved without human |
| Platform Uptime | 99.9% |
| Audit Coverage | 100% of automated actions logged |

---

## Non-Goals (V1)

- **AWS only** — GCP, Azure, and other cloud providers are explicitly out of scope for V1.
- **Not a full APM tool** — no code-level profiling or distributed tracing in V1.
- **Not a billing/cost optimisation tool** — cost insights are a future phase.
- **Not a CI/CD orchestrator** — integrates with GitHub Actions pipelines but does not replace them.
- **No mobile app** — React web dashboard only in V1.
- **No ML-based anomaly detection** — V1 uses threshold-based alert rules; ML scoring is a future phase.

---

## Phased Roadmap

| Phase | Name | Focus |
|---|---|---|
| **Phase 1** | Django Backend + JWT Authentication | Django project scaffold, split settings, JWT auth with SimpleJWT, RBAC (viewer / operator / admin), `.env` config, Docker Compose dev environment |
| **Phase 2** | AWS EC2 & CloudWatch Integration | boto3 EC2 instance sync, CloudWatch metric ingestion, Celery Beat scheduling, PostgreSQL storage, REST API for infra and metrics data |
| **Phase 3** | Auto-Healing Engine | HealingPolicy model, Celery-based action executor (reboot, stop, scale), human approval gate for high-risk actions, immutable AuditEvent log |
| **Phase 4** | Email Notifications | Alert rule evaluation, alert state machine (`pending → firing → resolved`), async email dispatch via Celery, notification channel management |
| **Phase 5** | React Dashboard | Vite + React 18 + Tailwind CSS frontend, JWT auth flow, EC2 instance table, CloudWatch metric charts, alert list, healing action history |
| **Phase 6** | Docker | Production-grade multi-stage Dockerfiles for backend and frontend, Docker Compose for full local stack |
| **Phase 7** | Kubernetes | K8s manifests for all services (web, celery, beat, frontend, postgres, redis), Ingress with TLS, namespace isolation |
| **Phase 8** | GitHub Actions CI/CD | CI pipeline (lint + tests on every PR), CD pipeline (build Docker images + deploy to K8s on merge to main) |
| **Phase 9** | Prometheus + Grafana Monitoring | Prometheus scraping Django + Celery metrics, Grafana dashboards for platform health, alert evaluation latency, task queue depth |
| **Phase 10** | Admin Panel & Future Enhancements | Django admin hardening, SLO tracking dashboard, ML-based anomaly detection (post-V1), multi-cloud connector design |

---

## Future Enhancements

Future versions of CloudOps-AI may include:

- Multi-cloud support (Azure, GCP)
- AI-based anomaly detection
- Slack and Microsoft Teams notifications
- Cost optimization dashboard
- Predictive auto-healing
- Terraform integration
- AWS Lambda + SNS event-driven healing
- Time-series database (TimescaleDB)
