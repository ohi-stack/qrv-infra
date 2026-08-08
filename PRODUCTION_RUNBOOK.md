# QR-V™ Production Runbook — Two-Node Architecture

## 1. Production topology

QR-V now deploys as two active nodes:

```text
qrv.network
  public platform
      ↓
api.qrv.network
  API + registry authority
      ↓
PostgreSQL / Google Cloud SQL
```

Legacy service repositories are retained as source archives until consolidation acceptance is complete. They are not separate production dependencies.

## 2. Release sequence

Deploy in this order:

1. `ohi-stack/qrv-api` → `api.qrv.network`.
2. Run the API migration.
3. Confirm API health and database readiness.
4. `ohi-stack/qrv-node` → `qrv.network`.
5. Confirm platform readiness through the API.
6. Execute issue → verify → revoke acceptance.
7. Route legacy subdomains to the platform node only if backward-compatible redirects are required.

## 3. API environment

```env
NODE_ENV=production
PORT=3000
APP_VERSION=2.0.0
QRV_PLATFORM_ORIGIN=https://qrv.network
DATABASE_URL=
QRV_PLATFORM_API_KEY=
CORS_ALLOWED_ORIGINS=https://qrv.network
PGSSLMODE=require
```

Only `api.qrv.network` receives `DATABASE_URL`.

## 4. Platform environment

```env
NODE_ENV=production
PORT=3000
APP_VERSION=1.0.0
QRV_PLATFORM_ORIGIN=https://qrv.network
QRV_API_BASE_URL=https://api.qrv.network/api/v1
QRV_PLATFORM_API_KEY=
SESSION_SECRET=
ISSUER_ACCESS_CODE=
```

`QRV_PLATFORM_API_KEY` must match on both nodes and remain server-side.

## 5. Database deployment

Before API cutover:

```bash
npm install
npm run check
npm run migrate
npm start
```

Confirm these tables exist:

```text
qr_objects
qr_certificates
qr_issuers
qr_hash_registry
qr_audit_log
```

Confirm the API database role uses TLS and least privilege. Remove broad production network ingress such as `0.0.0.0/0` when the hosting network path is known.

## 6. API health gate

Required:

```text
GET https://api.qrv.network/healthz
GET https://api.qrv.network/readyz
GET https://api.qrv.network/version
```

Expected:

- health returns 200 without depending on PostgreSQL;
- readiness returns 200 only when canonical tables can be queried;
- write routes fail closed if `QRV_PLATFORM_API_KEY` is absent.

## 7. Platform health gate

Required:

```text
GET https://qrv.network/healthz
GET https://qrv.network/readyz
GET https://qrv.network/version
GET https://qrv.network/verify
GET https://qrv.network/issuer
GET https://qrv.network/registry
GET https://qrv.network/docs
GET https://qrv.network/status
```

`qrv.network/readyz` must reflect API/database readiness rather than only confirming that the web process is alive.

## 8. Issuer lifecycle acceptance

Use a controlled pilot issuer:

1. Sign in at `https://qrv.network/issuer`.
2. Create a certificate or other record.
3. Confirm a unique QRVID is returned.
4. Confirm a SHA-256 registry hash is stored.
5. Confirm the platform generates an SVG verification QR.
6. Open `https://qrv.network/verify/{QRVID}`.
7. Confirm `VERIFIED`.
8. Revoke through `qrv.network/issuer`.
9. Re-open the same verification URL.
10. Confirm `REVOKED`.
11. Confirm CREATE, VERIFY, and REVOKE events in the audit table.

Cryptographic signing remains a separate QRVP-1 production-hardening gate until issuer Ed25519 keys are configured and signature validation returns a deterministic result. Do not display a successful signature assertion while that control is unconfigured.

## 9. Canonical QR URL

New QR codes use:

```text
https://qrv.network/verify/{QRVID}
```

For existing QR codes that contain `verify.qrv.network`, point that hostname to the same platform deployment so the host-based compatibility redirect preserves the record URL.

## 10. Legacy aliases

```text
verify.qrv.network      → qrv.network/verify
issuer.qrv.network      → qrv.network/issuer
registry.qrv.network    → qrv.network/registry
explorer.qrv.network    → qrv.network/explorer
docs.qrv.network        → qrv.network/docs
developers.qrv.network  → qrv.network/developers
status.qrv.network      → qrv.network/status
store.qrv.network       → qrv.network/store
```

Do not delete legacy repositories until all required content, tests, and operational behavior have been migrated.

## 11. Rollback

If release acceptance fails:

1. stop further cutover;
2. record commit SHAs, timestamps, and errors;
3. restore the previous application release;
4. do not reverse database migrations until data impact is understood;
5. prefer a forward-compatible corrective migration;
6. rerun health, readiness, and lifecycle acceptance.

## 12. Completion rule

The consolidated platform is production-complete only when this sequence is repeatable:

```text
ISSUER LOGIN
→ CREATE RECORD
→ HASH + STORE
→ GENERATE QR
→ VERIFY
→ REVOKE
→ REVERIFY
→ AUDIT
```

QRVP-1 Ed25519 signing is an additional required security gate before claiming full cryptographic verification compliance.
