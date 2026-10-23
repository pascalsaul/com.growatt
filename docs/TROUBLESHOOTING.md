# Troubleshooting — Growatt ARK-XH Homey fork

[← Project overview](../README.md) · [Installation](INSTALLATION.md) · [Capability reference](BMS-CAPABILITIES.md)

## I installed the fork but the ARK-XH fields are missing

- Confirm you installed **`custom/ark-xh`** rather than the repository default `main`.
- Check the Git working directory and run `node -p "require('./package.json').version"`. The baseline is Growatt 2.6.0; subsequent fork commits may not increment this upstream version.
- Check that your Homey battery is a supported `battery2` device with SPH/MIX (`sph`) mapping. The extra mapping is **not** applied to every Growatt device.
- Confirm your Growatt cloud/API connection is working and the battery's standard state-of-charge and power data update.
- Make sure the Growatt `getLastData` payload actually contains the requested `bms...` or cell fields. Availability differs by model and firmware.

If basic data works but a few BMS readings remain blank, that may mean the API omits those fields; it does not always mean the Homey app failed to install.

## Battery health or battery temperature is blank

SOH and battery temperature are **standard upstream 2.6.0 fields**:
- `measure_soh` reads `bmsSOH`.
- `measure_temperature` reads `batteryTemperature`.

Allow the next Growatt data update. If a value remains blank, check whether the data payload includes the corresponding field. The custom aliases of earlier test builds have been intentionally removed.

## The Homey device tile shows °C instead of battery power

Homey may choose a different **Status indicator** after a capability migration. In the battery device settings, select **Power** (`measure_power`) if you want the compact device tile to show watts rather than temperature. This is a Homey device preference, not a data-mapping error.

## Connectivity alarm stays blank / is raised

`alarm_connectivity` comes from **upstream Growatt**, not the 14-value ARK-XH module. Upstream derives it from the last known cloud upload time. A blank value can indicate insufficient upload-time data; a raised alarm can indicate stale connectivity. Do not force "No" if upstream cannot determine the state.

## Existing device shows "Migrating" or a capability error

This fork retains the Homey app ID `com.growatt`. Capabilities are reconciled against the installed device at startup; migrations may take time. Do **not** uninstall the app or delete and re-pair devices as your first recovery step.

If upgrading from an **old experimental fork** with `measure_battery_soh` or `measure_temperature_battery`, follow the [two-stage migration procedure](ARK-XH-MAINTENANCE.md#soh-and-temperature-use-upstream-capabilities). Removing a custom capability's *definition* too early can lead to "Invalid Capability" when Homey tries to remove the capability itself.

If the device remains unavailable, collect a redacted Homey app diagnostics report and check which migration or Growatt API action failed.

## Insights graphs disappeared when switching branches

Insights history is tied to the Homey device and **capability ID**. Removing or replacing custom capabilities can remove their historical series; renaming a display title is not a database migration. Back up/export important histories before changing the installed app's capability set.

The official SOH and temperature readings have their own capability IDs and therefore are not direct continuations of the experimental custom fields.

## npm audit reports vulnerabilities

Dependency audit warnings can include upstream dependencies and development tools. Avoid blindly running `npm audit fix` in your installation checkout: it may change `package-lock.json` and the installed dependency tree independently of the reviewed fork. Use `npm ci` from a clean checkout for a reproducible installation; investigate security issues in a separate review.

## Reporting problems

Use [this fork's GitHub Issues](https://github.com/pascalsaul/com.growatt/issues) for problems specific to the ARK-XH extension. Include:
- Growatt inverter / battery family and relevant firmware **without serial numbers**
- Homey model and OS version
- Fork branch/commit and installation method
- Which capability ID is missing or unexpected
- A small, **redacted** excerpt of the Homey diagnostics showing the relevant API field (not the entire private API payload)

Never post your Growatt API token, account credentials, public IP, street address, device serial number or unredacted diagnostic reports.

For baseline Growatt functionality, consult the [upstream repository](https://github.com/gruijter/com.growatt).
