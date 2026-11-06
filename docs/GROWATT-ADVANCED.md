# Growatt Advanced: independent integration and release gates

## Product identity
- Name: **Growatt Advanced**
- App ID: `nl.community.growattadvanced` (a new installation, independent of `com.growatt`)
- Version: `0.1.0` (new app release history)
- Supports Homey Pro / local platform initially, not Homey Cloud
- First validated hardware: Growatt SPH/MIX with ARK-XH stack
- **Architecture is not tied to ARK-XH**: `deviceType` mappings and drivers remain available for future Growatt families, with explicit feature gating per hardware

## Existing capabilities, preserved on the new device
The 14 additional BMS capabilities stay at their established IDs, unchanged. They are read-only and offer Insights history **from the time the new devices are paired**; history stored on existing `com.growatt` devices is not copied.

## Coexistence protocol
1. Do not remove or repair existing `com.growatt` devices. Keep original Insights and Flows.
2. A second instance reading the same serial can cause API rate limits. Do not let both installations perform intensive polling.
3. When testing both apps, exclude the **new** duplicate devices from Homey Energy (device → Advanced Settings → Exclude from Energy) to prevent energy double counting.
4. Compare the 14 new BMS metrics and existing inverter/meter capabilities.
5. Switch over only after a planned cutover. Keep old devices for historical Insights until retention/export policy is chosen.

## Commands and tariff integrations
- **Do not ship unverified VPP writes as AC-grid-charge control**. The experimental VPP transport from PR #6 remains separate.
- A future SPH charge adapter must read current Battery First / AC Charge values, create a finite charge window, support target SOC, stop reliably, and restore settings after failures/restart, with actual inverter measurements verifying grid charging.
- Price calculation, dynamic tariff selection and scheduling belong to Homey Flows / existing EMS tools, not this app.

## Release and intellectual property
- This is a materially extended integration focused on SPH/MIX diagnostics and planned charging; Athom's **copycat rule** still applies. Ask original author for permission/attribution and describe the differentiation to Athom before submission.
- GPL-3.0-or-later remains intact; the original source and copyright notices are preserved.
- The automation workflow stays disabled unless the repo variable `GROWATT_ADVANCED_DRAFT_ENABLED=true` and its `HOMEY_PAT` secret are explicitly configured.
- `product/growatt-advanced` is **only a staging branch**, not the permanent separately administered GitHub repository.

## Release checklist
- [ ] Homey publish-level validation + all unit tests pass
- [ ] Confirm API read-only diagnostics on user's actual SPH/MIX
- [ ] Check app ID uniqueness in Homey Developer Portal
- [ ] Set up permanent separate GitHub repository and developer support URL
- [ ] Document upstream attribution and obtain required permissions / clear Athom review
- [ ] Enable secure GitHub Actions Draft publishing with HOMEY_PAT
- [ ] Publish Test link only when approved and safe
- [ ] Avoid duplicated Homey Energy readings on trial devices
