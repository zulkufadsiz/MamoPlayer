# Stripe Setup (Internal)

Last updated: 2026-02-22

## Purpose

This document captures the planned Stripe setup for paid tiers and where checkout links will be used later.

## Placeholder Checkout Links (Do Not Publish Yet)

These are placeholders only and must **not** be hardcoded into public code until final Stripe setup and review are complete.

- Indie: https://buy.stripe.com/your-indie-link
- Team: https://buy.stripe.com/your-team-link
- Enterprise: Contact us

## Planned Stripe Configuration

### 1) Create Stripe products and prices

Plan:

- Create one product per paid tier in Stripe:
  - `MamoPlayer Indie`
  - `MamoPlayer Team`
  - `MamoPlayer Enterprise` (optional to keep as manual/contact flow)
- Define price objects for each tier (monthly/annual as needed).
- Add clear metadata to products/prices (for example: `tier=indie|team|enterprise`) to simplify downstream automation.
- Confirm tax settings, currency, and billing intervals before publishing links.

### 2) Use hosted checkout pages

Plan:

- Use Stripe hosted checkout/payment links (no custom checkout UI initially).
- Generate one hosted link per purchasable tier:
  - Indie link
  - Team link
- Keep Enterprise as “Contact us” in product UX until enterprise sales flow is defined.
- Store final links in a private/internal config source first; promote to production config only after validation.

### 3) Receive email notifications for successful purchases

Plan:

- Enable Stripe email receipts for customers.
- Configure internal purchase notifications via Stripe Dashboard notifications and/or forwarding mailbox.
- Optionally add event destinations/webhooks later for richer internal alerts.
- Verify notification flow in Stripe test mode, then live mode.

## Where Links Will Go Later (No Hardcoding Yet)

When approved, links should be injected via config/environment and referenced in UI/docs rather than hardcoded directly in source.

Likely placement points (to be finalized in implementation PR):

- Pricing/licensing docs pages that list plan options
- Purchase CTA areas in app/docs
- Any upsell screens for non-premium users

Guardrail:

- Do not commit real Stripe checkout URLs directly in public repository files until launch readiness and legal/commercial review are complete.

## TODO (Future Automation)

- [ ] Implement Stripe webhook listener for successful checkout/payment events.
- [ ] Map successful purchase to tier entitlements.
- [ ] Auto-add purchaser to internal license/registry system.
- [ ] Add idempotency and retry handling for webhook processing.
- [ ] Add audit logging + alerting for failed entitlement sync.

## Notes

- This is an internal planning document.
- Replace placeholders with final links only in a controlled release step.
