# QR-V™ Production Runbook

## 1. Purpose

This runbook governs deployment, validation, rollback, and incident response for the QR-V™ Global Verification Network.

## 2. Release Sequence

Deploy in this order:

1. `qrv-registry`
2. `qrv-api`
3. `qrv-verify`
4. `issuer-qrv`
5. `qrv-node`
6. `qrv-docs`, `qrv-explorer`, and `qrv-developer-portal`
7. `qrv-billing`, `qrv-admin`, and optional services

Do not deploy a dependent service before its required upstream health and readiness checks pass.

## 3. Required Environment Variables

Every service must define:

```env
NODE_ENV=production
PORT=3000
APP_VERSION=
QRV_PROTOCOL_VERSION=QRVP-1
QVS_VERSION=QVS-1.0
```

Shared service URLs:

```env
QRV_ROOT_URL=https://qrv.network
QRV_API_BASE_URL=https://api.qrv.network
QRV_VERIFY_URL=https://verify.qrv.network
QRV_REGISTRY_URL=https://registry.qrv.network
QRV_ISSUER_URL=https://issuer.qrv.network
QRV_DOCS_URL=https://docs.qrv.network
QRV_DEVELOPERS_URL=https://developers.qrv.network
QRV_STATUS_URL=https://qrv.network/status
QRV_DEMO_QRVID=QRV-PROD-CERT-000001
```

Never commit credentials, database passwords, JWT secrets, API keys, Stripe secrets, or signing private keys.

## 4. Pre-Deployment Gate

Run the following in every changed repository where supported:

```bash
npm ci
npm run check
npm test
npm run build
```

Confirm:

- no high or critical dependency vulnerabilities;
- required migrations are versioned;
- environment templates are current;
- the service binds to `0.0.0.0` and `process.env.PORT`;
- `/healthz`, `/readyz`, and `/version` exist;
- production URLs are environment-driven;
- no demo fallback can be mistaken for a live verified record.

## 5. Database Deployment

Before application deployment:

1. Confirm a current database backup.
2. Apply migrations from a controlled account.
3. Verify the canonical tables exist:
   - `qr_issuers`
   - `qr_objects`
   - `qr_certificates`
   - `qr_hash_registry`
   - `qr_audit_log`
4. Confirm QRVID uniqueness constraints and indexes.
5. Confirm application credentials cannot perform unrestricted administrative operations.
6. Confirm network access is restricted to approved infrastructure addresses. Do not retain `0.0.0.0/0` in production.

## 6. Live Acceptance

Root node:

```bash
QRV_NODE_URL=https://qrv.network \
QRV_VERIFY_URL=https://verify.qrv.network \
QRV_DEMO_QRVID=QRV-PROD-CERT-000001 \
npm run acceptance:live
```

Verification service must pass:

```text
GET /
GET /healthz
GET /readyz
GET /version
GET /QRV-PROD-CERT-000001
GET /api/v1/verify/QRV-PROD-CERT-000001
```

Acceptance conditions:

- no 500 or 503 responses;
- no raw framework error page;
- readiness confirms required dependencies;
- the JSON and HTML results agree;
- the issuer and record status are deterministic;
- private or restricted fields are not leaked.

## 7. Issuer Lifecycle Acceptance

Run the complete lifecycle using a controlled production pilot issuer:

1. Authenticate.
2. Create a certificate.
3. Confirm the API returns a unique QRVID.
4. Confirm SHA-256 hash and Ed25519 signature metadata are stored.
5. Generate PNG and SVG QR assets.
6. Open the public verification URL.
7. Confirm `VERIFIED`.
8. Revoke the record through the issuer portal.
9. Re-open the public verification URL.
10. Confirm `REVOKED`.
11. Confirm create, verify, and revoke audit entries.

## 8. Rollback

If a release fails:

1. Stop further deployments.
2. Capture the failed version, commit SHA, timestamps, and logs.
3. Revert to the last known-good application release.
4. Do not reverse a database migration until data impact is understood.
5. If required, deploy a forward-compatible corrective migration.
6. Re-run health, readiness, and live acceptance.
7. Record the incident and corrective action.

## 9. Incident Classification

- **SEV-1:** incorrect verification result, unauthorized issuance/revocation, key compromise, or registry corruption.
- **SEV-2:** verification or issuance unavailable for a material portion of users.
- **SEV-3:** degraded analytics, documentation, explorer, or non-critical public content.
- **SEV-4:** cosmetic or low-impact defect.

For SEV-1, disable affected mutation paths, preserve logs, rotate exposed credentials, and issue a public incident notice after facts are confirmed.

## 10. Production Completion Rule

QR-V is not fully operational merely because the sites load. Production completion requires a repeatable and audited:

```text
ISSUE → HASH/SIGN → STORE → GENERATE QR → VERIFY → REVOKE → REVERIFY
```
