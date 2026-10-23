# ARK-XH BMS capabilities

[← Project overview](../README.md) · [Installation](INSTALLATION.md) · [Troubleshooting](TROUBLESHOOTING.md)

## Scope

This fork adds exactly **14 read-only Homey capabilities** to Growatt `battery2` devices with a supported `sph` (SPH/MIX) mapping. These fields come from Growatt's cloud `getLastData` payload. All 14 extra definitions are marked with `getable: true`, `setable: false` and `insights: true`. The mappings live in [`lib/arkxhBmsMap.js`](../lib/arkxhBmsMap.js).

The field names and conversion logic below reflect the source code. Availability depends on the inverter, connected battery stack, firmware and API response. No measurements are created for non-SPH device types by this add-on.

## Numerical readings (11)

| Homey capability ID | Display label | Unit | Growatt response field / rule |
| --- | --- | --- | --- |
| `measure_battery_cycles` | Battery cycles | cycles | `bmsCycleCnt` |
| `measure_voltage_battery` | Battery voltage | V | First reported of `vbat`, `bmsBatteryVolt`, `vBatDsp` |
| `measure_current_battery` | Battery current | A | `bmsBatteryCurr` |
| `measure_temperature_bms` | BMS temperature | °C | `bmsBatteryTemp` |
| `measure_voltage_cell_min` | Min cell voltage | V | `minSingleCellVolt` |
| `measure_voltage_cell_max` | Max cell voltage | V | `maxSingleCellVolt` |
| `measure_voltage_cell_delta` | Cell voltage delta | V | `maxSingleCellVolt - minSingleCellVolt` (rounded to 0.001 V) |
| `measure_temperature_cell_min` | Min cell temperature | °C | `minSingleCellTem` |
| `measure_temperature_cell_max` | Max cell temperature | °C | `maxSingleCellTem` |
| `measure_current_charge_limit` | Charge current limit | A | `bmsMaxCurr` |
| `measure_current_discharge_limit` | Discharge current limit | A | `bmsMaxDischgCurr` |

The "Cell voltage delta" is computed from the reported minimum and maximum single-cell voltages. It is **not** taken from a possibly different BMS-reported delta field. This is useful for observing voltage spread over time but is not by itself a diagnosis of battery health.

Current-limit values are telemetry from the BMS, **not setpoints that Homey can change**. Battery current sign conventions and returned unit scales should be checked for the specific hardware before using them for automations.

## BMS alarms (3)

| Homey capability ID | Display label | Condition |
| --- | --- | --- |
| `alarm_battery_charge_forbidden` | Charge forbidden | `chargeForbiddenMark === 1` |
| `alarm_battery_discharge_forbidden` | Discharge forbidden | `dischargeForbiddenMark === 1` |
| `alarm_bms_error` | BMS error | Any nonzero value in `bmsError`, `bmsError2`, `bmsError3`, `bmsProtection`, `batErrorUnion`, `faultCode`, `errorCode`, `warnCode` |

**Implementation caveat:** the current alarm mappings treat missing flag/error fields as zero (not raised). Therefore, `false` / "No" does **not** independently prove that the BMS has no active fault when diagnostic fields are unavailable. The aggregate BMS alarm also includes warnings; it is a convenience indicator, not a certified protection or emergency stop.

## Provided by upstream — deliberately not duplicated

Growatt upstream **2.6.0** already implements:

| Official Homey capability | Description | SPH/MIX API field |
| --- | --- | --- |
| `measure_soh` | Battery health / state of health | `bmsSOH` |
| `measure_temperature` | Battery temperature | `batteryTemperature` |
| `alarm_connectivity` | Connectivity alarm | Derived by upstream from upload-timestamp freshness |

The fork's earlier experimental `measure_battery_soh` and `measure_temperature_battery` IDs are **removed**. They should not be added back: the aim is to be an add-on to the official Growatt implementation, not to maintain parallel historical SOH and temperature fields.

## Insights and automations

Because the 14 additional readings are configured for Insights, they can be graphed when Homey receives valid values. The measured values are refreshed when Growatt publishes its `getLastData` records and Homey polls them; do not assume a fixed physical sample frequency.

Typical examples include tracking **minimum-to-maximum cell voltage spread**, BMS thermal conditions, charge/discharge current limits and cycle-count progression. Use the alarm fields only as supplementary indicators, not as a safety-critical protection system.

For diagnostics, see [Troubleshooting](TROUBLESHOOTING.md). If reporting an issue, redact API tokens, battery serial numbers and personally identifying information.
