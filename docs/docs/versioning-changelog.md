---
title: Versioning & Changelog
---

# Versioning & Changelog

## Versioning strategy (SemVer)

MamoPlayer follows [Semantic Versioning](https://semver.org/) for published packages:

- **Major (`X`)**: backward-incompatible API or behavior changes.
- **Minor (`Y`)**: backward-compatible feature additions.
- **Patch (`Z`)**: backward-compatible bug fixes and internal improvements.

### Core and Pro alignment

- `@mamoplayer/core` and `@mamoplayer/pro` keep **major and minor versions aligned** (for example, `2.4.x` for both).
- Patch versions may differ when a fix applies to only one package.
- For best compatibility, consume matching major/minor versions across Core and Pro.

## What counts as a breaking change

Changes are considered breaking when they can require consumer code/config/runtime changes, including:

- Removing or renaming exported APIs (components, hooks, functions, types, props, events).
- Changing API contracts in a non-compatible way (required props, parameter shapes, return types, event payloads).
- Changing default behavior in a way that can alter playback, analytics, ads, licensing, or UI logic.
- Raising baseline requirements (React Native/OS versions) or removing support for previously supported platforms.
- Altering integration steps or configuration requirements such that existing setups stop working without updates.

## Where the changelog lives

Release notes and change history are published in:

- **GitHub Releases**: https://github.com/zulkufadsiz/MamoPlayer/releases
- **Repository changelog file (if present)**: `CHANGELOG.md` at repository root.

If both exist, GitHub Releases is the source for release-by-release publication, while `CHANGELOG.md` provides an in-repo reference.