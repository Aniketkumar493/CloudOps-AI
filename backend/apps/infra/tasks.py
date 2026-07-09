import logging
from celery import shared_task
from .services import sync_ec2_instances, fetch_cloudwatch_metrics
from .models import EC2Instance

logger = logging.getLogger(__name__)


@shared_task(name='apps.infra.tasks.sync_all_accounts_ec2_task')
def sync_all_accounts_ec2_task():
    """
    Periodic background task to sync EC2 instances for all active AWS accounts.
    """
    logger.info("Celery Task: starting sync_all_accounts_ec2_task")
    try:
        count = sync_ec2_instances()
        logger.info(f"Celery Task: successfully synced {count} instances.")
        return f"Successfully synced {count} instances."
    except Exception as e:
        logger.error(f"Celery Task Failed: {str(e)}")
        return f"Error: {str(e)}"


@shared_task(name='apps.infra.tasks.fetch_all_instances_metrics_task')
def fetch_all_instances_metrics_task():
    """
    Periodic background task to pull CPUUtilization for all running EC2 instances.
    """
    logger.info("Celery Task: starting fetch_all_instances_metrics_task")
    instances = EC2Instance.objects.filter(state='running')
    success_count = 0
    fail_count = 0

    for instance in instances:
        try:
            fetch_cloudwatch_metrics(
                instance_id=instance.instance_id,
                metric_name='CPUUtilization',
                period=300,
                duration_hours=1
            )
            success_count += 1
        except Exception as e:
            logger.error(f"Failed to fetch CloudWatch metrics for instance {instance.instance_id}: {str(e)}")
            fail_count += 1

    return f"Completed metrics fetch. Success: {success_count}, Failed: {fail_count}"

