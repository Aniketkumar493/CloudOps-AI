"""
ASGI config for CloudOps-AI.

Exposes the ASGI callable as `application`.
Required for async-capable servers (Daphne, Uvicorn) and Django Channels
if WebSocket support is added in a future phase.
"""

import os

from django.core.asgi import get_asgi_application

os.environ.setdefault(
    'DJANGO_SETTINGS_MODULE',
    'cloudops_backend.settings.production',
)

application = get_asgi_application()

#