"""
Run this script to seed demo data:
  python manage.py runscript seed_data
Or use: python seed_data.py

This creates:
 - 1 super admin
 - 1 regular admin
 - 3 demo users with accounts and sample transactions
"""
import os
import sys
import django
from pathlib import Path

# Setup Django
sys.path.insert(0, str(Path(__file__).parent))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'banking_project.settings')
django.setup()

from django.contrib.auth.hashers import make_password
from decimal import Decimal
from users.models import User
from accounts.models import Account
from transactions.models import Transaction

print("🌱 Seeding CapitalSphere demo data...")

# Super Admin
super_admin, created = User.objects.get_or_create(
    email='superadmin@capitalsphere.com',
    defaults={
        'full_name': 'Super Admin',
        'phone': '9000000001',
        'role': 'super_admin',
        'is_staff': True,
        'is_superuser': True,
        'is_verified': True,
        'kyc_status': 'verified',
    }
)
if created:
    super_admin.set_password('Admin@1234')
    super_admin.save()
    print("✅ Super Admin created: superadmin@capitalsphere.com / Admin@1234")
else:
    print("⚠️  Super Admin already exists")

# Admin
admin_user, created = User.objects.get_or_create(
    email='admin@capitalsphere.com',
    defaults={
        'full_name': 'Bank Admin',
        'phone': '9000000002',
        'role': 'admin',
        'is_staff': True,
        'is_verified': True,
        'kyc_status': 'verified',
    }
)
if created:
    admin_user.set_password('Admin@1234')
    admin_user.save()
    print("✅ Admin created: admin@capitalsphere.com / Admin@1234")

# Demo Users
demo_users = [
    {'full_name': 'Arjun Kumar', 'email': 'arjun@demo.com', 'phone': '9876543210', 'balance': Decimal('50000.00')},
    {'full_name': 'Priya Sharma', 'email': 'priya@demo.com', 'phone': '9876543211', 'balance': Decimal('125000.00')},
    {'full_name': 'Rajeev Nair', 'email': 'rajeev@demo.com', 'phone': '9876543212', 'balance': Decimal('35000.00')},
]

accounts_created = []
for u_data in demo_users:
    user, created = User.objects.get_or_create(
        email=u_data['email'],
        defaults={
            'full_name': u_data['full_name'],
            'phone': u_data['phone'],
            'role': 'user',
            'is_verified': True,
            'kyc_status': 'verified',
            'transaction_pin': make_password('1234'),
        }
    )
    if created:
        user.set_password('User@1234')
        user.save()
        print(f"✅ User created: {u_data['email']} / User@1234")

    account, acreated = Account.objects.get_or_create(
        user=user,
        account_type='savings',
        defaults={'balance': u_data['balance'], 'status': 'active'}
    )
    accounts_created.append(account)
    if acreated:
        print(f"   📦 Account: {account.account_number} (₹{account.balance})")

# Sample transactions between first two users
if len(accounts_created) >= 2:
    sender = accounts_created[0]
    receiver = accounts_created[1]
    if not Transaction.objects.filter(sender_account=sender, receiver_account=receiver).exists():
        txn = Transaction.objects.create(
            sender_account=sender,
            receiver_account=receiver,
            amount=Decimal('5000.00'),
            transaction_type='transfer',
            status='completed',
            description='Demo transfer',
            sender_balance_after=sender.balance - Decimal('5000'),
            receiver_balance_after=receiver.balance + Decimal('5000'),
        )
        print(f"✅ Sample transaction: {txn.reference_number}")

print("\n🎉 Seeding complete!")
print("\n📋 Login Credentials:")
print("  Super Admin : superadmin@capitalsphere.com / Admin@1234")
print("  Admin       : admin@capitalsphere.com / Admin@1234")
print("  Demo User 1 : arjun@demo.com / User@1234 (PIN: 1234)")
print("  Demo User 2 : priya@demo.com / User@1234 (PIN: 1234)")
print("  Demo User 3 : rajeev@demo.com / User@1234 (PIN: 1234)")
