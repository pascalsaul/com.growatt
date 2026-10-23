/* Keep the historical ARK-XH Insights capabilities while preferring official Homey
 * measure_soh and measure_temperature for display. No capability is deleted or
 * renamed: Homey Insights history is tied to the old capability IDs.
 */
'use strict';

const ALIASES = [
  ['measure_battery_soh', 'measure_soh'],
  ['measure_temperature_battery', 'measure_temperature'],
];

const hydrateOfficialCapabilities = async (device) => {
  for (const [legacy, official] of ALIASES) {
    if (!device.hasCapability(legacy) || !device.hasCapability(official)) continue;

    // Seed only a NEW/empty official field, never overwrite an already-reported value.
    // Both capabilities continue to be updated from the same Growatt lastData fields.
    const current = device.getCapabilityValue(official);
    const previous = device.getCapabilityValue(legacy);
    if (current == null && typeof previous === 'number' && Number.isFinite(previous)) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await device.setCapabilityValue(official, previous);
        device.log(`Initialized ${official} from historical ${legacy}: ${previous}`);
      } catch (error) {
        device.error(`Could not initialize ${official} from ${legacy}`, error);
      }
    }

    // Hide the two duplicate tiles; retain both capability IDs, their values,
    // their Flows and their Homey Insights history.
    let options;
    try {
      options = device.getCapabilityOptions(legacy);
    } catch {
      // Homey can throw for capabilities that do not yet have live options.
      options = undefined;
    }
    if (options?.uiComponent === null) continue;
    try {
      // eslint-disable-next-line no-await-in-loop
      await device.setCapabilityOptions(legacy, {
        ...(device.driver?.manifest?.capabilitiesOptions?.[legacy] || {}),
        uiComponent: null,
      });
    } catch (error) {
      device.error(`Could not hide legacy tile ${legacy}`, error);
    }
  }
};

module.exports = { hydrateOfficialCapabilities };
