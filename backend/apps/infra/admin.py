from django.contrib import admin
from .models import AWSAccount, EC2Instance, CloudWatchMetric


@admin.register(AWSAccount)
class AWSAccountAdmin(admin.ModelAdmin):
    list_display = ('name', 'region', 'is_active', 'created_at', 'updated_at')
    list_filter = ('is_active', 'region')
    search_fields = ('name',)


@admin.register(EC2Instance)
class EC2InstanceAdmin(admin.ModelAdmin):
    list_display = ('instance_id', 'name', 'state', 'instance_type', 'account', 'last_synced')
    list_filter = ('state', 'instance_type', 'account')
    search_fields = ('instance_id', 'name', 'public_ip', 'private_ip')


@admin.register(CloudWatchMetric)
class CloudWatchMetricAdmin(admin.ModelAdmin):
    list_display = ('instance', 'metric_name', 'value', 'unit', 'timestamp')
    list_filter = ('metric_name', 'timestamp')
    search_fields = ('instance__instance_id', 'metric_name')
