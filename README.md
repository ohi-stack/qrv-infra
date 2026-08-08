# QR-V™ Infrastructure

The QR-V™ Global Verification Network now targets a **two-node production topology**.

## Canonical production topology

| Node | Repository | Role |
|---|---|---|
| `qrv.network` | `ohi-stack/qrv-node` | All human-facing application routes |
| `api.qrv.network` | `ohi-stack/qrv-api` | Canonical API, registry persistence, lifecycle mutation, and audit access |

### Platform routes

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
qrv.network/pricing
qrv.network/store
qrv.network/status
```

### API routes

```text
api.qrv.network/healthz
api.qrv.network/readyz
api.qrv.network/version
api.qrv.network/api/v1/verify/{qrvid}
api.qrv.network/api/v1/records/{qrvid}
api.qrv.network/api/v1/records
api.qrv.network/api/v1/records/{qrvid}/revoke
api.qrv.network/api/v1/audit/{qrvid}
```

## Database boundary

PostgreSQL / Google Cloud SQL is private infrastructure behind `api.qrv.network`.

`qrv.network` must not receive database credentials. It calls the API server-to-server for issuance, lookup, verification, revocation, and authorized record listing.

## Legacy subdomain migration

The following names are compatibility aliases only and should no longer require separate applications:

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

Point any legacy hostnames that must remain reachable to the same `qrv-node` deployment. The platform code issues HTTP 308 redirects to the canonical `qrv.network` path. This preserves old bookmarks and previously encoded verification URLs while eliminating separate runtime nodes.

## Canonical QR payload

New QR-V records should use:

```text
https://qrv.network/verify/{QRVID}
```

## Active repository responsibilities

### `qrv-node`

- public website;
- verification UI;
- registry/explorer UI;
- issuer portal;
- docs and developer pages;
- pricing and store pages;
- public status;
- QR generation;
- compatibility redirects.

### `qrv-api`

- PostgreSQL connection;
- registry migrations;
- record issuance;
- record lookup;
- deterministic verification state;
- revocation;
- audit access;
- server-side authorization;
- health/readiness.

## Source/archive repositories

The following repositories remain useful as implementation history or migration sources but are no longer required as separate production nodes:

- `qrv-verify`
- `qrv-registry`
- `issuer-qrv`
- `qrv-docs`
- `qrv-developer-portal`
- `qrv-explorer`
- `qrv-status`
- `qrv-marketing-site`

Do not delete them until the consolidated production acceptance test passes and all required content has been migrated.

## Deployment order

1. Deploy `qrv-api` with `DATABASE_URL` and `QRV_PLATFORM_API_KEY`.
2. Run `npm run migrate` in `qrv-api`.
3. Confirm `api.qrv.network/healthz` and `/readyz`.
4. Deploy `qrv-node` to `qrv.network`.
5. Configure the same `QRV_PLATFORM_API_KEY` on `qrv-node`.
6. Configure `SESSION_SECRET` and `ISSUER_ACCESS_CODE` on `qrv-node`.
7. Confirm `qrv.network/readyz`.
8. Issue a certificate from `qrv.network/issuer`.
9. Confirm `qrv.network/verify/{QRVID}` returns `VERIFIED`.
10. Revoke the record and confirm the same URL returns `REVOKED`.
11. Point legacy subdomains to the platform app if backward-compatible redirects are required.

## Mandatory production gate

```text
ISSUER LOGIN
→ CREATE RECORD
→ GENERATE QRVID
→ GENERATE QR
→ VERIFIED
→ REVOKE
→ REVOKED
→ AUDIT EVENTS PRESENT
```

No additional public node is required for this lifecycle.
