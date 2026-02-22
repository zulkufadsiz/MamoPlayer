# Pricing & Licensing

This page explains how MamoPlayer Core and MamoPlayer Pro are packaged, priced, and licensed for commercial use.

## 1. Overview

- **MamoPlayer Core** (`@mamoplayer/core`) is free to use.
- **MamoPlayer Pro** (`@mamoplayer/pro`) is a paid, private package intended for teams that need advanced OTT capabilities and commercial support.

## 2. Pricing tiers

> Prices below are placeholders and can be updated before public launch.

| Tier | Usage | Price | Notes |
| --- | --- | --- | --- |
| Indie | For solo developers | `$[INDIE_PRICE]_one-time` (e.g. `$79`) | Placeholder pricing; adjust before publishing. |
| Team | For small teams (up to `[X]` developers) | `$[TEAM_PRICE]_one-time` (e.g. `$199`) | Placeholder pricing; adjust team size and amount before publishing. |
| Enterprise | For organizations needing custom plans | `Custom` | Includes priority support and potential custom features. |

## 3. Licensing model

MamoPlayer Pro uses a **per-company license** model.

A single company license covers:

- Use of `@mamoplayer/pro` by one legal entity.
- Internal development for the licensed team size/tier.
- Production use in that company’s apps under the same brand/organization.

A license does **not** cover:

- Redistribution of `@mamoplayer/pro` as a standalone package.
- Resale, white-label resale, or sublicensing to third parties.
- Unrelated external companies, agencies, or clients unless explicitly agreed in writing.

If your usage exceeds your tier (for example, more developers or broader deployment scope), upgrade to a higher tier or Enterprise.

## 4. Access to Pro

For a step-by-step purchase flow, see [How to Buy Pro](/docs/how-to-buy-pro).

After purchase, customers receive:

- Access to the private package registry (npm org / GitHub Packages).
- The Pro package name and version access (`@mamoplayer/pro`).
- Installation and authentication instructions for their environment.

Typical install flow:

1. Authenticate to the provided registry (token-based).
2. Add registry/auth configuration to `.npmrc`.
3. Install the package:

```bash
npm install @mamoplayer/pro
```

If needed, the team can also provide a copy-paste `.npmrc` template for CI/CD and local development.

## 5. Upgrades & support

Default commercial support policy (can vary by agreement):

- **Updates:** includes Pro updates and fixes for 12 months from purchase date.
- **Support channel:** email support during business hours.
- **Enterprise options:** priority response targets and custom feature scoping are available on Enterprise plans.

For renewals, expanded usage, or custom terms, contact the MamoPlayer team.
