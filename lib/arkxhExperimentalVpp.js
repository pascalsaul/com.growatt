/*
 * EXPERIMENTAL VPP transport only. Hardware verification of this route for
 * SPH/MIX AC GRID CHARGING is still outstanding. Do not enable by default.
 * GPL-3.0-or-later.
 */
'use strict';

const READ_FIELDS = ['set_param_1', 'set_param_25', 'set_param_26', 'set_param_27'];

const integerValue = (result) => {
  const candidates = [result, result?.value, result?.paramValue, result?.setValue,
    result?.data, result?.data?.value, result?.data?.paramValue, result?.result?.value];
  for (const value of candidates) {
    if ((typeof value === 'string' && value.trim() !== '') || typeof value === 'number') {
      const num = Number(value);
      if (Number.isInteger(num)) return num;
    }
  }
  throw Error('Unexpected VPP readback format; no charging settings were changed.');
};

class ExperimentalVppBackend {
  constructor(device) {
    this.device = device;
  }

  options(setType) {
    return { deviceSn: this.device.deviceSn, deviceType: this.device.deviceType, setType };
  }

  async read(field) {
    return integerValue(await this.device.growatt.getVPP(this.options(field)));
  }

  async write(field, val) {
    return this.device.growatt.setVPP({
      deviceSn: this.device.deviceSn,
      deviceType: this.device.deviceType,
      value: { setType: field, value: String(val) },
    });
  }

  async prepare() {
    if (this.device.deviceType !== 'sph') throw Error('VPP experimental backend is SPH/MIX-only.');
    const previous = {};
    for (const field of READ_FIELDS) {
      // eslint-disable-next-line no-await-in-loop
      previous[field] = await this.read(field);
    }
    if (![0, 1].includes(previous.set_param_1) || previous.set_param_25 !== 0) {
      throw Error('Existing remote control state is unknown or already active; refusing to take control.');
    }
    if (previous.set_param_26 < 0 || previous.set_param_26 > 1440
        || previous.set_param_27 < -100 || previous.set_param_27 > 100) {
      throw Error('Unexpected VPP setpoint; refusing to overwrite inverter settings.');
    }
    return previous;
  }

  async begin(state) {
    // This command sequence is VPP power control, NOT a verified SPH
    // AC-grid charging command. A successful API response is not proof of
    // grid charging. Requires live confirmation on the target hardware.
    const limit = Number(this.device.getSettings().maxChargePower);
    const pct = Math.round((state.powerWatts / limit) * 100);
    if (!Number.isInteger(pct) || pct < 1 || pct > 100) throw Error('Unsafe VPP charging percentage.');
    if (state.snapshot.set_param_1 === 0) await this.write('set_param_1', 1);
    await this.write('set_param_26', state.maxMinutes); // finite inverter-side timeout, not 0 (unlimited)
    await this.write('set_param_27', pct); // positive = charge; NEVER negative = discharge
    await this.write('set_param_25', 1); // enable last, after setting timer and power
  }

  async end(state) {
    // The stop operation is deliberately retryable and may be called after
    // a partial begin (or Homey restart). Never set an indefinite duration.
    await this.write('set_param_25', 0);
    await this.write('set_param_27', 0);
    await this.write('set_param_26', state.snapshot.set_param_26);
    if (state.snapshot.set_param_1 === 0) await this.write('set_param_1', 0);
  }
}

module.exports = { ExperimentalVppBackend, integerValue };
