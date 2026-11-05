# EXPERIMENTAL: Charge to target SOC (SPH/MIX)

**Prototype / hardware not verified. Do not use unattended or install over your production Homey without a backup.**

The feature branch `feature/arkxh-charge-to-soc` adds two Flow actions:

- **EXPERIMENTAL: Charge battery until target SOC** — target SOC (20–100%), charge power (W) and a finite safety timeout (5–240 minutes)
- **EXPERIMENTAL: Stop battery charging**

No tariff-provider or spot-price logic is embedded: Homey Flows decide *when*, while the battery controller is responsible for the requested charge target, deadline and stop.

## Experimental VPP backend

This branch currently uses Growatt's v4 VPP calls `getVPP` / `setVPP`. It first reads master/remote control and prior timer/setpoint values. It rejects an already-active remote session. When explicitly enabled, the backend attempts a bounded remote power command (positive charging percentage); at the end it tries to disable and restore the original values.

**This is NOT yet a confirmed method for charging a Growatt SPH/MIX battery from the AC grid.** The suitable SPH-specific route may instead be the `mix_ac_charge_time_period` / Battery First setting with AC charging enabled, a stop-SOC and defined charge schedule. The SPH-specific write route is not yet implemented or verified using the existing Homey API token.

**The checkbox `arkxhExperimentalVppCharge` in the battery settings defaults to OFF.** Unless you explicitly turn it on, the Flow start action makes no control writes and returns a clear error.

The existing `setChargePowerTarget` method from upstream previously used an *unlimited* VPP charging time (0); this prototype deliberately passes a nonzero finite value. Do not rely on it as a physical fail-safe until the inverter's firmware behavior is confirmed.

## Session safeguards

- Only `battery2` devices with `deviceType=sph` are considered.
- Rejects missing or stale SOC telemetry, target already reached, battery charge-forbidden flag and BMS alarms, requests over the configured max charging power, duplicate starts, and durations outside 5–240 minutes.
- Stores the previous remote configuration and job deadline in Homey's persistent device storage before writes.
- Monitors SOC and the wall-clock deadline on each last-data update and with a 60-second watchdog. A stale data feed causes a stop attempt.
- A partial start triggers a rollback attempt. After a restart an unconfirmed or overdue session causes a stop attempt. Failed stops stay pending for retry.
- The backend depends on Growatt cloud/API availability. If writes fail, the inverter may need manual intervention. Do not leave the first physical test unattended.

## Before any live test

1. Take a Homey backup; record the inverter's battery mode, current charging schedule, AC Charge toggle, charging power limit and stop-SOC settings in ShinePhone/Growatt.
2. Install only from the feature branch into a controlled test environment. Verify Homey validation and all 14 BMS readings before enabling experimental control.
3. Examine the actual VPP readback values and verify SPH support. **If unsupported or unexpected: stop.**
4. Start a short low-power trial while observing battery, PV and grid power at the meter. A successful API response is not proof of grid charging.
5. Check that reaching the target SOC, the explicit stop action, the timeout, and interruption recovery actually restore normal inverter behavior.
6. If charging from the grid does not start, do not guess other VPP parameters. Build a verified SPH-specific Battery First / AC Charge backend instead.

Sources: [SPH settings reference](https://github.com/indykoning/PyPi_GrowattServer/blob/master/docs/openapiv1/sph_settings.md), [Growatt Battery First / AC Charge interface](https://server.growatt.com/commonDeviceSetC/setMix?lang=en&type=OSS).

**This feature branch has not been deployed to the user's Homey.** Production branch remains `custom/ark-xh`.
