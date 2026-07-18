# CloudOps-AI — Kubernetes Deployment

This directory contains the Kubernetes manifests for deploying the CloudOps-AI application stack.

## Prerequisites

- A running Kubernetes cluster (e.g., Minikube, Kind, EKS, GKE).
- `kubectl` configured to communicate with your cluster.
- Built Docker images:
  - `cloudops-backend:latest` (used by backend, celery-worker, and celery-beat)
  - `cloudops-frontend:latest` (used by frontend)

---

## Configuration & Secrets

Before deploying, you **must** update the placeholder secrets in `kubernetes/secret.yaml`. 

Open [secret.yaml](file:///Users/aniketkumar/CloudOps-AI-1/kubernetes/secret.yaml) and replace the placeholder values under `stringData` (e.g. `YOUR_DB_PASSWORD_HERE`, `YOUR_DJANGO_SECRET_KEY_HERE`, and AWS credentials).

> [!WARNING]
> Never commit real secrets to version control. Keep `secret.yaml` modified locally, or use a Git-ignored file or secret manager (like AWS Secrets Manager, HashiCorp Vault, or SealedSecrets) in production.

---

## Deployment Instructions

### Option 1: Quick Start (Apply All)

You can apply all resources at once:

```bash
kubectl apply -f kubernetes/
```

### Option 2: Step-by-Step Deployment (Dependency Order)

To ensure datastores and configurations are fully ready before the application servers start, apply the manifests in this exact order:

1. **Namespace**: Create the isolated `cloudops-ai` environment.
   ```bash
   kubectl apply -f kubernetes/namespace.yaml
   ```

2. **Configurations and Secrets**:
   ```bash
   kubectl apply -f kubernetes/configmap.yaml
   kubectl apply -f kubernetes/secret.yaml
   ```

3. **Datastores**: Start Postgres and Redis.
   ```bash
   kubectl apply -f kubernetes/postgres.yaml
   kubectl apply -f kubernetes/redis.yaml
   ```

4. **Django Backend**: Deploy the API server (database migrations will run automatically via an init container).
   ```bash
   kubectl apply -f kubernetes/backend.yaml
   ```

5. **Celery Services**: Deploy workers and beat scheduler.
   ```bash
   kubectl apply -f kubernetes/celery-worker.yaml
   kubectl apply -f kubernetes/celery-beat.yaml
   ```

6. **Web Frontend**: Deploy the static Nginx server serving the React app.
   ```bash
   kubectl apply -f kubernetes/frontend.yaml
   ```

7. **Ingress**: Enable external routing to the frontend and API.
   ```bash
   kubectl apply -f kubernetes/ingress.yaml
   ```

---

## Verification

Check the status of all resources in the `cloudops-ai` namespace:

```bash
# View all pods, services, deployments, and statefulsets
kubectl get all -n cloudops-ai

# View ingress details
kubectl get ingress -n cloudops-ai

# Stream Django backend logs
kubectl logs -n cloudops-ai -l app=backend -f
```
