/*
 * Read-only whitelist of SPH/MIX charge and discharge settings from Growatt.
 * NEVER log the unfiltered v1 detail response: it includes device identifiers.
 * GPL-3.0-or-later.
 */
'use strict';

const FIELD_GROUPS = Object.freeze({
  charge: ['priorityChoose', 'acChargeEnable', 'chargePowerCommand',
    'wchargeSOCLowLimit', 'wchargeSOCLowLimit1', 'wchargeSOCLowLimit2'],
  discharge: ['disChargePowerCommand', 'wdisChargeSOCLowLimit1', 'wdisChargeSOCLowLimit2'],
});

const numberOrNull = (value) => {
  if (value === null || value === undefined || value === '' || value === 'null') return null;
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const timeOrNull = (value) => {
  if (value === null || value === undefined || value === '' || value === 'null') return null;
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const text = String(value).trim();
  const match = /^(\d{1,2}):(\d{1,2})(?::\d{1,2})?$/.exec(text);
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  return h < 24 && m < 60 ? `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}` : null;
};

const configValue = (data, field) => {
  if (!Object.prototype.hasOwnProperty.call(data, field)) return null;
  return numberOrNull(data[field]);
};

const periods = (data, type) => [1, 2, 3].map((slot) => ({
  slot,
  start: timeOrNull(data[`forced${type}TimeStart${slot}`]),
  end: timeOrNull(data[`forced${type}TimeStop${slot}`]),
  enabled: (() => {
    const code = configValue(data, `forced${type}StopSwitch${slot}`);
    return code === 1 ? true : code === 0 ? false : null;
  })(),
}));

const summarizeSphChargeSettings = (response) => {
  // Accept either already-unwrapped v1 detail or a { data } wrapper.
  const data = response?.data && typeof response.data === 'object'
    ? response.data : response;
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw Error('Invalid SPH settings response');
  }
  const charge = Object.fromEntries(FIELD_GROUPS.charge.map((field) => [field, configValue(data, field)]));
  const discharge = Object.fromEntries(FIELD_GROUPS.discharge.map((field) => [field, configValue(data, field)]));
  const known = Object.keys(data).filter((field) => FIELD_GROUPS.charge.includes(field)
    || FIELD_GROUPS.discharge.includes(field) || /^forced(Charge|Discharge)(Time(Start|Stop)|StopSwitch)[123]$/.test(field));
  if (known.length === 0) {
    throw Error('SPH detail response contains no recognized charging configuration fields');
  }
  return {
    source: 'Growatt OpenAPI V1 SPH/MIX detail (read-only)',
    charge: {
      ...charge,
      acChargeEnabled: charge.acChargeEnable === 1 ? true : charge.acChargeEnable === 0 ? false : null,
      periods: periods(data, 'Charge'),
    },
    discharge: { ...discharge, periods: periods(data, 'Discharge') },
    availableFieldCount: known.length,
  };
};

module.exports = { summarizeSphChargeSettings, numberOrNull, timeOrNull };
