/**
 * IrriCount Quick Quote — calculation engine
 * Implements all 19 calculation rules from SYSA-8 spec.
 */

import { DEFAULT_PRICES } from './storage'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const ceil = Math.ceil

// ---------------------------------------------------------------------------
// Main calculation function
// ---------------------------------------------------------------------------
/**
 * @param {object} inputs   - user inputs from InputScreen
 * @param {object} settings - from SettingsScreen (laborRate, grossMargin, taxRate)
 * @param {object} prices   - from storage (user-configurable material unit prices)
 * @returns {object} full result breakdown
 */
export function calculate(inputs, settings, prices = DEFAULT_PRICES) {
  const p = { ...DEFAULT_PRICES, ...prices }
  const {
    sprayCount = 0,
    rotorCount = 0,
    spraySpacing = 'short',
    rotorSpacing = 'short',
    mainLineLength = 0,
    meterSize = '1in',
    dripFootage = 0,
    dripZones = 0,
    sleeving2in = 0,
    sleeving4in = 0,
    qcvCount = 0,
    isolationValveCount = 0,
    miscCost = 0,
  } = inputs

  const {
    laborRate = 17,
    grossMargin = 0.40,
    taxRate = 0.0725,
  } = settings

  // -------------------------------------------------------------------------
  // Rules 1-4: GPM and zone calculations
  // -------------------------------------------------------------------------

  // Rule 1
  const sprayGpm = sprayCount * (spraySpacing === 'short' ? 1.5 : 2.0)

  // Rule 2
  const rotorGpm = rotorCount * (rotorSpacing === 'short' ? 3.0 : 3.5)

  const systemGpm = sprayGpm + rotorGpm

  // Rule 3
  const availableGpmMap = { '0.75in': 15, '1in': 25, '1.5in': 40, '2in': 65 }
  const availableGpm = availableGpmMap[meterSize]

  // Rule 4
  const minZones = systemGpm > 0 ? ceil(systemGpm / availableGpm) : (sprayCount + rotorCount > 0 ? 1 : 0)

  // -------------------------------------------------------------------------
  // Rule 5: Main line size
  // -------------------------------------------------------------------------
  const mainLineSizeMap = { '0.75in': '1in', '1in': '1.5in', '1.5in': '2in', '2in': '3in' }
  const mainLineSize = mainLineSizeMap[meterSize]

  // -------------------------------------------------------------------------
  // Rules 6-9: Lateral footage and pipe distribution
  // -------------------------------------------------------------------------

  // Rule 6
  const sprayLateral = sprayCount * (spraySpacing === 'short' ? 15 : 20)

  // Rule 7
  const rotorLateral = rotorCount * (rotorSpacing === 'short' ? 40 : 50)

  const totalLateral = sprayLateral + rotorLateral

  const isLargeMeter = meterSize === '1.5in' || meterSize === '2in'

  // Rule 8: 1.5in lateral only on large meter
  const lateral1_5inFt = isLargeMeter ? totalLateral * 0.33 : 0

  // Rule 9: 1in lateral
  const lateral1inFt = isLargeMeter ? totalLateral * 0.66 : totalLateral

  // -------------------------------------------------------------------------
  // Pipe material costs (used for fittings calc in rule 10)
  // -------------------------------------------------------------------------
  const mainLinePriceMap = {
    '1in': p.mainLinePipe1in,
    '1.5in': p.mainLinePipe1_5in,
    '2in': p.mainLinePipe2in,
    '3in': p.mainLinePipe3in,
  }
  const mainLineCost = mainLineLength * (mainLinePriceMap[mainLineSize] ?? p.mainLinePipe1in)
  const lateralCost = (lateral1_5inFt * p.lateralPipe1_5in) + (lateral1inFt * p.lateralPipe1in)
  const pipeMaterialCost = mainLineCost + lateralCost

  // Rule 10: Fittings
  const fittingsCost = pipeMaterialCost * 0.35

  // -------------------------------------------------------------------------
  // Rules 11-14: Wire and consumables
  // -------------------------------------------------------------------------

  // Rule 11
  const commonWireFt = mainLineLength

  // Rule 12
  const hotWireFt = commonWireFt * 5

  const wireCost = (commonWireFt + hotWireFt) * p.wireFt

  // Rule 13
  const spliceKitQty = (minZones + dripZones) * 2
  const spliceKitCost = spliceKitQty * p.spliceKit

  // Rule 14
  const primerCementQty = ceil((mainLineLength + totalLateral) / 1000)
  const primerCementCost = primerCementQty * p.primerCementPair

  // -------------------------------------------------------------------------
  // Rules 15-18: Heads and small parts
  // -------------------------------------------------------------------------

  // Rule 15: Spray nozzles (separate from bodies)
  const sprayBodyCost = sprayCount * p.sprayBody
  const sprayNozzleCost = sprayCount * p.sprayNozzle    // rule 15
  const rotorHeadCost = rotorCount * p.rotorHead

  // Rule 16: Flex barb 0.5in — spray heads (2 per head) + rotor heads (1 per head)
  const flexBarb05Qty = (sprayCount * 2) + (rotorCount * 1)
  const flexBarb05Cost = flexBarb05Qty * p.flexBarb05

  // Rule 17: Flex barb 0.75in — rotor heads only (1 per head)
  const flexBarb075Qty = rotorCount * 1
  const flexBarb075Cost = flexBarb075Qty * p.flexBarb075

  // Rule 18: Swing pipe
  const swingPipeFt = (sprayCount + rotorCount) * 1.5
  const swingPipeCost = swingPipeFt * p.swingPipeFt

  // -------------------------------------------------------------------------
  // Rule 19: Auto-sized items (valve boxes, pea gravel, rain sensor, backflow)
  // -------------------------------------------------------------------------
  const totalControlValves = minZones + dripZones
  const smallValveBoxQty = totalControlValves
  const smallValveBoxCost = smallValveBoxQty * p.valveBoxSmall

  const largeValveBoxQty = Math.max(1, ceil(totalControlValves / 3))
  const largeValveBoxCost = largeValveBoxQty * p.valveBoxLarge

  const peaGravelBags = ceil(totalControlValves / 3)
  const peaGravelCost = Math.max(1, peaGravelBags) * p.peaGravelBag

  const rainSensorCost = p.rainSensor

  const backflowPriceMap = {
    '0.75in': p.backflow075in,
    '1in': p.backflow1in,
    '1.5in': p.backflow1_5in,
    '2in': p.backflow2in,
  }
  const backflowCost = backflowPriceMap[meterSize] ?? p.backflow1in

  // -------------------------------------------------------------------------
  // Valves and accessories
  // -------------------------------------------------------------------------
  const zoneValveCost = minZones * p.zoneValve
  const dripValveCost = dripZones * p.dripValve
  const qcvCost = qcvCount * (p.qcv + p.qcvKeySwivel)
  const isolationValveCost = isolationValveCount * p.isolationValve

  // Drip
  const dripTubeCost = dripFootage * p.dripTubeFt

  // Sleeving
  const sleeving2inCost = sleeving2in * p.sleeving2inFt
  const sleeving4inCost = sleeving4in * p.sleeving4inFt

  // -------------------------------------------------------------------------
  // Total material
  // -------------------------------------------------------------------------
  const totalMaterial =
    pipeMaterialCost + fittingsCost +
    wireCost + spliceKitCost + primerCementCost +
    sprayBodyCost + sprayNozzleCost + rotorHeadCost +
    flexBarb05Cost + flexBarb075Cost + swingPipeCost +
    zoneValveCost + dripValveCost + qcvCost + isolationValveCost +
    smallValveBoxCost + largeValveBoxCost + peaGravelCost +
    rainSensorCost + backflowCost +
    dripTubeCost + sleeving2inCost + sleeving4inCost +
    Number(miscCost || 0)

  // -------------------------------------------------------------------------
  // Labor hours
  // -------------------------------------------------------------------------
  const laborLaterals = totalLateral > 0 ? totalLateral / 25 : 0
  const laborHeadInstall = (sprayCount + rotorCount) > 0 ? (sprayCount + rotorCount) / 3 : 0
  const valveCountForLabor = minZones + dripZones + isolationValveCount + qcvCount
  const laborValveInstall = valveCountForLabor * 3
  const laborDripTubing = dripFootage > 0 ? dripFootage / 50 : 0
  const laborDripControlValve = dripZones * 3
  const totalSleeving = (sleeving2in || 0) + (sleeving4in || 0)
  const laborSleeving = totalSleeving > 0 ? totalSleeving / 10 : 0

  const totalLaborHours =
    laborLaterals + laborHeadInstall + laborValveInstall +
    laborDripTubing + laborDripControlValve + laborSleeving

  const laborCost = totalLaborHours * Number(laborRate || 17)

  // -------------------------------------------------------------------------
  // Pricing
  // -------------------------------------------------------------------------
  const salesTax = totalMaterial * Number(taxRate || 0.0725)
  const totalDirectCost = totalMaterial + laborCost + salesTax
  const gm = Number(grossMargin || 0.40)
  const salePrice = gm < 1 ? totalDirectCost / (1 - gm) : totalDirectCost

  // -------------------------------------------------------------------------
  // Return full breakdown
  // -------------------------------------------------------------------------
  return {
    // System sizing
    sprayGpm, rotorGpm, systemGpm, availableGpm, minZones, mainLineSize,

    // Footage / quantities
    sprayLateral, rotorLateral, totalLateral,
    lateral1inFt, lateral1_5inFt,
    commonWireFt, hotWireFt,
    spliceKitQty, primerCementQty,
    flexBarb05Qty, flexBarb075Qty, swingPipeFt,
    smallValveBoxQty, largeValveBoxQty, peaGravelBags,
    totalControlValves, valveCountForLabor,

    // Material costs by category
    costs: {
      pipe: { mainLine: mainLineCost, lateral: lateralCost, fittings: fittingsCost, total: pipeMaterialCost + fittingsCost },
      heads: { sprayBodies: sprayBodyCost, sprayNozzles: sprayNozzleCost, rotorHeads: rotorHeadCost, flexBarb05: flexBarb05Cost, flexBarb075: flexBarb075Cost, swingPipe: swingPipeCost, total: sprayBodyCost + sprayNozzleCost + rotorHeadCost + flexBarb05Cost + flexBarb075Cost + swingPipeCost },
      valves: { zoneValves: zoneValveCost, dripValves: dripValveCost, qcv: qcvCost, isolation: isolationValveCost, total: zoneValveCost + dripValveCost + qcvCost + isolationValveCost },
      electrical: { wire: wireCost, spliceKits: spliceKitCost, primerCement: primerCementCost, total: wireCost + spliceKitCost + primerCementCost },
      accessories: { smallBoxes: smallValveBoxCost, largeBoxes: largeValveBoxCost, peaGravel: peaGravelCost, rainSensor: rainSensorCost, backflow: backflowCost, total: smallValveBoxCost + largeValveBoxCost + peaGravelCost + rainSensorCost + backflowCost },
      drip: { tube: dripTubeCost, valves: dripValveCost, total: dripTubeCost + dripValveCost },
      sleeving: { twoIn: sleeving2inCost, fourIn: sleeving4inCost, total: sleeving2inCost + sleeving4inCost },
      misc: Number(miscCost || 0),
    },
    totalMaterial,

    // Labor breakdown
    labor: {
      laterals: laborLaterals,
      headInstall: laborHeadInstall,
      valveInstall: laborValveInstall,
      dripTubing: laborDripTubing,
      dripControlValve: laborDripControlValve,
      sleeving: laborSleeving,
      totalHours: totalLaborHours,
      cost: laborCost,
      rate: Number(laborRate || 17),
    },

    // Pricing summary
    salesTax,
    totalDirectCost,
    salePrice,
    grossMarginPct: gm * 100,
  }
}

export function fmt(n) {
  return Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function fmtHrs(n) {
  return Number(n || 0).toFixed(1)
}

// ---------------------------------------------------------------------------
// Proposal line builder
// ---------------------------------------------------------------------------
const CONTROLLER_STATIONS = [6, 12, 24, 36, 48]
const BACKFLOW_LABEL = { '0.75in': '3/4"', '1in': '1"', '1.5in': '1-1/2"', '2in': '2"' }

/**
 * Builds the client-facing proposal description line.
 * @param {object} inputs   - user inputs (sprayCount, rotorCount, dripZones, meterSize)
 * @param {object} results  - calculated results (minZones)
 * @returns {string}
 */
export function buildProposalLine(inputs, results) {
  const sprayCount = inputs.sprayCount || 0
  const rotorCount = inputs.rotorCount || 0
  const dripZones  = inputs.dripZones  || 0
  const totalZones = (results.minZones || 0) + dripZones

  const stationCount = CONTROLLER_STATIONS.find(s => s >= totalZones) ?? 48
  const backflowSize = BACKFLOW_LABEL[inputs.meterSize] ?? '1"'

  const dripClause = dripZones > 0
    ? `, and ${dripZones} drip zone${dripZones !== 1 ? 's' : ''}`
    : ''

  return (
    `Furnish and install complete ${totalZones}-zone irrigation system consisting of ` +
    `${sprayCount} spray zone${sprayCount !== 1 ? 's' : ''}, ` +
    `${rotorCount} rotor zone${rotorCount !== 1 ? 's' : ''}${dripClause}, ` +
    `automatic ${stationCount}-station controller, rain sensor, and ` +
    `${backflowSize} backflow preventer with insulated cover.`
  )
}
