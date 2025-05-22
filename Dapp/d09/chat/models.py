from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

# Create your models here.


class Room(models.Model):
    #Ajouter des protections cf websocket ?
    # Only  alphanumerics, hyphens, underscores, or periods.
    name = models.CharField(max_length=64, null=False)

class Message(models.Model):
    author = models.ForeignKey(User, on_delete=models.CASCADE, null=False, related_name='author')
    room = models.ForeignKey(Room, on_delete=models.CASCADE, null=False, related_name='room_messages')
    posted_date = models.DateTimeField(default=timezone.now)
    content = models.TextField(null=False)
    # room.rooms_messages.all()#Donne tout les messages associes a l'instance de room
    # user.room_author.all()#Donne l'auteur du message 

# Solutions pour avoir la liste des users connected 
    # - enregistrer dans le modele Room les user connected
    # - enregsitrer dans le consumer les user connected 
    # - utiliser Redis pour stocker 

    # Exporter des donnees
# python manage.py dumpdata auth.User chat.Room --indent 2 > fixtures/init_data.json
    # charger des donnes 
# python manage.py loaddata fixtures/init_data.json
