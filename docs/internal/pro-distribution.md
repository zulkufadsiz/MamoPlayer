# Pro Package Distribution (Private)

This note applies to the Pro package defined in `packages/pro/package.json`.

The package is intended for private distribution only, using one of these registries:

- private npm org registry
- GitHub Packages

## Package identity

- Package name: `@mamoplayer/pro`

## Option A: Publish to npm (private org)

### 1) Publisher prerequisites

- npm account with access to the org scope
- Logged in via CLI (`npm login`)
- Org/package configured for private access

### 2) Publish command

From repository root (or package folder):

```bash
cd packages/pro
npm publish --access restricted
```

Notes:

- `--access restricted` ensures scoped package privacy on npm.
- Do not add a `publishConfig.access=public` for this package.

### 3) Consumer `.npmrc` example

```ini
@zulkufadsiz:registry=https://registry.npmjs.org/
//registry.npmjs.org/:_authToken=${NPM_TOKEN}
always-auth=true
```

Consumer install:

```bash
npm install @zulkufadsiz/mamoplayer-pro
```

## Option B: Publish to GitHub Packages

### 1) Publisher prerequisites

- GitHub account with package publish permissions
- Personal access token with `write:packages` (and `repo` if repository is private)
- Logged in via npm to GitHub Packages registry

Example login config in publisher `.npmrc`:

```ini
@zulkufadsiz:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
always-auth=true
```

### 2) Publish command

```bash
cd packages/pro
npm publish --registry=https://npm.pkg.github.com
```

### 3) Consumer `.npmrc` example

```ini
@zulkufadsiz:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
always-auth=true
```

Consumer install:

```bash
npm install @zulkufadsiz/mamoplayer-pro
```

## Quick verification

After publishing, verify with:

```bash
npm view @zulkufadsiz/mamoplayer-pro --registry=https://registry.npmjs.org/
# or
npm view @zulkufadsiz/mamoplayer-pro --registry=https://npm.pkg.github.com
```
