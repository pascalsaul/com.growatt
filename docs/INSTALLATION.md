# Installation and upgrades — Growatt ARK-XH Homey fork

[← Project overview](../README.md) · [BMS capabilities](BMS-CAPABILITIES.md) · [Troubleshooting](TROUBLESHOOTING.md) · [Nederlandse snelstart](INSTALLATIE-NL.md)

## Before you begin

This fork is based on the Growatt Homey app and has the **same app ID: `com.growatt`**. It should be treated as an **update of an existing Growatt app**, not a second independent app.

You need a supported **Homey Pro** capable of local developer app installation, an already functional Growatt connection, Git, and **Node.js 22 or newer** (the app's `package.json` requires Node ≥22). You also need access to the Homey account that owns the Homey Pro and an authenticated Homey CLI.

**Important:** Before switching from the App Store version, or switching back, take a Homey backup. Adding and removing capabilities can change Flows and Homey Insights history; do not delete, uninstall, or re-pair existing inverter or battery devices merely to deploy this fork.

This project has been tested on a Growatt SPH/MIX + ARK-XH battery configuration; it is not guaranteed to expose BMS telemetry for other device types.

## Windows PowerShell — first installation

Install [Node.js](https://nodejs.org/) 22+ and [Git](https://git-scm.com/) if required, then open PowerShell:

```powershell
node --version
git --version
npm.cmd install --global homey
homey.cmd login
homey.cmd select
```

Sign in with the same account as your Homey. Select the correct Homey Pro when prompted.

Clone **the maintained branch** (the repository's default `main` branch is not the app to install):

```powershell
cd C:\Temp
git clone -b custom/ark-xh https://github.com/pascalsaul/com.growatt.git com.growatt-arkxh
cd .\com.growatt-arkxh

npm.cmd ci
node -p "require('./package.json').version"
homey.cmd app validate
npm.cmd test
homey.cmd app install
```

The displayed version is the **upstream app version**, not a separate fork version. The fork can include additional commits while the `package.json` version stays the same.

`homey.cmd app install` deploys the development build to your selected Homey. It **does not publish** to the Homey App Store. Verify the selected Homey before running it.

### macOS or Linux

The process is the same, using `npm` and `homey` instead of the Windows `.cmd` commands:

```bash
npm install --global homey
homey login
homey select
git clone -b custom/ark-xh https://github.com/pascalsaul/com.growatt.git com.growatt-arkxh
cd com.growatt-arkxh
npm ci
homey app validate
npm test
homey app install
```

## Upgrading an existing fork installation

In your existing clean checkout:

```powershell
git switch custom/ark-xh
git fetch origin
git pull --ff-only origin custom/ark-xh
npm.cmd ci
homey.cmd app validate
npm.cmd test
homey.cmd app install
```

Run these commands only after reviewing the release/commit changes. If `git pull --ff-only` fails, inspect `git status` and local changes rather than forcing a reset. Prefer a separate clean clone for testing if you have changed the code or run `npm audit fix` locally.

**Do not use `npm audit fix` as part of ordinary installation.** It changes the resolved dependencies/lockfile and can make your local build differ from the tested GitHub commit. Dependency security changes should be reviewed separately.

## Verify the installation

1. In Homey, check that your existing inverter and battery devices are still present; **do not re-pair** them.
2. Open the battery device. Check the upstream Battery health (`measure_soh`), Temperature (`measure_temperature`) and the added BMS cycle count, cell voltages, current limits and alarms.
3. Look at **Homey Insights** for the new BMS readings. Custom metrics should be available as separate series when supported data is present.
4. Check your existing Flows and the Homey Energy view.
5. If the small Homey device tile shows temperature rather than battery power, check the device's **Status indicator** setting and choose Power (`measure_power`).

Readings may remain blank if the Growatt `getLastData` response does not include their respective field. Do not assume that every SPH/MIX firmware exposes every ARK-XH diagnostic.

## Compatibility with older fork versions

The custom `measure_battery_soh` and `measure_temperature_battery` capabilities were removed in **two installation stages**. If you have an older fork build that still contains either capability, see [the two-stage migration notes](ARK-XH-MAINTENANCE.md#soh-and-temperature-use-upstream-capabilities) **before installing the latest cleanup directly**. Removing these capabilities can erase their former Insights history and break Flows targeting those old IDs.

If you have never used those obsolete custom IDs, the special two-stage cleanup is not relevant to you.

## Uninstalling / returning to upstream

This fork uses the original `com.growatt` app ID. Changing back to the upstream App Store version may remove fork-only capabilities and affect existing Flows and Insights. Make a backup and export important histories first; check the version and device migration effects before switching. Simply uninstalling/re-pairing is **not** a safe rollback procedure.

The app and any associated cloud data follow the normal permissions and data handling of the upstream Growatt integration. **Never share your Growatt API token in public issues.**

## References

- [Homey Apps SDK — Getting started](https://apps.developer.homey.app/the-basics/getting-started)
- [Maintainer/update strategy](ARK-XH-MAINTENANCE.md)
