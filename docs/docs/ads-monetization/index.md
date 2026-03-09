---
title: Ads & Monetization
---

# Ads & Monetization

This section documents ad break configuration, monetization flows, and rollout considerations.

For complete `ProMamoPlayer` setup and prop coverage, start with [Pro Player](../pro-player/).

## Where to configure ads

- Use `ads` for simulated ad breaks (preroll, midroll, postroll), skip behavior, and `overlayInset`.
- Use `ima` for ad-tag-based serving (VAST/IMA).
- See [Analytics & Events](../analytics-events/) for tracking `ad_start`, `ad_complete`, and `ad_error`.

## AdsConfig

```ts
type AdsConfig = {
  adBreaks: Array<{
    type: 'preroll' | 'midroll' | 'postroll';
    time?: number;
    source: {
      uri: string;
      type?: 'video/mp4' | 'application/x-mpegURL';
    };
  }>;
  skipButtonEnabled?: boolean;
  skipAfterSeconds?: number;
  overlayInset?: {
    right?: number;
    bottom?: number;
  };
};
```

- `overlayInset.right`: right padding for ad label/skip button cluster.
- `overlayInset.bottom`: bottom padding for ad label/skip button cluster.

For end-to-end examples using both `ads` and `ima`, see [Pro Player](../pro-player/).
