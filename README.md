# Growatt Homey — ARK-XH BMS telemetry add-on

**Community-maintained fork of [gruijter/com.growatt](https://github.com/gruijter/com.growatt), with 14 additional BMS capabilities for compatible Growatt SPH/MIX + ARK-XH battery installations.**

This fork keeps the original Homey app ID (`com.growatt`) and the upstream app functionality. It adds **read-only battery diagnostics** from the Growatt `getLastData` response to the `battery2` device. The extra capabilities support Homey Insights and are not used to control the battery.

> **Install from [`custom/ark-xh`](https://github.com/pascalsaul/com.growatt/tree/custom/ark-xh), NOT the default `main` branch.** The default branch is used for the automated synchronization workflow and is not the deployable ARK-XH variant.

## Start here

- **[Installation and upgrades](docs/INSTALLATION.md)** — Windows PowerShell instructions, Homey CLI, upgrading without removing devices, and rollback considerations.
- **[All 14 BMS capabilities](docs/BMS-CAPABILITIES.md)** — names, units, Growatt API fields, and interpretation notes.
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** — missing readings, app version, connectivity alarms, Insights and migration issues.
- **[Nederlandse snelstart](docs/INSTALLATIE-NL.md)** — de belangrijkste installatie- en updatecommando's.
- **[Maintainer guide](docs/ARK-XH-MAINTENANCE.md)** — branch strategy, automated upstream sync and update reviews.

## What this fork adds

| Group | Additional measurements |
| --- | --- |
| Battery state | Cycle count, battery voltage, battery current |
| Battery management | BMS temperature, charge current limit, discharge current limit |
| Cell health | Minimum and maximum cell voltage, voltage difference, minimum and maximum cell temperature |
| BMS alarms | Charging forbidden, discharging forbidden, aggregate BMS error/warning flag |

That is **14 custom capabilities**: 11 numerical readings and 3 boolean alarms.

**Battery health (SOH)**, **battery temperature**, and **connectivity alarm** are already part of the upstream Growatt 2.6.0 app and are deliberately **not duplicated** here. The original custom SOH and battery-temperature capabilities were removed as part of a staged migration.

## Compatibility and limitations

- Developed and tested with a **Growatt SPH/MIX-type installation with an ARK-XH high-voltage battery stack**, through the cloud-backed `battery2` driver (`sph` mapping).
- Other Growatt models, battery generations, firmware revisions and API accounts may return different field sets. Additional compatibility is **not** claimed without testing.
- The battery and inverter must already be accessible through the normal Growatt Homey pairing/API flow.
- This is a **developer-installed, unofficial fork**, not a separate app in the Homey App Store. Do not install it alongside the original app as if it had a different app ID: both use `com.growatt`.
- Each change in upstream code is proposed for review and validation before inclusion. Installing a development build does not automatically deploy future commits to your Homey.

## Development and upstream

- Upstream: [gruijter/com.growatt](https://github.com/gruijter/com.growatt).
- Original contribution: [upstream ARK-XH BMS PR #23](https://github.com/gruijter/com.growatt/pull/23).
- Stable fork code: [`custom/ark-xh`](https://github.com/pascalsaul/com.growatt/tree/custom/ark-xh).
- Underlying telemetry mapping: [`lib/arkxhBmsMap.js`](lib/arkxhBmsMap.js).
- App license: see [LICENSE](LICENSE); upstream copyright and credit remain in place.

For support, [open an issue on this fork](https://github.com/pascalsaul/com.growatt/issues) for ARK-XH-specific problems. Please **remove serial numbers, location information, API tokens and credentials** from logs and screenshots before publishing them.

_This community fork is not affiliated with Growatt, Athom, or the upstream maintainer._
