# Release Tags & GitHub Release Notes

Internal guide for tagging releases and publishing GitHub release notes for MamoPlayer.

---

## Tag Naming Convention

This monorepo uses **independent versioning** (Lerna `"version": "independent"`), meaning `core` and `pro` are versioned and tagged separately.

### Standard release tags

```
@mamoplayer/core@1.2.0
@mamoplayer/pro@1.2.0
```

Lerna creates these tags automatically when you run `npm run lerna:version`. Do not invent a custom format — keep the default `<package-name>@<version>` pattern so Lerna's changelog and GitHub release automation continues to work correctly.

### Release candidate tags

For pre-releases, pass the `--preid` flag manually or use the `--conventional-prerelease` option:

```bash
# Promote a specific package to RC
npx lerna version prerelease --preid rc --no-push
# Results in e.g. @mamoplayer/core@1.2.0-rc.1
```

Expected RC tag examples:

| Package | Tag |
|---------|-----|
| core RC | `@mamoplayer/core@1.2.0-rc.1` |
| pro RC | `@mamoplayer/pro@1.2.0-rc.1` |

### Monorepo-wide "umbrella" tag (optional)

If a core and pro release are shipped together and you want a single reference point, add a lightweight companion tag **after** the per-package tags:

```bash
git tag v1.2.0
git push origin v1.2.0
```

This tag carries no Lerna automation — it is for human navigation only.

---

## Creating a GitHub Release Entry

Lerna is already configured with `"createRelease": "github"`, so a draft release is created automatically during `npm run lerna:version` / `npm run lerna:publish` for any package that has changes.

### Automated path (preferred)

1. Run the standard version + publish workflow — see [publish-core.md](publish-core.md) and [publish-pro.md](publish-pro.md).
2. Lerna creates a GitHub release per changed package using the conventional-commit changelog.
3. Open the draft release on GitHub, review the auto-generated notes, fill in any manual sections (see below), then **Publish release**.

### Manual path (hotfixes, RC announcements, etc.)

1. Push the tag first:
   ```bash
   git tag @mamoplayer/core@1.2.1
   git push origin @mamoplayer/core@1.2.1
   ```
2. Go to **GitHub → Releases → Draft a new release**.
3. Select the tag from the dropdown.
4. Set the title to `@mamoplayer/core v1.2.1` (or the equivalent pro tag).
5. Check **Set as a pre-release** for any `-rc.*` tag.
6. Fill in the release notes body (structure below) and publish.

---

## Release Notes Structure

Use this template for each GitHub release entry. Delete sections that do not apply.

```markdown
## @mamoplayer/core v1.2.0

### Highlights
<!-- One or two sentences summarising the most important change in this release. -->

### New Features
- Short description of feature A (PR #123)
- Short description of feature B (PR #124)

### Breaking Changes
<!-- List every change that requires consumer action. -->
- **Renamed prop** `autoPlay` → `autostart` — update all usages in consuming apps.
- **Removed** `deprecated_method()` — use `newMethod()` instead.
- **Peer dependency bump** — React Native ≥ 0.73 is now required.

### Bug Fixes
- Fixed seek position resetting on background transition (PR #120)

### Known Limitations
<!-- Honest list of issues that are present but not yet resolved in this release. -->
- Chromecast session handoff is not supported on Android 12 (tracked in #98).
- PiP mode on iOS 15 has a brief black frame on entry.

### Installation / Migration Notes
<!-- Steps a consumer must take beyond `npm install`. -->
1. Update the package version in your app:
   ```bash
   npm install @mamoplayer/core@1.2.0
   ```
2. Run `pod install` inside the `ios/` directory.
3. If upgrading from v1.1.x, rename the `autoPlay` prop to `autostart` throughout your codebase.

### Internal Notes
<!-- Any context relevant to the team but not visible to consumers. Remove before publishing if the release is public. -->
- RC.1 testing notes: docs/internal/rc-testing-notes.md
```

---

## Checklist Before Publishing a Release

- [ ] Tag exists on `main` (or the target release branch) and is pushed to origin
- [ ] `CHANGELOG.md` in the affected package reflects this version
- [ ] Breaking changes section is present if any API changed
- [ ] Known limitations are honest and up to date
- [ ] Installation notes cover pod install / Gradle sync if native files changed
- [ ] Pre-release checkbox is set for any `-rc.*` release
- [ ] Release is NOT published until CI is green on the tagged commit

---

## Related Docs

- [release-checklist.md](release-checklist.md) — full pre-release quality checklist
- [publish-core.md](publish-core.md) — npm publish steps for core
- [publish-pro.md](publish-pro.md) — registry publish steps for pro
- [rc-testing-notes.md](rc-testing-notes.md) — RC test tracking template
