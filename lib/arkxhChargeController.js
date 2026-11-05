/*
 * EXPERIMENTAL Growatt charge-to-SOC session controller.
 * GPL-3.0-or-later (same license as the upstream Growatt Homey app).
 * The Homey Flow chooses when to start. The controller owns the target SOC,
 * finite deadline, telemetry watchdog, stop retries and restart recovery.
 */
'use strict';

const STORE_KEY = 'arkxhGridChargeSession';
const STALE_MS = 12 * 60 * 1000;
const CHECK_MS = 60 * 1000;
const MAX_MINUTES = 240;
const MIN_MINUTES = 5;

class ChargeController {
  constructor(device, backend, { now = () => Date.now(), intervalMs = CHECK_MS } = {}) {
    this.device = device;
    this.backend = backend;
    this.now = now;
    this.intervalMs = intervalMs;
    this.latest = null;
    this.pending = Promise.resolve();
    this.timer = null;
  }

  serialize(job) {
    const promise = this.pending.catch(() => {}).then(job);
    this.pending = promise.catch(() => {});
    return promise;
  }

  get session() {
    return this.device.getStoreValue(STORE_KEY) || null;
  }

  async save(state) {
    await this.device.setStoreValue(STORE_KEY, state);
  }

  async init() {
    if (this.timer) this.device.homey.clearInterval(this.timer);
    this.timer = this.device.homey.setInterval(() => {
      this.tick().catch((error) => this.device.error('ARK-XH charge watchdog', error));
    }, this.intervalMs);
    // On restart, do not assume a previously active charge has stopped.
    // No new charge command is sent during restoration. A timed-out job
    // is stopped immediately, and any other job waits for fresh telemetry.
    await this.tick();
  }

  close() {
    if (this.timer) this.device.homey.clearInterval(this.timer);
    this.timer = null;
  }

  async observed(soc, { blocked = false, bmsAlarm = false } = {}) {
    if (!Number.isFinite(soc) || soc < 0 || soc > 100) return;
    this.latest = { soc, at: this.now(), blocked: Boolean(blocked), bmsAlarm: Boolean(bmsAlarm) };
    await this.tick();
  }

  static validate({ targetSoc, powerWatts, maxMinutes }, limitWatts) {
    const target = Number(targetSoc);
    const power = Number(powerWatts);
    const minutes = Number(maxMinutes);
    if (!Number.isInteger(target) || target < 20 || target > 100) throw Error('Target SOC must be between 20 and 100%.');
    if (!Number.isInteger(power) || power < 250) throw Error('Charging power must be at least 250 W.');
    if (!Number.isFinite(limitWatts) || limitWatts <= 0) throw Error('Configure a valid maximum battery charging power on the device first.');
    if (power > limitWatts) throw Error('Requested power exceeds the configured maximum battery charge power.');
    if (!Number.isInteger(minutes) || minutes < MIN_MINUTES || minutes > MAX_MINUTES) throw Error('Maximum charge duration must be 5–240 minutes.');
    return { targetSoc: target, powerWatts: power, maxMinutes: minutes };
  }

  async start(args) {
    return this.serialize(async () => {
      if (this.session) throw Error('An ARK-XH charging session already exists. Stop it first.');
      if (this.device.deviceType !== 'sph' || this.device.isMergedBattery) {
        throw Error('Experimental charge control is restricted to SPH/MIX battery2 devices.');
      }
      if (this.device.getSettings().arkxhExperimentalVppCharge !== true) {
        throw Error('Charging is disabled. Enable Experimental VPP charge control in this battery device’s settings only after reviewing the warning.');
      }
      if (!this.device.getAvailable()) throw Error('The battery is unavailable.');
      const limitWatts = Number(this.device.getSettings().maxChargePower);
      const request = ChargeController.validate(args, limitWatts);
      if (!this.latest || this.now() - this.latest.at > STALE_MS) {
        throw Error('Fresh battery SOC is required before starting. Wait for the next Growatt API update.');
      }
      if (this.latest.blocked || this.latest.bmsAlarm) throw Error('The BMS reports a charge prohibition or alarm.');
      if (this.latest.soc >= request.targetSoc) return { started: false, reason: 'SOC already at or above target' };

      // Read and validate current remote-control state before making ANY write.
      // A snapshot is saved before the first write to support crash recovery.
      const snapshot = await this.backend.prepare();
      const state = {
        ...request,
        deadline: this.now() + (request.maxMinutes * 60 * 1000),
        startedAt: this.now(),
        snapshot,
        status: 'starting',
      };
      await this.save(state);
      try {
        await this.backend.begin(state);
        await this.save({ ...state, status: 'active' });
        this.device.log('ARK-XH experimental charge started; finite duration', state.maxMinutes, 'min; target SOC', state.targetSoc);
        return { started: true, targetSoc: state.targetSoc, deadline: state.deadline };
      } catch (error) {
        // A partial cloud write may have happened. Never silently clear the
        // persisted session: attempt rollback, retaining it if rollback fails.
        try {
          await this.stopInternal(state);
        } catch (cleanupError) {
          this.device.error('ARK-XH failed to roll back partial charge command', cleanupError);
        }
        throw error;
      }
    });
  }

  async stopInternal(state) {
    if (!state) return { stopped: false };
    await this.save({ ...state, status: 'stopping' });
    await this.backend.end(state);
    await this.save(null);
    this.device.log('ARK-XH experimental charge stop command completed');
    return { stopped: true };
  }

  async stop() {
    return this.serialize(async () => this.stopInternal(this.session));
  }

  async tick() {
    return this.serialize(async () => {
      const state = this.session;
      if (!state) return;
      const expired = this.now() >= state.deadline;
      const stale = this.latest
        ? this.now() - this.latest.at > STALE_MS
        : this.now() - state.startedAt > STALE_MS;
      const reached = this.latest && this.latest.soc >= state.targetSoc;
      const alarm = this.latest && (this.latest.blocked || this.latest.bmsAlarm);
      // 'starting' means Homey may have restarted halfway through a hardware
      // command. We cannot confirm ownership; stop instead of resuming.
      const shouldStop = expired || stale || reached || alarm || state.status !== 'active';
      if (shouldStop) {
        try {
          await this.stopInternal(state);
        } catch (error) {
          // Kept as 'stopping' in Homey's persistent store; retried next tick.
          this.device.error('ARK-XH charge stop pending; check inverter manually if needed', error);
          throw error;
        }
      }
    });
  }
}

module.exports = { ChargeController, STORE_KEY, STALE_MS };
