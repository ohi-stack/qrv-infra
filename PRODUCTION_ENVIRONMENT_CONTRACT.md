# QR-V™ Production Environment Contract

**Status:** Authoritative deployment contract  
**Architecture:** Two-node production topology  
**Public platform:** `https://qrv.network`  
**Trusted API/data boundary:** `https://api.qrv.network`

## 1. Non-negotiable runtime boundary

Every production QR-V capability belongs to exactly one of two runtime nodes:

- `qrv.network` — human-facing platform, verification UI, issuer UI, registry/explorer UI, docs, developer resources, pricing, status, and public workflows.
- `api.qrv.network` — authentication/authorization, registry persistence, verification resolution, issuance, revocation, audit logging, cryptographic operations, rate limiting, webhooks, and privileged secrets.

Legacy service hostnames such as `verify.qrv.network`, `issuer.qrv.network`, `registry.qrv.network`, `docs.qrv.network`, and `developers.qrv.network` are compatibility aliases only. They must redirect to the canonical `qrv.network` route and must not become independent writable authorities.

## 2. Canonical public URLs

```text
https://qrv.network/
https://qrv.network/verify/{QRVID}
https://qrv.network/issuer
https://qrv.network/registry
https://qrv.network/explorer
https://qrv.network/docs
https://qrv.network/developers
https://qrv.network/status
https://qrv.network/pricing
```

New QR-V codes MUST encode:

```text
https://qrv.network/verify/{QRVID}
```

## 3. Canonical API

```text
https://api.qrv.network/api/v1
```

`qrv.network/api/v1/*` may remain as a compatibility proxy, but `api.qrv.network` is the execution authority.

Required operational endpoints:

```text
GET /healthz
GET /readyz
GET /version
GET /api/v1/status
GET /api/v1/verify/:qrvid
GET /api/v1/records
GET /api/v1/records/:qrvid
POST /api/v1/records
POST /api/v1/records/:qrvid/revoke
GET /api/v1/audit/:qrvid
```

## 4. qrv.network environment

The public platform MAY contain route configuration, session configuration, and a server-to-server API credential when required by protected platform actions.

It MUST NOT contain database credentials, Supabase secret keys, signing private keys, webhook secrets, or database-administrator credentials.

```env
NODE_ENV=production
PORT=3000
APP_VERSION=1.0.0

QRV_PLATFORM_ORIGIN=https://qrv.network
APP_BASE_URL=https://qrv.network
QRV_API_BASE_URL=https://api.qrv.network/api/v1
API_BASE_URL=https://api.qrv.network/api/v1

VERIFY_BASE_URL=https://qrv.network/verify
REGISTRY_BASE_URL=https://qrv.network/registry
ISSUER_BASE_URL=https://qrv.network/issuer
DOCS_BASE_URL=https://qrv.network/docs
DEVELOPERS_BASE_URL=https://qrv.network/developers
STATUS_BASE_URL=https://qrv.network/status

QRV_PLATFORM_API_KEY=
SESSION_SECRET=
ISSUER_ACCESS_CODE=
SESSION_TTL_MS=43200000
```

## 5. api.qrv.network environment

The API node owns all privileged configuration and the canonical persistence connection.

```env
NODE_ENV=production
PORT=3000
APP_VERSION=2.0.0

QRV_API_BASE_URL=https://api.qrv.network
QRV_PUBLIC_BASE_URL=https://qrv.network
QRV_PLATFORM_ORIGIN=https://qrv.network
QRV_VERIFY_BASE_URL=https://qrv.network/verify
QRV_REGISTRY_BASE_URL=https://qrv.network/registry
QRV_ISSUER_BASE_URL=https://qrv.network/issuer

DATABASE_URL=
DATABASE_POOL_MAX=20
PG_CONNECTION_TIMEOUT_MS=5000
PG_IDLE_TIMEOUT_MS=10000
PGSSLMODE=require

QRV_PLATFORM_API_KEY=
QRV_API_KEY=
QRV_WEBHOOK_SECRET=

CORS_ALLOWED_ORIGINS=https://qrv.network
CORS_ORIGINS=https://qrv.network
LOG_LEVEL=info
PUBLIC_RATE_WINDOW_MS=60000
PUBLIC_RATE_LIMIT=240
```

## 6. Supabase migration rule

The current `qrv-api` implementation uses direct PostgreSQL through `DATABASE_URL`.

If Supabase becomes the canonical production registry, migrate `qrv-api` deliberately to a Supabase persistence adapter first. The preferred future server-side names are:

```env
SUPABASE_URL=
SUPABASE_SECRET_KEY=sb_secret_...
```

Do not operate Supabase and Cloud SQL/PostgreSQL as two independent writable canonical registries without an explicit replication/conflict-resolution design.

`SUPABASE_SECRET_KEY` is server-only. A legacy `SUPABASE_KEY` may be accepted temporarily only during a controlled migration and must not be exposed to browser code.

## 7. Trust flow

```text
Browser / QR scan
      ↓
qrv.network
      ↓ HTTPS
api.qrv.network
      ↓
authn / authz / validation / hashing / lifecycle checks
      ↓
canonical QR-V registry
      ↓
audit event
      ↓
deterministic response
```

## 8. Production acceptance

Production is accepted only when all of the following pass against the deployed topology:

1. `qrv.network` returns the public application.
2. `api.qrv.network/healthz` returns JSON and does not redirect to a UI/login page.
3. `api.qrv.network/readyz` confirms the canonical datastore is reachable.
4. A known QRVID returns `VERIFIED` through the API and `qrv.network/verify/{QRVID}`.
5. Revoking that record returns `REVOKED` through the same public verification URL.
6. Audit events exist for issuance, verification, and revocation.
7. No browser bundle or public environment contains server secrets.
8. Legacy QR-V hostnames either resolve to 308 redirects or are intentionally retired after compatibility review.

## 9. Architectural rule

**Everything user-facing goes to `qrv.network`. Everything privileged, persistent, cryptographic, or machine-facing goes to `api.qrv.network`.**
