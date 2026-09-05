# QR-V™ Infrastructure

The QR-V™ Global Verification Network uses a **strict two-node production topology**.

> `qrv.network` = public platform / application layer  
> `api.qrv.network` = trusted backend / API / canonical data boundary

No other QR-V hostname should run an independent production application unless a future architecture revision explicitly changes this contract.

## Canonical production topology

| Node | Repository | Role |
|---|---|---|
| `qrv.network` | `ohi-stack/qrv-node` | All human-facing application routes and issuer workflows |
| `api.qrv.network` | `ohi-stack/qrv-api` | Canonical API, registry persistence, verification logic, lifecycle mutation, audit, cryptographic operations, and privileged backend integrations |

```text
Browser / QR scan / issuer user
              ↓
        https://qrv.network
              ↓ authenticated server-to-server calls
https://api.qrv.network/api/v1
              ↓
     Canonical QR-V registry
```

## Platform routes

```text
qrv.network/
qrv.network/verify
qrv.network/verify/{qrvid}
qrv.network/issuer
qrv.network/issuer/dashboard
qrv.network/issuer/records
qrv.network/registry
qrv.network/explorer
qrv.network/docs
qrv.network/developers
qrv.network/api-reference
qrv.network/protocol
qrv.network/standards
qrv.network/security
qrv.network/use-cases
qrv.network/pricing
qrv.network/store
qrv.network/billing
qrv.network/wallet
qrv.network/admin
qrv.network/status
qrv.network/about
```

New QR-V codes must encode:

```text
https://qrv.network/verify/{QRVID}
```

## API routes

Canonical API base:

```text
https://api.qrv.network/api/v1
```

Current core routes:

```text
GET  /healthz
GET  /readyz
GET  /version
GET  /api/v1/verify/{qrvid}
GET  /api/v1/records/{qrvid}
GET  /api/v1/records
POST /api/v1/records
POST /api/v1/records/{qrvid}/revoke
GET  /api/v1/audit/{qrvid}
```

## Environment boundary

### `qrv.network`

Expected server configuration:

```env
NODE_ENV=production
PORT=3000
APP_VERSION=1.0.0
QRV_PLATFORM_ORIGIN=https://qrv.network
QRV_API_BASE_URL=https://api.qrv.network/api/v1
QRV_PLATFORM_API_KEY=
SESSION_SECRET=
ISSUER_ACCESS_CODE=
SESSION_TTL_MS=43200000
```

The platform node must **not** receive:

```text
DATABASE_URL
SUPABASE_SECRET_KEY
QRV_SIGNING_PRIVATE_KEY
QRV_WEBHOOK_SECRET
database-admin credentials
payment-provider secrets
```

`QRV_PLATFORM_API_KEY` is server-to-server only and must never be exposed to browser JavaScript.

### `api.qrv.network`

Expected server configuration:

```env
NODE_ENV=production
PORT=3000
APP_VERSION=2.0.0
QRV_PLATFORM_ORIGIN=https://qrv.network
DATABASE_URL=
DATABASE_POOL_MAX=20
PG_CONNECTION_TIMEOUT_MS=5000
PG_IDLE_TIMEOUT_MS=10000
PGSSLMODE=require
QRV_PLATFORM_API_KEY=
CORS_ALLOWED_ORIGINS=https://qrv.network
PUBLIC_RATE_WINDOW_MS=60000
PUBLIC_RATE_LIMIT=240
```

Backend-only secrets such as webhook credentials, JWT signing secrets, and Ed25519 private keys belong on the API node when those capabilities are implemented.

## Canonical datastore rule

QR-V must have exactly **one writable canonical registry authority**.

The current production contract is PostgreSQL / managed PostgreSQL through `DATABASE_URL` on `api.qrv.network`.

Supabase may replace the persistence adapter later, but it must be an intentional migration, not an additional writable authority. If Supabase becomes canonical, only `api.qrv.network` may receive `SUPABASE_URL` and `SUPABASE_SECRET_KEY`.

Do not operate Cloud SQL/PostgreSQL and Supabase as competing sources of truth.

## Legacy subdomain migration

The following names are compatibility aliases only:

```text
verify.qrv.network      → qrv.network/verify
issuer.qrv.network      → qrv.network/issuer
registry.qrv.network    → qrv.network/registry
explorer.qrv.network    → qrv.network/explorer
docs.qrv.network        → qrv.network/docs
developers.qrv.network  → qrv.network/developers
status.qrv.network      → qrv.network/status
store.qrv.network       → qrv.network/store
wallet.qrv.network      → qrv.network/wallet
admin.qrv.network       → qrv.network/admin
```

Where backward compatibility is required, point the hostname to the same `qrv-node` deployment and return HTTP **308** to the canonical path. Do not keep duplicate applications alive merely to preserve the hostname.

## Active repository responsibilities

### `qrv-node`

- public website;
- verification UI;
- registry/explorer UI;
- issuer portal;
- docs/developer pages;
- pricing/store/billing UI;
- public status;
- QR generation;
- authenticated platform sessions;
- legacy-host compatibility redirects.

### `qrv-api`

- canonical database connection;
- registry migrations;
- record issuance;
- record lookup;
- deterministic verification state;
- issuer authorization;
- revocation/expiration lifecycle;
- SHA-256 hashing;
- Ed25519 signing/verification when enabled;
- audit access;
- server-side authorization;
- health/readiness;
- rate limiting;
- backend-only integrations and secrets.

## Source/archive repositories

These repositories remain implementation history, source modules, or migration inputs. They are **not independent production origins** under Architecture v1.0:

- `qrv-verify`
- `qrv-registry`
- `issuer-qrv`
- `qrv-docs`
- `qrv-developer-portal`
- `qrv-explorer`
- `qrv-status`
- `qrv-marketing-site`
- `qrv-billing`
- `qrv-admin`
- `qrv-wallet`

Do not delete source repositories until consolidated production acceptance passes and required content has been migrated.

### Source-runtime protection

Source repositories must not be capable of silently becoming competing production origins. `qrv-marketing-site` now blocks `npm start` unless `QRV_ALLOW_SOURCE_PREVIEW=1` is explicitly set for a non-production preview. The production `qrv.network` Hostinger application must never set that variable.

This control exists to prevent split-origin behavior such as desktop and mobile clients receiving different QR-V builds from different deployments.

## Cryptographic status

SHA-256 integrity support is active in the current implementation. Ed25519 issuer signing remains a required production gate.

Do not claim full issuer-signed QRVP-1 cryptographic compliance until key management, signing, signature persistence, public-key verification, rotation, and invalid-signature fail-closed behavior are working end-to-end.

## Deployment order

1. Back up the canonical registry.
2. Map `api.qrv.network` to `ohi-stack/qrv-api`.
3. Configure the API environment and database access.
4. Run `npm run migrate` in `qrv-api`.
5. Confirm API `/healthz` and `/readyz`.
6. Validate create → verify → revoke → verify against the API.
7. Deploy `ohi-stack/qrv-node` to `qrv.network`.
8. Configure the platform server environment.
9. Confirm platform `/healthz`, `/readyz`, `/version`, and canonical routes.
10. Run the full issuer lifecycle through `qrv.network`.
11. Enable legacy-host 308 redirects only after canonical routes are healthy.

## Mandatory production gate

```text
ISSUER LOGIN
→ CREATE RECORD
→ GENERATE QRVID
→ GENERATE QR
→ VERIFIED
→ REVOKE / EXPIRE
→ REVOKED / EXPIRED
→ AUDIT EVENTS PRESENT
```

Overall network status must not be presented as fully operational while the API node is misrouted, unavailable, or failing acceptance.
