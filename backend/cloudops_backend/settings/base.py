"""
Base settings for CloudOps-AI.

Shared by all environments (development, production).
Environment-specific files import from here and override what they need.
All secrets and environment-specific values are loaded from the .env file
via python-decouple — nothing is hardcoded here.
"""

from datetime import timedelta
from pathlib import Path

from decouple import AutoConfig

# ── Paths ──────────────────────────────────────────────────────────────────────
# BASE_DIR points to backend/ (the directory containing manage.py)
BASE_DIR = Path(__file__).resolve().parent.parent.parent

config = AutoConfig(search_path=str(BASE_DIR))

# ── Security ───────────────────────────────────────────────────────────────────
SECRET_KEY = config('SECRET_KEY')

# Overridden per environment
DEBUG = False
ALLOWED_HOSTS = []

# ── Application Definition ─────────────────────────────────────────────────────
DJANGO_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

THIRD_PARTY_APPS = [
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',  # Required for token rotation
    'corsheaders',
    'drf_spectacular',
]

LOCAL_APPS = [
    'apps.accounts',
    'apps.infra',
    # Future phases will add:
    # 'apps.metrics',
    # 'apps.alerting',
    # 'apps.healing',
    # 'apps.audit',
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

# ── Middleware ─────────────────────────────────────────────────────────────────
# CorsMiddleware must come before CommonMiddleware
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'cloudops_backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'cloudops_backend.wsgi.application'

# ── Database ───────────────────────────────────────────────────────────────────
# All credentials loaded from .env via python-decouple
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('DB_NAME', default='cloudops'),
        'USER': config('DB_USER', default='cloudops'),
        'PASSWORD': config('DB_PASSWORD', default='cloudops'),
        'HOST': config('DB_HOST', default='localhost'),
        'PORT': config('DB_PORT', default='5432'),
    }
}

# ── Custom User Model ──────────────────────────────────────────────────────────
# Tells Django to use our custom User (email-based login) instead of the default
AUTH_USER_MODEL = 'accounts.User'

# ── Password Validation ────────────────────────────────────────────────────────
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ── Internationalisation ───────────────────────────────────────────────────────
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# ── Static Files ───────────────────────────────────────────────────────────────
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# ── Primary Key ────────────────────────────────────────────────────────────────
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ── Django REST Framework ──────────────────────────────────────────────────────
REST_FRAMEWORK = {
    # JWT is the only authentication method — no session auth for the API
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    # All endpoints require authentication by default;
    # individual views can override with AllowAny where needed (e.g. health, login)
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    # Auto-generate OpenAPI schema via drf-spectacular
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    # Consistent cursor-style pagination for list endpoints
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

# ── SimpleJWT ─────────────────────────────────────────────────────────────────
SIMPLE_JWT = {
    # Short-lived access token (15 min) — aligned with HLD security model
    'ACCESS_TOKEN_LIFETIME': timedelta(
        minutes=config('ACCESS_TOKEN_LIFETIME_MINUTES', default=15, cast=int)
    ),
    # Long-lived refresh token (7 days)
    'REFRESH_TOKEN_LIFETIME': timedelta(
        days=config('REFRESH_TOKEN_LIFETIME_DAYS', default=7, cast=int)
    ),
    # Issue a new refresh token on each refresh and blacklist the old one
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    # Standard Bearer token scheme
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'TOKEN_OBTAIN_SERIALIZER': 'rest_framework_simplejwt.serializers.TokenObtainPairSerializer',
}

# ── CORS ───────────────────────────────────────────────────────────────────────
# Reads comma-separated origins from .env; restricts to known frontend origins
_cors_origins = config(
    'CORS_ALLOWED_ORIGINS',
    default='http://localhost:5173,http://127.0.0.1:5173',
)
CORS_ALLOWED_ORIGINS = [origin.strip() for origin in _cors_origins.split(',') if origin.strip()]
CORS_ALLOW_CREDENTIALS = True  # Allow cookies / Authorization header


# ── DRF Spectacular (OpenAPI 3) ────────────────────────────────────────────────
SPECTACULAR_SETTINGS = {
    'TITLE': 'CloudOps-AI API',
    'DESCRIPTION': (
        'AWS Cloud Infrastructure Monitoring and Auto-Healing Platform. '
        'Monitors EC2 instances, ingests CloudWatch metrics, evaluates alert rules, '
        'and automatically remediates known failure patterns via boto3.'
    ),
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'COMPONENT_SPLIT_REQUEST': True,
}

# ── Celery Configurations ─────────────────────────────────────────────────────
CELERY_BROKER_URL = config('CELERY_BROKER_URL', default='redis://localhost:6379/0')
CELERY_RESULT_BACKEND = config('CELERY_RESULT_BACKEND', default='redis://localhost:6379/0')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE

CELERY_BEAT_SCHEDULE = {
    'sync-ec2-instances-every-5-min': {
        'task': 'apps.infra.tasks.sync_all_accounts_ec2_task',
        'schedule': 300.0,
    },
    'fetch-cloudwatch-metrics-every-5-min': {
        'task': 'apps.infra.tasks.fetch_all_instances_metrics_task',
        'schedule': 300.0,
    },
}

