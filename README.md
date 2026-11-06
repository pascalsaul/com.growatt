# Growatt Advanced — independent Homey Pro integration

**Status: development preview, not published.**

A standalone community Homey integration for Growatt inverters, meters and battery systems. First verified focus: **SPH/MIX + ARK-XH** with extended **14 read-only BMS metrics**. Architecture retains Growatt model families for future validation.

- Permanent proposed Homey app ID: `nl.community.growattadvanced`
- Preview version: `0.1.0`
- Platforms: **Homey Pro (local)**; no Homey Cloud release in this stage
- Initial functionality: SPH/MIX inverter, battery, meter readings, additional BMS telemetry, read-only AC-charge settings diagnostic
- Future functionality (not ready): AC grid charging to target SOC via verified SPH-specific API, safe stop/restore and Homey/EMS interoperability
- Explicitly **not** an energy pricing / optimization engine: Homey Flows or Ultimate EMS may choose *when* to charge

## Independence and compatibility

This application has **its own Homey app ID** and can be installed alongside the existing `com.growatt` app. It does **not** overwrite that app, Robin's Test releases, existing devices or Insights. Historic Homey Insights are tied to the original devices and will **not be migrated** by this application.

**Do not pair the same inverter, battery or meter into both apps without reviewing energy accounting.** If doing a side-by-side trial, set **Exclude from Energy** on the new duplicate devices before using Homey Energy. Two separate apps querying the same Growatt API account can also add to API load and rate limiting. Prefer a short supervised test and avoid concurrent high-frequency polling.

## Distribution

The `product/growatt-advanced` branch is a temporary staging location in the existing GitHub fork. Our long-term target is a separate repository `pascalsaul/homey-growatt-advanced` with an independent **CI → Athom Draft → Test** release pipeline like the Orcon HRC Multizone project. A Homey Developer Personal Access Token must be configured as the `HOMEY_PAT` GitHub Actions secret in the destination repository. No token is committed to source control.

**Do not enable automatic Draft publishing** until the new app passes review for Athom's copycat guidelines and original-author attribution. This fork is GPL-3.0-or-later (original: [R.M. de Gruijter](https://github.com/gruijter/com.growatt)), but Athom independently asks for permission and clear differentiation before approving similar community apps.

## Development and validation

```sh
npm ci
npx homey app validate
npm test
```

Do not install the `custom/ark-xh` branch for this new app ID; `custom/ark-xh` remains the existing operational fork and does not change.

## Sources and license

Based on [gruijter/com.growatt](https://github.com/gruijter/com.growatt), GPL-3.0-or-later. Original authorship and copyright comments remain in source. See `LICENSE` and [BMS implementation](docs/BMS-CAPABILITIES.md).

See [architecture and release gates](docs/GROWATT-ADVANCED.md) and [read-only charge-setting diagnostics](docs/READ-CHARGE-SETTINGS.md).
