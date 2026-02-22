# FAQ & Troubleshooting

## Why doesn't the video play in Expo Go?

If the player does not appear or video does not play in **Expo Go**, the most common cause is native module support.

`MamoPlayer` relies on native modules, and Expo Go does not include arbitrary native dependencies from your project.

Use a **development build (dev client)** instead:

- Build and run a dev client for iOS/Android.
- Open your app with that dev client (not Expo Go).
- Re-test the player screen.

If you are on the web target, behavior can differ from native. Always validate native playback in a native dev client.

## Why does video play on iOS but not on Android?

This is usually a media format or codec compatibility issue.

Common causes:

- Video codec is not broadly supported on Android devices (for example, unsupported H.265/HEVC profile on some devices).
- Audio codec/container combination is not supported by the Android media stack.
- Stream packaging differs by platform and Android cannot decode one variant.

What to check:

- Use widely compatible formats (for example, H.264 video + AAC audio in MP4, or properly packaged HLS).
- Test the exact media URL on multiple Android devices/emulators.
- Verify server response headers and MIME type are correct.
- Confirm the stream is reachable on Android network conditions.

## Why are IMA ads not showing?

When IMA ads do not appear, validate setup end-to-end.

Checklist:

- `adTagUrl` is set and returns a valid VAST/VMAP response.
- URL is reachable from the device (no firewall/VPN/proxy block).
- Test with a known-good sample ad tag URL to isolate tag issues.
- Platform-specific ad setup is completed for iOS and Android.
- Device has internet access and can reach ad servers.
- Any consent/privacy requirements are satisfied before requesting ads.

If content plays but ads do not, focus first on ad tag validity and network reachability.

## Why are analytics events not firing?

Analytics callbacks only fire when using the Pro player configuration correctly.

Make sure:

- You are rendering `ProMamoPlayer` (not the base player) for analytics features.
- `analytics.onEvent` is provided in the player props/config.
- Your callback function is actually reached (add temporary logs).
- Event filtering or conditional logic is not unintentionally dropping events.

Quick verification pattern:

1. Render `ProMamoPlayer` with a minimal analytics config.
2. Attach `analytics.onEvent` and log every incoming event.
3. Start playback and confirm events appear in logs.

If no events arrive, re-check player variant and analytics prop wiring first.