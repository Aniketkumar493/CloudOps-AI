"""
WSGI config for CloudOps-AI.

Exposes the WSGI callable as `application`.
Used by gunicorn in production:
    gunicorn cloudops_backend.wsgi:application
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault(
    'DJANGO_SETTINGS_MODULE',
    'cloudops_backend.settings.production',
)

application = get_wsgi_application()
