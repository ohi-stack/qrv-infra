# QR-V™ Frontend Convergence Status

**Status date:** September 6, 2026  
**State:** CONVERGED AND RUNTIME-ACTIVATED

QR-V Production Architecture v1.0 remains a strict two-node deployment:

```text
qrv.network               → ohi-stack/qrv-node
api.qrv.network           → ohi-stack/qrv-api
```

The public QR-V customer frontend has now been converged from `ohi-stack/qrv-marketing-site` into `ohi-stack/qrv-node` and activated from the canonical production runtime.

Canonical activation commit:

```text
ed8831a4a45c061a69400fe5aad75557b9cb9e4b
```

The exact runtime-activation branch passed both QR-V Platform Production CI and Production Readiness before merge.

## Current runtime model

```text
qrv.network
  React/Vite customer frontend
  + Express production boundary
        │
        ▼
api.qrv.network/api/v1
  trusted API / data / registry authority
```

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

`qrv-marketing-site` is now source/history/reference only. It retains:

- original Sites visual system;
- source React/Vite composition;
- public content and commercialization strategy;
- SEO source assets;
- Sites provenance/manifests.

It must not be deployed as a competing `qrv.network` production origin.

## Remaining production acceptance

Frontend convergence is complete. Production acceptance still requires:

```text
[ ] Hostinger maps qrv.network to ohi-stack/qrv-node/main
[ ] public homepage serves the compiled frontend
[ ] /healthz /readyz /version are green live
[ ] verification route still resolves through api.qrv.network
[ ] issuer login works live
[ ] issue record
[ ] generate QRVID / QR
[ ] VERIFIED
[ ] revoke
[ ] REVOKED
[ ] final visual/mobile/SEO parity review
```

Frontend convergence does not alter QRVP-1/QVS-1.0 verification semantics and does not introduce a second writable/data authority.