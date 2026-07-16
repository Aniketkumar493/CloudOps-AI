from django.utils import timezone
from datetime import timedelta
from django.shortcuts import get_object_or_404
from rest_framework import views, generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models import EC2Instance, AWSAccount, CloudWatchMetric, HealingEvent
from .serializers import EC2InstanceSerializer, AWSAccountSerializer, HealingEventSerializer
from .services import sync_ec2_instances


class EC2InstanceListView(generics.ListAPIView):
    """
    GET /api/infra/ec2/
    Lists all synced EC2 instances from the database.
    Requires authentication.
    """
    serializer_class = EC2InstanceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        account_id = self.request.query_params.get('account_id')
        queryset = EC2Instance.objects.all().order_by('instance_id')
        if account_id:
            queryset = queryset.filter(account_id=account_id)
        return queryset


class SyncEC2InstancesView(views.APIView):
    """
    POST /api/infra/sync/
    Triggers an immediate sync of EC2 instances from AWS.
    Accepts optional account_id in request body to sync a specific account.
    Requires authentication.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        account_id = request.data.get('account_id')
        try:
            synced_count = sync_ec2_instances(account_id=account_id)
            return Response(
                {
                    "status": "success",
                    "message": f"Successfully synced {synced_count} EC2 instances.",
                    "synced_count": synced_count
                },
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {
                    "status": "error",
                    "message": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AWSAccountListCreateView(generics.ListCreateAPIView):
    """
    GET /api/monitoring/cloud-accounts/
    Lists all AWS accounts.
    POST /api/monitoring/cloud-accounts/
    Connects a new AWS account.
    """
    queryset = AWSAccount.objects.all().order_by('id')
    serializer_class = AWSAccountSerializer
    permission_classes = [IsAuthenticated]


class AWSAccountDestroyView(generics.DestroyAPIView):
    """
    DELETE /api/monitoring/cloud-accounts/<id>/
    Disconnects/deletes an AWS account.
    """
    queryset = AWSAccount.objects.all()
    serializer_class = AWSAccountSerializer
    permission_classes = [IsAuthenticated]


class InstanceMetricsHistoryView(views.APIView):
    """
    GET /api/monitoring/instances/<int:pk>/metrics/
    Powers the CPU/Memory/Disk utilization charts on the frontend InstanceDetail page.
    Queries the CloudWatchMetric history (grouped and grouped by timestamp) for the given instance.
    Enforces user authentication, and checks account ownership if supported.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk, *args, **kwargs):
        # Fetch the instance, returning 404 if not found
        instance = get_object_or_404(EC2Instance, pk=pk)

        # Enforce account ownership logic if supported in the schema
        account = instance.account
        owner_field = None
        for field in ['user', 'owner', 'created_by']:
            if hasattr(account, field):
                owner_field = field
                break

        if owner_field:
            owner = getattr(account, owner_field)
            if owner != request.user:
                return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        # Parse hours query parameter (default to 24)
        hours_param = request.query_params.get('hours', '24')
        try:
            hours = int(hours_param)
            if hours <= 0:
                raise ValueError()
        except ValueError:
            return Response(
                {"error": "Query parameter 'hours' must be a positive integer."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Filter CloudWatchMetric by timestamp and order ascending
        cutoff_time = timezone.now() - timedelta(hours=hours)
        metrics = CloudWatchMetric.objects.filter(
            instance=instance,
            timestamp__gte=cutoff_time
        ).order_by('timestamp')

        # Group metrics by timestamp. CloudWatchMetric stores separate rows for CPU, Memory, Disk.
        # We group them so that each timestamp returns exactly one combined record.
        grouped_data = {}
        for metric in metrics:
            ts_str = metric.timestamp.isoformat()
            if ts_str not in grouped_data:
                grouped_data[ts_str] = {
                    "timestamp": ts_str,
                    "cpu_percent": None,
                    "memory_percent": None,
                    "disk_percent": None
                }

            name = metric.metric_name
            val = round(metric.value, 2)
            if name == 'CPUUtilization':
                grouped_data[ts_str]["cpu_percent"] = val
            elif name in ['MemoryUtilization', 'Memory%']:
                grouped_data[ts_str]["memory_percent"] = val
            elif name in ['DiskUtilization', 'Disk%', 'DiskSpaceUtilization']:
                grouped_data[ts_str]["disk_percent"] = val

        # Convert grouped dictionary to a sorted list by timestamp
        sorted_response = sorted(grouped_data.values(), key=lambda x: x["timestamp"])

        return Response(sorted_response, status=status.HTTP_200_OK)


class HealingEventListView(generics.ListAPIView):
    """
    GET /api/monitoring/healing-events/
    Lists all auto-healing events, with optional query parameters:
      - status: filter by status (success/failed)
      - search: filter by instance name or ID
    Ordered by triggered_at descending.
    """
    serializer_class = HealingEventSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = HealingEvent.objects.all().select_related('instance').order_by('-triggered_at')
        
        status_param = self.request.query_params.get('status')
        if status_param and status_param.lower() != 'all':
            queryset = queryset.filter(status__iexact=status_param)
            
        search_param = self.request.query_params.get('search')
        if search_param:
            queryset = queryset.filter(
                Q(instance__name__icontains=search_param) |
                Q(instance__instance_id__icontains=search_param)
            )
            
        return queryset

