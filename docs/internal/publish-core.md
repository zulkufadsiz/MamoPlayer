# Publishing @mamoplayer/core

Operational guide for publishing the core package publicly to npm.

---

## 1. Preconditions

**Build passes**

```bash
yarn build:core
```

Verify `packages/core/dist/` contains `index.js`, `index.mjs`, `index.d.ts`, and `index.d.mts` before proceeding.

**Version updated**

Bump the version in `packages/core/package.json` following semver. A changelog entry in `docs/docs/changelog.md` must exist for the new version.

```bash
# Check current version
node -e "console.log(require('./packages/core/package.json').version)"
```

**npm login**

```bash
npm whoami           # confirm you are authenticated
npm login            # if not authenticated
```

Ensure you have publish rights to the `@mamoplayer` org scope on npm.

---

## 2. Publish

```bash
cd packages/core
npm publish --access public
```

`publishConfig.access` is already set to `"public"` in `package.json`, so `--access public` is a safety guard rather than required.

To do a dry run first:

```bash
npm publish --dry-run
```

---

## 3. Verify Package Contents Before Publishing

Use `npm pack` to inspect exactly what will be shipped:

```bash
cd packages/core
npm pack --dry-run
```

Confirm the tarball includes:
- `dist/index.js` (CJS)
- `dist/index.mjs` (ESM)
- `dist/index.d.ts` and `dist/index.d.mts` (types)
- `src/` (React Native source entry)
- `README.md`
- `LICENSE`

Confirm it does **not** include:
- `node_modules/`
- Test files (`*.test.*`, `jest.config.js`)
- `yarn-error.log` or other build artifacts outside `dist/`

---

## 4. Post-Publish Checks

**Install test**

In a separate project or temp directory:

```bash
npm install @mamoplayer/core@<version>
node -e "require('@mamoplayer/core')"
```

**npm page verification**

Visit `https://www.npmjs.com/package/@mamoplayer/core` and confirm:
- Version matches what was published
- "Files" tab shows expected files
- Weekly download count begins incrementing (may take a few minutes)

**README visibility**

Confirm the README renders correctly on the npm page. If it appears blank or broken, check that `README.md` is present in `packages/core/` and is included in the `files` field of `package.json`.
