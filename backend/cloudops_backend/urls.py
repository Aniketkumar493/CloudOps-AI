"""
Root URL configuration for CloudOps-AI.

URL tree:
    /admin/                  → Django admin panel
    /api/health/             → Public health check endpoint
    /api/auth/               → JWT token + user account endpoints (apps.accounts)
    /api/schema/             → Raw OpenAPI 3 schema (JSON/YAML)
    /api/docs/               → Swagger UI (interactive API browser)

Future phases will add:
    /api/infra/              → EC2 + IAM (Phase 2)
    /api/metrics/            → CloudWatch metrics (Phase 2)
    /api/alerts/             → Alert rules + notifications (Phase 4)
    /api/healing/            → Auto-healing engine (Phase 3)
    /api/audit/              → Immutable audit log (Phase 3)
"""

from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from apps.infra.views import AWSAccountListCreateView, AWSAccountDestroyView, EC2InstanceListView, SyncEC2InstancesView, InstanceMetricsHistoryView, HealingEventListView


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    GET /api/health/

    Public endpoint. Returns 200 OK with a simple JSON body.
    Used by Kubernetes liveness/readiness probes and uptime monitors.

    Response:
        {"status": "ok"}
    """
    return Response({'status': 'ok'})


urlpatterns = [
    # ── Django Admin ──────────────────────────────────────────────────────────
    path('admin/', admin.site.urls),

    # ── Health Check ──────────────────────────────────────────────────────────
    path('api/health/', health_check, name='health_check'),

    # ── Auth & Accounts (Phase 1) ─────────────────────────────────────────────
    path('api/auth/', include('apps.accounts.urls')),

    path('api/infra/', include('apps.infra.urls')),

    # ── AWS Cloud Accounts (Phase 2) ──────────────────────────────────────────
    path('api/monitoring/cloud-accounts/', AWSAccountListCreateView.as_view(), name='cloud_accounts_list_create'),
    path('api/monitoring/cloud-accounts/<int:pk>/', AWSAccountDestroyView.as_view(), name='cloud_accounts_destroy'),
    path('api/monitoring/instances/', EC2InstanceListView.as_view(), name='monitoring_instances_list'),
    path('api/monitoring/instances/sync/', SyncEC2InstancesView.as_view(), name='monitoring_instances_sync'),
    path('api/monitoring/instances/<int:pk>/metrics/', InstanceMetricsHistoryView.as_view(), name='monitoring_instance_metrics_history'),
    path('api/monitoring/healing-events/', HealingEventListView.as_view(), name='monitoring_healing_events_list'),

    # ── OpenAPI Schema & Docs ─────────────────────────────────────────────────
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]
