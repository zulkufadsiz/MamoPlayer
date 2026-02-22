---
title: Getting Started with MamoPlayer
---

# Getting Started with MamoPlayer

This guide helps you install MamoPlayer and render your first player using the Core package.

## What is MamoPlayer?

MamoPlayer is a React Native video player SDK that provides ready-to-use player UIs and playback building blocks.

You can start with the Core package for a standard playback experience, then move to Pro when you need advanced capabilities.

## Core vs Pro packages

### `@mamoplayer/core` (Core)

Use Core when you need:

- Base player components
- Standard playback controls
- Fast integration with minimal setup

### `@mamoplayer/pro` (Pro)

Use Pro when you need:

- Premium/advanced player capabilities
- Extended controls and enterprise-style features
- A richer playback experience on top of Core concepts

## Installation

Follow these steps in your React Native project.

### 1) Install the package

Choose one package based on your needs:

```bash
# Core
npm install @mamoplayer/core
# or
yarn add @mamoplayer/core
```

```bash
# Pro
npm install @mamoplayer/pro
# or
yarn add @mamoplayer/pro
```

### 2) Install peer dependencies

MamoPlayer expects these peer dependencies in your app:

- `react`
- `react-native`
- `react-native-video`

If needed, install them with:

```bash
npm install react react-native react-native-video
# or
yarn add react react-native react-native-video
```

### 3) iOS only: install pods

```bash
cd ios && pod install
```

## Basic Core usage example

The example below shows a simple `@mamoplayer/core` integration using `MamoPlayer`.

```tsx
import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { MamoPlayer } from '@mamoplayer/core';

export default function PlayerScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <MamoPlayer
        source={{ uri: 'https://example.com/video.mp4' }}
        autoPlay
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
```

## Next steps

- Read the [Core Player docs](/docs/core-player)
- Read the [Pro Player docs](/docs/pro-player)
