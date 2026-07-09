from django.urls import path
from .views import EC2InstanceListView, SyncEC2InstancesView

urlpatterns = [
    # ── EC2 Endpoints ────────────────────────────────────────────────────────
    path('ec2/', EC2InstanceListView.as_view(), name='ec2_list'),
    path('sync/', SyncEC2InstancesView.as_view(), name='ec2_sync'),
]
