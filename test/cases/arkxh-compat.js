'use strict';

/* The maintained ARK-XH add-on must never shadow upstream SOH/temperature.
 * Homey's migration removes retired device capabilities during this release;
 * the old definitions stay for one release so removeCapability still works.
 */
const map = require('../../lib/growattMap');
const DeviceMigrator = require('../../lib/DeviceMigrator');
const fs = require('node:fs');
const path = require('node:path');

const dropped = ['measure_battery_soh', 'measure_temperature_battery'];

module.exports = async (t) => {
  for (const old of dropped) {
    const file = path.join(__dirname, '..', '..', '.homeycompose', 'capabilities', `${old}.json`);
    t.ok(!fs.existsSync(file), `${old}: obsolete manifest definition deleted`);
  }
  const sph = map.battery2Map.sph;
  const sample = { bmsSOH: 98, batteryTemperature: 22.8 };
  t.eq(sph.measure_soh[1](sample), 98, 'only upstream measure_soh reads SOH');
  t.eq(sph.measure_temperature[1](sample), 22.8, 'only upstream measure_temperature reads battery temperature');

  for (const cap of dropped) {
    t.ok(!Object.prototype.hasOwnProperty.call(sph, cap), `${cap}: mapping removed`);
  }

  const desired = Object.keys(sph);
  t.ok(desired.includes('measure_battery_cycles'), 'BMS addon cycle count still mapped');
  t.ok(desired.includes('measure_voltage_cell_delta'), 'BMS addon cell voltage delta still mapped');

  const actual = [...desired, ...dropped];
  const state = { caps: [...actual], removed: [], added: [], available: true };
  const device = {
    homey: { __: (key) => key, setTimeout: (cb) => cb() },
    driver: { manifest: { capabilitiesOptions: {} } },
    getName: () => 'ARK-XH test battery',
    log: () => {},
    error: (err) => { throw err; },
    getAvailable: () => state.available,
    setAvailable: async () => { state.available = true; },
    setUnavailable: async () => { state.available = false; },
    getCapabilities: () => [...state.caps],
    getCapabilityValue: () => null,
    hasCapability: (cap) => state.caps.includes(cap),
    removeCapability: async (cap) => {
      state.removed.push(cap);
      state.caps = state.caps.filter((v) => v !== cap);
    },
    addCapability: async (cap) => {
      state.added.push(cap);
      state.caps.push(cap);
    },
  };
  const changed = await DeviceMigrator.migrateCapabilities(device, desired, { settleMs: 0 });
  t.ok(changed, 'legacy capabilities are removed through the normal migrator');
  t.ok(dropped.every((cap) => state.removed.includes(cap)), 'both deprecated capabilities removed');
  t.eq(state.added.length, 0, 'other BMS capabilities are not rebuilt');
  t.ok(desired.every((cap) => state.caps.includes(cap)), 'all retained and upstream capabilities survive');
  t.ok(state.available, 'device becomes available after migration');
};
