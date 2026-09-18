# QR-V™ Frontend & Multi-Builder Convergence Status

**Status date:** September 17, 2026  
**State:** RUNTIME CONVERGED; MULTI-BUILDER DEVELOPMENT MODEL ACTIVE; LIVE DEPLOYMENT ACCEPTANCE REMAINS

QR-V Production Architecture remains a strict two-node deployment:

```text
qrv.network               → ohi-stack/qrv-node
api.qrv.network           → ohi-stack/qrv-api
```

The public QR-V frontend is converged into `qrv-node`. The compiled React/Vite Sites frontend is served by the canonical Express platform runtime while protected operational routes remain server-owned.

Canonical runtime convergence:

```text
eaac061efd4c03d8d90714409414832682e3fec0
```

Canonical multi-builder environment:

```text
4e9dd06e7c164b61ec586c54f2c3578192ef5bb3
```

## Development lanes

```text
main
  production only

work/chatgpt-sites
  customer-facing UI / UX / content / responsive / accessibility / SEO presentation

work/google-ai-studio
  isolated full-stack / Gemini / interactive workflow / developer-tool experiments

integration/multi-builder
  conflict resolution / validation / release candidate assembly
```

All three development branches are synchronized to the multi-builder baseline above.

Local lane ports:

```text
ChatGPT Sites      Vite 3101   Express 3201
Google AI Studio   Vite 3102   Express 3202
Integration        Vite 3103   Express 3203
```

## Trust boundary

The development environments do not become independent QR-V authorities.

```text
builder preview
    ↓
qrv-node Express boundary
    ↓
api.qrv.network/api/v1
    ↓
canonical registry
```

Experimental environments default closed and must not receive production registry, signing, database, payment, or privileged API secrets.

## SPA / Express boundary

Ordinary customer-facing HTML routes may use the compiled SPA. These operational route families remain Express-owned:

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

Direct `/{QRVID}` compatibility URLs also bypass SPA fallback.

## Promotion model

```text
work/chatgpt-sites ──────┐
                         ├─→ integration/multi-builder
work/google-ai-studio ───┘
                                  ↓
                         npm run validate:prod
                                  ↓
                                main
                                  ↓
                             qrv.network
```

No builder branch should deploy directly to `qrv.network`.

## Remaining live-production acceptance

```text
[ ] Hostinger maps qrv.network to ohi-stack/qrv-node/main at or after 4e9dd06
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

This architecture does not alter QRVP-1/QVS-1.0 semantics and does not introduce a second writable registry.
