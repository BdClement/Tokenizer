"""
ASGI config for d09 project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/howto/deployment/asgi/
"""

import os

from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django.core.asgi import get_asgi_application
from chat.routing import websocket_urlpatterns as chat_websocket_urlpatterns

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'd09.settings')

application = ProtocolTypeRouter({#permet de rooter les connexions (http, webscokets)
    'http': get_asgi_application(),# permet de continuer a rooter les request http en asgi comme en wsgi
    'websocket': AuthMiddlewareStack(
        URLRouter(chat_websocket_urlpatterns)
    )
})
