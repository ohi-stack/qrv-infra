# QR-V™ Infrastructure

Infrastructure, deployment, DNS, environments, monitoring, secrets management, CI/CD, and operations controls for the QR-V™ Global Verification Network.

## Canonical Production Topology

| Service | Production role | Public route |
|---|---|---|
| `qrv.network` | Root network hub, public content, pricing, use cases, status | `/` |
| `verify.qrv.network` | Public QRVID verification and result pages | `/{qrvid}` |
| `api.qrv.network` | Canonical REST API and mutation authority | `/api/v1/*` |
| `registry.qrv.network` | Canonical registry and read-only record inspection | `/records/{qrvid}` |
| `issuer.qrv.network` | Authenticated issuer portal | `/login` |
| `explorer.qrv.network` | Public registry explorer | `/search` |
| `docs.qrv.network` | Protocol, standard, architecture, and API documentation | `/` |
| `developers.qrv.network` | SDKs, integration guides, examples, and sandbox access | `/` |
| `qrv.network/status` | Public service-status page during consolidated deployment | `/status` |

## Consolidation Policy

Use `qrv.network/{page}` for public education, SEO, conversion, pricing, status, and use-case pages.

Keep the following operational services separated because they have distinct security, availability, or authentication boundaries:

- `api.qrv.network`
- `verify.qrv.network`
- `registry.qrv.network`
- `issuer.qrv.network`
- `admin.qrv.network`

## Production Deployment Order

1. Database migrations and registry readiness.
2. API health, readiness, and canonical verification contract.
3. Public verifier and canonical demo QRVID.
4. Issuer create → QR → verify → revoke lifecycle.
5. Root site, documentation, explorer, and status surfaces.
6. Billing, white-label deployments, and commercial automation.

## Mandatory Go-Live Gate

The network is production-ready only when all of the following pass:

- `qrv.network/healthz` returns healthy JSON.
- `qrv.network/readyz` returns ready JSON.
- `api.qrv.network/healthz` returns healthy JSON.
- `verify.qrv.network/healthz` returns healthy JSON.
- `verify.qrv.network/readyz` confirms registry access.
- `QRV-PROD-CERT-000001` returns a deterministic result.
- An issuer can create a certificate without direct database access.
- The generated QR resolves to the public verification URL.
- Revocation changes the result to `REVOKED`.
- Create, verify, and revoke events are audit logged.

## Environment Rules

- Node.js 20 or later.
- Bind HTTP services to `0.0.0.0` and `process.env.PORT`.
- Store secrets only in deployment environment variables or a secrets manager.
- Permit only explicit production CORS origins.
- Require TLS for every public service.
- Use Gregorian/UTC timestamps as the canonical operational time reference.
- Treat OneGodian Time™ as supplemental display metadata only where configured.

## Repository Responsibilities

- `qrv-node`: root hub and public route consolidation.
- `qrv-api`: canonical application API.
- `qrv-registry`: schema, migrations, persistence, and registry queries.
- `qrv-verify`: public verification UX.
- `issuer-qrv`: issuer control plane.
- `qrv-docs`: standards and implementation documentation.
- `qrv-security`: security policy and threat model.
- `qrv-status`: monitoring and incident presentation.
- `qrv-demo-records`: deterministic fixtures and seed records.

See `network.manifest.json` and `PRODUCTION_RUNBOOK.md` for machine-readable service definitions and operating procedures.
