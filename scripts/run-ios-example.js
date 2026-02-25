#!/usr/bin/env node

const { execSync, spawnSync } = require('node:child_process');

function listAvailableSimulators() {
  const json = execSync('xcrun simctl list devices available --json', {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const parsed = JSON.parse(json);
  const devicesByRuntime = parsed.devices || {};

  return Object.values(devicesByRuntime)
    .flat()
    .filter((device) => device && device.isAvailable !== false)
    .filter((device) => /iPhone|iPad/i.test(device.name));
}

function pickSimulator(devices) {
  const bootedIPhone = devices.find(
    (device) => device.state === 'Booted' && /iPhone/i.test(device.name),
  );
  if (bootedIPhone) {
    return bootedIPhone;
  }

  const bootedIPad = devices.find(
    (device) => device.state === 'Booted' && /iPad/i.test(device.name),
  );
  if (bootedIPad) {
    return bootedIPad;
  }

  const anyIPhone = devices.find((device) => /iPhone/i.test(device.name));
  if (anyIPhone) {
    return anyIPhone;
  }

  return devices[0] || null;
}

function run() {
  let simulator = process.env.IOS_SIMULATOR;

  if (!simulator) {
    const devices = listAvailableSimulators();
    const selected = pickSimulator(devices);

    if (!selected) {
      console.error('No available iOS simulator found.');
      process.exit(1);
    }

    simulator = selected.udid;
    console.log(`Using simulator: ${selected.name} (${simulator})`);
  } else {
    console.log(`Using simulator from IOS_SIMULATOR: ${simulator}`);
  }

  const result = spawnSync('npx', ['react-native', 'run-ios', '--udid', simulator], {
    stdio: 'inherit',
  });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  process.exit(result.status ?? 0);
}

run();
