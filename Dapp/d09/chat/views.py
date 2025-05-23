from django.shortcuts import render
from django.views.generic import DetailView
from django.db.models import Q
from chat.models import Room
from django.utils.decorators import method_decorator
from django.contrib.auth.decorators import login_required
from django.urls import reverse_lazy, reverse

# Create your views here.

def access_chatrooms(request):
    rooms = Room.objects.filter(
        Q(name='TennisChat') | Q(name='FootballChat') | Q(name='CookingChat')
    )
    return render(request, 'chat/access.html', {'rooms' : rooms})

@method_decorator(login_required(login_url=reverse_lazy('account:home_page')), name='dispatch')
class RoomDetailView(DetailView):
    model = Room
    template_name = "chat/access_room.html"
    context_object_name = 'room'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        
        room = self.get_object()

        # Modifier pour les 3 derniers messages ?
        messages = room.room_messages.all()
        context['room_messages'] = messages
        return context
