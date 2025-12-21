# Database Access Guide

## Issue: Port Conflict Detected

You have a **local PostgreSQL** installation running on port `5432`, which conflicts with the Docker PostgreSQL container. This is likely why Prisma cannot connect.

```
Local PostgreSQL: localhost:5432 (PID 1060)
Docker PostgreSQL: Trying to bind to 5432 but blocked by local installation
```

---

## Solution Options

### Option 1: Stop Local PostgreSQL and Use Docker (Recommended)

This is the cleanest solution - use only the Docker PostgreSQL.

**Step 1: Stop your local PostgreSQL**
```bash
# For macOS with Homebrew
brew services stop postgresql@15
# OR
brew services stop postgresql

# For macOS manual installation
pg_ctl -D /usr/local/var/postgres stop
# OR
pg_ctl -D /opt/homebrew/var/postgres stop
```

**Step 2: Verify port 5432 is free**
```bash
lsof -i :5432
# Should return nothing
```

**Step 3: Restart Docker containers**
```bash
docker-compose down
docker-compose up -d
```

**Step 4: Verify Docker PostgreSQL is accessible**
```bash
docker exec evaluation-framework-db psql -U postgres -c "SELECT version();"
```

**Step 5: Test from localhost**
If you have `psql` installed locally:
```bash
psql -h localhost -p 5432 -U postgres -d evaluation_framework
# Password: postgres
```

---

### Option 2: Change Docker PostgreSQL Port

Keep your local PostgreSQL and run Docker on a different port.

**Step 1: Update docker-compose.yml**

Edit `docker-compose.yml` to use port 5433:

```yaml
services:
  postgres:
    image: postgres:15-alpine
    container_name: evaluation-framework-db
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: evaluation_framework
    ports:
      - "5433:5432"  # Changed from 5432:5432
    # ... rest of config
```

**Step 2: Update .env file**

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/evaluation_framework?schema=public"
```

**Step 3: Update Keycloak configuration**

In `docker-compose.yml`, update Keycloak database URL:

```yaml
  keycloak:
    # ...
    environment:
      # ...
      KC_DB_URL: jdbc:postgresql://postgres:5432/keycloak  # Keep this as 5432 (internal)
      # The above is internal to Docker network, so stays 5432
```

**Step 4: Restart containers**
```bash
docker-compose down
docker-compose up -d
```

**Step 5: Test connection**
```bash
psql -h localhost -p 5433 -U postgres -d evaluation_framework
# Password: postgres
```

---

### Option 3: Use Docker Network Name from Local Machine

Connect to Docker PostgreSQL using the container name (requires Docker Desktop on macOS).

**Connection string:**
```
postgresql://postgres:postgres@localhost:5432/evaluation_framework?schema=public
```

This won't work if local PostgreSQL is running, so you'd need to stop it first (same as Option 1).

---

## How to Access the Database

### Using psql (Command Line)

**If you have psql installed:**

```bash
# For Docker on port 5432
psql -h localhost -p 5432 -U postgres -d evaluation_framework

# For Docker on port 5433
psql -h localhost -p 5433 -U postgres -d evaluation_framework

# Password is: postgres
```

**Common psql commands:**
```sql
-- List all databases
\l

-- List all tables
\dt

-- Describe a table
\d users

-- Show all users
SELECT * FROM users;

-- Show table sizes
\dt+

-- Quit psql
\q
```

---

### Using Database GUI Tools

#### **Option A: pgAdmin 4** (Free)
1. Download from: https://www.pgadmin.org/download/
2. Install and open
3. Right-click "Servers" → "Register" → "Server"
4. **General tab**:
   - Name: `Evaluation Framework`
5. **Connection tab**:
   - Host: `localhost`
   - Port: `5432` (or `5433` if you changed it)
   - Maintenance database: `postgres`
   - Username: `postgres`
   - Password: `postgres`
6. Click "Save"

#### **Option B: DBeaver** (Free)
1. Download from: https://dbeaver.io/download/
2. Install and open
3. Click "New Database Connection"
4. Select "PostgreSQL"
5. Enter connection details:
   - Host: `localhost`
   - Port: `5432` (or `5433`)
   - Database: `evaluation_framework`
   - Username: `postgres`
   - Password: `postgres`
6. Click "Test Connection" then "Finish"

#### **Option C: TablePlus** (Paid, macOS native)
1. Download from: https://tableplus.com/
2. Create new connection → PostgreSQL
3. Enter:
   - Host: `localhost`
   - Port: `5432` (or `5433`)
   - User: `postgres`
   - Password: `postgres`
   - Database: `evaluation_framework`
4. Connect

#### **Option D: Postico** (Paid, macOS native)
1. Download from: https://eggerapps.at/postico/
2. New Favorite
3. Enter:
   - Host: `localhost`
   - Port: `5432` (or `5433`)
   - User: `postgres`
   - Password: `postgres`
   - Database: `evaluation_framework`
4. Connect

---

### Using Docker Exec (Always Works)

This method always works regardless of port conflicts:

```bash
# Connect to database
docker exec -it evaluation-framework-db psql -U postgres -d evaluation_framework

# Run one-off queries
docker exec evaluation-framework-db psql -U postgres -d evaluation_framework -c "SELECT * FROM users;"

# List databases
docker exec evaluation-framework-db psql -U postgres -l

# Backup database
docker exec evaluation-framework-db pg_dump -U postgres evaluation_framework > backup.sql

# Restore database
docker exec -i evaluation-framework-db psql -U postgres -d evaluation_framework < backup.sql
```

---

## Recommended Setup

For your development environment, I recommend **Option 1** (stop local PostgreSQL and use Docker):

### Why?
1. ✅ Keeps development environment isolated
2. ✅ Same setup across all developers
3. ✅ Easy to reset/clean database
4. ✅ Matches production Docker setup
5. ✅ No port conflicts
6. ✅ Includes both app DB and Keycloak DB

### Quick Setup Commands

```bash
# 1. Stop local PostgreSQL
brew services stop postgresql@15

# 2. Verify port is free
lsof -i :5432
# Should return nothing

# 3. Restart Docker containers
docker-compose down
docker-compose up -d

# 4. Wait for database to be ready (check health)
docker ps

# 5. Verify both databases exist
docker exec evaluation-framework-db psql -U postgres -l | grep -E "evaluation_framework|keycloak"

# 6. Connect with psql (if installed)
psql -h localhost -p 5432 -U postgres -d evaluation_framework
# Password: postgres
```

---

## Connection Strings Reference

### For Application (.env)
```env
# If using port 5432
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/evaluation_framework?schema=public"

# If using port 5433
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/evaluation_framework?schema=public"
```

### For Database Tools
```
Host: localhost
Port: 5432 (or 5433)
Username: postgres
Password: postgres
Database: evaluation_framework
```

### For Keycloak Database
```
Host: localhost
Port: 5432 (or 5433)
Username: postgres
Password: postgres
Database: keycloak
```

---

## Troubleshooting

### "Connection refused"
- Check if PostgreSQL is running: `docker ps | grep postgres`
- Check if port is listening: `lsof -i :5432`
- Check firewall settings

### "Port already in use"
- Stop local PostgreSQL: `brew services stop postgresql@15`
- Or use Option 2 (different port)

### "Password authentication failed"
- Password is: `postgres`
- Username is: `postgres`
- Make sure you're connecting to the Docker container, not local PostgreSQL

### "Database does not exist"
- Verify databases exist: `docker exec evaluation-framework-db psql -U postgres -l`
- If missing, recreate containers: `docker-compose down -v && docker-compose up -d`

---

## Next Steps

1. Choose an option (I recommend Option 1)
2. Follow the setup steps
3. Install a database GUI tool (I recommend DBeaver - it's free and cross-platform)
4. Connect and explore your database!

Once you have database access working, you can:
- Monitor user registrations during OAuth testing
- Debug authentication issues
- Manually create test data
- Run database migrations
- Backup/restore data
