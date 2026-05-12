# Production Monitoring, Rate Limiting, and Scaling

This doc covers: **detecting high throughput**, **what to monitor**, **rate limiting (DDoS)**, and **how robust the current architecture is** for scale.

---

## 1. Detecting high throughput

**Throughput** = requests per second (RPS) or per minute that your API handles.

### What you already have

- **Spring Boot Actuator** with `metrics` and **Prometheus** export is enabled (`application.yml`).
- Prometheus scrapes Micrometer metrics: HTTP request count, latency, JVM, etc.

### Key metrics to watch (high throughput signals)

| Metric | What it tells you | Where to see it |
|--------|-------------------|------------------|
| **`http_server_requests_seconds_count`** (by URI, method) | Request rate per endpoint | Prometheus / Grafana |
| **`http_server_requests_seconds_sum` / `_count`** | Latency (avg = sum/count) | Prometheus |
| **`jvm_memory_used_bytes`** | Memory pressure | Actuator `/actuator/metrics/jvm.memory.used` or Prometheus |
| **`hikaricp_connections_active`** | DB connection pool usage | Prometheus (if HikariCP metrics enabled) |
| **`system_cpu_usage`** | CPU load | Actuator / Prometheus |

### Enabling more metrics (recommended for production)

In `application.yml` (or `application-prod.yml`):

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  endpoint:
    health:
      show-details: when-authorized
  metrics:
    export:
      prometheus:
        enabled: true
  # Enable HikariCP and HTTP request metrics in Prometheus
  enable:
    all: false
  tags:
    application: eventpro-api
```

Ensure **Micrometer** registers HTTP and HikariCP. With `spring-boot-starter-actuator` and `prometheus` enabled, `http_server_requests_*` and (if on classpath) `hikaricp_*` are usually auto-exposed.

### Defining “high throughput” for your app

- **Baseline:** Measure normal traffic (e.g. 10–50 RPS per endpoint).
- **Thresholds:** Alert when:
  - RPS for a critical path (e.g. `/api/v1/payments/guest-reserve`, `/api/v1/events`) exceeds **2–3× baseline** for 5+ minutes, or
  - **p99 latency** exceeds a target (e.g. 2s for checkout, 500ms for listing events), or
  - **Error rate** (5xx or 4xx) spikes above a few percent.

Use **Prometheus + Alertmanager** (or your cloud’s alerting) to fire when these thresholds are breached.

---

## 2. What to monitor in production

### Must-have

| Area | What to monitor | Why |
|------|-----------------|-----|
| **Availability** | `/actuator/health` (HTTP 200) | Uptime checks, load balancer health |
| **Latency** | p50, p95, p99 per endpoint (from `http_server_requests_*`) | User experience, SLA |
| **Errors** | 4xx/5xx rate, logs (e.g. ELK, CloudWatch) | Incidents, bugs |
| **Throughput** | RPS per endpoint / total | Capacity planning, “high throughput” detection |
| **Database** | Connection pool usage, slow queries, lock wait | DB is usually the bottleneck |
| **Queues (SQS)** | Message age, depth, DLQ | Order/payment/notification flow |

### Nice-to-have

- **Distributed tracing** (e.g. Sleuth/Zipkin, OpenTelemetry) for request flow across API → DB → SQS.
- **Log aggregation** (structured JSON logs + ELK/Datadog/CloudWatch) with correlation IDs.
- **Business metrics:** orders/min, payments confirmed/min, reservation release rate.

### New Relic deployment variables

The ECS API uses the New Relic Java agent bundled in the service image. Set `NEW_RELIC_LICENSE_KEY` in the deploy environment to enable APM for the API service.

The Java Lambda processors use New Relic's Lambda layer and handler wrapper. Set both values before deploying Lambda stacks:

```bash
export NEW_RELIC_LICENSE_KEY="..."
export NEW_RELIC_ACCOUNT_ID="..."
```

`NEW_RELIC_ACCOUNT_ID` is passed to the Lambda extension as the trusted account key for distributed tracing. In GitHub Actions, configure `NEW_RELIC_LICENSE_KEY` and `NEW_RELIC_ACCOUNT_ID` as repository secrets.

Lambda telemetry is emitted only when the function is invoked. After deploying a new Lambda image and Terraform config, run an order/payment/notification flow or publish a test SQS message, then check the Lambda CloudWatch log stream for New Relic extension lines and New Relic serverless entities. The Java Lambda entity name is driven by Lambda function metadata; `NEW_RELIC_APP_NAME` is retained for agent config but is not the primary UI name for Lambda entities.

### Health endpoint security

- Keep `/actuator/health` **public** for load balancers.
- Restrict **`/actuator/prometheus`** and **`/actuator/metrics`** in production (e.g. IP allowlist, VPN, or auth) so they are not exposed to the internet.

---

## 3. Rate limiting (DDoS and abuse)

**Yes, you should add rate limiting** for production to:

- Reduce impact of **DDoS** and abuse (e.g. brute force on login, spam on signup/guest-reserve).
- Keep the API fair under load and avoid one client exhausting DB/CPU.

### Options

| Approach | Pros | Cons |
|----------|------|------|
| **In-memory rate limit (per instance)** | Simple, no extra infra; good for single instance or first line of defence | Per-instance only; limits don’t aggregate across instances |
| **Redis-backed rate limit** | Shared across instances; accurate under multiple pods/nodes | Requires Redis; add when you scale horizontally |
| **API Gateway / load balancer** | Offloads rate limiting at the edge (e.g. AWS WAF, Cloudflare, nginx) | Depends on your hosting; may cost extra |

**Recommendation:**  
- **Now:** Add **in-memory rate limiting** on sensitive/public endpoints (login, signup, guest-reserve, create-intent).  
- **When you run 2+ instances:** Move to **Redis-backed** (e.g. Bucket4j with Redis) so limits are global.

### What to limit

- **Public/auth endpoints:** e.g. 30–60 req/min per IP for `/api/v1/auth/login`, `/api/v1/auth/signup`, `/api/v1/payments/guest-reserve`, `/api/v1/payments/create-intent`.
- **Strictest on:** login (brute force) and payment intent creation (abuse/card testing).

**Implemented:** A **per-IP, in-memory rate limit** is applied to POST `/api/v1/auth/login`, `/api/v1/auth/signup`, `/api/v1/auth/send-reset-email`, `/api/v1/payments/guest-reserve`, and `/api/v1/payments/create-intent`. Configure via `eventpro.rate-limit.*` (see `application.yml`). Disable for local with `EVENTPRO_RATE_LIMIT_ENABLED=false` if needed.

---

## 4. Is the current architecture robust enough to scale?

### What’s already solid

- **Stateless API:** No server-side session; JWT in header. You can run **multiple instances** behind a load balancer.
- **DB + Flyway:** Single source of truth; migrations are versioned.
- **Async processing:** Order/payment/notifications via **SQS + Lambdas** so the API doesn’t block on email or heavy work.
- **Reservation expiry:** DB + scheduler (or later Redis) is a scalable pattern for ticket locks.

### What to add or tune as you grow

| Concern | Now | When scaling |
|---------|-----|--------------|
| **Rate limiting** | Add in-memory per IP on public endpoints | Move to Redis when multi-instance |
| **DB connections** | Default HikariCP pool | Tune pool size (e.g. `maxPoolSize`) and monitor `hikaricp_connections_active` |
| **Caching** | None | Cache read-heavy, rarely changing data (e.g. event list, categories) if DB becomes hot |
| **Reservation state** | DB + scheduler | Redis for reservation TTL when you have many instances or very high reservation churn |
| **Secrets** | Env / Secrets Manager | Keep using Secrets Manager (or equivalent) in prod |
| **Horizontal scaling** | One instance | Add more API instances behind a load balancer; ensure health checks and metrics are in place |

### Scaling checklist

- [ ] **Monitoring:** Prometheus (or equivalent) scraping `/actuator/prometheus`; dashboards for RPS, latency, errors, DB pool.
- [ ] **Alerting:** Alerts on high error rate, high latency, health down, and (optional) high throughput.
- [ ] **Rate limiting:** In-memory (or Redis) on auth and payment-related public endpoints.
- [ ] **Health:** Load balancer health check → `/actuator/health`.
- [ ] **Restrict actuator:** Do not expose `/actuator/prometheus` and `/actuator/metrics` publicly without auth or allowlist.
- [ ] **DB:** Connection pool tuned; consider read replicas if read traffic grows.
- [ ] **Multi-instance:** When you run 2+ API instances, plan Redis for rate limiting and (if needed) reservation state.

**Summary:** The architecture is **robust enough to scale** for typical event ticketing (hundreds to low thousands of RPS) if you add **monitoring, alerting, and rate limiting**. Add Redis and caching when you need shared state and higher throughput.
