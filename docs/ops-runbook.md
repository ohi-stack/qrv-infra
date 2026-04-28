# QR-V Production Operations Runbook

Date: 2026-04-27
Scope: `issuer.qrv.network`, `api.qrv.network`, `verify.qrv.network`, `registry.qrv.network`

## Operating principle

The production network is not ready because the build passes. It is ready when the live acceptance checks pass against the public hosts without masking failures.

## Standard commands

```bash
npm run audit:repo-family
npm run acceptance:live:quiet
```

For full demo proof:

```bash
QRV_ACCEPTANCE_INCLUDE_DEMO=1 \
QRV_DEMO_QRVID=QRV-PROD-CERT-000001 \
npm run acceptance:live
```

For strict environment checking:

```bash
QRV_AUDIT_STRICT=1 npm run audit:repo-family
```

## 429 handling

If all public hosts return `429`, treat it as an upstream protection issue rather than a per-service code failure until proven otherwise.

Likely sources:

- Hostinger edge protection
- CDN/WAF throttling
- shared-hosting anti-bot rules
- probes firing too quickly from one runner IP

Immediate actions:

1. Use `npm run acceptance:live:quiet`.
2. Increase delay variables:

```bash
QRV_ACCEPTANCE_MIN_DELAY_MS=5000 \
QRV_ACCEPTANCE_MAX_DELAY_MS=10000 \
QRV_ACCEPTANCE_RETRIES=2 \
npm run acceptance:live
```

3. Whitelist the monitoring runner IP if firewall controls allow it.
4. Prefer `/health`, `/healthz`, `/readyz`, `/version` over full page scraping.
5. Run public probes every 5 minutes or slower on low-cost hosting.

## Production proof target

The network launch proof is:

```text
QRV-PROD-CERT-000001 => VERIFIED
```

This proof must be captured from both:

- `https://verify.qrv.network/api/v1/verify/QRV-PROD-CERT-000001`
- `https://verify.qrv.network/QRV-PROD-CERT-000001`

## Failure interpretation

- `200`: route responds.
- `404`: route exists but record or path is missing.
- `429`: rate limiting / WAF / edge protection.
- `500`: app error.
- `503`: service unavailable, DB unavailable, or upstream dependency not ready.
- `0`: network timeout or fetch failure.

## Next production threshold

Do not move to sales demos until:

1. all health checks pass,
2. demo verification returns `VERIFIED`,
3. issuer can create one live record,
4. revoke path returns `REVOKED`,
5. acceptance output is archived.
