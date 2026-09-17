# QR-V™ Frontend Convergence Status

**Status date:** September 17, 2026  
**State:** CONVERGED AND MERGED; LIVE DEPLOYMENT ACCEPTANCE REMAINS

QR-V Production Architecture v1.0 remains a strict two-node deployment:

```text
qrv.network               → ohi-stack/qrv-node
api.qrv.network           → ohi-stack/qrv-api
```

The public QR-V customer frontend is converged into `ohi-stack/qrv-node`. The canonical platform runtime now serves the compiled React/Vite Sites frontend while preserving the existing Express trust boundary.

Canonical runtime-convergence merge:

```text
eaac061efd4c03d8d90714409414832682e3fec0
```

The exact merge candidate passed both QR-V Platform Production CI and Production Readiness before merge.

## Current runtime model

```text
qrv.network
  compiled React/Vite customer frontend
  + Express production boundary
        │
        ▼
api.qrv.network/api/v1
  trusted API / data / registry authority
```

## SPA / Express boundary

Ordinary customer-facing HTML routes may use the compiled SPA. These operational route families remain Express-owned and are explicitly excluded from SPA fallback:

```text
/verify/*
/issuer/*
/registry/*
/api/*
/healthz
/health
/readyz
/version
/metrics
/qr/*
/explorer/*
/status
/robots.txt
/sitemap.xml
/site.webmanifest
```

Direct `/{QRVID}` compatibility URLs also bypass SPA fallback and keep their canonical 308 verification redirect.

Legacy branded hostnames redirect before static/SPA handling so they cannot become competing runtime origins.

## qrv-node authority

`qrv-node` is authoritative for:

- React/Vite customer-facing presentation;
- compiled frontend assets;
- Express production server boundary;
- server-side sessions and issuer authentication;
- public verification routing and fail-closed behavior;
- server-to-server API communication;
- QR generation;
- health/readiness/version endpoints;
- legacy-host redirects;
- security middleware and rate limiting;
- production acceptance.

In production, `qrv-node` fails startup if the compiled frontend is missing. The required deployment contract is build first, then start.

## qrv-api authority

`qrv-api` remains authoritative for:

- canonical registry persistence;
- verification truth;
- issuer authorization;
- issuance/revocation mutations;
- cryptographic signing/validation;
- audit persistence;
- privileged API credentials;
- database and signing secrets.

## qrv-marketing-site role

`qrv-marketing-site` is source/history/reference only. It must not be deployed as a competing `qrv.network` production origin.

## Remaining live-production acceptance

Frontend runtime convergence is merged. Production acceptance still requires:

```text
[ ] Hostinger maps qrv.network to ohi-stack/qrv-node/main at or after eaac061
[ ] public homepage serves the compiled frontend
[ ] /healthz /readyz /version behave correctly live
[ ] verification resolves through api.qrv.network
[ ] issuer login works live
[ ] issue record
[ ] generate QRVID / QR
[ ] VERIFIED
[ ] revoke
[ ] REVOKED
[ ] final visual/mobile/SEO parity review
```

Frontend convergence does not alter QRVP-1/QVS-1.0 verification semantics and does not introduce a second writable/data authority.
