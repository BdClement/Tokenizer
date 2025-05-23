from django.shortcuts import render, redirect
from django.views import View
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from django.contrib import messages

# Create your views here.

# Vue page d'acceuil
def home_page(request):
    return render(request, 'account/home1.html')
    # return render(request, 'account/home1.html', {'form': AuthenticationForm()})

# Vue page de login
class MyLogin(View):

    def get(self, request):
        form = AuthenticationForm()
        return render(request, "account/login.html", {'form': form})

# Redirection en cas de succès
    def post(self, request):

        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            user = form.get_user()#Authenticate effectue ici
            login(request, user)
            messages.success(request, f"Welcome, {user.username} !")
            return redirect("account:home_page")
        else:
            return render(request, "account/login.html", {'form': form})

# Vue page de logout"'
class MyLogout(View):
    def get(self, request):
        if request.user.is_authenticated:
            logout(request)
            messages.success(request, "You have been successfully logged out.")
            # return JsonResponse({'success': True})
        else:
            messages.warning(request, "Impossible action. Something went wrong.")
        return redirect("account:home_page")

# Juste pour obliger Django a reset un token CSRF apres une deconnexion du user
# Et le recuperer dans le front 
@ensure_csrf_cookie
def csrf_token_view(request):
    return JsonResponse({'detail': 'CSRF token set'})