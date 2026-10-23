/* ARK-XH / ARK-HV BMS-only read-only fields for SPH/MIX lastData.
 * Separate from upstream battery2 device lifecycle and migrations.
 * Official upstream handles SOH and battery temperature; this module maps only\n * the additional telemetry that upstream does not provide.
 */
'use strict';

module.exports = {
  measure_battery_cycles: ['getLastData', (data) => Number(data.bmsCycleCnt)],
  measure_voltage_battery: ['getLastData', (data) => Number(data.vbat ?? data.bmsBatteryVolt ?? data.vBatDsp)],
  measure_current_battery: ['getLastData', (data) => Number(data.bmsBatteryCurr)],
  measure_temperature_bms: ['getLastData', (data) => Number(data.bmsBatteryTemp)],
  measure_voltage_cell_min: ['getLastData', (data) => Number(data.minSingleCellVolt)],
  measure_voltage_cell_max: ['getLastData', (data) => Number(data.maxSingleCellVolt)],
  measure_voltage_cell_delta: ['getLastData', (data) => {
    const min = Number(data.minSingleCellVolt);
    const max = Number(data.maxSingleCellVolt);
    return Number.isFinite(min) && Number.isFinite(max) ? Number((max - min).toFixed(3)) : null;
  }],
  measure_temperature_cell_min: ['getLastData', (data) => Number(data.minSingleCellTem)],
  measure_temperature_cell_max: ['getLastData', (data) => Number(data.maxSingleCellTem)],
  measure_current_charge_limit: ['getLastData', (data) => Number(data.bmsMaxCurr)],
  measure_current_discharge_limit: ['getLastData', (data) => Number(data.bmsMaxDischgCurr)],
  alarm_battery_charge_forbidden: ['getLastData', (data) => Number(data.chargeForbiddenMark ?? 0) === 1],
  alarm_battery_discharge_forbidden: ['getLastData', (data) => Number(data.dischargeForbiddenMark ?? 0) === 1],
  alarm_bms_error: ['getLastData', (data) => (
    Number(data.bmsError ?? 0) !== 0
    || Number(data.bmsError2 ?? 0) !== 0
    || Number(data.bmsError3 ?? 0) !== 0
    || Number(data.bmsProtection ?? 0) !== 0
    || Number(data.batErrorUnion ?? 0) !== 0
    || Number(data.faultCode ?? 0) !== 0
    || Number(data.errorCode ?? 0) !== 0
    || Number(data.warnCode ?? 0) !== 0
  )],
};
