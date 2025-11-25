# When Does Flyway Migration Run?

This document explains the **exact timing** of when Flyway migrations execute during application startup.

---

## Quick Answer

**Flyway migrations run automatically during Spring Boot application startup**, specifically:

1. **After** the DataSource bean is created
2. **Before** JPA/Hibernate initializes
3. **Before** any `@PostConstruct` methods
4. **Before** the application is ready to accept requests

**Timing**: Very early in the Spring Boot lifecycle, during the **Application Context initialization phase**.

---

## Detailed Execution Timeline

### Spring Boot Startup Sequence

```
1. Application Starts
   └─> SpringApplication.run() called
       │
2. Application Context Creation
   └─> Spring creates ApplicationContext
       │
3. Bean Definition Loading
   └─> Loads @Configuration classes
       └─> Discovers @Component, @Service, @Repository, etc.
       │
4. DataSource Bean Creation ⭐
   └─> Creates database connection pool
       └─> Configures HikariCP connection pool
       │
5. Flyway Auto-Configuration ⭐⭐⭐ FLYWAY RUNS HERE
   └─> Spring Boot detects Flyway dependency
       └─> Creates Flyway bean
       └─> Executes migrations immediately
           ├─> Scans db/migration/ directory
           ├─> Checks flyway_schema_history table
           ├─> Applies pending migrations
           └─> Validates applied migrations
       │
6. JPA/Hibernate Initialization
   └─> Hibernate validates schema (ddl-auto: validate)
       └─> Creates EntityManagerFactory
       └─> Validates entities match database schema
       │
7. Repository Beans Creation
   └─> Creates JPA repositories
       │
8. Service Beans Creation
   └─> Creates @Service beans
       │
9. Controller Beans Creation
   └─> Creates @RestController beans
       │
10. @PostConstruct Methods
    └─> Executes any @PostConstruct methods
        │
11. ApplicationReadyEvent
    └─> Application is ready
        └─> HTTP server starts accepting requests
```

---

## Why This Order Matters

### Flyway Runs BEFORE JPA/Hibernate

This is **critical** because:

1. **JPA `ddl-auto: validate`** requires the schema to exist
   - Hibernate checks that entities match the database schema
   - If tables don't exist, validation fails
   - Flyway creates the schema first

2. **Prevents Race Conditions**
   - Ensures database is ready before any code tries to use it
   - No risk of queries running before tables exist

3. **Atomic Operations**
   - Migrations run in a transaction
   - Either all succeed or all fail
   - Database is in a consistent state

---

## Exact Spring Boot Lifecycle Phase

Flyway runs during the **Bean Initialization Phase**, specifically:

```
ApplicationContext.refresh()
  ↓
invokeBeanFactoryPostProcessors()
  ↓
registerBeanPostProcessors()
  ↓
finishBeanFactoryInitialization()  ← Flyway runs here
  ├─> DataSource bean created
  ├─> FlywayAutoConfiguration.execute()  ⭐ FLYWAY EXECUTES
  │   └─> Flyway.migrate()
  └─> JPA/Hibernate beans created (after Flyway completes)
```

---

## When Flyway Executes

### Scenario 1: Application Startup (Normal)

**Trigger**: Spring Boot application starts

**When**:
- `./gradlew :eventpro-api:bootRun`
- `docker-compose up backend`
- Running the JAR file: `java -jar backend.jar`

**Timing**: 
- **Before** HTTP server starts
- **Before** any REST endpoints are available
- **Before** any business logic runs

**Example Log Output**:
```
2024-01-15 10:30:15.123  INFO --- [main] o.f.c.internal.database.base.DatabaseType : Database: jdbc:postgresql://localhost:5432/eventpro (PostgreSQL 16)
2024-01-15 10:30:15.145  INFO --- [main] o.f.core.internal.command.DbMigrate      : Current version of schema "public": << Empty Schema >>
2024-01-15 10:30:15.146  INFO --- [main] o.f.core.internal.command.DbMigrate      : Migrating schema "public" to version "1 - create base tables"
2024-01-15 10:30:15.234  INFO --- [main] o.f.core.internal.command.DbMigrate      : Successfully applied 1 migration to schema "public" (execution time 00:00.088s)
2024-01-15 10:30:15.235  INFO --- [main] o.f.core.internal.command.DbMigrate      : Migrating schema "public" to version "2 - seed categories"
2024-01-15 10:30:15.245  INFO --- [main] o.f.core.internal.command.DbMigrate      : Successfully applied 1 migration to schema "public" (execution time 00:00.010s)
2024-01-15 10:30:16.123  INFO --- [main] c.a.e.EventProApplication                : Started EventProApplication in 2.456 seconds
```

---

### Scenario 2: Docker Compose Startup

**Trigger**: `docker-compose up` or `make local-up`

**Timeline**:
```
0s:   docker-compose starts containers
5s:   PostgreSQL container healthy
10s:  Backend container starts
15s:  Spring Boot application begins startup
16s:  DataSource connects to PostgreSQL
17s:  Flyway runs migrations ⭐
18s:  Migrations complete
20s:  Application ready (HTTP server starts)
```

**Important**: Backend waits for PostgreSQL health check before starting, ensuring database is ready.

---

### Scenario 3: Subsequent Starts (Migrations Already Applied)

**When**: Application restarts, but migrations are already applied

**What Happens**:
1. Flyway still runs (always runs on startup)
2. Checks `flyway_schema_history` table
3. Finds all migrations already applied
4. Validates checksums
5. Skips execution (no SQL runs)
6. Continues startup

**Example Log Output**:
```
2024-01-15 10:35:22.123  INFO --- [main] o.f.c.internal.database.base.DatabaseType : Database: jdbc:postgresql://localhost:5432/eventpro (PostgreSQL 16)
2024-01-15 10:35:22.145  INFO --- [main] o.f.core.internal.command.DbValidate    : Successfully validated 2 migrations (execution time 00:00.012s)
2024-01-15 10:35:22.146  INFO --- [main] o.f.core.internal.command.DbMigrate      : Current version of schema "public": 2
2024-01-15 10:35:22.147  INFO --- [main] o.f.core.internal.command.DbMigrate      : Schema "public" is up to date. No migration necessary.
2024-01-15 10:35:23.123  INFO --- [main] c.a.e.EventProApplication                : Started EventProApplication in 1.234 seconds
```

**Note**: Flyway still executes, but it's a no-op (no migrations to apply).

---

## When Flyway Does NOT Run

### ❌ Not on Application Restart (Hot Reload)

If you're using Spring Boot DevTools or similar:
- **Hot reload** of code changes does **NOT** trigger Flyway
- Flyway only runs on **full application restart**
- This is by design - migrations should be intentional

### ❌ Not on HTTP Request

Flyway does **NOT** run when:
- An HTTP request comes in
- A REST endpoint is called
- A scheduled task runs

**Why**: Migrations are schema changes that should happen during controlled deployments, not during runtime.

### ❌ Not on Bean Creation

Flyway does **NOT** run when:
- A new `@Service` bean is created
- A new `@Repository` bean is created
- Lazy-loaded beans are initialized

**Why**: Flyway runs once during application startup, not per-bean.

---

## Configuration That Controls Timing

### Spring Boot Auto-Configuration

Flyway is automatically configured by Spring Boot when:

1. **Flyway dependency is present**:
   ```gradle
   implementation 'org.flywaydb:flyway-core'
   implementation 'org.flywaydb:flyway-database-postgresql'
   ```

2. **DataSource is configured**:
   ```yaml
   spring:
     datasource:
       url: jdbc:postgresql://localhost:5432/eventpro
   ```

3. **Flyway is enabled** (default: true):
   ```yaml
   spring:
     flyway:
       enabled: true
   ```

### Disabling Flyway

If you want to disable Flyway (not recommended):

```yaml
spring:
  flyway:
    enabled: false
```

**Warning**: This will prevent migrations from running. Your database schema won't be managed automatically.

---

## Verification: How to Confirm Flyway Ran

### 1. Check Application Logs

Look for Flyway log messages:
```bash
docker-compose logs backend | grep -i flyway
```

### 2. Check Database

Query the Flyway history table:
```sql
SELECT version, description, installed_on, success 
FROM flyway_schema_history 
ORDER BY installed_rank;
```

### 3. Check Application Startup Time

If migrations run, startup takes slightly longer:
- First run: ~2-3 seconds (applies migrations)
- Subsequent runs: ~1-2 seconds (validates only)

### 4. Check Health Endpoint

After application starts:
```bash
curl http://localhost:8080/actuator/health
```

If Flyway failed, the application might not start, or health check might fail.

---

## Important Notes

### ⚠️ Blocking Behavior

**Flyway runs synchronously** - the application **waits** for migrations to complete before continuing startup.

**Implications**:
- If a migration takes 30 seconds, application startup takes 30+ seconds
- If a migration fails, **application startup fails**
- Application won't accept HTTP requests until migrations complete

### ⚠️ Transaction Safety

Each migration runs in a **transaction**:
- If migration succeeds: committed to database
- If migration fails: rolled back, application startup fails
- Database remains in consistent state

### ⚠️ Database Connection Required

Flyway **requires** a valid database connection:
- If database is down: Application startup fails
- If connection string is wrong: Application startup fails
- If credentials are wrong: Application startup fails

**This is why** Docker Compose waits for PostgreSQL health check before starting backend.

---

## Summary

| When | Does Flyway Run? |
|------|------------------|
| Application startup | ✅ **YES** - Automatically |
| Application restart | ✅ **YES** - Automatically |
| Hot reload (code changes) | ❌ **NO** - Only on full restart |
| HTTP request | ❌ **NO** - Only on startup |
| Bean creation | ❌ **NO** - Only on startup |
| Scheduled task | ❌ **NO** - Only on startup |

**Key Point**: Flyway runs **once per application startup**, very early in the Spring Boot lifecycle, **before** the application is ready to handle requests.

---

## Real-World Example

When you run `make local-up`:

```bash
$ make local-up
Starting local development environment...
Starting services...
Waiting for services to be healthy...

# Timeline:
# 0s:  PostgreSQL starts
# 5s:  PostgreSQL healthy ✓
# 10s: Backend container starts
# 11s: Spring Boot begins startup
# 12s: DataSource connects to PostgreSQL
# 13s: Flyway runs ⭐
#      - Creates flyway_schema_history table
#      - Applies V1__create_base_tables.sql
#      - Applies V2__seed_categories.sql
# 14s: Flyway completes ✓
# 15s: JPA/Hibernate validates schema ✓
# 16s: All beans created ✓
# 17s: HTTP server starts ✓
# 18s: Application ready ✓

✓ PostgreSQL: http://localhost:5432
✓ LocalStack: http://localhost:4566
✓ Backend API: http://localhost:8080  ← Ready to accept requests
✓ Frontend: http://localhost:5173
```

**At this point**, Flyway has already completed, and the application is ready to handle HTTP requests.

