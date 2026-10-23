'use strict';

const { hydrateOfficialCapabilities } = require('../../lib/arkxhLegacyAliases');
const growattMap = require('../../lib/growattMap');

const fake = (values, options = {}) => {
  const state = { values: { ...values }, options: { ...options }, writes: [] };
  return {
    state,
    driver: { manifest: { capabilitiesOptions: {
      measure_battery_soh: { uiComponent: null },
      measure_temperature_battery: { uiComponent: null },
    } } },
    hasCapability: (cap) => Object.prototype.hasOwnProperty.call(state.values, cap),
    getCapabilityValue: (cap) => state.values[cap],
    setCapabilityValue: async (cap, value) => {
      state.writes.push(`value:${cap}`);
      state.values[cap] = value;
    },
    getCapabilityOptions: (cap) => {
      if (!state.options[cap]) throw Error('Invalid Capability');
      return state.options[cap];
    },
    setCapabilityOptions: async (cap, val) => {
      state.writes.push(`options:${cap}`);
      state.options[cap] = val;
    },
    log: () => {},
    error: (msg, err) => { throw Error(`${msg} ${err}`); },
  };
};

module.exports = async (t) => {
  const sph = growattMap.battery2Map.sph;
  const sample = { bmsSOH: 98, batteryTemperature: 22.8 };
  t.eq(sph.measure_soh[1](sample), 98, 'upstream SOH remains the active reading');
  t.eq(sph.measure_temperature[1](sample), 22.8, 'upstream temperature remains the active reading');
  t.eq(sph.measure_battery_soh[1](sample), undefined, 'legacy SOH no longer writes new Insights points');
  t.eq(sph.measure_temperature_battery[1](sample), undefined, 'legacy temperature no longer writes new Insights points');

  const d = fake({
    measure_battery_soh: 98,
    measure_soh: null,
    measure_temperature_battery: 22.8,
    measure_temperature: null,
  });
  await hydrateOfficialCapabilities(d);
  t.eq(d.state.values.measure_soh, 98, 'official SOH seeded once from legacy value');
  t.eq(d.state.values.measure_temperature, 22.8, 'official temperature seeded once');
  t.eq(d.state.values.measure_battery_soh, 98, 'historical SOH unchanged');
  t.eq(d.state.values.measure_temperature_battery, 22.8, 'historical temperature unchanged');
  t.eq(d.state.options.measure_battery_soh.uiComponent, null, 'legacy SOH tile hidden, capability kept');
  t.eq(d.state.options.measure_temperature_battery.uiComponent, null, 'legacy temperature tile hidden, capability kept');
  await hydrateOfficialCapabilities(d);
  t.eq(d.state.writes.length, 4, 'subsequent initialization is idempotent');

  const existing = fake({
    measure_battery_soh: 98, measure_soh: 97,
    measure_temperature_battery: 22.8, measure_temperature: 23.2,
  });
  await hydrateOfficialCapabilities(existing);
  t.eq(existing.state.values.measure_soh, 97, 'existing upstream SOH never overwritten');
  t.eq(existing.state.values.measure_temperature, 23.2, 'existing upstream temperature never overwritten');

  const missing = fake({ measure_battery_soh: 98, measure_temperature_battery: 22.8 });
  await hydrateOfficialCapabilities(missing);
  t.eq(missing.state.writes.length, 0, 'no official capabilities, no migration writes');

  const invalid = fake({
    measure_battery_soh: NaN, measure_soh: null,
    measure_temperature_battery: null, measure_temperature: null,
  });
  await hydrateOfficialCapabilities(invalid);
  t.eq(invalid.state.values.measure_soh, null, 'never initialize from invalid SOH');
  t.eq(invalid.state.values.measure_temperature, null, 'never initialize from invalid temperature');
};
