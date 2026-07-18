# ── Stage 1: Build dependencies ────────────────────────────────────────────────
FROM python:3.11-slim AS builder

WORKDIR /app

# Install system dependencies required for building Python packages
# (e.g., build-essential and libpq-dev)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Create a virtual environment to isolate installed dependencies
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir gunicorn

# ── Stage 2: Final Runtime ───────────────────────────────────────────────────
FROM python:3.11-slim

# Why multi-stage builds are used:
# 1. Smaller final image: We avoid shipping compiler toolchains (gcc, make, dev libraries)
#    and package managers, which significantly reduces the final Docker image size.
# 2. Security hardening: By excluding build tools from the final image, we drastically
#    reduce the system's attack surface, preventing potential attackers from leveraging
#    compilers/linkers inside the running container.

WORKDIR /app

# Install runtime libpq (required for postgresql client operations if dynamically linked,
# though psycopg2-binary is self-contained, having it is good practice)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Copy the virtual environment containing installed packages from builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy the application code
COPY . .

# Expose Django backend port
EXPOSE 8000

# Environment variables:
# - PYTHONUNBUFFERED=1: Ensures Python stdout/stderr is flushed straight to logs
# - PYTHONDONTWRITEBYTECODE=1: Prevents Python from writing .pyc files to disk
# - DJANGO_SETTINGS_MODULE: Sets the settings module to production
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    DJANGO_SETTINGS_MODULE=cloudops_backend.settings.production

# Why gunicorn replaces runserver:
# 1. Production-grade WSGI server: Gunicorn is designed to run in production, handling
#    worker process management, signals, and proper request routing.
# 2. Concurrency: Gunicorn uses a pre-fork worker model that can process multiple concurrent
#    requests. In contrast, Django's 'runserver' is single-threaded, not optimized for
#    load/security, and explicitly warned against for production use.
CMD ["gunicorn", "cloudops_backend.wsgi:application", "--bind", "0.0.0.0:8000"]
