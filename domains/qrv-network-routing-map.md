# QR-V Network Routing Map

This file defines the production domain-to-repository routing map for the QR-V Network node family.

## Production service routing

| Domain | Repository | Service Role |
|---|---|---|
| `verify.qrv.network` | `ohi-stack/qrv-verify` | Public verification portal and public verification result pages |
| `registry.qrv.network` | `ohi-stack/qrv-registry` | Canonical QR-V registry authority and record datastore service |
| `api.qrv.network` | `ohi-stack/qrv-api` | JSON API gateway for verification, registry creation, revocation, and integrations |
| `issuer.qrv.network` | `ohi-stack/issuer-qrv` | Issuer Portal for certificate creation, issuer dashboard, records manager, and QR generation |
| `docs.qrv.network` | `ohi-stack/qrv-docs` | Protocol documentation, standards, guides, and API references |
| `developers.qrv.network` | `ohi-stack/qrv-developer-portal` | Developer onboarding, SDK resources, sandbox documentation, and integration guides |
| `status.qrv.network` | `ohi-stack/qrv-status` | Network status, uptime, health checks, and service availability reporting |
| `admin.qrv.network` | `ohi-stack/qrv-admin` | Internal admin console for network operations and issuer oversight |
| `store.qrv.network` | `qrv-store` / WordPress | QR-V store, product catalog, WooCommerce checkout, implementation packages, and digital downloads |

## Activation dependency order

1. `registry.qrv.network` must store the canonical record.
2. `api.qrv.network` must proxy creation and verification requests.
3. `verify.qrv.network` must display the public VERIFIED result.
4. `issuer.qrv.network` must create records through the API.
5. `docs.qrv.network` and `developers.qrv.network` must document the public contracts.
6. `store.qrv.network` must sell the Issuer Portal, onboarding packages, API plans, and QR-V products.

## First certificate activation flow

```text
issuer.qrv.network
  -> POST api.qrv.network/api/v1/registry/create
    -> registry.qrv.network/registry/create
      -> returns QRVID + canonicalUrl
        -> verify.qrv.network/{QRVID}
          -> returns VERIFIED
```

## Store role

`store.qrv.network` is assigned to the WordPress / WooCommerce commerce layer. It should not operate as the verification authority. It should sell access, products, onboarding packages, and documentation-linked service offers while linking all live verification actions back to `issuer.qrv.network`, `api.qrv.network`, and `verify.qrv.network`.
