# CloudOps-AI

CloudOps-AI is an AWS cloud infrastructure monitoring and auto-healing platform. It monitors EC2 instances, retrieves metrics from AWS CloudWatch, evaluates alert rules, and performs automated remediation actions (such as instance reboots or stops) to ensure high system availability.

---

## Architecture Overview

- **Frontend**: Single Page Application built using React, Vite, and Tailwind CSS. Served by Nginx in production/Docker environments.
- **Backend**: Django REST Framework API, handling accounts, authentication, EC2 instance/IAM role discovery (via `boto3`), alert rules, and audit logs.
- **Task Queue**: Celery for asynchronous sync tasks (EC2 inventory caching, metric collection) and alert evaluation, backed by Redis as a message broker.
- **Database**: PostgreSQL storing configuration, instance states, historical metrics, alerts, policies, and audit logs.

---

## Running with Docker

You can run the entire CloudOps-AI stack locally with Docker Compose. This starts all required services (database, broker, backend API, background workers, and Nginx serving the React frontend) and automatically runs the database migrations.

### Prerequisites

1. Ensure [Docker](https://www.docker.com/) and Docker Compose are installed on your machine.
2. Verify the configuration settings in `backend/.env` exist (see `backend/.env.example`). The compose file overrides database and Redis hostnames automatically to hook up service communication.

### Step 1: Start the services

From the root directory, run:

```bash
docker-compose up --build
```

This will build the frontend and backend images and spin up all containers:
* **`cloudops-db`**: PostgreSQL on port `5433` (host mapping)
* **`cloudops-redis`**: Redis on port `6379` (host mapping)
* **`cloudops-backend`**: Django API served by Gunicorn on port `8000`
* **`cloudops-celery-worker`**: Celery worker for async tasks
* **`cloudops-celery-beat`**: Celery beat for periodic task execution
* **`cloudops-frontend`**: Nginx serving the static React build on port `3000`

### Step 2: Access the Application

Once the containers are up, open your web browser and navigate to:

```
http://localhost:3000
```

* The React frontend is served on port `3000`.
* All `/api/` calls are automatically proxied via Nginx to the backend container.
* Database migrations run automatically during backend container startup.
