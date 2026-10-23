# Growatt Homey — community ARK-XH BMS fork

This repository is a fork of [gruijter/com.growatt](https://github.com/gruijter/com.growatt), the Growatt integration for Homey.

## Looking for the ARK-XH BMS extension?

**Use the maintained [`custom/ark-xh` branch](https://github.com/pascalsaul/com.growatt/tree/custom/ark-xh)**. It includes the upstream Growatt application plus **14 additional read-only BMS telemetry capabilities** for compatible SPH/MIX + ARK-XH battery installations.

**Do not install the code from this default `main` branch.** This branch contains the upstream-sync scheduler and is not the deployed ARK-XH release branch.

### Documentation

- [Project overview and compatibility](https://github.com/pascalsaul/com.growatt/blob/custom/ark-xh/README.md)
- [Installation and upgrades](https://github.com/pascalsaul/com.growatt/blob/custom/ark-xh/docs/INSTALLATION.md)
- [All 14 BMS capabilities and API fields](https://github.com/pascalsaul/com.growatt/blob/custom/ark-xh/docs/BMS-CAPABILITIES.md)
- [Troubleshooting](https://github.com/pascalsaul/com.growatt/blob/custom/ark-xh/docs/TROUBLESHOOTING.md)
- [Nederlandse snelstart](https://github.com/pascalsaul/com.growatt/blob/custom/ark-xh/docs/INSTALLATIE-NL.md)
- [Maintenance and upstream sync](https://github.com/pascalsaul/com.growatt/blob/custom/ark-xh/docs/ARK-XH-MAINTENANCE.md)

The original upstream app provides Battery health (SOH), battery temperature, and connectivity alarm in its Growatt 2.6.0 code. The fork adds **14 other** BMS values and alarms; it does not redefine those three upstream measurements.

The app ID remains `com.growatt`. Developer installs are updates to the existing Homey integration, not a separate independent app. Back up important Insights and devices before changing app versions.

[Upstream repository](https://github.com/gruijter/com.growatt) · [Upstream contribution PR #23](https://github.com/gruijter/com.growatt/pull/23) · [Fork issues](https://github.com/pascalsaul/com.growatt/issues)

This is an unofficial community fork and is not affiliated with Growatt, Athom, or the upstream maintainer.
