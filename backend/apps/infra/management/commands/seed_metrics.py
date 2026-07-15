from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from datetime import timedelta
import math
import random
from apps.infra.models import EC2Instance, CloudWatchMetric

class Command(BaseCommand):
    help = 'Generates realistic fake CloudWatchMetric data for EC2 instances for demo/testing purposes.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--instance-id',
            type=str,
            help='Specific EC2 instance ID to seed data for. If not provided, seeds all instances.'
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force overwrite of existing metric data within the last 24 hours timeframe.'
        )

    def handle(self, *args, **options):
        instance_id = options.get('instance_id')
        force = options.get('force')

        # 1. Fetch target instances
        if instance_id:
            target_instances = EC2Instance.objects.filter(instance_id=instance_id)
            if not target_instances.exists():
                raise CommandError(f"EC2 Instance with ID '{instance_id}' does not exist.")
        else:
            target_instances = EC2Instance.objects.all()
            if not target_instances.exists():
                self.stdout.write(self.style.WARNING("No EC2 instances found in database. Please sync instances first."))
                return

        # 2. Designate exactly one instance to simulate no CloudWatch Agent installed (null memory/disk)
        # We designate the first instance in the list to be agentless
        agentless_instance = target_instances.first() if target_instances.count() > 1 else None

        now = timezone.now().replace(second=0, microsecond=0)
        start_time = now - timedelta(hours=24)
        
        total_created = 0
        instances_seeded_count = 0

        self.stdout.write(self.style.NOTICE(f"Seeding metrics from {start_time.isoformat()} to {now.isoformat()}..."))

        for instance in target_instances:
            # 3. Check for existing metrics in this timeframe
            existing_metrics = CloudWatchMetric.objects.filter(
                instance=instance,
                timestamp__gte=start_time
            )

            if existing_metrics.exists():
                if not force:
                    self.stdout.write(self.style.WARNING(
                        f"Skipping instance {instance.instance_id} - metric data already exists in the last 24 hours. "
                        f"Use the --force flag to overwrite."
                    ))
                    continue
                else:
                    self.stdout.write(self.style.NOTICE(
                        f"Overwriting existing metrics for instance {instance.instance_id} (--force enabled)..."
                    ))
                    existing_metrics.delete()

            # 4. Generate 288 data points (every 5 mins for 24h)
            is_agentless = (instance == agentless_instance)
            
            metrics_to_create = []

            for i in range(288):
                timestamp = start_time + timedelta(minutes=i * 5)
                
                # Base cpu oscillation using sine wave (cycles every 6 hours)
                cpu_base = 25.0 + 8.0 * math.sin(i / 12.0)
                cpu_noise = random.uniform(-4.0, 4.0)
                cpu = cpu_base + cpu_noise
                
                # Introduce specific workload spikes to simulate real load scenarios
                if i in range(45, 49):      # Spike 1
                    cpu = random.uniform(80.0, 95.0)
                elif i in range(130, 134):  # Spike 2
                    cpu = random.uniform(75.0, 88.0)
                elif i in range(220, 225):  # Spike 3
                    cpu = random.uniform(88.0, 97.0)
                
                cpu = max(0.0, min(100.0, cpu))
                
                # Add CPU metric point
                metrics_to_create.append(CloudWatchMetric(
                    instance=instance,
                    metric_name='CPUUtilization',
                    timestamp=timestamp,
                    value=cpu,
                    unit='Percent'
                ))

                if not is_agentless:
                    # Memory oscillation around 55%
                    mem_base = 55.0 + 5.0 * math.cos(i / 20.0)
                    mem_noise = random.uniform(-2.0, 2.0)
                    memory = max(0.0, min(100.0, mem_base + mem_noise))
                    
                    # Disk usage slowly climbing over the 24 hours
                    disk = 30.0 + (i / 287.0) * 12.0 + random.uniform(-0.3, 0.3)
                    disk = max(0.0, min(100.0, disk))
                    
                    metrics_to_create.append(CloudWatchMetric(
                        instance=instance,
                        metric_name='MemoryUtilization',
                        timestamp=timestamp,
                        value=memory,
                        unit='Percent'
                    ))
                    
                    metrics_to_create.append(CloudWatchMetric(
                        instance=instance,
                        metric_name='DiskSpaceUtilization',
                        timestamp=timestamp,
                        value=disk,
                        unit='Percent'
                    ))

            # Bulk create to ensure fast execution
            CloudWatchMetric.objects.bulk_create(metrics_to_create)
            total_created += len(metrics_to_create)
            instances_seeded_count += 1
            
            agent_status = "No CloudWatch Agent" if is_agentless else "CloudWatch Agent Installed"
            self.stdout.write(self.style.SUCCESS(
                f"Seeded {len(metrics_to_create)} metrics for instance {instance.instance_id} ({agent_status})"
            ))

        self.stdout.write(self.style.SUCCESS(
            f"Summary: Created {total_created} metric snapshots across {instances_seeded_count} instance(s)."
        ))
