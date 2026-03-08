---
title: Ads & Monetization
---

# Ads & Monetization

This section documents ad break configuration, monetization flows, and rollout considerations.

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
