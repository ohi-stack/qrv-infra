# QR-V™ Production DNS and Route Topology

**Effective:** 2026-09-17

QR-V uses a deliberately simple production application model:

| Host | Production role |
|---|---|
| `qrv.network` | Canonical human-facing platform |
| `api.qrv.network` | Canonical machine API, trust boundary and data authority |

All other QR-V service hostnames are branded entry points or compatibility aliases, not independent production applications.

## Compatibility host map

- `verify.qrv.network` → `https://qrv.network/verify`
- `registry.qrv.network` → `https://qrv.network/registry`
- `issuer.qrv.network` → `https://qrv.network/issuer`
- `docs.qrv.network` → `https://qrv.network/docs`
- `developers.qrv.network` → `https://qrv.network/developers`
- `explorer.qrv.network` → `https://qrv.network/explorer`

The machine-readable redirect plan is `config/legacy-host-redirects.json`.

## API rule

`api.qrv.network` is not a browser product surface. Its normal production responsibilities are:

- health/readiness/version telemetry;
- the versioned `/api/v1` contract;
- authentication and authorization;
- issuance and revocation;
- canonical registry persistence;
- cryptographic operations;
- audit data;
- API keys and webhooks;
- machine-to-machine integrations.

The normative endpoint contract is maintained in `ohi-stack/qrv-api/openapi.yaml`.

## Customer experience rule

A legacy hostname such as `registry.qrv.network` must not expose a bare service-status or API response as the normal customer experience. Human users are redirected into the polished platform route under `qrv.network`.

## Cutover gate

Do not enable permanent redirects until:

1. `qrv.network` route parity is confirmed;
2. `api.qrv.network/healthz` is healthy;
3. `api.qrv.network/readyz` confirms the canonical datastore;
4. issuer create → verify → revoke → verify passes;
5. canonical URLs and SEO redirects are validated;
6. rollback instructions are recorded.

## Repository ownership

- `ohi-stack/qrv-node` owns browser routes and compatibility redirects.
- `ohi-stack/qrv-api` owns the authoritative API/data plane.
- `ohi-stack/qrv-docs` owns documentation source.
- `ohi-stack/qrv-infra` owns deployment topology, DNS/redirect policy and operational runbooks.
