---
title: How to Buy Pro
---

# How to Buy Pro

MamoPlayer Pro is a paid package for teams that need advanced OTT features.

## Buying process (Phase 6: manual / Stripe-based)

For now, purchasing is handled manually through a simple Stripe-based flow:

1. Fill out a short form or send an email to your contact address (for example: `contact@mamoplayer.com`).
2. Receive a Stripe payment link from the MamoPlayer team.
3. After payment is confirmed, access is granted to the private npm / GitHub Packages registry for `@mamoplayer/pro`.
4. Receive installation and usage instructions.

## Installation after purchase

Use the provided registry details in your `.npmrc` file.

```ini
@mamoplayer:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NPM_TOKEN}
always-auth=true
```

Then install Pro:

```bash
npm install @mamoplayer/pro
```

## Note

An automated self-serve license portal may be introduced later. For now, access is manual but straightforward.
