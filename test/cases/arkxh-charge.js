'use strict';
const { ChargeController, STORE_KEY, STALE_MS } = require('../../lib/arkxhChargeController');
const { ExperimentalVppBackend, integerValue } = require('../../lib/arkxhExperimentalVpp');

const fake = (options = {}) => {
  const s = { time: 100000, stored: null, calls: [] };
  const dev = {
    deviceType: 'sph', isMergedBattery: false, deviceSn: 'TEST',
    homey: { setInterval: () => 1, clearInterval: () => {} },
    getStoreValue: (key) => key === STORE_KEY ? s.stored : null,
    setStoreValue: async (key, value) => { s.stored = value; },
    getSettings: () => ({ arkxhExperimentalVppCharge: options.enabled !== false, maxChargePower: 3000 }),
    getAvailable: () => true,
    log: () => {}, error: () => {},
  };
  const backend = {
    prepare: async () => { s.calls.push('prepare'); return { set_param_1: 0, set_param_26: 0 }; },
    begin: async () => { s.calls.push('begin'); if (options.beginFails) throw Error('begin failed'); },
    end: async () => { s.calls.push('end'); if (options.endFails) throw Error('end failed'); },
  };
  return { s, dev, controller: new ChargeController(dev, backend, { now: () => s.time }) };
};

const rejects = async (fn, pattern) => {
  try { await fn(); return false; } catch (err) { return pattern.test(err.message); }
};

module.exports = async (t) => {
  const a = fake();
  const request = { targetSoc: 80, powerWatts: 1500, maxMinutes: 15 };
  t.ok(await rejects(() => a.controller.start(request), /Fresh battery SOC/), 'requires a fresh SOC');
  await a.controller.observed(40);
  t.ok(await rejects(() => a.controller.start({ ...request, maxMinutes: 0 }), /duration/), 'no indefinite charging');
  t.ok(await rejects(() => a.controller.start({ ...request, maxMinutes: 300 }), /duration/), 'duration capped at four hours');
  t.ok(await rejects(() => a.controller.start({ ...request, targetSoc: 102 }), /Target SOC/), 'target SOC validated');
  t.ok(await rejects(() => a.controller.start({ ...request, powerWatts: 4000 }), /exceeds/), 'power limited by device');
  t.eq(a.s.calls.length, 0, 'bad requests make no cloud calls');
  const result = await a.controller.start(request);
  t.ok(result.started, 'creates bounded session');
  t.eq(a.s.stored.status, 'active', 'active session stored');
  t.eq(a.s.stored.deadline, a.s.time + 15 * 60000, 'deadline stored as epoch milliseconds');
  t.ok(await rejects(() => a.controller.start(request), /already exists/), 'duplicate start rejected');
  await a.controller.observed(80);
  t.eq(a.s.stored, null, 'stops when target SOC reached');
  t.ok(a.s.calls.includes('end'), 'stop command sent at SOC target');

  const timeout = fake();
  await timeout.controller.observed(40);
  await timeout.controller.start(request);
  timeout.s.time += 16 * 60000;
  await timeout.controller.tick();
  t.eq(timeout.s.stored, null, 'stops at deadline');

  const stale = fake();
  await stale.controller.observed(40);
  await stale.controller.start(request);
  stale.s.time += STALE_MS + 1;
  await stale.controller.tick();
  t.eq(stale.s.stored, null, 'stops when readings go stale');

  const unavailable = fake({ enabled: false });
  await unavailable.controller.observed(30);
  t.ok(await rejects(() => unavailable.controller.start(request), /disabled/), 'experimental writes are disabled by default');
  t.eq(unavailable.s.calls.length, 0, 'disabled means no VPP operations');

  const forbidden = fake();
  await forbidden.controller.observed(30, { blocked: true });
  t.ok(await rejects(() => forbidden.controller.start(request), /BMS/), 'refuses charge forbidden');
  t.eq(forbidden.s.calls.length, 0, 'forbidden prevents cloud writes');

  const partial = fake({ beginFails: true });
  await partial.controller.observed(30);
  t.ok(await rejects(() => partial.controller.start(request), /begin failed/), 'partial API failure propagated');
  t.ok(partial.s.calls.includes('end'), 'rolls back partial VPP writes');
  t.eq(partial.s.stored, null, 'rollback clears persistent state');

  const pending = fake({ endFails: true });
  await pending.controller.observed(30);
  await pending.controller.start(request);
  t.ok(await rejects(() => pending.controller.stop(), /end failed/), 'stop failure propagated');
  t.eq(pending.s.stored.status, 'stopping', 'failure remains pending in storage');

  const reboot = fake();
  reboot.s.stored = { status: 'starting', startedAt: reboot.s.time, deadline: reboot.s.time + 60000, targetSoc: 80, snapshot: {} };
  await reboot.controller.init();
  t.eq(reboot.s.stored, null, 'restart in starting state invokes rollback');
  reboot.controller.close();

  const staleReboot = fake();
  staleReboot.s.stored = { status: 'active', startedAt: staleReboot.s.time - STALE_MS - 1, deadline: staleReboot.s.time + 60000, targetSoc: 80, snapshot: {} };
  await staleReboot.controller.init();
  t.eq(staleReboot.s.stored, null, 'restart without fresh telemetry stops stale session');
  staleReboot.controller.close();

  const already = fake();
  await already.controller.observed(85);
  t.eq((await already.controller.start(request)).started, false, 'no command when target already achieved');
  t.eq(already.s.calls.length, 0, 'at target: no VPP reads or writes');

  t.eq(integerValue({ value: '1' }), 1, 'VPP readback numeric string parsed');
  t.eq(integerValue({ data: { value: 0 } }), 0, 'VPP nested readback parsed');
  t.ok(await rejects(async () => integerValue({ error: 'unknown' }), /Unexpected VPP/), 'unknown VPP response rejected');

  const calls = [];
  const device = {
    deviceType: 'sph', deviceSn: 'MOCK',
    getSettings: () => ({ maxChargePower: 4000 }),
    growatt: {
      getVPP: async ({ setType }) => ({ value: { set_param_1: 0, set_param_25: 0, set_param_26: 0, set_param_27: 0 }[setType] }),
      setVPP: async ({ value }) => { calls.push([value.setType, value.value]); },
    },
  };
  const vpp = new ExperimentalVppBackend(device);
  const snapshot = await vpp.prepare();
  await vpp.begin({ powerWatts: 2000, maxMinutes: 60, snapshot });
  t.ok(calls.some(([field, val]) => field === 'set_param_26' && val === '60'), 'sets finite inverter override');
  t.ok(calls.some(([field, val]) => field === 'set_param_27' && val === '50'), 'positive percentage for charging');
  t.ok(calls.findIndex(([field]) => field === 'set_param_25') > calls.findIndex(([field]) => field === 'set_param_26'), 'enable is written last');
  await vpp.end({ snapshot });
  t.ok(calls.some(([field, val]) => field === 'set_param_25' && val === '0'), 'stop disables remote control');
  t.ok(calls.some(([field, val]) => field === 'set_param_1' && val === '0'), 'master setting restored');
};
