# Read SPH/MIX charging configuration (read-only)

This diagnostic feature can query **Growatt OpenAPI V1** from the Homey app using the existing account token. It reads:
`GET /v1/device/mix/mix_data_info?device_sn=...`.

It does **not** call any set/write API and does not modify battery charge priority, AC charging, SOC targets or time periods.

## How to use

1. Install this read-only feature branch on your Homey Pro with the usual `homey app install`. The installed app ID is still `com.growatt` and the battery device does not need to be re-paired.
2. Create an Advanced Flow with the **Then** action **Read SPH/MIX charge settings (read-only)** and select the SPH/MIX battery.
3. Run the Flow. The **Sanitized charge settings (JSON)** text token can be connected to your own notification or inspection action. The same sanitized summary is written in the app developer logs.
4. Share **only the sanitized JSON summary**, never the raw Growatt API response or a complete unredacted diagnostics report.

The summary includes AC charging enabled/disabled (or unknown), inverter priority code (not interpreted into a mode without verification), charge power percentage, configured stop-SOC and up to three charge/discharge time slots. It intentionally omits serial numbers, API tokens, account metadata, datalogger and location information.

**Missing values remain `null`** — this is not proof the corresponding setting is off. Some Growatt firmware revisions/API tokens may reject the OpenAPI V1 read operation. If so the action returns an error and does not attempt any write or fallback that changes settings.

The `custom/ark-xh` production branch is unchanged. The separate [experimental charge-to-SOC PR #6](https://github.com/pascalsaul/com.growatt/pull/6) remains Draft; do not enable unverified VPP charging.

Reference: https://github.com/indykoning/PyPi_GrowattServer/blob/master/docs/openapiv1/sph_settings.md
