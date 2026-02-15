const REQUIRED_MAJOR = 20;
const current = process.versions.node;
const major = Number.parseInt(current.split('.')[0], 10);

if (!Number.isFinite(major)) {
  console.warn('[env] Unable to determine Node.js version.');
  process.exit(0);
}

if (major !== REQUIRED_MAJOR) {
  console.warn(
    `\n[env] Warning: Detected Node.js ${current}. This project is pinned to Node.js ${REQUIRED_MAJOR}.x via .nvmrc.\n` +
      '[env] Recommended: run "nvm use" before starting the app.\n',
  );
}
