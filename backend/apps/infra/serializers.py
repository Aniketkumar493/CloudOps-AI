from rest_framework import serializers
from .models import AWSAccount, EC2Instance, CloudWatchMetric


class AWSAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = AWSAccount
        fields = ['id', 'name', 'access_key_id', 'secret_access_key', 'region', 'is_active', 'created_at', 'updated_at']
        extra_kwargs = {
            'secret_access_key': {'write_only': True}
        }


class EC2InstanceSerializer(serializers.ModelSerializer):
    account_name = serializers.CharField(source='account.name', read_only=True)

    class Meta:
        model = EC2Instance
        fields = [
            'id', 'account', 'account_name', 'instance_id', 'name', 'state',
            'instance_type', 'public_ip', 'private_ip', 'launch_time', 'last_synced'
        ]


class CloudWatchMetricSerializer(serializers.ModelSerializer):
    instance_id = serializers.CharField(source='instance.instance_id', read_only=True)

    class Meta:
        model = CloudWatchMetric
        fields = ['id', 'instance', 'instance_id', 'metric_name', 'timestamp', 'value', 'unit']
