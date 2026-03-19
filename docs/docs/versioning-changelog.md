---
title: Versioning & Changelog
---

# Versioning & Changelog

## Versioning strategy (SemVer)

MamoPlayer follows [Semantic Versioning](https://semver.org/) for all published packages:

| Segment | When to bump | Example trigger |
|---------|-------------|-----------------|
| **Major (`X`)** | Backward-incompatible change | Removed prop, renamed hook, raised peer dep |
| **Minor (`Y`)** | New backward-compatible feature | New component, new optional prop, new hook |
| **Patch (`Z`)** | Bug fix or internal improvement | Crash fix, style correction, dependency patch |

Version bumps are derived automatically from [Conventional Commits](https://www.conventionalcommits.org/) when running `yarn lerna:version`:

- `fix:` → patch
- `feat:` → minor
- `BREAKING CHANGE:` footer or `!` suffix → major

---

## Package versioning — independent mode

This monorepo uses Lerna in **independent** mode, meaning `@mamoplayer/core` and `@mamoplayer/pro` each carry their own version number. They do **not** have to move together on every release.

### When versions must align (major and minor)

`@mamoplayer/pro` depends on `@mamoplayer/core`. Version alignment is required whenever:

- A **new public API** added to `@mamoplayer/core` is consumed by `@mamoplayer/pro` (e.g., a new hook, prop, or exported type).
- A **breaking change** is made in `@mamoplayer/core` that `@mamoplayer/pro` must adopt.

In these cases, both packages should ship the same major and minor version (e.g., both at `2.3.x`) so consumers can reason about compatibility at a glance.

### When versions may differ (patch)

Patch versions may diverge when a fix applies to only one package:

- A rendering bug fixed only in `@mamoplayer/core` → bump core to `1.0.1`, pro stays at `1.0.0`.
- A licensing fix only in `@mamoplayer/pro` → bump pro to `1.0.1`, core stays at `1.0.0`.

### Practical rule for consumers

Always use matching major and minor versions across both packages:

```
"@mamoplayer/core": "^2.3.0",
"@mamoplayer/pro": "^2.3.0",
```

The `^` range handles patch divergence automatically.

---

## What counts as a breaking change

The following require a **major version bump**:

- Removing or renaming any exported API — component, hook, function, type, prop, or event.
- Changing an API contract in an incompatible way: adding a required prop, changing parameter shape, altering return type or event payload.
- Changing default behavior that affects playback, analytics, ads, licensing, or UI output.
- Raising the minimum supported version of React Native, iOS, Android, or a peer dependency.
- Removing support for a previously supported platform or integration.
- Changing the peer dependency contract of `@mamoplayer/core` in a way that breaks existing `@mamoplayer/pro` consumers.

The following do **not** count as breaking:

- Adding new optional props with sensible defaults.
- Adding new exports that don't conflict with existing ones.
- Internal refactors that have no effect on the public API or runtime behavior.
- Documentation and type comment improvements.

---

## Release tags and GitHub Releases

Because the monorepo uses Lerna in independent mode with `createRelease: "github"`, each package produces its own Git tag and GitHub Release entry.

### Tag format

```
@mamoplayer/core@X.Y.Z
@mamoplayer/pro@X.Y.Z
```

Examples: `@mamoplayer/core@1.1.0`, `@mamoplayer/pro@1.1.0`

### Where releases are published

| Location | Purpose |
|----------|---------|
| **GitHub Releases** ([releases page](https://github.com/zulkufadsiz/MamoPlayer/releases)) | Canonical per-version notes, auto-generated from Conventional Commits |
| **`packages/core/CHANGELOG.md`** | In-repo log auto-maintained by Lerna for `@mamoplayer/core` |
| **`packages/pro/CHANGELOG.md`** | In-repo log auto-maintained by Lerna for `@mamoplayer/pro` |

GitHub Releases is the source of truth for what shipped in each version. The `CHANGELOG.md` files in each package are the in-repo reference.

### Release workflow

```bash
# 1. Bump versions, generate changelogs, create Git tags, and open a GitHub Release
yarn lerna:version

# 2. Build and publish to npm
yarn lerna:publish
```

Run a dry run first to preview what would be bumped:

```bash
yarn release:dry
```

See the [Release Checklist](../internal/release-checklist.md) for the full pre-release verification steps.
