from django.shortcuts import render
from django.views import View
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie
# from django.contrib import messages

# Create your views here.

# Vue page d'acceuil
def home_page(request):
    return render(request, 'account/home.html', {'form': AuthenticationForm()})

# Vue page de login
class MyLogin(View):

    def post(self, request):
        # Connecter le user
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            user = form.get_user()#Authenticate effectue ici
            login(request, user)
            return JsonResponse({'success': True, 'username': user.username})
        else:
            # print(f"error === {form.errors}")
            return JsonResponse({'success': False, 'errors': form.errors})

# Vue page de logout"'
class MyLogout(View):
    def post(self, request):
        if not request.user.is_authenticated:
            return JsonResponse({'success': False, 'errors': "User must be connected to logout"})
        else :
            # Deconnecter le user
            logout(request)
            return JsonResponse({'success': True})

# Juste pour obliger Django a reset un token CSRF apres une deconnexion du user
# Et le recuperer dans le front 
@ensure_csrf_cookie
def csrf_token_view(request):
    return JsonResponse({'detail': 'CSRF token set'})