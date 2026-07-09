from rest_framework import generics, permissions
from .models import User
from .serializers import UserSerializer, UserRegistrationSerializer


class UserRegistrationView(generics.CreateAPIView):
    """
    POST /api/auth/register/
    Public registration endpoint. Creates a new user, assigns them to a team
    (creating it if needed), and assigns the designated group role.
    """
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]


class UserMeView(generics.RetrieveAPIView):
    """
    GET /api/auth/me/
    Authenticated profile endpoint. Returns current user details, team association,
    and role groups.
    """
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user
