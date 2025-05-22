from django.urls import path, re_path
from chat.consumers import ChatConsumer

websocket_urlpatterns = [
    path('ws/chat/<int:pk>/', ChatConsumer.as_asgi()),
]