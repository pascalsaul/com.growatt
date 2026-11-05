/*
Copyright 2025 - 2026, Robin de Gruijter (rmdegruijter@gmail.com)

This file is part of com.growatt.

com.growatt is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

com.growatt is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with com.growatt.  If not, see <http://www.gnu.org/licenses/>.
*/

'use strict';

const Device = require('../../lib/common_device');
const { ChargeController } = require('../../lib/arkxhChargeController');
const { ExperimentalVppBackend } = require('../../lib/arkxhExperimentalVpp');

module.exports = class MyDevice extends Device {

  // a second battery device ('<sn>.bat2', paired before one device per unit) was never a real battery
  get isMergedBattery() {
    return String(this.getData().id).endsWith('.bat2');
  }

  async onInit() {
    if (this.isMergedBattery) {
      this.restarting = false;
      this.log(`${this.getName()} is a second battery device; the unit's batteries are one device now`);
      await this.setUnavailable(this.homey.__('status.batteryMerged')).catch((error) => this.error(error));
      // clear its last (junk bdc2) readings from Homey Energy
      for (const cap of ['measure_power', 'measure_battery']) {
        if (this.hasCapability(cap)) await this.setCapabilityValue(cap, null).catch((error) => this.error(error));
      }
      return;
    }
    await super.onInit();
    if (!this.restarting) {
      this.arkxhCharge?.close();
      this.arkxhCharge = new ChargeController(this, new ExperimentalVppBackend(this));
      await this.arkxhCharge.init();
    }
  }

  async handleLastData(data) {
    await super.handleLastData(data);
    if (!this.arkxhCharge || !this.getAvailable()) return;
    // Only use actual battery readings from the relevant lastData response.
    // BMS flags are read from mapped Homey capabilities after upstream updates.
    const soc = Number(data.soc);
    const errorFields = ['bmsError', 'bmsError2', 'bmsError3', 'bmsProtection', 'batErrorUnion', 'faultCode', 'errorCode', 'warnCode'];
    await this.arkxhCharge.observed(soc, {
      blocked: Number(data.chargeForbiddenMark ?? 0) === 1,
      bmsAlarm: errorFields.some((field) => Number(data[field] ?? 0) !== 0),
    });
  }

  async startArkxhCharge(request) {
    if (!this.arkxhCharge) throw Error('ARK-XH charge controller has not initialized.');
    return this.arkxhCharge.start(request);
  }

  async stopArkxhCharge() {
    if (!this.arkxhCharge) throw Error('ARK-XH charge controller has not initialized.');
    return this.arkxhCharge.stop();
  }

  async onUninit() {
    this.arkxhCharge?.close();
    await super.onUninit();
  }

  async onAdded() {
    if (this.isMergedBattery) return;
    await super.onAdded();
  }

  async onSettings(event) {
    if (this.isMergedBattery) return;
    await super.onSettings(event);
  }

};
