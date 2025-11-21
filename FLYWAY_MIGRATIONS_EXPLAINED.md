# Flyway Database Migrations - Execution Order and Process

This document explains how Flyway executes database migrations in the EventPro platform.

---

## Overview

**Flyway** is a database migration tool that manages version-controlled database schema changes. It ensures your database schema evolves in a controlled, repeatable way.

---

## Configuration

### Location
Migrations are stored in:
```
backend/modules/eventpro-api/src/main/resources/db/migration/
```

### Configuration (application.yml)

```yaml
spring:
  flyway:
    enabled: true                    # Enable Flyway
    locations: classpath:db/migration # Where to find migration files
    baseline-on-migrate: true        # Create baseline if schema history table doesn't exist
    baseline-version: 0              # Baseline version number
    validate-on-migrate: true        # Validate migrations before applying
    clean-disabled: true             # Prevent accidental database drops
    out-of-order: false              # Require migrations to run in order
```

**Key Settings Explained:**

- **`enabled: true`**: Flyway runs automatically on application startup
- **`baseline-on-migrate: true`**: If database exists but has no Flyway history, create baseline at version 0
- **`validate-on-migrate: true`**: Check that migration files haven't been modified since they were applied
- **`out-of-order: false`**: Migrations must run in version order (prevents skipping versions)
- **`clean-disabled: true`**: Prevents accidental `flyway clean` which would drop all tables

---

## Migration File Naming Convention

Flyway uses a **strict naming convention** to determine execution order:

```
V{version}__{description}.sql
```

### Format Breakdown:

1. **Prefix**: `V` (uppercase) - indicates versioned migration
2. **Version**: Numeric version number (e.g., `1`, `2`, `3`)
3. **Separator**: `__` (double underscore)
4. **Description**: Human-readable description (optional but recommended)
5. **Extension**: `.sql`

### Examples:

```
V1__create_base_tables.sql
V2__seed_categories.sql
V3__add_user_preferences.sql
V10__add_indexes.sql
```

**Important Rules:**

- ✅ Version numbers are **numeric** (integers)
- ✅ Versions are compared **numerically** (V10 runs after V9, not after V1)
- ✅ Description can contain letters, numbers, underscores, and hyphens
- ✅ Double underscore `__` is **required** between version and description
- ❌ **Never modify** a migration file after it's been applied to any environment
- ❌ **Never delete** migration files (they're part of history)

---

## Execution Order

### How Flyway Determines Order

1. **Scans** the `db/migration/` directory
2. **Extracts version numbers** from filenames
3. **Sorts numerically** by version number
4. **Executes in ascending order**

### Current Migrations

Based on the codebase, here are the migrations in execution order:

#### 1. V1__create_base_tables.sql
**Version**: 1  
**Purpose**: Creates base database schema  
**Executes**: First  
**Contains**:
- `user` table (authentication and user profiles)
- `base_entity` concepts (via JPA BaseEntity)
- Indexes and constraints

#### 2. V2__seed_categories.sql
**Version**: 2  
**Purpose**: Seeds initial data (categories)  
**Executes**: Second (after base tables exist)  
**Contains**:
- Initial category data
- Reference data for the application

---

## Execution Process

### Step-by-Step Flow

#### 1. Application Startup

When Spring Boot starts:
```
Application Context Initialization
  ↓
DataSource Bean Creation
  ↓
Flyway Auto-Configuration
  ↓
Flyway Migration Execution
  ↓
Application Ready
```

#### 2. Flyway Initialization

1. **Connect to Database**: Uses configured DataSource
2. **Check Schema History**: Looks for `flyway_schema_history` table
3. **Create History Table** (if doesn't exist):
   ```sql
   CREATE TABLE flyway_schema_history (
       installed_rank INTEGER,
       version VARCHAR(50),
       description VARCHAR(200),
       type VARCHAR(20),
       script VARCHAR(1000),
       checksum INTEGER,
       installed_by VARCHAR(100),
       installed_on TIMESTAMP,
       execution_time INTEGER,
       success BOOLEAN
   );
   ```

#### 3. Migration Discovery

1. **Scan Directory**: `classpath:db/migration/`
2. **Parse Filenames**: Extract version numbers
3. **Validate Format**: Ensure naming convention is correct
4. **Sort by Version**: Numeric sort (1, 2, 10, not 1, 10, 2)

#### 4. Migration Execution

For each migration file (in order):

1. **Check if Applied**: Query `flyway_schema_history` table
   ```sql
   SELECT * FROM flyway_schema_history 
   WHERE version = '1' AND success = true;
   ```

2. **If Not Applied**:
   - **Validate Checksum**: Ensure file hasn't been modified
   - **Execute SQL**: Run all SQL statements in the file
   - **Record in History**: Insert row into `flyway_schema_history`
   - **Commit Transaction**: Migration is atomic

3. **If Already Applied**:
   - **Skip**: Do not re-execute
   - **Validate**: Check that checksum matches (if `validate-on-migrate: true`)

#### 5. Validation

After all migrations:
- **Verify Checksums**: Ensure no applied migrations were modified
- **Check for Gaps**: Ensure no version numbers are missing (if `out-of-order: false`)
- **Report Status**: Log which migrations were applied/skipped

---

## Example Execution Log

When the application starts, you'll see logs like:

```
Flyway Community Edition 9.x.x by Redgate
Database: jdbc:postgresql://localhost:5432/eventpro (PostgreSQL 16)
Schema history table "public"."flyway_schema_history" does not exist. Creating...
Successfully validated 2 migrations (execution time 00:00.012s)
Creating Schema History table: "public"."flyway_schema_history"
Current version of schema "public": << Empty Schema >>
Migrating schema "public" to version "1 - create base tables"
Successfully applied 1 migration to schema "public", now at version v1 (execution time 00:00.234s)
Migrating schema "public" to version "2 - seed categories"
Successfully applied 1 migration to schema "public", now at version v2 (execution time 00:00.045s)
```

---

## Migration Lifecycle

### First Time (Empty Database)

```
Database: Empty
  ↓
Flyway creates flyway_schema_history table
  ↓
V1__create_base_tables.sql → Applied
  ↓
V2__seed_categories.sql → Applied
  ↓
Database: At version 2
```

### Subsequent Starts (Migrations Already Applied)

```
Database: At version 2
  ↓
Flyway checks flyway_schema_history
  ↓
V1__create_base_tables.sql → Already applied, skip
  ↓
V2__seed_categories.sql → Already applied, skip
  ↓
Database: Still at version 2 (no changes)
```

### Adding New Migration

If you add `V3__add_user_preferences.sql`:

```
Database: At version 2
  ↓
Flyway discovers V3__add_user_preferences.sql
  ↓
V1__create_base_tables.sql → Already applied, skip
  ↓
V2__seed_categories.sql → Already applied, skip
  ↓
V3__add_user_preferences.sql → Apply now
  ↓
Database: At version 3
```

---

## Important Rules and Best Practices

### ✅ DO

1. **Always increment version numbers**: V1, V2, V3, etc.
2. **Use descriptive names**: `V3__add_user_preferences.sql` not `V3__migration.sql`
3. **Test migrations locally** before committing
4. **Keep migrations small and focused**: One logical change per migration
5. **Make migrations idempotent** when possible (use `IF NOT EXISTS`)
6. **Review migrations in code review** before merging

### ❌ DON'T

1. **Never modify applied migrations**: Once applied to any environment, they're immutable
2. **Never delete migration files**: They're part of the database history
3. **Never skip version numbers**: If you need V5, don't jump from V3 to V5
4. **Never use timestamps in version numbers**: Use sequential integers
5. **Never run migrations manually** in production (let Flyway handle it)

### Handling Mistakes

**If you need to fix a migration that hasn't been applied yet:**
- ✅ Modify the file before it runs in any environment
- ✅ Update the checksum will be recalculated

**If you need to fix a migration that's already been applied:**
- ❌ **Cannot modify** the original migration
- ✅ **Create a new migration** (V{N+1}) that fixes the issue
- Example: If V3 has a bug, create `V4__fix_v3_issue.sql`

---

## Checking Migration Status

### Via Application Logs

Check backend logs during startup:
```bash
docker-compose logs backend | grep -i flyway
```

### Via Database Query

Connect to PostgreSQL and check the history table:

```sql
-- List all applied migrations
SELECT 
    installed_rank,
    version,
    description,
    installed_on,
    execution_time,
    success
FROM flyway_schema_history
ORDER BY installed_rank;

-- Check current version
SELECT version 
FROM flyway_schema_history 
WHERE success = true 
ORDER BY installed_rank DESC 
LIMIT 1;
```

### Via Flyway CLI (if installed)

```bash
# Check status
flyway info -url=jdbc:postgresql://localhost:5432/eventpro \
           -user=eventpro \
           -password=eventpro

# Validate migrations
flyway validate -url=jdbc:postgresql://localhost:5432/eventpro \
                -user=eventpro \
                -password=eventpro
```

---

## Troubleshooting

### Issue: Migration Fails

**Symptoms**: Application fails to start, error in logs

**Solution**:
1. Check error message in logs
2. Fix the SQL in the migration file (if not yet applied)
3. Or create a new migration to fix the issue (if already applied)
4. Manually fix database if needed, then mark migration as applied

### Issue: Checksum Validation Failed

**Symptoms**: 
```
Validate failed: Migration checksum mismatch
```

**Cause**: Migration file was modified after being applied

**Solution**:
- **If in development**: Drop and recreate database, or manually update checksum
- **If in production**: **DO NOT** modify. Create a new migration instead

### Issue: Out-of-Order Migration

**Symptoms**:
```
Detected resolved migration not applied to database
```

**Cause**: A migration with a lower version number exists but hasn't been applied

**Solution**:
- Apply the missing migration manually, or
- Set `out-of-order: true` (not recommended for production)

---

## Integration with Docker Compose

When using `docker-compose up`:

1. **PostgreSQL starts** first (health check passes)
2. **Backend starts** and connects to PostgreSQL
3. **Flyway runs** automatically during Spring Boot startup
4. **Migrations apply** if database is empty or new migrations exist
5. **Application continues** startup after migrations complete

**Timeline:**
```
0s:  PostgreSQL container starts
10s: PostgreSQL healthy
15s: Backend container starts
20s: Backend connects to database
21s: Flyway discovers migrations
22s: Flyway applies migrations (if needed)
25s: Spring Boot application ready
```

---

## Summary

1. **Migrations are versioned** using `V{number}__{description}.sql` format
2. **Execution order** is determined by numeric version sorting
3. **Flyway runs automatically** on application startup
4. **Applied migrations are tracked** in `flyway_schema_history` table
5. **Migrations are immutable** once applied to any environment
6. **New migrations** are discovered and applied automatically

This ensures your database schema evolves consistently across all environments (local, dev, staging, production).

