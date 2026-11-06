'use strict';
const { summarizeSphChargeSettings, numberOrNull, timeOrNull } = require('../../lib/arkxhReadChargeSettings');
const Api = require('../../lib/growatt_api');
const fs = require('node:fs');
const path = require('node:path');
const testRoot = path.join(__dirname, '..', '..');

module.exports = async (t) => {
  const sample = {
    serialNum: 'SECRET-SERIAL', dataLogSn: 'SECRET-LOGGER', apiToken: 'SECRET-TOKEN', location: 'SECRET-ADDRESS',
    priorityChoose: 2, acChargeEnable: '1', chargePowerCommand: '40',
    wchargeSOCLowLimit: '80', wchargeSOCLowLimit1: 12,
    forcedChargeTimeStart1: '1:05', forcedChargeTimeStop1: '03:40', forcedChargeStopSwitch1: 1,
    forcedChargeTimeStart2: '16:15', forcedChargeTimeStop2: '17:00', forcedChargeStopSwitch2: 0,
    forcedDischargeTimeStart1: '12:10', forcedDischargeTimeStop1: '13:20', forcedDischargeStopSwitch1: 1,
  };
  const summary = summarizeSphChargeSettings(sample);
  const json = JSON.stringify(summary);
  t.eq(summary.charge.acChargeEnabled, true, 'AC charge enabled state captured');
  t.eq(summary.charge.chargePowerCommand, 40, 'read charge power');
  t.eq(summary.charge.wchargeSOCLowLimit, 80, 'read stop SOC');
  t.eq(summary.charge.priorityChoose, 2, 'priorityChoose preserved as raw numeric code');
  t.eq(summary.charge.periods[0].start, '01:05', 'charge start time normalized');
  t.eq(summary.charge.periods[0].enabled, true, 'charge slot enabled');
  t.eq(summary.charge.periods[1].enabled, false, 'charge slot disabled');
  t.eq(summary.discharge.periods[0].start, '12:10', 'discharge slot included to help restore mode');
  t.ok(!json.includes('SECRET'), 'report strips all identifiers, accounts, and secrets');
  t.ok(!Object.keys(summary).includes('serialNum'), 'raw device serial omitted');
  t.eq(summarizeSphChargeSettings({ data: sample }).charge.acChargeEnabled, true, 'wrapped data accepted');
  t.eq(summarizeSphChargeSettings({ acChargeEnable: 0 }).charge.acChargeEnabled, false, 'zero means disabled');
  t.eq(summarizeSphChargeSettings({ acChargeEnable: 'null' }).charge.acChargeEnabled, null, 'unknown does not imply disabled');
  t.eq(summarizeSphChargeSettings({ acChargeEnable: '0' }).charge.acChargeEnabled, false, 'zero string means disabled');
  t.eq(numberOrNull(''), null, 'missing number is unknown');
  t.eq(timeOrNull('25:00'), null, 'bad time is unknown');
  let rejected = false;
  try { summarizeSphChargeSettings({ serialNum: 'ONLY-ID' }); } catch (err) { rejected = /no recognized/.test(err.message); }
  t.ok(rejected, 'unexpected response structure fails closed');
  const client = Object.create(Api.prototype);
  let call;
  client._makeRequest = async (endpoint, data) => { call = { endpoint, data }; return { data: sample }; };
  const fetched = await client.getSphChargeSettings({ deviceSn: 'SPH-MOCK' });
  t.eq(fetched.acChargeEnable, '1', 'SPH detail read returns settings');
  t.eq(call.endpoint, '/v1/device/mix/mix_data_info?device_sn=SPH-MOCK', 'correct V1 GET route');
  t.eq(call.data, undefined, 'no POST body, read-only GET request');
  let invalid = false;
  try { await client.getSphChargeSettings({ deviceSn: '' }); } catch { invalid = true; }
  t.ok(invalid, 'cannot read without selected SPH serial');

  const manifest = JSON.parse(fs.readFileSync(path.join(testRoot, 'app.json'), 'utf8'));
  const action = manifest.flow.actions.find((entry) => entry.id === 'arkxh_read_charge_settings');
  t.ok(action, 'read-only Flow action declared');
  t.ok(action.tokens.some((token) => token.name === 'report' && token.type === 'text'), 'redacted JSON return token exposed');
};
