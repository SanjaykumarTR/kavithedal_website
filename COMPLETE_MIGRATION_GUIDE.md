# Complete Database Migration Guide: Render PostgreSQL → Supabase PostgreSQL

⚠️ **CRITICAL: URL FORMAT FIX** - The error you're seeing is because the Supabase URL format is wrong.

## ✅ CORRECT DATABASE_URL for Render:

```
postgres://postgres.dybmcyueojifigodnnhz:Thulir%402025@db.dybmcyueojifigodnnhz.supabase.co:6543/postgres
```

**Key points:**
- Host: `db.dybmcyueojifigodnnhz.supabase.co` (NOT `aws-1-ap-southeast-1.pooler.supabase.com`)
- Port: `6543` (connection pooler)
- Password: `Thulir@2025` encoded as `Thulir%402025`

---

This document provides a complete step-by-step guide to migrate your Kavithedal Publications database from Render PostgreSQL to Supabase PostgreSQL with zero data loss.

---

## ⚠️ IMPORTANT PREREQUISITES

Before starting the migration, ensure you have:

1. ✅ **Render DATABASE_URL** - Available in Render Dashboard → PostgreSQL → Internal Database URL
2. ✅ **Supabase Account** - Create a project at [supabase.com](https://supabase.com)
3. ✅ **Supabase Connection Pooler URL** - Get from Settings → Database → Connection Pooler

---

## 📋 MIGRATION CHECKLIST

| Step | Task | Status |
|------|------|--------|
| 1 | Get Render DATABASE_URL | ☐ |
| 2 | Create Supabase project | ☐ |
| 3 | Get Supabase pooler URL | ☐ |
| 4 | Export data from Render | ☐ |
| 5 | Apply migrations to Supabase | ☐ |
| 6 | Import data to Supabase | ☐ |
| 7 | Update Render env vars | ☐ |
| 8 | Redeploy backend | ☐ |
| 9 | Verify application | ☐ |

---

## 🚀 STEP-BY-STEP MIGRATION

### STEP 1: Get Render DATABASE_URL

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Navigate to **Your PostgreSQL** → **Details**
3. Copy the **Internal Database URL** (format: `postgres://user:password@host.render.com:5432/database`)
4. Save this URL - you'll need it for exporting data

### STEP 2: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New Project**
3. Enter project details:
   - **Name**: `kavithedal-publications`
   - **Database Password**: Generate a strong password and SAVE IT
   - **Region**: Select Asia (Singapore) or closest to your users
4. Wait for provisioning (2-3 minutes)

### STEP 3: Get Supabase Connection Pooler URL

1. In Supabase dashboard, go to **Settings** → **Database**
2. Find **Connection Pooler** section
3. Copy the connection string

The pooler URL format:
```
postgres://postgres.[PROJECT_REF]:[PASSWORD]@db.[PROJECT_REF].supabase.co:6543/postgres
```

**⚠️ IMPORTANT**: Use port **6543** (pooler), NOT port 5432 (direct)

---

### STEP 4: Export Data from Render

#### Method A: Using Django dumpdata (Recommended)

```bash
# Navigate to backend directory
cd backend

# Set Render DATABASE_URL
export DATABASE_URL="postgres://user:password@host.render.com:5432/database"

# Export all data (excluding auth.permission and contenttypes to avoid conflicts)
python manage.py dumpdata --exclude auth.permission --exclude contenttypes > ../data.json
```

#### Verify Export
```bash
# Check file size
ls -lh data.json

# Verify it contains data
head -c 500 data.json
```

---

### STEP 5: Apply Migrations on Supabase

```bash
# Set Supabase DATABASE_URL
export DATABASE_URL="postgres://postgres.[PROJECT_REF]:[PASSWORD]@db.[PROJECT_REF].supabase.co:6543/postgres"

# Apply migrations
python manage.py migrate

# Verify migrations
python manage.py showmigrations
```

---

### STEP 6: Import Data into Supabase

```bash
# Import the exported data
python manage.py loaddata ../data.json

# Verify import
python manage.py shell -c "
from django.contrib.auth import get_user_model
from apps.books.models import Book
from apps.orders.models import Order

User = get_user_model()
print(f'Users: {User.objects.count()}')
print(f'Books: {Book.objects.count()}')
print(f'Orders: {Order.objects.count()}')
"
```

---

### STEP 7: Update Render Environment Variables

1. Go to Render Dashboard → Your Backend Service → **Environment**
2. Find the `DATABASE_URL` variable
3. Replace with Supabase pooler URL:

```
postgres://postgres.[PROJECT_REF]:[PASSWORD]@db.[PROJECT_REF].supabase.co:6543/postgres
```

4. **Add new environment variable**:
   - Key: `SSLROOTCERT`
   - Value: (leave empty - optional, for SSL verification)

---

### STEP 8: Redeploy Backend

1. Go to Render Dashboard → Your Backend Service
2. Click **Deploy** (or push to GitHub for auto-deploy)
3. Check logs for any errors

---

### STEP 9: Verify Application

Test all functionality:

| Test | Expected Result |
|------|-----------------|
| Admin panel | Books, users, orders visible |
| User login | Authentication works |
| Book listings | All books displayed |
| Order history | Previous orders visible |
| Ebook access | Purchased ebooks accessible |
| API endpoints | All endpoints respond correctly |

---

## 🔧 DJANGO SETTINGS VERIFICATION

Your [`backend/config/settings.py`](backend/config/settings.py) is already configured for Supabase with:

```python
# Automatic Supabase detection based on .supabase.co domain
if '.supabase.co' in _DATABASE_URL:
    # Uses port 6543 (pooler)
    # Adds sslmode=require
    DATABASES['default']['OPTIONS'] = {
        'sslmode': 'require',
        'sslrootcert': os.environ.get('SSLROOTCERT', ''),
    }
```

---

## ⚠️ TROUBLESHOOTING

### Issue: "table does not exist"
**Solution**: Run `python manage.py migrate`

### Issue: "duplicate key value violates unique constraint"
**Solution**: Use `--natural-primary` flag or check for existing data

### Issue: "encoding issues"
**Solution**: Ensure UTF-8 encoding in terminal

### Issue: "SSL connection errors"
**Solution**: Ensure `sslmode=require` is set (already in settings.py)

### Issue: "connection timeout"
**Solution**: 
1. Verify using port 6543 (pooler), not 5432
2. Check IP is whitelisted in Supabase dashboard

---

## 🔄 ROLLBACK PLAN

If migration fails:

1. ❌ **DO NOT delete Render database** - Keep it active
2. Go to Render Dashboard → Environment variables
3. Revert DATABASE_URL to Render PostgreSQL URL
4. Redeploy backend
5. Application will reconnect to Render

---

## 📁 FILES CREATED FOR MIGRATION

| File | Purpose |
|------|---------|
| [`backend/migrate_to_supabase.sh`](backend/migrate_to_supabase.sh) | Bash script for automated migration |
| [`data.json`](data.json) | Exported data file (empty - will be populated during export) |
| [`SUPABASE_MIGRATION_GUIDE.md`](SUPABASE_MIGRATION_GUIDE.md) | Reference documentation |

---

## ✅ MIGRATION COMPLETE

After successful migration:

- Supabase database contains all production data
- Django backend connects to Supabase
- Application behaves exactly as before
- Zero data loss

**DO NOT delete the Render PostgreSQL until you have verified everything works!**

---

## 📞 NEED HELP?

If you encounter issues:

1. Check the logs in Render Dashboard
2. Verify DATABASE_URL format
3. Ensure Supabase project is active
4. Check SSL configuration in settings.py
