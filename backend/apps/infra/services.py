import boto3
import logging
from datetime import datetime, timedelta, timezone as datetime_timezone
from django.utils import timezone
from botocore.config import Config as BotoConfig
from .models import AWSAccount, EC2Instance, CloudWatchMetric

logger = logging.getLogger(__name__)


def list_ec2_instances(account_id=None):
    """
    Retrieve list of cached EC2Instance records from database.
    """
    queryset = EC2Instance.objects.all()
    if account_id:
        queryset = queryset.filter(account_id=account_id)
    return queryset


def sync_ec2_instances(account_id=None):
    """
    Query AWS via boto3 to pull latest EC2 instances and update local database cache.
    """
    if account_id:
        accounts = AWSAccount.objects.filter(id=account_id, is_active=True)
    else:
        accounts = AWSAccount.objects.filter(is_active=True)

    synced_count = 0
    boto_config = BotoConfig(connect_timeout=5, read_timeout=5)

    for account in accounts:
        logger.info(f"Syncing EC2 instances for account: {account.name}")
        try:
            ec2_client = boto3.client(
                'ec2',
                aws_access_key_id=account.access_key_id,
                aws_secret_access_key=account.secret_access_key,
                region_name=account.region,
                config=boto_config
            )

            response = ec2_client.describe_instances()
            active_ids = []

            for reservation in response.get('Reservations', []):
                for inst_data in reservation.get('Instances', []):
                    inst_id = inst_data['InstanceId']
                    state = inst_data['State']['Name']
                    inst_type = inst_data['InstanceType']
                    public_ip = inst_data.get('PublicIpAddress')
                    private_ip = inst_data.get('PrivateIpAddress')
                    launch_time = inst_data.get('LaunchTime')

                    # Extract the 'Name' tag if it exists
                    name = ""
                    for tag in inst_data.get('Tags', []):
                        if tag['Key'] == 'Name':
                            name = tag['Value']
                            break

                    # Update or create instance cache record
                    EC2Instance.objects.update_or_create(
                        instance_id=inst_id,
                        defaults={
                            'account': account,
                            'name': name,
                            'state': state,
                            'instance_type': inst_type,
                            'public_ip': public_ip,
                            'private_ip': private_ip,
                            'launch_time': launch_time
                        }
                    )
                    active_ids.append(inst_id)
                    synced_count += 1

            # Mark instances not returned in this sync as terminated
            EC2Instance.objects.filter(account=account).exclude(instance_id__in=active_ids).update(state='terminated')

        except Exception as e:
            logger.error(f"Failed to sync EC2 instances for account {account.name}: {str(e)}")
            raise e

    return synced_count


def fetch_cloudwatch_metrics(instance_id, metric_name='CPUUtilization', period=300, duration_hours=1):
    """
    Fetch CloudWatch metric history for a specific EC2 instance via boto3 and save to DB.
    """
    try:
        instance = EC2Instance.objects.get(instance_id=instance_id)
    except EC2Instance.DoesNotExist:
        logger.error(f"EC2Instance with ID {instance_id} not found in database.")
        raise ValueError(f"EC2Instance with ID {instance_id} does not exist.")

    account = instance.account
    boto_config = BotoConfig(connect_timeout=5, read_timeout=5)

    logger.info(f"Fetching CloudWatch metric '{metric_name}' for instance {instance_id}")

    try:
        cw_client = boto3.client(
            'cloudwatch',
            aws_access_key_id=account.access_key_id,
            aws_secret_access_key=account.secret_access_key,
            region_name=account.region,
            config=boto_config
        )

        end_time = datetime.utcnow()
        start_time = end_time - timedelta(hours=duration_hours)

        response = cw_client.get_metric_statistics(
            Namespace='AWS/EC2',
            MetricName=metric_name,
            Dimensions=[{'Name': 'InstanceId', 'Value': instance_id}],
            StartTime=start_time,
            EndTime=end_time,
            Period=period,
            Statistics=['Average']
        )

        created_metrics = []
        for datapoint in response.get('Datapoints', []):
            timestamp = datapoint['Timestamp']
            # Ensure timezone-aware datetime
            if timezone.is_naive(timestamp):
                timestamp = timezone.make_aware(timestamp, datetime_timezone.utc)

            value = datapoint['Average']
            unit = datapoint.get('Unit', '')

            metric, _ = CloudWatchMetric.objects.update_or_create(
                instance=instance,
                metric_name=metric_name,
                timestamp=timestamp,
                defaults={
                    'value': value,
                    'unit': unit
                }
            )
            created_metrics.append(metric)

        return created_metrics

    except Exception as e:
        logger.error(f"Failed to fetch CloudWatch metrics for instance {instance_id}: {str(e)}")
        raise e
