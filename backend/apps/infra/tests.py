from django.test import TestCase
from django.contrib.auth.models import Group
from django.utils import timezone
from unittest.mock import patch, MagicMock
from datetime import datetime
from rest_framework.test import APIClient
from rest_framework import status

from apps.accounts.models import User, Team
from .models import AWSAccount, EC2Instance, CloudWatchMetric
from .services import sync_ec2_instances, fetch_cloudwatch_metrics, list_ec2_instances
from .tasks import sync_all_accounts_ec2_task, fetch_all_instances_metrics_task


class InfraModelsTestCase(TestCase):
    def setUp(self):
        self.account = AWSAccount.objects.create(
            name="Test Account",
            access_key_id="test-key",
            secret_access_key="test-secret",
            region="us-east-1"
        )
        self.instance = EC2Instance.objects.create(
            account=self.account,
            instance_id="i-1234567890abcdef0",
            name="Test Server",
            state="running",
            instance_type="t2.micro",
            public_ip="1.2.3.4",
            private_ip="10.0.0.4"
        )

    def test_aws_account_creation(self):
        self.assertEqual(str(self.account), "Test Account (us-east-1)")
        self.assertTrue(self.account.is_active)

    def test_ec2_instance_creation(self):
        self.assertEqual(str(self.instance), "Test Server (i-1234567890abcdef0)")
        self.assertEqual(self.instance.account, self.account)

    def test_cloudwatch_metric_creation(self):
        metric = CloudWatchMetric.objects.create(
            instance=self.instance,
            metric_name="CPUUtilization",
            timestamp=timezone.now(),
            value=45.2,
            unit="Percent"
        )
        self.assertEqual(metric.metric_name, "CPUUtilization")
        self.assertEqual(metric.value, 45.2)


class InfraServicesTestCase(TestCase):
    def setUp(self):
        self.account = AWSAccount.objects.create(
            name="Test Account",
            access_key_id="test-key",
            secret_access_key="test-secret",
            region="us-east-1"
        )

    @patch('boto3.client')
    def test_sync_ec2_instances_success(self, mock_boto_client):
        # Mock describe_instances response
        mock_ec2 = MagicMock()
        mock_ec2.describe_instances.return_value = {
            'Reservations': [
                {
                    'Instances': [
                        {
                            'InstanceId': 'i-99999999',
                            'State': {'Name': 'running'},
                            'InstanceType': 'm5.large',
                            'PublicIpAddress': '54.54.54.54',
                            'PrivateIpAddress': '172.31.0.5',
                            'LaunchTime': datetime(2026, 7, 8, 12, 0, 0),
                            'Tags': [{'Key': 'Name', 'Value': 'Prod-Server'}]
                        }
                    ]
                }
            ]
        }
        mock_boto_client.return_value = mock_ec2

        count = sync_ec2_instances(account_id=self.account.id)
        self.assertEqual(count, 1)

        # Verify DB records
        instance = EC2Instance.objects.get(instance_id='i-99999999')
        self.assertEqual(instance.name, 'Prod-Server')
        self.assertEqual(instance.state, 'running')
        self.assertEqual(instance.instance_type, 'm5.large')
        self.assertEqual(instance.public_ip, '54.54.54.54')

    @patch('boto3.client')
    def test_fetch_cloudwatch_metrics_success(self, mock_boto_client):
        instance = EC2Instance.objects.create(
            account=self.account,
            instance_id="i-99999999",
            name="Prod-Server",
            state="running",
            instance_type="m5.large"
        )

        mock_cw = MagicMock()
        mock_cw.get_metric_statistics.return_value = {
            'Datapoints': [
                {
                    'Timestamp': datetime(2026, 7, 8, 13, 0, 0),
                    'Average': 32.5,
                    'Unit': 'Percent'
                },
                {
                    'Timestamp': datetime(2026, 7, 8, 13, 5, 0),
                    'Average': 40.1,
                    'Unit': 'Percent'
                }
            ]
        }
        mock_boto_client.return_value = mock_cw

        metrics = fetch_cloudwatch_metrics(
            instance_id='i-99999999',
            metric_name='CPUUtilization',
            period=300,
            duration_hours=1
        )
        self.assertEqual(len(metrics), 2)
        
        # Verify DB entries
        db_metrics = CloudWatchMetric.objects.filter(instance=instance, metric_name='CPUUtilization')
        self.assertEqual(db_metrics.count(), 2)


class InfraAPITestCase(TestCase):
    def setUp(self):
        # Create team, user and role groups
        self.team = Team.objects.create(name="DevOps")
        self.user = User.objects.create_user(
            email="ops@cloudops.ai",
            password="SecurePassword123!"
        )
        self.viewer_group, _ = Group.objects.get_or_create(name="viewer")
        self.user.groups.add(self.viewer_group)
        self.user.team = self.team
        self.user.save()

        # Create sample data
        self.account = AWSAccount.objects.create(
            name="Test Account",
            access_key_id="test-key",
            secret_access_key="test-secret",
            region="us-east-1"
        )
        self.instance = EC2Instance.objects.create(
            account=self.account,
            instance_id="i-abcdef123",
            name="Api-Server",
            state="running",
            instance_type="t3.medium"
        )

        self.client = APIClient()

    def test_list_ec2_instances_unauthenticated(self):
        response = self.client.get('/api/infra/ec2/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_ec2_instances_authenticated(self):
        # Authenticate
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/infra/ec2/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # DRF PageNumberPagination is default
        self.assertIn('results', response.data)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['instance_id'], 'i-abcdef123')

    @patch('apps.infra.views.sync_ec2_instances')
    def test_sync_ec2_instances_endpoint(self, mock_sync):
        mock_sync.return_value = 5
        self.client.force_authenticate(user=self.user)
        response = self.client.post('/api/infra/sync/', {'account_id': self.account.id}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'success')
        self.assertEqual(response.data['synced_count'], 5)
        mock_sync.assert_called_once_with(account_id=self.account.id)


class InfraTasksTestCase(TestCase):
    @patch('apps.infra.tasks.sync_ec2_instances')
    def test_sync_all_accounts_ec2_task(self, mock_sync):
        mock_sync.return_value = 3
        result = sync_all_accounts_ec2_task()
        self.assertEqual(result, "Successfully synced 3 instances.")
        mock_sync.assert_called_once()

    @patch('apps.infra.tasks.fetch_cloudwatch_metrics')
    def test_fetch_all_instances_metrics_task(self, mock_fetch):
        # Create a running instance
        account = AWSAccount.objects.create(name="Task Account", access_key_id="k", secret_access_key="s")
        EC2Instance.objects.create(account=account, instance_id="i-task1", state="running")
        EC2Instance.objects.create(account=account, instance_id="i-task2", state="stopped") # should be ignored because it is not running
        
        result = fetch_all_instances_metrics_task()
        self.assertEqual(result, "Completed metrics fetch. Success: 1, Failed: 0")
        mock_fetch.assert_called_once_with(
            instance_id="i-task1",
            metric_name="CPUUtilization",
            period=300,
            duration_hours=1
        )

