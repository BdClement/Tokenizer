import json

from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer
from chat.models import Room, Message, User
import redis

# Migration pour AsyncWebscoketConsumer pour gagner en performance sous charge 
class ChatConsumer(WebsocketConsumer):
    
    # Objet redis global a mes consumers
    r = redis.Redis(host='127.0.0.1', port=6379, db=0, decode_responses=True)

    def connect(self):
        self.room_id = self.scope["url_route"]["kwargs"]["pk"]
        self.room_name = Room.objects.get(pk=self.room_id).name
        self.room_group_name = f"chat_{self.room_name}"
        # ChatConsumer.r.delete(self.room_name)#A supprimer
        # Ajout du user connecte a mon set sur mon objet redis
        ChatConsumer.r.lpush(self.room_name, self.scope['user'].username)
        list_users = ChatConsumer.r.lrange(self.room_name, 0, -1)#liste du premier indice jusqu'au dernier
        self.accept()

        # Join the group
        async_to_sync(self.channel_layer.group_add)(
            self.room_group_name, self.channel_name
        )
        # mis a jour de la liste des users connectes
        async_to_sync(self.channel_layer.group_send)(
                self.room_group_name, {"type": "list_connected_users", "users_connected": list(set(list_users))}
            )
        # Envoi dun message de connection
        async_to_sync(self.channel_layer.group_send)(
                self.room_group_name, {"type": "user_connection", "message": "has joined the chat", "author": self.scope['user'].username}
            )

    def disconnect(self, close_code):
        # Suppression du user dans redis
        ChatConsumer.r.lrem(self.room_name, 1, self.scope['user'].username)
        list_users = ChatConsumer.r.lrange(self.room_name, 0, -1)
        # mise a jour de la liste des users connectes
        async_to_sync(self.channel_layer.group_send)(
                self.room_group_name, {"type": "list_connected_users", "users_connected": list(set(list_users))}
            )

        # Message de decconnection
        async_to_sync(self.channel_layer.group_send)(
                self.room_group_name, {"type": "user_connection", "message": "has left the chat", "author": self.scope['user'].username}
            )
        async_to_sync(self.channel_layer.group_discard)(
            self.room_group_name, self.channel_name
        )

    def receive(self, text_data):
        # Creation d'un objet Message lie a la room
        text_data_json = json.loads(text_data)
        msg_type = text_data_json.get("type")
        message = text_data_json.get("message")
        msg_author = User.objects.get(username=self.scope['user'].username)
        room = Room.objects.get(id=self.room_id)
        # Sauvegarde du message dans la database
        if msg_type == "chat_message":
            obj_message = Message.objects.create(author=msg_author, room=room, content=message)
            obj_message.save()

        async_to_sync(self.channel_layer.group_send)(
            self.room_group_name, {"type": "chat_message", "message": message, "author": msg_author.username}
        )
    
    # Receive a chat message from group
    def chat_message(self, event):
        message = event["message"]
        author = event["author"]
        type = event["type"]

        self.send(text_data=json.dumps({"type": type, "message": message, "author": author}))

    # receive a connection message from the group
    def user_connection(self, event):
        message = event["message"]
        author = event["author"]
        type = event["type"]

        self.send(text_data=json.dumps({"type": type, "message": message, "author": author}))

    def list_connected_users(self, event):
        type = event["type"]
        users_connected = event["users_connected"]

        self.send(text_data=json.dumps({"type": type, "users_connected": users_connected}))
