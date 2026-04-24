# Supabase Database Migration Guide

This document provides step-by-step instructions for migrating the PostgreSQL database from Render to Supabase with zero data loss and minimal downtime.

---

## Prerequisites

- [ ] Supabase account created
- [ ] Render database URL available
- [ ] Access to Render dashboard
- [ ] pg_dump and psql CLI tools installed

---

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Enter project details:
   - **Name**: kavithedal-publications
   - **Database Password**: Generate a strong password and save it
   - **Region**: Select region closest to your users (e.g., Asia - Singapore)
4. Wait for project to be provisioned (may take 2-3 minutes)

---

## Step 2: Get Supabase Connection Strings

### Option A: Connection Pooler (Recommended)

The connection pooler is designed for application connections and is more performant.

1. In Supabase dashboard, go to **Settings** → **Database**
2. Find the **Connection Pooler** section
3. Copy the **Connection String** (格式: `postgres://postgres.[project-ref]:[password]@db.[project-ref].supabase.co:6543/postgres`)

The pooler URL format:
```
postgres://postgres.[PROJECT_REF]:[PASSWORD]@db.[PROJECT_REF].supabase.co:6543/postgres
```

### Option B: Direct Connection (Not Recommended for Production)

If needed, you can use the direct connection string from the **URI** section (port 5432), but the pooler is recommended.

---

## Step 3: Export Data from Render

### Method A: Using pg_dump (Recommended)

Run this command on your local machine or a machine with PostgreSQL client:

```bash
# Replace with your actual Render database URL
pg_dump "postgresql://user:password@host.render.com:5432/database" > backup.sql
```

**Important Notes:**
- The Render database URL can be found in Render dashboard → PostgreSQL → Internal Database URL
- Ensure there are no active writes during the export to maintain data consistency

### Method B: Using Render's CLI

```bash
render postgres export backup.sql
```

### Verify the Backup

```bash
# Check file exists and has content
ls -la backup.sql

# Check table count (should show CREATE TABLE statements)
grep -c "CREATE TABLE" backup.sql
```

---

## Step 4: Import Data into Supabase

### Prepare Supabase Database

Before importing, you may need to reset the database schema:

```bash
# Drop all existing tables (be careful - this deletes all data!)
psql "YOUR_SUPABASE_POOLER_URL" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
```

### Import the Backup

```bash
psql "postgres://postgres.[PROJECT_REF]:[PASSWORD]@db.[PROJECT_REF].supabase.co:6543/postgres" < backup.sql
```

**Important:** Use port 6543 (pooler) for the connection.

### Verify Import

```bash
# Connect to Supabase
psql "YOUR_SUPABASE_POOLER_URL"

# List tables
\dt

# Check record counts (example)
SELECT 'accounts_adminuser' as table_name, count(*) FROM accounts_adminuser
UNION ALL
SELECT 'books_book', count(*) FROM books_book
UNION ALL
SELECT 'orders_order', count(*) FROM orders_order;
```

---

## Step 5: Update Environment Variables

### In Render Dashboard

1. Go to Render Dashboard → Your Backend Service → **Environment**
2. Find the `DATABASE_URL` variable
3. Replace the value with your Supabase connection pooler URL

**New DATABASE_URL format:**
```
postgres://postgres.[PROJECT_REF]:[PASSWORD]@db.[PROJECT_REF].supabase.co:6543/postgres?sslmode=require
```

### In Local Development (.env)

If you want to connect locally to Supabase:

```bash
# .env file
DATABASE_URL=postgres://postgres.[PROJECT_REF]:[PASSWORD]@db.[PROJECT_REF].supabase.co:6543/postgres?sslmode=require
```

---

## Step 6: Deploy/Redeploy Backend

### Option A: Automatic Deploy (Render)

1. Push your code changes to GitHub
2. Render will automatically detect the change and redeploy

### Option B: Manual Deploy

1. Go to Render Dashboard → Your Backend Service
2. Click "Deploy" button

### Verify Deployment

Check the logs for any database connection errors:

```bash
# In Render dashboard, view Logs
```

---

## Step 7: Verify Migration

### Test Checklist

- [ ] **User Login**: Test user authentication
- [ ] **Admin Panel**: Access `/admin/` and verify all models load
- [ ] **Books**: Verify book listings and details work
- [ ] **Orders**: Test order creation and history
- [ ] **Ebook Purchase**: Complete a test ebook purchase
- [ ] **API Endpoints**: Test key API endpoints with curl or Postman

### Database Connection Test

Run this in Django shell:

```bash
cd backend
python manage.py shell
```

```python
from django.db import connection
with connection.cursor() as cursor:
    cursor.execute("SELECT 1")
    print(cursor.fetchone())
# Should output: (1,)
```

---

## Step 8: Troubleshooting

### SSL Connection Errors

If you see SSL errors, ensure `sslmode=require` is set:

```python
# In settings.py, the following is already configured:
DATABASES['default']['OPTIONS'] = {
    'sslmode': 'require',
}
```

### Connection Timeout

If connections timeout, verify:
1. You're using the **pooler URL** (port 6543), not direct DB (port 5432)
2. IP whitelist includes your IP in Supabase dashboard

### Migration Errors

If you encounter errors during import:

```bash
# Check for specific errors
psql "YOUR_SUPABASE_URL" < backup.sql 2>&1 | grep -i error
```

Common issues:
- **UUID extension**: Supabase uses uuid-ossp extension
- **Schema issues**: Use `DROP SCHEMA public CASCADE` to reset

### Verify Migrations Status

```bash
cd backend
python manage.py showmigrations
```

All migrations should be marked as `[X]`.

---

## Rollback Plan

If migration fails:

1. **Keep the Render database active** - Do not delete it until migration is verified
2. **Revert DATABASE_URL** - Change back to Render URL in Render dashboard
3. **Redeploy** - The backend will reconnect to Render

---

## Security Notes

- **Never commit** database credentials to version control
- Use environment variables for all secrets
- The pooler connection is encrypted with SSL
- Supabase provides built-in row-level security (RLS) if needed

---

## Summary

| Step | Description | Status |
|------|-------------|--------|
| 1 | Create Supabase project | ☐ |
| 2 | Get pooler connection string | ☐ |
| 3 | Export from Render | ☐ |
| 4 | Import to Supabase | ☐ |
| 5 | Update DATABASE_URL | ☐ |
| 6 | Redeploy backend | ☐ |
| 7 | Verify migration | ☐ |

---

## Updated Django Configuration

The `settings.py` has been updated with SSL support for Supabase:

```python
# In backend/config/settings.py
DATABASES = {
    'default': dj_database_url.parse(
        os.environ.get('DATABASE_URL'),
        conn_max_age=600,
        conn_health_checks=True,
    )
}

# Add SSL configuration (already in settings.py)
DATABASES['default']['OPTIONS'] = {
    'sslmode': 'require',
}
```

This configuration is compatible with:
- Render PostgreSQL
- Supabase PostgreSQL (via pooler)
- Any PostgreSQL provider using SSL
