# Publishing @mamoplayer/pro

Operational guide for publishing the pro package privately to GitHub Packages.

---

## 1. Registry

`@mamoplayer/pro` is published to **GitHub Packages** under the `@mamoplayer` scope.

```
registry: https://npm.pkg.github.com/
access:   restricted
```

This is already declared in `packages/pro/package.json`:

```json
"publishConfig": {
  "access": "restricted",
  "registry": "https://npm.pkg.github.com/"
}
```

Do **not** change `access` to `"public"` — the package is commercial and must remain private.

---

## 2. Preconditions

Complete all three checks before publishing. If any fails, stop and resolve it first.

### 2a. Build passes

```bash
yarn build:pro
```

Confirm `packages/pro/dist/` contains all four expected outputs:

```
dist/index.js       # CJS
dist/index.mjs      # ESM
dist/index.d.ts     # CJS types
dist/index.d.mts    # ESM types
```

Run the test suite as a final sanity check:

```bash
yarn workspace @mamoplayer/pro test
```

### 2b. Version updated

The version in `packages/pro/package.json` must be correct and must follow semver before publishing.

```bash
# Check current version
node -e "console.log(require('./packages/pro/package.json').version)"
```

Bump the version manually or via Lerna (see [Step 3](#3-publish)). A corresponding entry in `packages/pro/CHANGELOG.md` must exist for the new version.

Version alignment rule: if this release also ships `@mamoplayer/core`, major and minor versions must match across both packages. See `docs/docs/versioning-changelog.md` for the full alignment policy.

### 2c. Registry authentication configured

You need a GitHub Personal Access Token (PAT) with the `write:packages` scope (also add `repo` if the repository is private).

Configure your publisher-side `~/.npmrc`:

```ini
@mamoplayer:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
always-auth=true
```

Export the token in your shell (or set it in your environment):

```bash
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
```

Verify authentication before proceeding:

```bash
npm whoami --registry=https://npm.pkg.github.com
```

---

## 3. Publish

Two paths are available: direct publish for a standalone pro-only release, or Lerna publish when releasing both packages together.

### Option A — Direct publish (pro only)

Use this when publishing `@mamoplayer/pro` independently of `@mamoplayer/core`.

```bash
# Dry run first — inspect what will be sent
cd packages/pro
npm pack --dry-run

# Publish
npm publish --registry=https://npm.pkg.github.com
```

Because `publishConfig` is already set in `package.json`, the `--registry` flag is redundant but acts as a safety guard.

### Option B — Lerna publish (both packages together)

Use this when a monorepo release bumps both packages.

```bash
# 1. Bump versions, generate CHANGELOG entries, and create Git tags
npm run lerna:version

# 2. Build all packages
yarn build

# 3. Publish all packages (core → npm public, pro → GitHub Packages)
npm run lerna:publish
```

Lerna reads each package's `publishConfig.registry` automatically, so no extra registry flags are needed.

---

## 4. Consumer `.npmrc` setup

Consumers who have been granted access must configure their project's `.npmrc` to resolve the `@mamoplayer` scope from GitHub Packages.

```ini
@mamoplayer:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
always-auth=true
```

`GITHUB_TOKEN` must be a PAT with at least `read:packages` scope. For CI environments, use a repository secret:

```ini
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

After configuring `.npmrc`, install normally:

```bash
npm install @mamoplayer/pro
# or
yarn add @mamoplayer/pro
# or
pnpm add @mamoplayer/pro
```

For the full consumer onboarding flow, see `docs/internal/pro-onboarding-template.md`.

---

## 5. Post-publish verification

### 5a. Package visible on GitHub Packages

```bash
npm view @mamoplayer/pro --registry=https://npm.pkg.github.com
```

Confirm the output shows the expected version, `dist/` in the `files` field, and `restricted` access.

### 5b. Tarball contents

```bash
cd packages/pro
npm pack --dry-run
```

Confirm the tarball includes:

- `dist/index.js` (CJS)
- `dist/index.mjs` (ESM)
- `dist/index.d.ts` and `dist/index.d.mts` (types)
- `README.md`

Confirm it does **not** include:

- `node_modules/`
- `src/` (source files are not part of the published output)
- Test files (`*.test.*`, `jest.config.js`)

### 5c. Install test in a clean project

In a separate project that has the correct `.npmrc` in place:

```bash
npm install @mamoplayer/pro@<version>
node -e "require('@mamoplayer/pro')"
```

Resolve any peer dependency warnings before closing out the release.

### 5d. Git tag

Verify the Git tag created by Lerna (or pushed manually) matches the published version:

```bash
git tag --list "@mamoplayer/pro*" | sort -V | tail -1
```

Expected format: `@mamoplayer/pro@X.Y.Z`

### 5e. Release checklist

Mark the **Pro Package — Private Publish** section of `docs/internal/release-checklist.md` complete.
