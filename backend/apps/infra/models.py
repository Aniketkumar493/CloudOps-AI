from django.db import models


class AWSAccount(models.Model):
    """
    AWSAccount stores AWS credentials and configuration for connecting to AWS via boto3.
    """
    name = models.CharField(max_length=100, unique=True)
    access_key_id = models.CharField(max_length=255)
    secret_access_key = models.CharField(max_length=255)
    region = models.CharField(max_length=50, default='us-east-1')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.region})"


class EC2Instance(models.Model):
    """
    EC2Instance caches a snapshot of EC2 state retrieved from AWS.
    """
    account = models.ForeignKey(
        AWSAccount,
        on_delete=models.CASCADE,
        related_name='instances'
    )
    instance_id = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=255, blank=True)
    state = models.CharField(max_length=50)
    instance_type = models.CharField(max_length=50)
    public_ip = models.GenericIPAddressField(null=True, blank=True)
    private_ip = models.GenericIPAddressField(null=True, blank=True)
    launch_time = models.DateTimeField(null=True, blank=True)
    last_synced = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name or 'Unnamed'} ({self.instance_id})"


class CloudWatchMetric(models.Model):
    """
    CloudWatchMetric stores periodic performance data points (like CPUUtilization)
    fetched from AWS CloudWatch.
    """
    instance = models.ForeignKey(
        EC2Instance,
        on_delete=models.CASCADE,
        related_name='metrics'
    )
    metric_name = models.CharField(max_length=100)
    timestamp = models.DateTimeField()
    value = models.FloatField()
    unit = models.CharField(max_length=50, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=['instance', 'metric_name', 'timestamp']),
        ]
        # Prevent duplicate metric data points at the exact same timestamp
        unique_together = ('instance', 'metric_name', 'timestamp')

    def __str__(self):
        return f"{self.instance.instance_id} - {self.metric_name}: {self.value} at {self.timestamp}"
