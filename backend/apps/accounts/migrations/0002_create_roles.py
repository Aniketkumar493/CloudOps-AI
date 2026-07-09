# Generated manually to create default user roles/groups

from django.db import migrations


def create_default_groups(apps, schema_editor):
    Group = apps.get_model('auth', 'Group')
    Group.objects.get_or_create(name='viewer')
    Group.objects.get_or_create(name='operator')
    Group.objects.get_or_create(name='admin')


def remove_default_groups(apps, schema_editor):
    Group = apps.get_model('auth', 'Group')
    Group.objects.filter(name__in=['viewer', 'operator', 'admin']).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(create_default_groups, reverse_code=remove_default_groups),
    ]
