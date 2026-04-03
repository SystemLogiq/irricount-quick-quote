/**
 * IrriCount Quick Quote — localStorage helpers
 */

const QUOTES_KEY = 'iqq_quotes'
const SETTINGS_KEY = 'iqq_settings'
const PRICES_KEY = 'iqq_prices'

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Material prices — user-configurable defaults seeded from Parts Library
// ---------------------------------------------------------------------------
export const DEFAULT_PRICES = {
  // Pipe (per ft) — lateral
  lateralPipe1in: 0.438,
  lateralPipe1_5in: 0.389,
  // Pipe (per ft) — main line
  mainLinePipe1in: 0.438,
  mainLinePipe1_5in: 0.930,
  mainLinePipe2in: 0.586,
  mainLinePipe3in: 1.329,
  // Spray & rotor heads
  sprayBody: 1.24,         // Spray body 4"
  sprayBody6in: 0,         // Spray body 6"
  sprayNozzle: 0.78,
  rotorHead: 9.17,
  // Small parts
  flexBarb05: 0.244,
  flexBarb075: 0.268,
  swingPipeFt: 0.212,
  // Valves
  zoneValve: 15.05,        // Electric valve 1"
  zoneValve1_5in: 0,       // Electric valve 1.5"
  dripValve: 45.82,
  qcv: 63.52,              // Quick coupler valve
  qcvKeySwivel: 49.34,     // Quick coupler key/swivel (per QCV)
  isolationValve: 12.00,
  // Wire & electrical — 14/1 conventional (per ft, applied to common + hot)
  wireFt: 0.42,
  spliceKit: 2.17,
  // PVC consumables (primer + cement, per pair of quarts)
  primerCementPair: 46.56,
  // Valve boxes & accessories
  valveBoxRound6in: 0,     // Valve box 6" round
  valveBoxSmall: 11.35,    // 10" round
  valveBoxLarge: 25.79,    // 12×17 rect manifold
  peaGravelBag: 3.85,
  rainSensor: 25.08,
  // Backflow (by meter size)
  backflow075in: 350,
  backflow1in: 425,
  backflow1_5in: 675,
  backflow2in: 895,
  // Drip & sleeving
  dripTubeFt: 0.28,
  sleeving2inFt: 2.00,
  sleeving4inFt: 5.98,
  // Controllers (qty 1, auto-selected by zone count) — $0 placeholder
  controller6st: 0,
  controller12st: 0,
  controller24st: 0,
  controller36st: 0,
  controller48st: 0,
  controller2wire12st: 0,
  controller2wire24st: 0,
  controller2wire48st: 0,
  // Field decoders — 2-wire only — $0 placeholder
  decoder2st: 0,
  decoder4st: 0,
  decoder6st: 0,
  // Multi-strand wire per foot — $0 placeholder
  wire18_2ft: 0,
  wire18_3ft: 0,
  wire18_4ft: 0,
  wire18_5ft: 0,
  wire18_6ft: 0,
  wire18_7ft: 0,
  wire18_8ft: 0,
  wire18_9ft: 0,
  wire18_10ft: 0,
  wire18_12ft: 0,
  wire18_13ft: 0,
  // 2-wire decoder cable per foot — $0 placeholder
  wire14_2ft: 0,
}

export function loadPrices() {
  try {
    const raw = localStorage.getItem(PRICES_KEY)
    if (!raw) return { ...DEFAULT_PRICES }
    return { ...DEFAULT_PRICES, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_PRICES }
  }
}

export function savePrices(prices) {
  localStorage.setItem(PRICES_KEY, JSON.stringify(prices))
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------
export const DEFAULT_SETTINGS = {
  laborRate: 17,
  grossMargin: 0.40,
  taxRate: 0.0725,
  companyName: '',
  phone: '',
  email: '',
  address: '',
  // Contractor Profile
  sprayBodyDefault: '6in',
  wireType: '14/1 Conventional',
  valveBoxStyle: 'Standard',
  manifoldValvesPerBox: 3,
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return { ...DEFAULT_SETTINGS }
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

// ---------------------------------------------------------------------------
// Quotes
// ---------------------------------------------------------------------------
export const DEFAULT_INPUTS = {
  jobName: '',
  sprayCount: 0,
  rotorCount: 0,
  spraySpacing: 'short',
  rotorSpacing: 'short',
  mainLineLength: 0,
  meterSize: '1in',
  dripFootage: 0,
  dripZones: 0,
  sleeving2in: 0,
  sleeving4in: 0,
  qcvCount: 0,
  isolationValveCount: 0,
  miscCost: 0,
  includeBackflow: true,
  zoneCountOverride: 0,
  decoder2stQty: 0,
  decoder4stQty: 0,
  decoder6stQty: 0,
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function loadQuotes() {
  try {
    const raw = localStorage.getItem(QUOTES_KEY)
    if (!raw) return []
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export function saveQuote(inputs, results, settings) {
  const quotes = loadQuotes()
  const quote = {
    id: generateId(),
    createdAt: new Date().toISOString(),
    jobName: inputs.jobName || 'Unnamed Quote',
    inputs: { ...inputs },
    results,
    settingsSnapshot: {
      laborRate: settings.laborRate,
      grossMargin: settings.grossMargin,
      taxRate: settings.taxRate,
    },
  }
  quotes.unshift(quote)
  localStorage.setItem(QUOTES_KEY, JSON.stringify(quotes))
  return quote
}

export function deleteQuote(id) {
  const quotes = loadQuotes().filter(q => q.id !== id)
  localStorage.setItem(QUOTES_KEY, JSON.stringify(quotes))
}
