from django.urls import path 
from chat.views import access_chatrooms, RoomDetailView

app_name = 'chat'

urlpatterns = [
    path('chat/', access_chatrooms, name="chose_chatrooms"),
    path('chat/room/<int:pk>/', RoomDetailView.as_view(), name="access_room")
]
