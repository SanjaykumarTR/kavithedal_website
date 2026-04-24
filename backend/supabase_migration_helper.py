#!/usr/bin/env python
"""
Supabase Migration Helper Script
Run this script in your Django virtual environment to fix URL and import data.
"""

import os
import sys
import json
import urllib.parse
import subprocess


def print_banner():
    print("\n" + "="*60)
    print("🔧 SUPABASE MIGRATION HELPER")
    print("="*60)


def get_correct_supabase_url():
    """Generate the correct Supabase URL format"""
    print("\n" + "-"*60)
    print("📋 CORRECT SUPABASE URL FORMAT")
    print("-"*60)
    print("""
Your current URL format appears to be incorrect.

The ERROR: "could not translate host name aws-0-xxx.pooler.supabase.com"
indicates the hostname is wrong.

CORRECT FORMAT:
  postgres://postgres.[PROJECT_REF]:[PASSWORD]@db.[PROJECT_REF].supabase.co:6543/postgres

For your project (PROJECT_REF: dybmcyueojifigodnnhz):

✅ CORRECT URL:
  postgres://postgres.dybmcyueojifigodnnhz:Thulir@2025@db.dybmcyueojifigodnnhz.supabase.co:6543/postgres

NOTE: The @ symbol in password "Thulir@2025" must be URL-encoded as %40
      when it appears before the @ in the hostname part!

Alternative (if the above doesn't work):
  postgres://postgres.dybmcyueojifigodnnhz:Thulir%402025@db.dybmcyueojifigodnnhz.supabase.co:6543/postgres
""")
    print("-"*60)


def set_environment_and_import():
    """Set the correct DATABASE_URL and import data"""
    print("\n" + "-"*60)
    print("🚀 IMPORTING DATA TO SUPABASE")
    print("-"*60)
    
    # The correct URL (with properly encoded password)
    correct_url = "postgres://postgres.dybmcyueojifigodnnhz:Thulir%402025@db.dybmcyueojifigodnnhz.supabase.co:6543/postgres"
    
    print(f"\nUsing DATABASE_URL: {correct_url[:60]}...")
    
    # Set environment variable
    os.environ['DATABASE_URL'] = correct_url
    
    # Test connection first
    print("\n1️⃣ Testing database connection...")
    try:
        result = subprocess.run(
            [sys.executable, 'manage.py', 'check', '--database', 'default'],
            capture_output=True,
            text=True,
            cwd=os.path.dirname(os.path.abspath(__file__))
        )
        if result.returncode == 0:
            print("   ✅ Database connection successful!")
        else:
            print(f"   ❌ Connection failed: {result.stderr}")
            return False
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False
    
    # Clear existing data
    print("\n2️⃣ Clearing existing data...")
    try:
        subprocess.run(
            [sys.executable, 'manage.py', 'flush', '--no-input'],
            capture_output=True,
            cwd=os.path.dirname(os.path.abspath(__file__))
        )
        print("   ✅ Database cleared")
    except Exception as e:
        print(f"   ⚠️  Warning: {e}")
    
    # Import data
    print("\n3️⃣ Importing data from data.json...")
    data_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data.json')
    
    if not os.path.exists(data_path):
        print(f"   ❌ data.json not found at {data_path}")
        return False
    
    try:
        result = subprocess.run(
            [sys.executable, 'manage.py', 'loaddata', data_path],
            capture_output=True,
            text=True,
            cwd=os.path.dirname(os.path.abspath(__file__))
        )
        if result.returncode == 0:
            print("   ✅ Data imported successfully!")
            print(result.stdout)
        else:
            print(f"   ❌ Import failed: {result.stderr}")
            return False
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False
    
    # Verify import
    print("\n4️⃣ Verifying import...")
    try:
        result = subprocess.run(
            [sys.executable, 'manage.py', 'shell', '-c', 
             "from django.contrib.auth import get_user_model; from apps.books.models import Book; from apps.orders.models import Order; User = get_user_model(); print(f'Users: {User.objects.count()}'); print(f'Books: {Book.objects.count()}'); print(f'Orders: {Order.objects.count()}')"],
            capture_output=True,
            text=True,
            cwd=os.path.dirname(os.path.abspath(__file__))
        )
        print(result.stdout)
    except Exception as e:
        print(f"   ⚠️  Could not verify: {e}")
    
    return True


def main():
    print_banner()
    
    # Show correct URL format
    get_correct_supabase_url()
    
    # Ask user what they want to do
    print("\n" + "="*60)
    print("CHOOSE AN OPTION:")
    print("="*60)
    print("1. Fix DATABASE_URL and import data (recommended)")
    print("2. Just show the correct URL format")
    print("3. Exit")
    print("="*60)
    
    choice = input("\nEnter your choice (1/2/3): ").strip()
    
    if choice == '1':
        print("\n🚀 Starting migration process...")
        success = set_environment_and_import()
        if success:
            print("\n" + "="*60)
            print("✅ MIGRATION COMPLETE!")
            print("="*60)
            print("""
Next steps:
1. Update your Render dashboard with the correct DATABASE_URL:
   postgres://postgres.dybmcyueojifigodnnhz:Thulir%402025@db.dybmcyueojifigodnnhz.supabase.co:6543/postgres

2. Redeploy your backend on Render

3. Test the application:
   - Admin panel: /admin/
   - User login
   - Book listings
   - Order history
""")
        else:
            print("\n❌ Migration failed. Please check the errors above.")
    elif choice == '2':
        print("\n" + "="*60)
        print("CORRECT DATABASE_URL:")
        print("="*60)
        print("""
For Render Environment Variables:

DATABASE_URL=postgres://postgres.dybmcyueojifigodnnhz:Thulir%402025@db.dybmcyueojifigodnnhz.supabase.co:6543/postgres

SSLROOTCERT=(leave empty)
""")
    else:
        print("\n👋 Goodbye!")


if __name__ == "__main__":
    main()
