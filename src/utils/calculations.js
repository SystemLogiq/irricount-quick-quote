/**
 * IrriCount Quick Quote — calculation engine
 * Implements all calculation rules including SYSA-25 additions.
 */

import { DEFAULT_PRICES } from './storage'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const ceil = Math.ceil

// Multi-strand bundle sizes (conductor count, in order)
const MULTI_STRAND_BUNDLES = [2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13]
const MULTI_STRAND_KEYS = [
  'wire18_2ft', 'wire18_3ft', 'wire18_4ft', 'wire18_5ft', 'wire18_6ft',
  'wire18_7ft', 'wire18_8ft', 'wire18_9ft', 'wire18_10ft', 'wire18_12ft', 'wire18_13ft',
]

function selectMultiStrandBundle(zoneCount) {
  const needed = zoneCount + 1 // zones + 1 common conductor
  const idx = MULTI_STRAND_BUNDLES.findIndex(b => b >= needed)
  if (idx === -1) return { conductors: 13, key: 'wire18_13ft' }
  return { conductors: MULTI_STRAND_BUNDLES[idx], key: MULTI_STRAND_KEYS[idx] }
}

// ---------------------------------------------------------------------------
// Main calculation function
// ---------------------------------------------------------------------------
/**
 * @param {object} inputs   - user inputs from InputScreen
 * @param {object} settings - from SettingsScreen (laborRate, grossMargin, taxRate, wireType, etc.)
 * @param {object} prices   - from storage (user-configurable material unit prices)
 * @returns {object} full result breakdown including lineItems array
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
    includeBackflow = true,
    zoneCountOverride = 0,
    decoder2stQty = 0,
    decoder4stQty = 0,
    decoder6stQty = 0,
  } = inputs

  const {
    laborRate = 17,
    grossMargin = 0.40,
    taxRate = 0.0725,
    sprayBodyDefault = '6in',
    wireType = '14/1 Conventional',
    valveBoxStyle = 'Standard',
    manifoldValvesPerBox = 3,
  } = settings

  // Line items accumulator for Materials List PDF
  const lineItems = []

  // -------------------------------------------------------------------------
  // Rules 1-4: GPM and zone calculations
  // -------------------------------------------------------------------------
  const sprayGpm = sprayCount * (spraySpacing === 'short' ? 1.5 : 2.0)
  const rotorGpm = rotorCount * (rotorSpacing === 'short' ? 3.0 : 3.5)
  const systemGpm = sprayGpm + rotorGpm

  const availableGpmMap = { '0.75in': 15, '1in': 25, '1.5in': 40, '2in': 65 }
  const availableGpm = availableGpmMap[meterSize]

  const minZones = systemGpm > 0
    ? ceil(systemGpm / availableGpm)
    : (sprayCount + rotorCount > 0 ? 1 : 0)

  // Zone count override — contractor can increase above calculated minimum
  const effectiveZones = (zoneCountOverride > minZones) ? zoneCountOverride : minZones

  // -------------------------------------------------------------------------
  // Rule 5: Main line size
  // -------------------------------------------------------------------------
  const mainLineSizeMap = { '0.75in': '1in', '1in': '1.5in', '1.5in': '2in', '2in': '3in' }
  const mainLineSize = mainLineSizeMap[meterSize]

  // -------------------------------------------------------------------------
  // Rules 6-9: Lateral footage and pipe distribution
  // -------------------------------------------------------------------------
  const sprayLateral = sprayCount * (spraySpacing === 'short' ? 15 : 20)
  const rotorLateral = rotorCount * (rotorSpacing === 'short' ? 40 : 50)
  const totalLateral = sprayLateral + rotorLateral

  const isLargeMeter = meterSize === '1.5in' || meterSize === '2in'
  const lateral1_5inFt = isLargeMeter ? totalLateral * 0.33 : 0
  const lateral1inFt = isLargeMeter ? totalLateral * 0.66 : totalLateral

  // -------------------------------------------------------------------------
  // Pipe material costs
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
  const fittingsCost = pipeMaterialCost * 0.35

  if (mainLineLength > 0) {
    lineItems.push({ description: `Main Line ${mainLineSize} Pipe`, qty: mainLineLength, unit: 'ft', unitCost: mainLinePriceMap[mainLineSize] ?? p.mainLinePipe1in })
  }
  if (lateral1inFt > 0) {
    lineItems.push({ description: '1" Lateral Pipe', qty: Math.round(lateral1inFt), unit: 'ft', unitCost: p.lateralPipe1in })
  }
  if (lateral1_5inFt > 0) {
    lineItems.push({ description: '1½" Lateral Pipe', qty: Math.round(lateral1_5inFt), unit: 'ft', unitCost: p.lateralPipe1_5in })
  }
  if (fittingsCost > 0) {
    lineItems.push({ description: 'Pipe Fittings (35%)', qty: 1, unit: 'ls', unitCost: fittingsCost })
  }

  // -------------------------------------------------------------------------
  // Rules 11-14: Wire — logic driven by wireType setting
  // -------------------------------------------------------------------------
  let commonWireFt = 0
  let hotWireFt = 0
  let wireCost = 0

  if (wireType === 'Multi-Strand') {
    const wireLength = mainLineLength * 1.15
    if (effectiveZones <= 12 && effectiveZones > 0) {
      const bundle = selectMultiStrandBundle(effectiveZones)
      wireCost = wireLength * p[bundle.key]
      lineItems.push({ description: `Wire 18/${bundle.conductors} Multi-Strand`, qty: Math.round(wireLength), unit: 'ft', unitCost: p[bundle.key] })
    } else if (effectiveZones > 12) {
      const remaining = effectiveZones - 12
      const bundle2 = selectMultiStrandBundle(remaining)
      wireCost = wireLength * (p.wire18_13ft + p[bundle2.key])
      lineItems.push({ description: 'Wire 18/13 Multi-Strand', qty: Math.round(wireLength), unit: 'ft', unitCost: p.wire18_13ft })
      lineItems.push({ description: `Wire 18/${bundle2.conductors} Multi-Strand`, qty: Math.round(wireLength), unit: 'ft', unitCost: p[bundle2.key] })
    }
    commonWireFt = Math.round(wireLength)
    hotWireFt = 0
  } else if (wireType === '2-Wire Decoder Path') {
    const wireLength = mainLineLength * 1.15
    wireCost = wireLength * p.wire14_2ft
    commonWireFt = Math.round(wireLength)
    hotWireFt = 0
    lineItems.push({ description: 'Wire 14/2 Decoder Cable', qty: Math.round(wireLength), unit: 'ft', unitCost: p.wire14_2ft })
  } else {
    // 14/1 Conventional — existing logic
    commonWireFt = mainLineLength
    hotWireFt = commonWireFt * 5
    wireCost = (commonWireFt + hotWireFt) * p.wireFt
    if (commonWireFt + hotWireFt > 0) {
      lineItems.push({ description: 'Irrigation Wire 14/1', qty: commonWireFt + hotWireFt, unit: 'ft', unitCost: p.wireFt })
    }
  }

  // Splice kits and PVC consumables
  const spliceKitQty = (effectiveZones + dripZones) * 2
  const spliceKitCost = spliceKitQty * p.spliceKit
  const primerCementQty = ceil((mainLineLength + totalLateral) / 1000)
  const primerCementCost = primerCementQty * p.primerCementPair

  if (spliceKitQty > 0) {
    lineItems.push({ description: 'Waterproof Splice Kit', qty: spliceKitQty, unit: 'ea', unitCost: p.spliceKit })
  }
  if (primerCementQty > 0) {
    lineItems.push({ description: 'Primer + Cement', qty: primerCementQty, unit: 'pair', unitCost: p.primerCementPair })
  }

  // -------------------------------------------------------------------------
  // Controller — auto-selected by total zone count
  // -------------------------------------------------------------------------
  const totalZonesForController = effectiveZones + dripZones
  let controllerKey, controllerDesc
  if (wireType === '2-Wire Decoder Path') {
    if (totalZonesForController <= 12)      { controllerKey = 'controller2wire12st'; controllerDesc = '2-Wire Decoder Controller 12-Station' }
    else if (totalZonesForController <= 24) { controllerKey = 'controller2wire24st'; controllerDesc = '2-Wire Decoder Controller 24-Station' }
    else                                    { controllerKey = 'controller2wire48st'; controllerDesc = '2-Wire Decoder Controller 48-Station' }
  } else {
    if (totalZonesForController <= 6)       { controllerKey = 'controller6st';  controllerDesc = '6-Station Controller' }
    else if (totalZonesForController <= 12) { controllerKey = 'controller12st'; controllerDesc = '12-Station Controller' }
    else if (totalZonesForController <= 24) { controllerKey = 'controller24st'; controllerDesc = '24-Station Controller' }
    else if (totalZonesForController <= 36) { controllerKey = 'controller36st'; controllerDesc = '36-Station Controller' }
    else                                    { controllerKey = 'controller48st'; controllerDesc = '48-Station Controller' }
  }
  const controllerCost = p[controllerKey] || 0
  lineItems.push({ description: controllerDesc, qty: 1, unit: 'ea', unitCost: controllerCost })

  // -------------------------------------------------------------------------
  // Field decoders (2-wire only)
  // -------------------------------------------------------------------------
  let decoderCost = 0
  if (wireType === '2-Wire Decoder Path') {
    const d2 = Number(decoder2stQty) || 0
    const d4 = Number(decoder4stQty) || 0
    const d6 = Number(decoder6stQty) || 0
    decoderCost = d2 * p.decoder2st + d4 * p.decoder4st + d6 * p.decoder6st
    if (d2 > 0) lineItems.push({ description: 'Field Decoder 2-Station', qty: d2, unit: 'ea', unitCost: p.decoder2st })
    if (d4 > 0) lineItems.push({ description: 'Field Decoder 4-Station', qty: d4, unit: 'ea', unitCost: p.decoder4st })
    if (d6 > 0) lineItems.push({ description: 'Field Decoder 6-Station', qty: d6, unit: 'ea', unitCost: p.decoder6st })
  }

  // -------------------------------------------------------------------------
  // Rules 15-18: Heads and small parts
  // -------------------------------------------------------------------------
  const sprayBodyPrice = (sprayBodyDefault === '4in') ? p.sprayBody : p.sprayBody6in
  const sprayBodyLabel = (sprayBodyDefault === '4in') ? 'Spray Body 4"' : 'Spray Body 6"'
  const sprayBodyCost = sprayCount * sprayBodyPrice
  const sprayNozzleCost = sprayCount * p.sprayNozzle
  const rotorHeadCost = rotorCount * p.rotorHead

  const flexBarb05Qty = sprayCount * 2
  const flexBarb05Cost = flexBarb05Qty * p.flexBarb05
  const flexBarb075Qty = rotorCount * 2
  const flexBarb075Cost = flexBarb075Qty * p.flexBarb075
  const swingPipeFt = (sprayCount + rotorCount) * 1.5
  const swingPipeCost = swingPipeFt * p.swingPipeFt

  if (sprayCount > 0) {
    lineItems.push({ description: sprayBodyLabel, qty: sprayCount, unit: 'ea', unitCost: sprayBodyPrice })
    lineItems.push({ description: 'Fixed Spray Nozzle', qty: sprayCount, unit: 'ea', unitCost: p.sprayNozzle })
  }
  if (rotorCount > 0) {
    lineItems.push({ description: 'Rotor 4" Adj Arc', qty: rotorCount, unit: 'ea', unitCost: p.rotorHead })
  }
  if (flexBarb05Qty > 0) {
    lineItems.push({ description: 'Flex Barb ½"', qty: flexBarb05Qty, unit: 'ea', unitCost: p.flexBarb05 })
  }
  if (flexBarb075Qty > 0) {
    lineItems.push({ description: 'Flex Barb ¾"', qty: flexBarb075Qty, unit: 'ea', unitCost: p.flexBarb075 })
  }
  if (swingPipeFt > 0) {
    lineItems.push({ description: 'Flex Swing Pipe', qty: Math.round(swingPipeFt * 10) / 10, unit: 'ft', unitCost: p.swingPipeFt })
  }

  // -------------------------------------------------------------------------
  // Valves
  // -------------------------------------------------------------------------
  const zoneValveCost = effectiveZones * p.zoneValve
  const dripValveCost = dripZones * p.dripValve
  const qcvCost = qcvCount * (p.qcv + p.qcvKeySwivel)
  const isolationValveCost = isolationValveCount * p.isolationValve

  if (effectiveZones > 0) {
    lineItems.push({ description: 'Electric Valve 1"', qty: effectiveZones, unit: 'ea', unitCost: p.zoneValve })
  }
  if (dripZones > 0) {
    lineItems.push({ description: 'Drip Control Valve', qty: dripZones, unit: 'ea', unitCost: p.dripValve })
  }
  if (qcvCount > 0) {
    lineItems.push({ description: 'Quick Coupler Valve', qty: qcvCount, unit: 'ea', unitCost: p.qcv })
    lineItems.push({ description: 'QCV Key/Swivel', qty: qcvCount, unit: 'ea', unitCost: p.qcvKeySwivel })
  }
  if (isolationValveCount > 0) {
    lineItems.push({ description: 'Isolation Ball Valve 1"', qty: isolationValveCount, unit: 'ea', unitCost: p.isolationValve })
  }

  // -------------------------------------------------------------------------
  // Rule 19: Valve boxes — driven by valveBoxStyle setting
  // -------------------------------------------------------------------------
  const totalControlValves = effectiveZones + dripZones
  let smallValveBoxQty, smallValveBoxCost, largeValveBoxQty, largeValveBoxCost

  if (valveBoxStyle === '10in Round') {
    smallValveBoxQty = totalControlValves
    smallValveBoxCost = smallValveBoxQty * p.valveBoxSmall
    largeValveBoxQty = 0
    largeValveBoxCost = 0
  } else if (valveBoxStyle === 'Manifold') {
    smallValveBoxQty = 0
    smallValveBoxCost = 0
    const vpb = Math.max(1, Number(manifoldValvesPerBox) || 3)
    largeValveBoxQty = totalControlValves > 0 ? Math.max(1, ceil(totalControlValves / vpb)) : 0
    largeValveBoxCost = largeValveBoxQty * p.valveBoxLarge
  } else {
    // Standard auto-size by meter — original behavior
    smallValveBoxQty = totalControlValves
    smallValveBoxCost = smallValveBoxQty * p.valveBoxSmall
    largeValveBoxQty = Math.max(1, ceil(totalControlValves / 3))
    largeValveBoxCost = largeValveBoxQty * p.valveBoxLarge
  }

  const peaGravelBags = ceil(totalControlValves / 3)
  const peaGravelCost = Math.max(1, peaGravelBags) * p.peaGravelBag
  const rainSensorCost = p.rainSensor

  const backflowPriceMap = {
    '0.75in': p.backflow075in,
    '1in': p.backflow1in,
    '1.5in': p.backflow1_5in,
    '2in': p.backflow2in,
  }
  const backflowCost = (includeBackflow !== false)
    ? (backflowPriceMap[meterSize] ?? p.backflow1in)
    : 0

  if (smallValveBoxQty > 0) {
    lineItems.push({ description: 'Valve Box 10" Round', qty: smallValveBoxQty, unit: 'ea', unitCost: p.valveBoxSmall })
  }
  if (largeValveBoxQty > 0) {
    lineItems.push({ description: 'Valve Box 12×17 Rect', qty: largeValveBoxQty, unit: 'ea', unitCost: p.valveBoxLarge })
  }
  if (peaGravelBags > 0) {
    lineItems.push({ description: 'Pea Gravel', qty: Math.max(1, peaGravelBags), unit: 'bag', unitCost: p.peaGravelBag })
  }
  lineItems.push({ description: 'Rain Sensor/Bypass', qty: 1, unit: 'ea', unitCost: p.rainSensor })
  if (includeBackflow !== false) {
    const bfLabel = { '0.75in': 'RPZ Backflow ¾"', '1in': 'RPZ Backflow 1"', '1.5in': 'RPZ Backflow 1½"', '2in': 'RPZ Backflow 2"' }
    lineItems.push({ description: bfLabel[meterSize] ?? 'RPZ Backflow', qty: 1, unit: 'ea', unitCost: backflowCost })
  }

  // -------------------------------------------------------------------------
  // Drip & sleeving
  // -------------------------------------------------------------------------
  const dripTubeCost = dripFootage * p.dripTubeFt
  const sleeving2inCost = sleeving2in * p.sleeving2inFt
  const sleeving4inCost = sleeving4in * p.sleeving4inFt

  if (dripFootage > 0) {
    lineItems.push({ description: 'Drip Tube', qty: dripFootage, unit: 'ft', unitCost: p.dripTubeFt })
  }
  if (sleeving2in > 0) {
    lineItems.push({ description: 'Conduit Sleeve 2"', qty: sleeving2in, unit: 'ft', unitCost: p.sleeving2inFt })
  }
  if (sleeving4in > 0) {
    lineItems.push({ description: 'Conduit Sleeve 4"', qty: sleeving4in, unit: 'ft', unitCost: p.sleeving4inFt })
  }
  if (Number(miscCost || 0) > 0) {
    lineItems.push({ description: 'Misc / Electrical', qty: 1, unit: 'ls', unitCost: Number(miscCost) })
  }

  // -------------------------------------------------------------------------
  // Total material
  // -------------------------------------------------------------------------
  const totalMaterial =
    pipeMaterialCost + fittingsCost +
    wireCost + spliceKitCost + primerCementCost +
    controllerCost + decoderCost +
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
  const valveCountForLabor = effectiveZones + dripZones + isolationValveCount + qcvCount
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
  const totalDirectCost = totalMaterial + laborCost
  const gm = Number(grossMargin || 0.40)
  const salePrice = gm < 1 ? totalDirectCost / (1 - gm) : totalDirectCost

  // -------------------------------------------------------------------------
  // Return full breakdown
  // -------------------------------------------------------------------------
  return {
    // System sizing
    sprayGpm, rotorGpm, systemGpm, availableGpm, minZones, effectiveZones, mainLineSize,

    // Footage / quantities
    sprayLateral, rotorLateral, totalLateral,
    lateral1inFt, lateral1_5inFt,
    commonWireFt, hotWireFt,
    spliceKitQty, primerCementQty,
    flexBarb05Qty, flexBarb075Qty, swingPipeFt,
    smallValveBoxQty, largeValveBoxQty, peaGravelBags,
    totalControlValves, valveCountForLabor,
    wireType, controllerDesc,

    // Material costs by category
    costs: {
      pipe: { mainLine: mainLineCost, lateral: lateralCost, fittings: fittingsCost, total: pipeMaterialCost + fittingsCost },
      heads: { sprayBodies: sprayBodyCost, sprayNozzles: sprayNozzleCost, rotorHeads: rotorHeadCost, flexBarb05: flexBarb05Cost, flexBarb075: flexBarb075Cost, swingPipe: swingPipeCost, total: sprayBodyCost + sprayNozzleCost + rotorHeadCost + flexBarb05Cost + flexBarb075Cost + swingPipeCost },
      valves: { zoneValves: zoneValveCost, dripValves: dripValveCost, qcv: qcvCost, isolation: isolationValveCost, total: zoneValveCost + dripValveCost + qcvCost + isolationValveCost },
      electrical: { wire: wireCost, spliceKits: spliceKitCost, primerCement: primerCementCost, controller: controllerCost, decoders: decoderCost, total: wireCost + spliceKitCost + primerCementCost + controllerCost + decoderCost },
      accessories: { smallBoxes: smallValveBoxCost, largeBoxes: largeValveBoxCost, peaGravel: peaGravelCost, rainSensor: rainSensorCost, backflow: backflowCost, total: smallValveBoxCost + largeValveBoxCost + peaGravelCost + rainSensorCost + backflowCost },
      drip: { tube: dripTubeCost, valves: dripValveCost, total: dripTubeCost + dripValveCost },
      sleeving: { twoIn: sleeving2inCost, fourIn: sleeving4inCost, total: sleeving2inCost + sleeving4inCost },
      misc: Number(miscCost || 0),
    },
    totalMaterial,

    // Line items for Materials List PDF
    lineItems,

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
 * @param {object} inputs   - user inputs
 * @param {object} results  - calculated results
 * @param {object} settings - contractor settings (wireType, etc.)
 * @returns {string}
 */
export function buildProposalLine(inputs, results, settings = {}) {
  const dripZones     = inputs.dripZones || 0
  const effectiveZones = results.effectiveZones ?? results.minZones ?? 0
  const totalZones    = effectiveZones + dripZones
  const wireType      = settings.wireType ?? results.wireType ?? '14/1 Conventional'
  const includeBackflow = inputs.includeBackflow !== false

  // Spray Zones = ROUNDUP(effectiveZones × (Spray GPM / System GPM))
  // Rotor Zones = effectiveZones − Spray Zones
  let sprayZones, rotorZones
  if (results.systemGpm > 0 && effectiveZones > 0) {
    sprayZones = Math.ceil(effectiveZones * ((results.sprayGpm || 0) / results.systemGpm))
    rotorZones = effectiveZones - sprayZones
  } else {
    sprayZones = (results.sprayGpm || 0) > 0 ? effectiveZones : 0
    rotorZones = effectiveZones - sprayZones
  }

  const stationCount = CONTROLLER_STATIONS.find(s => s >= totalZones) ?? 48
  const backflowSize = BACKFLOW_LABEL[inputs.meterSize] ?? '1"'

  const dripClause = dripZones > 0
    ? `, and ${dripZones} drip zone${dripZones !== 1 ? 's' : ''}`
    : ''

  const controllerClause = wireType === '2-Wire Decoder Path'
    ? 'automatic 2-wire decoder controller'
    : `automatic ${stationCount}-station controller`

  const backflowClause = includeBackflow
    ? `, and ${backflowSize} backflow preventer with insulated cover`
    : `, and connection to existing backflow assembly`

  return (
    `Furnish and install complete ${totalZones}-zone irrigation system consisting of ` +
    `${sprayZones} spray zone${sprayZones !== 1 ? 's' : ''}, ` +
    `${rotorZones} rotor zone${rotorZones !== 1 ? 's' : ''}${dripClause}, ` +
    `rain sensor, ${controllerClause}${backflowClause}.`
  )
}
