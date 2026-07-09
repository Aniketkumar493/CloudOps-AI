from django.contrib.auth.models import Group
from rest_framework import serializers
from .models import User, Team


class TeamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Team
        fields = ['id', 'name', 'description']


class UserSerializer(serializers.ModelSerializer):
    team = TeamSerializer(read_only=True)
    roles = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'team', 'roles', 'date_joined']

    def get_roles(self, obj):
        # Return names of groups the user belongs to (viewer, operator, admin)
        return [group.name for group in obj.groups.all()]


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    team_name = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True
    )
    role = serializers.ChoiceField(
        choices=['viewer', 'operator', 'admin'],
        default='viewer',
        write_only=True
    )

    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'password', 'team_name', 'role']

    def create(self, validated_data):
        team_name = validated_data.pop('team_name', None)
        role_name = validated_data.pop('role', 'viewer')
        password = validated_data.pop('password')

        # Connect to or create a Team if provided
        team = None
        if team_name:
            team, _ = Team.objects.get_or_create(name=team_name.strip())

        # Create user
        user = User.objects.create_user(team=team, **validated_data)
        user.set_password(password)
        user.save()

        # Assign user to the designated group/role
        group, _ = Group.objects.get_or_create(name=role_name)
        user.groups.add(group)

        return user
