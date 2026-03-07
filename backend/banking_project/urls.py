from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('users.urls')),
    path('api/accounts/', include('accounts.urls')),
    path('api/transactions/', include('transactions.urls')),
    path('api/loans/', include('loans.urls')),
    path('api/admin/', include('adminpanel.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Admin site customization
admin.site.site_header = "CapitalSphere Administration"
admin.site.site_title = "CapitalSphere Admin"
admin.site.index_title = "Welcome to CapitalSphere Admin Portal"
