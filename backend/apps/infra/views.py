from rest_framework import views, generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import EC2Instance, AWSAccount
from .serializers import EC2InstanceSerializer, AWSAccountSerializer
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
