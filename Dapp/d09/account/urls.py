from django.urls import path 
# from . import views
from account.views import home_page, MyLogin, MyLogout, csrf_token_view, web3_features
# from articles.views import ArticleListView, HomePageRedirect, MyLoginView, MyLogoutView
# from articles.views import SelfPublicationListView, ArticleDetailView, FavouriteArticleList
# from articles.views import CreateUser, CreateArticle

app_name = 'account'

urlpatterns = [
    path('account/', home_page, name="home_page"),
    path('login/', MyLogin.as_view(), name='login'),
    path('logout/', MyLogout.as_view(), name='logout'),
    path('csrf/', csrf_token_view, name='csrf_token'),
    path('web3', web3_features, name="web3")
]