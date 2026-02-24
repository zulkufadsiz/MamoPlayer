# Theming & Skins

This page explains how to style MamoPlayer using built-in themes, full token overrides, custom icons, and layout variants.

## overview

You can theme the player in two ways:

- `themeName`: pick a built-in skin: `"light"`, `"dark"`, or `"ott"`
- `theme`: pass a full `PlayerThemeConfig` object for token-level customization

If both are provided, `theme` should be considered the source of truth.

```tsx
import { MamoPlayer } from '@mamoplayer/core';

<MamoPlayer source={{ uri: 'https://cdn.example.com/video/master.m3u8' }} themeName="dark" />;
```

## tokens

`PlayerThemeConfig` is token-driven. The main token groups are:

### colors

Controls and surfaces, including common keys such as:

- `background`
- `backgroundOverlay`
- `primary`
- `primaryText`
- `secondaryText`
- `accent`
- `danger`
- `border`
- `sliderTrack`
- `sliderThumb`

### typography

Text sizing and readability tokens, typically:

- `fontSizeSmall`
- `fontSizeMedium`
- `fontSizeLarge`

### shape

Corner radii and control geometry, typically:

- `borderRadiusSmall`
- `borderRadiusMedium`
- `borderRadiusLarge`

## examples

### using `themeName` only

Use this when one of the built-in skins is sufficient:

```tsx
import { MamoPlayer } from '@mamoplayer/core';

export function DarkPlayer() {
  return (
    <MamoPlayer source={{ uri: 'https://cdn.example.com/video/master.m3u8' }} themeName="dark" />
  );
}
```

### providing a custom `theme`

Use this for full branding control:

```tsx
import { MamoPlayer } from '@mamoplayer/core';
import type { PlayerThemeConfig } from '@mamoplayer/core';

const customTheme: PlayerThemeConfig = {
  tokens: {
    colors: {
      background: '#0B1220',
      backgroundOverlay: '#0B1220CC',
      primary: '#7C3AED',
      primaryText: '#F8FAFC',
      secondaryText: '#CBD5E1',
      accent: '#22D3EE',
      danger: '#F43F5E',
      border: '#1E293B',
      sliderTrack: '#64748B',
      sliderThumb: '#22D3EE',
    },
    typography: {
      fontSizeSmall: 12,
      fontSizeMedium: 14,
      fontSizeLarge: 20,
    },
    shape: {
      borderRadiusSmall: 8,
      borderRadiusMedium: 12,
      borderRadiusLarge: 18,
    },
  },
};

export function BrandedPlayer() {
  return (
    <MamoPlayer source={{ uri: 'https://cdn.example.com/video/master.m3u8' }} theme={customTheme} />
  );
}
```

## icons & `layoutVariant`

### `icons` prop with custom icon components

Use custom icon components to align player controls with your product icon set:

```tsx
import { MamoPlayer } from '@mamoplayer/core';
import { MyPlayIcon, MyPauseIcon, MySeekForwardIcon } from './player-icons';

<MamoPlayer
  source={{ uri: 'https://cdn.example.com/video/master.m3u8' }}
  icons={{
    Play: MyPlayIcon,
    Pause: MyPauseIcon,
    SeekForward: MySeekForwardIcon,
  }}
/>;
```

### `layoutVariant`: `compact`, `standard`, `ott`

Pick a layout preset based on context:

- `compact`: dense controls for constrained space
- `standard`: balanced default player UI
- `ott`: TV-style or premium streaming presentation

```tsx
import { MamoPlayer } from '@mamoplayer/core';

<MamoPlayer source={{ uri: 'https://cdn.example.com/video/master.m3u8' }} layoutVariant="ott" />;
```

## pseudo-layout (visual guide)

If screenshots are not yet available, use this structure as a quick visual reference:

```text
┌──────────────────────────────────────────────────────────┐
│                      Video Surface                       │
│                                                          │
│  [Back]                           [CC] [Settings] [Cast] │
│                                                          │
│               [Play/Pause] [Seek -10] [+10]             │
│                                                          │
│  00:42 ────────────────●─────────────── 12:18            │
│        (timeline / buffered / progress)                 │
└──────────────────────────────────────────────────────────┘
```

Recommended screenshots to add later:

- light + standard
- dark + compact
- ott + ott layout with custom icons

## design guidelines

- Ensure text/controls meet accessible contrast targets against both bright and dark video frames.
- Use stronger `backgroundOverlay` opacity when subtitles and controls overlap complex scenes.
- Keep primary actions (play/pause, seek, full screen) visually prominent and consistently placed.
- Avoid low-contrast `secondaryText` for timestamps on high-motion video.
- Preserve legibility over video by combining contrast, size, and spacing (not color alone).
