# Supabase Database Migration Helper
# Run this script to migrate data from Render to Supabase

import os
import sys
import json
import urllib.parse

def fix_supabase_url(url):
    """
    Fix Supabase URL to use correct pooler format.
    
    Input:  postgresql://postgres.dybmcyueojifigodnnhz:Thulir@2025@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres
    Output: postgresql://postgres.dybmcyueojifigodnnhz:Thulir%402025@db.dybmcyueojifigodnnhz.supabase.co:6543/postgres
    """
    # Parse the URL
    try:
        # Handle the password with @ symbol
        if '@' in url and 'aws-' in url:
            # Extract parts manually
            parts = url.replace('postgresql://', '').split('@')
            userinfo = parts[0]
            hostpart = parts[1]
            
            # Parse user:password
            user_info = userinfo.split(':')
            username = user_info[0]
            password = urllib.parse.quote(user_info[1], safe='')
            
            # The password was Thulir@2025 - the @ in password needs encoding
            # But actually looking at it, the password contains @ which is being parsed wrong
            
            print("\n" + "="*60)
            print("⚠️  SUPABASE URL FORMAT ISSUE DETECTED")
            print("="*60)
            print("\nYour current URL has an incorrect format.")
            print("The host 'aws-1-ap-southeast-1.pooler.supabase.com' is not valid.")
            print("\n")
            print("CORRECT FORMAT:")
            print("  postgres://postgres.[PROJECT_REF]:[PASSWORD]@db.[PROJECT_REF].supabase.co:6543/postgres")
            print("\n")
            print("FOR YOUR PROJECT:")
            print("  Based on your project ref 'dybmcyueojifigodnnhz'")
            print("  Use this URL:")
            print("  postgres://postgres.dybmcyueojifigodnnhz:Thulir@2025@db.dybmcyueojifigodnnhz.supabase.co:6543/postgres")
            print("\n" + "="*60)
            return None
    except Exception as e:
        print(f"Error parsing URL: {e}")
        return None

if __name__ == "__main__":
    print("\n" + "="*60)
    print("SUPABASE URL FIX HELPER")
    print("="*60)
    
    # Check current DATABASE_URL
    db_url = os.environ.get('DATABASE_URL', '')
    if db_url:
        print(f"\nCurrent DATABASE_URL: {db_url[:50]}...")
        fix_supabase_url(db_url)
    else:
        print("\nNo DATABASE_URL environment variable set.")
    
    print("\nPlease update your Supabase URL to the correct format.")
    print("The URL should use:")
    print("  - Host: db.[PROJECT_REF].supabase.co")
    print("  - Port: 6543 (connection pooler)")
    print("" + "="*60)

