# Post-Publish Verification Checklist

Run these checks immediately after publishing `@mamoplayer/core` and/or `@mamoplayer/pro`.

---

## 1. Registry Listing

- [ ] Package appears on the registry at the expected version
  ```bash
  npm view @mamoplayer/core version
  npm view @mamoplayer/pro version   # if applicable
  ```
- [ ] `dist-tag` `latest` points to the newly published version
  ```bash
  npm dist-tag ls @mamoplayer/core
  ```
- [ ] Package metadata (description, keywords, homepage, repository) looks correct on the registry page

---

## 2. Clean Install

- [ ] Create a temporary project and install the package with no cache
  ```bash
  mkdir /tmp/mamo-verify && cd /tmp/mamo-verify
  npm init -y
  npm install @mamoplayer/core@latest   # or specific version
  ```
- [ ] Installation completes without errors or unmet peer-dependency warnings
- [ ] `node_modules/@mamoplayer/core/dist/` exists and contains `index.js` / `index.mjs` / `index.d.ts`

---

## 3. Type Declarations

- [ ] `index.d.ts` (and `index.d.mts` if dual-format) is present in the published `dist/`
  ```bash
  ls node_modules/@mamoplayer/core/dist/*.d.ts
  ```
- [ ] Create a minimal TypeScript file and confirm it type-checks cleanly
  ```ts
  // verify.ts
  import { MamoPlayer } from '@mamoplayer/core';
  const _: typeof MamoPlayer = MamoPlayer;
  ```
  ```bash
  npx tsc verify.ts --noEmit --moduleResolution node
  ```
- [ ] No "Could not find declaration file" errors in a consuming project

---

## 4. Import Resolution

- [ ] Core named exports resolve without runtime errors
  ```js
  const core = require('@mamoplayer/core');
  console.log(Object.keys(core)); // should list exported symbols
  ```
- [ ] ESM import resolves correctly (if `module` / `exports` field is present)
  ```js
  import { MamoPlayer } from '@mamoplayer/core';
  ```
- [ ] Pro package imports resolve and do not accidentally re-export core internals
  ```js
  import { ProPlayer } from '@mamoplayer/pro';
  ```
- [ ] No "Cannot find module" or "Package path not exported" errors

---

## 5. README Examples

- [ ] Open the published README on the registry page and skim each code snippet
- [ ] Installation command in README matches the package name and scope exactly
- [ ] Basic usage snippet (`import` / `require` + component render) is syntactically valid and references only exported symbols
- [ ] Any prop names or API surface shown in examples matches the published types
- [ ] No references to unreleased features or pre-release API shapes

---

## 6. Docs Site & Package References

- [ ] `docs/docs/changelog.md` entry matches the published version number and date
- [ ] Links in the docs that reference npm (e.g. `npmjs.com/package/@mamoplayer/core`) resolve correctly
- [ ] Version badge in docs/README (if present) reflects the new version
- [ ] `packages/core/package.json` and `packages/pro/package.json` `homepage` / `repository` URLs are reachable
- [ ] Any cross-references between Core and Pro docs (e.g. "requires @mamoplayer/core ≥ x.y.z") are accurate for the released versions

---

## On Failure

| Issue | Action |
|---|---|
| Wrong version on registry | Publish the correct version; **do not** unpublish unless critical |
| Install breaks | Check `files` field and `dist/` contents; republish as a patch |
| Types missing | Verify `types` field in `package.json` points to `dist/index.d.ts`; republish |
| Import error | Check `main` / `module` / `exports` fields; republish as a patch |
| Docs link broken | Fix in docs repo; no package republish needed |
