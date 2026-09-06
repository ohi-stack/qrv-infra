# QR-V™ Frontend Convergence Status

**Status date:** September 6, 2026

QR-V Production Architecture v1.0 remains a strict two-node deployment:

```text
qrv.network               → ohi-stack/qrv-node
api.qrv.network            → ohi-stack/qrv-api
```

The public Sites/marketing frontend is currently being migrated from `ohi-stack/qrv-marketing-site` into `ohi-stack/qrv-node` under PR #17 (`feat/sites-frontend-convergence`).

## Convergence rule

`qrv-node` remains authoritative for:

- Express production runtime;
- server-side sessions and issuer authentication;
- public verification logic and fail-closed behavior;
- server-to-server API communication;
- health/readiness/version endpoints;
- legacy-host redirects;
- security middleware and rate limiting;
- production acceptance.

`qrv-marketing-site` remains migration source for:

- Sites visual system;
- public/customer-facing React composition;
- responsive styling;
- SEO/public assets;
- commercialization and content strategy;
- Sites provenance/manifests.

The imported React/Vite source in `qrv-node` must never receive backend-only secrets. Its canonical API target is `https://api.qrv.network/api/v1`.

## Production activation order

1. Compile and validate the imported frontend in `qrv-node`.
2. Preserve dynamic server ownership of `/verify/*`, `/issuer/*`, `/registry/*`, `/healthz`, `/readyz`, `/version`, compatibility API routes, and protected workflows.
3. Serve compiled static assets only from the platform runtime.
4. Validate SEO assets and canonical links.
5. Run local/CI production validation.
6. Run live acceptance against `qrv.network` and `api.qrv.network`.
7. Only then mark `qrv-marketing-site` archive/source-history.

## Required acceptance

```text
PUBLIC HOMEPAGE LOADS
→ VERIFY ROUTE STILL USES AUTHORITATIVE API
→ ISSUER LOGIN WORKS
→ ISSUE RECORD
→ GENERATE QRVID / QR
→ VERIFIED
→ REVOKE
→ REVOKED
→ HEALTH / READINESS REMAIN GREEN
```

Frontend convergence must not alter QRVP-1/QVS-1.0 verification semantics or introduce a second writable/data authority.
