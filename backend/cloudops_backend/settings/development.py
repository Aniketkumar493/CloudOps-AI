"""
Development settings for CloudOps-AI.

Inherits everything from base.py and enables developer-friendly overrides:
- DEBUG = True
- Relaxed ALLOWED_HOSTS
- Django Debug Toolbar can be added here in future
"""

from .base import *  # noqa: F401, F403

DEBUG = True

ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    'testserver',
]

# ── Development-only: more verbose logging ─────────────────────────────────────
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '[{levelname}] {asctime} {module} — {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'DEBUG',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'django.db.backends': {
            # Set to DEBUG to log every SQL query during development
            'level': 'WARNING',
            'handlers': ['console'],
            'propagate': False,
        },
    },
}
