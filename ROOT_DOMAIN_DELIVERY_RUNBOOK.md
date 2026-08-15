# QR-V Root Domain Delivery Runbook

## Incident signature

Desktop and mobile clients receive different `qrv.network` homepages.

This indicates that the root domain is not being delivered from one canonical platform origin or that a stale CDN/application cache remains reachable.

## Canonical production ownership

```text
qrv.network      = ohi-stack/qrv-node
api.qrv.network  = ohi-stack/qrv-api
```

No other repository is permitted to serve the `qrv.network` root hostname.

## Repositories that must not be mapped to qrv.network

```text
ohi-stack/qrv-marketing-site
ohi-stack/qrv-verify
ohi-stack/issuer-qrv
ohi-stack/qrv-registry
ohi-stack/qrv-explorer
```

They remain source modules or compatibility services only.

## Recovery sequence

1. Inspect Hostinger application/domain mappings for `qrv.network`.
2. Remove every root-domain mapping except the application deployed from `ohi-stack/qrv-node/main`.
3. Inspect DNS for duplicate A, AAAA, or CNAME records.
4. Confirm IPv4 and IPv6 terminate at the same application origin.
5. Redeploy `ohi-stack/qrv-node/main`.
6. Purge Hostinger/CDN cache.
7. Confirm `https://qrv.network/version` is returned by the canonical platform application.
8. Run `npm run acceptance:live` from `qrv-node`.
9. Require both `platform-root-desktop` and `platform-root-mobile` to pass.
10. Confirm the legacy headline `Verify Records. Confirm Authenticity. Instantly.` is no longer returned.

## Acceptance condition

The incident is resolved only when desktop and mobile probes both receive the canonical platform homepage and the complete QR-V acceptance suite passes.

## Prevention

- Keep the root domain mapped to one application only.
- Keep `qrv-marketing-site` source-only.
- Use 308 redirects for legacy QR-V hostnames.
- Revalidate root HTML after releases.
- Purge edge caches after origin changes.
- Run live acceptance after every production deployment.
