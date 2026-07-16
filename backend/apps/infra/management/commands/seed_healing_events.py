from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
import random
from apps.infra.models import AWSAccount, EC2Instance, HealingEvent

class Command(BaseCommand):
    help = 'Seeds realistic mock HealingEvent data linked to EC2 instances.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Clear all existing healing events before seeding.'
        )

    def handle(self, *args, **options):
        force = options.get('force')

        if force:
            self.stdout.write(self.style.WARNING("Clearing existing Healing Events..."))
            HealingEvent.objects.all().delete()

        # Ensure we have at least one account and some instances
        account = AWSAccount.objects.first()
        if not account:
            account = AWSAccount.objects.create(
                name="Production Account",
                access_key_id="AKIAIOSFODNN7EXAMPLE",
                secret_access_key="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
                region="us-west-2"
            )
            self.stdout.write(self.style.SUCCESS(f"Created default AWS account: {account.name}"))

        instances = list(EC2Instance.objects.all())
        if not instances or len(instances) < 4:
            # Create some mock instances to make sure we have at least 4
            mock_data = [
                {"instance_id": "i-0123456789abcdef0", "name": "web-server-prod", "state": "running", "type": "t3.medium"},
                {"instance_id": "i-0987654321fedcba0", "name": "db-server-replica", "state": "running", "type": "r5.large"},
                {"instance_id": "i-0abcdef1234567890", "name": "auth-service-dev", "state": "stopped", "type": "t2.micro"},
                {"instance_id": "i-0fedcba9876543210", "name": "cache-node-prod", "state": "running", "type": "m5.large"},
            ]
            for data in mock_data:
                # Check if it already exists, if not create it
                inst, created = EC2Instance.objects.get_or_create(
                    instance_id=data["instance_id"],
                    defaults={
                        "account": account,
                        "name": data["name"],
                        "state": data["state"],
                        "instance_type": data["type"],
                        "public_ip": f"54.{random.randint(1,254)}.{random.randint(1,254)}.{random.randint(1,254)}",
                        "private_ip": f"10.0.{random.randint(1,254)}.{random.randint(1,254)}"
                    }
                )
                if created:
                    instances.append(inst)
            self.stdout.write(self.style.SUCCESS(f"Ensured at least 4 EC2 instances are in the database."))

        reasons = [
            "CPU Utilization > 90% for 15 minutes",
            "Memory utilization reached 98%",
            "Disk utilization exceeded 92% threshold",
            "Status Check Failed (Instance)",
            "System status check failure (boto3 timeout)",
            "CPU Utilization > 95% for 5 minutes"
        ]

        actions = [
            "Reboot Instance",
            "Stop/Start Instance",
            "Notify Only (Escalate to Operator)",
            "Restart System Daemon"
        ]

        notes_success = [
            "Reboot triggered via boto3. Instance resumed normal metrics within 4 minutes.",
            "Celery task rebooted the instance successfully. CPU dropped to 12%.",
            "Operator notification dispatched. Automatically resolved after reboot.",
            "Health checks returned green status after system daemon restart."
        ]

        notes_failed = [
            "Boto3 API client encountered a timeout error while initiating reboot. Operator alerted.",
            "Instance did not respond to reboot command. Manual escalation required.",
            "Disk cleanup action failed due to permissions on system directories. Escalated to admin.",
            "Celery task aborted: Instance in transitional 'stopping' state."
        ]

        now = timezone.now()
        created_count = 0

        # Define 15 mock events with varying timestamps
        events_data = [
            {"offset_hours": 1.5, "status": "success", "instance_idx": 0},
            {"offset_hours": 4, "status": "success", "instance_idx": 2},
            {"offset_hours": 12, "status": "failed", "instance_idx": 3},
            {"offset_hours": 24, "status": "success", "instance_idx": 1},
            {"offset_hours": 30, "status": "success", "instance_idx": 0},
            {"offset_hours": 45, "status": "success", "instance_idx": 3},
            {"offset_hours": 72, "status": "failed", "instance_idx": 0},
            {"offset_hours": 96, "status": "success", "instance_idx": 2},
            {"offset_hours": 110, "status": "success", "instance_idx": 1},
            {"offset_hours": 130, "status": "success", "instance_idx": 3},
            {"offset_hours": 150, "status": "success", "instance_idx": 0},
            {"offset_hours": 168, "status": "success", "instance_idx": 1},
            {"offset_hours": 180, "status": "failed", "instance_idx": 2},
            {"offset_hours": 200, "status": "success", "instance_idx": 0},
            {"offset_hours": 240, "status": "success", "instance_idx": 3}
        ]

        for i, ev in enumerate(events_data):
            timestamp = now - timedelta(hours=ev["offset_hours"])
            reason = reasons[i % len(reasons)]
            action = actions[0] if "reboot" in reason.lower() or i % 2 == 0 else actions[i % len(actions)]
            
            notes = random.choice(notes_success) if ev["status"] == "success" else random.choice(notes_failed)
            inst = instances[ev["instance_idx"] % len(instances)]
            
            HealingEvent.objects.create(
                instance=inst,
                triggered_at=timestamp,
                reason=reason,
                action_taken=action,
                status=ev["status"],
                notes=notes
            )
            created_count += 1

        self.stdout.write(self.style.SUCCESS(f"Successfully seeded {created_count} Healing Events in the database."))
