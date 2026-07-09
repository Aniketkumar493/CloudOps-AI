from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from .views import UserRegistrationView, UserMeView

urlpatterns = [
    # ── JWT Authentication ───────────────────────────────────────────────────
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # ── User Registration & Profile ──────────────────────────────────────────
    path('register/', UserRegistrationView.as_view(), name='user_register'),
    path('me/', UserMeView.as_view(), name='user_me'),
]
