"""
Production settings for CloudOps-AI.

Inherits everything from base.py and enforces security hardening:
- DEBUG = False
- Strict ALLOWED_HOSTS from environment
- HTTPS enforcement headers
- Secure cookies
"""

from .base import *  # noqa: F401, F403

# ── Core ───────────────────────────────────────────────────────────────────────
# DEBUG is already inherited as False from base.py, but explicitly hardcoded here for clarity.
DEBUG = False

# Loaded from Kubernetes Secret / environment variable in production
ALLOWED_HOSTS = [host.strip() for host in config('ALLOWED_HOSTS', default='').split(',') if host.strip()]


# ── HTTPS / Security Headers ───────────────────────────────────────────────────
# Redirect all HTTP requests to HTTPS
SECURE_SSL_REDIRECT = config('SECURE_SSL_REDIRECT', default=True, cast=bool)

# HSTS: tell browsers to only use HTTPS for 1 year
SECURE_HSTS_SECONDS = 31_536_000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# Prevent browsers from sniffing content type
SECURE_CONTENT_TYPE_NOSNIFF = True

# Enable browser XSS filter
SECURE_BROWSER_XSS_FILTER = True

# Clickjacking protection
X_FRAME_OPTIONS = 'DENY'

# ── Secure Cookies ─────────────────────────────────────────────────────────────
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# ── Logging ────────────────────────────────────────────────────────────────────
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'json': {
            'format': '{"level": "%(levelname)s", "time": "%(asctime)s", "module": "%(module)s", "message": "%(message)s"}',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'json',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'WARNING',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'WARNING',
            'propagate': False,
        },
    },
}
