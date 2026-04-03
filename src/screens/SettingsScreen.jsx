/**
 * SettingsScreen — Contractor Profile, Pricing Defaults, Company Info, Parts Library.
 */

import { useState } from 'react'
import { saveSettings, savePrices, DEFAULT_PRICES } from '../utils/storage'

const SPRAY_BODY_OPTIONS = [
  { value: '4in', label: '4" Body' },
  { value: '6in', label: '6" Body' },
]

const WIRE_TYPE_OPTIONS = [
  { value: '14/1 Conventional', label: '14/1 Conv' },
  { value: 'Multi-Strand',      label: 'Multi-Str' },
  { value: '2-Wire Decoder Path', label: '2-Wire' },
]

const VALVE_BOX_OPTIONS = [
  { value: 'Standard',  label: 'Auto-Size' },
  { value: '10in Round', label: '10" Round' },
  { value: 'Manifold',  label: 'Manifold' },
]

export default function SettingsScreen({ settings, onSave, prices, onSavePrices }) {
  const [local, setLocal] = useState({ ...settings })
  const [localPrices, setLocalPrices] = useState({ ...DEFAULT_PRICES, ...prices })
  const [saved, setSaved] = useState(false)

  function field(key, type = 'text') {
    return {
      value: local[key] ?? '',
      onChange: e => {
        const val = type === 'number' ? Number(e.target.value) : e.target.value
        setLocal(prev => ({ ...prev, [key]: val }))
        setSaved(false)
      },
    }
  }

  function priceField(key) {
    return {
      value: localPrices[key] ?? '',
      onChange: e => {
        setLocalPrices(prev => ({ ...prev, [key]: Number(e.target.value) }))
        setSaved(false)
      },
    }
  }

  function toggle(key, val) {
    setLocal(prev => ({ ...prev, [key]: val }))
    setSaved(false)
  }

  function handleSave() {
    saveSettings(local)
    onSave(local)
    savePrices(localPrices)
    onSavePrices(localPrices)
    setSaved(true)
  }

  const PRICE_GROUPS = [
    {
      label: 'Pipe',
      items: [
        { key: 'lateralPipe1in',    label: '1" Lateral Pipe',      unit: '/ft' },
        { key: 'lateralPipe1_5in',  label: '1½" Lateral Pipe',     unit: '/ft' },
        { key: 'mainLinePipe1in',   label: '1" Main Line',          unit: '/ft' },
        { key: 'mainLinePipe1_5in', label: '1½" Main Line',         unit: '/ft' },
        { key: 'mainLinePipe2in',   label: '2" Main Line',          unit: '/ft' },
        { key: 'mainLinePipe3in',   label: '3" Main Line',          unit: '/ft' },
      ],
    },
    {
      label: 'Spray & Rotor Heads',
      items: [
        { key: 'sprayBody',    label: 'Spray Body 4"',        unit: 'ea' },
        { key: 'sprayBody6in', label: 'Spray Body 6"',        unit: 'ea' },
        { key: 'sprayNozzle',  label: 'Fixed Spray Nozzle',   unit: 'ea' },
        { key: 'rotorHead',    label: 'Rotor 4" Adj Arc',     unit: 'ea' },
        { key: 'flexBarb05',   label: 'Flex Barb ½"',         unit: 'ea' },
        { key: 'flexBarb075',  label: 'Flex Barb ¾"',         unit: 'ea' },
        { key: 'swingPipeFt',  label: 'Flex Swing Pipe',      unit: '/ft' },
      ],
    },
    {
      label: 'Valves',
      items: [
        { key: 'zoneValve',      label: 'Electric Valve 1"',       unit: 'ea' },
        { key: 'zoneValve1_5in', label: 'Electric Valve 1.5"',     unit: 'ea' },
        { key: 'dripValve',      label: 'Drip Control Valve',      unit: 'ea' },
        { key: 'qcv',            label: 'Quick Coupler Valve',     unit: 'ea' },
        { key: 'qcvKeySwivel',   label: 'QCV Key/Swivel',          unit: 'ea' },
        { key: 'isolationValve', label: 'Isolation Ball Valve 1"', unit: 'ea' },
      ],
    },
    {
      label: 'Wire & Electrical',
      items: [
        { key: 'wireFt',           label: 'Wire 14/1 Conventional', unit: '/ft' },
        { key: 'wire14_2ft',       label: 'Wire 14/2 Decoder Cable',unit: '/ft' },
        { key: 'wire18_2ft',       label: 'Wire 18/2 Multi-Strand', unit: '/ft' },
        { key: 'wire18_3ft',       label: 'Wire 18/3 Multi-Strand', unit: '/ft' },
        { key: 'wire18_4ft',       label: 'Wire 18/4 Multi-Strand', unit: '/ft' },
        { key: 'wire18_5ft',       label: 'Wire 18/5 Multi-Strand', unit: '/ft' },
        { key: 'wire18_6ft',       label: 'Wire 18/6 Multi-Strand', unit: '/ft' },
        { key: 'wire18_7ft',       label: 'Wire 18/7 Multi-Strand', unit: '/ft' },
        { key: 'wire18_8ft',       label: 'Wire 18/8 Multi-Strand', unit: '/ft' },
        { key: 'wire18_9ft',       label: 'Wire 18/9 Multi-Strand', unit: '/ft' },
        { key: 'wire18_10ft',      label: 'Wire 18/10 Multi-Strand',unit: '/ft' },
        { key: 'wire18_12ft',      label: 'Wire 18/12 Multi-Strand',unit: '/ft' },
        { key: 'wire18_13ft',      label: 'Wire 18/13 Multi-Strand',unit: '/ft' },
        { key: 'spliceKit',        label: 'Waterproof Splice Kit',  unit: 'ea' },
        { key: 'primerCementPair', label: 'Primer + Cement',        unit: '/pair' },
      ],
    },
    {
      label: 'Controllers',
      items: [
        { key: 'controller6st',      label: '6-Station Controller',           unit: 'ea' },
        { key: 'controller12st',     label: '12-Station Controller',          unit: 'ea' },
        { key: 'controller24st',     label: '24-Station Controller',          unit: 'ea' },
        { key: 'controller36st',     label: '36-Station Controller',          unit: 'ea' },
        { key: 'controller48st',     label: '48-Station Controller',          unit: 'ea' },
        { key: 'controller2wire12st',label: '2-Wire Dec Controller 12-Sta',  unit: 'ea' },
        { key: 'controller2wire24st',label: '2-Wire Dec Controller 24-Sta',  unit: 'ea' },
        { key: 'controller2wire48st',label: '2-Wire Dec Controller 48-Sta',  unit: 'ea' },
        { key: 'decoder2st',         label: 'Field Decoder 2-Station',        unit: 'ea' },
        { key: 'decoder4st',         label: 'Field Decoder 4-Station',        unit: 'ea' },
        { key: 'decoder6st',         label: 'Field Decoder 6-Station',        unit: 'ea' },
      ],
    },
    {
      label: 'Accessories',
      items: [
        { key: 'valveBoxRound6in', label: 'Valve Box 6" Round',    unit: 'ea' },
        { key: 'valveBoxSmall',    label: 'Valve Box 10" Round',   unit: 'ea' },
        { key: 'valveBoxLarge',    label: 'Valve Box 12×17 Rect',  unit: 'ea' },
        { key: 'peaGravelBag',     label: 'Pea Gravel',            unit: '/bag' },
        { key: 'rainSensor',       label: 'Rain Sensor/Bypass',    unit: 'ea' },
        { key: 'backflow075in',    label: 'RPZ Backflow ¾"',       unit: 'ea' },
        { key: 'backflow1in',      label: 'RPZ Backflow 1"',       unit: 'ea' },
        { key: 'backflow1_5in',    label: 'RPZ Backflow 1½"',      unit: 'ea' },
        { key: 'backflow2in',      label: 'RPZ Backflow 2"',       unit: 'ea' },
      ],
    },
    {
      label: 'Drip & Sleeving',
      items: [
        { key: 'dripTubeFt',    label: 'Drip Tube',           unit: '/ft' },
        { key: 'sleeving2inFt', label: 'Conduit Sleeve 2"',   unit: '/ft' },
        { key: 'sleeving4inFt', label: 'Conduit Sleeve 4"',   unit: '/ft' },
      ],
    },
  ]

  return (
    <div className="flex flex-col h-full">
      <header className="bg-field-surface border-b border-field-border px-4 py-3 flex-shrink-0">
        <p className="text-xs font-semibold text-field-accent uppercase tracking-widest">IrriCount</p>
        <h1 className="text-xl font-bold text-field-text">Settings</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-6 pt-4 space-y-4">

        {/* ── Contractor Profile ── */}
        <div className="card p-4">
          <p className="section-label">Contractor Profile</p>

          {/* Spray Body Default */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-field-sub mb-1">
              Spray Body Default
            </label>
            <div className="flex gap-2">
              {SPRAY_BODY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggle('sprayBodyDefault', opt.value)}
                  className={[
                    'tap-btn flex-1 h-12 text-sm font-semibold rounded-xl border transition-colors',
                    local.sprayBodyDefault === opt.value
                      ? 'bg-field-accent border-field-accent text-field-bg'
                      : 'bg-field-elevated border-field-border text-field-sub',
                  ].join(' ')}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-field-muted mt-1">Selects spray body SKU in quote calculations</p>
          </div>

          {/* Wire Type */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-field-sub mb-1">
              Wire Type
            </label>
            <div className="flex gap-2">
              {WIRE_TYPE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggle('wireType', opt.value)}
                  className={[
                    'tap-btn flex-1 h-12 text-sm font-semibold rounded-xl border transition-colors',
                    local.wireType === opt.value
                      ? 'bg-field-accent border-field-accent text-field-bg'
                      : 'bg-field-elevated border-field-border text-field-sub',
                  ].join(' ')}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-field-muted mt-1">
              {local.wireType === 'Multi-Strand' && 'Auto-selects smallest bundle ≥ (zones + 1) conductors, +15% for service loops'}
              {local.wireType === '2-Wire Decoder Path' && 'Main line × 1.15 ft of 14/2 decoder cable; decoder qty entered per quote'}
              {local.wireType === '14/1 Conventional' && 'Common = main line, Hot = common × 5'}
            </p>
          </div>

          {/* Valve Box Style */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-field-sub mb-1">
              Valve Box Style
            </label>
            <div className="flex gap-2">
              {VALVE_BOX_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggle('valveBoxStyle', opt.value)}
                  className={[
                    'tap-btn flex-1 h-12 text-sm font-semibold rounded-xl border transition-colors',
                    local.valveBoxStyle === opt.value
                      ? 'bg-field-accent border-field-accent text-field-bg'
                      : 'bg-field-elevated border-field-border text-field-sub',
                  ].join(' ')}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Manifold valves per box — only shown when Manifold selected */}
          {local.valveBoxStyle === 'Manifold' && (
            <div className="mb-2">
              <label className="block text-sm font-semibold text-field-sub mb-1">
                Max Valves Per Manifold Box
              </label>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={12}
                className="input-base w-28"
                {...field('manifoldValvesPerBox', 'number')}
              />
              <p className="text-xs text-field-muted mt-1">
                Box qty = ROUNDUP(zone count ÷ this value)
              </p>
            </div>
          )}
        </div>

        {/* ── Pricing Defaults ── */}
        <div className="card p-4">
          <p className="section-label">Pricing Defaults</p>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-field-sub mb-1">
              Labor Rate ($/hr)
            </label>
            <input
              type="number"
              inputMode="decimal"
              className="input-base"
              {...field('laborRate', 'number')}
              min={0}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-field-sub mb-1">
              Gross Margin Target — {Math.round((local.grossMargin || 0.40) * 100)}%
            </label>
            <input
              type="range"
              min="10"
              max="65"
              step="1"
              value={Math.round((local.grossMargin || 0.40) * 100)}
              onChange={e => {
                setLocal(prev => ({ ...prev, grossMargin: Number(e.target.value) / 100 }))
                setSaved(false)
              }}
              className="w-full h-3 rounded-full appearance-none bg-field-elevated accent-field-accent cursor-pointer"
            />
            <div className="flex justify-between text-xs text-field-muted mt-1">
              <span>10%</span><span>65%</span>
            </div>
          </div>

          <div className="mb-2">
            <label className="block text-sm font-semibold text-field-sub mb-1">
              Sales Tax Rate — {((local.taxRate || 0.0725) * 100).toFixed(2)}%
            </label>
            <input
              type="range"
              min="0"
              max="12"
              step="0.25"
              value={((local.taxRate || 0.0725) * 100).toFixed(2)}
              onChange={e => {
                setLocal(prev => ({ ...prev, taxRate: Number(e.target.value) / 100 }))
                setSaved(false)
              }}
              className="w-full h-3 rounded-full appearance-none bg-field-elevated accent-field-accent cursor-pointer"
            />
            <div className="flex justify-between text-xs text-field-muted mt-1">
              <span>0%</span><span>12%</span>
            </div>
          </div>
        </div>

        {/* ── Company Info (PDF header/footer) ── */}
        <div className="card p-4">
          <p className="section-label">Company Info (PDF)</p>

          {[
            { key: 'companyName', label: 'Company Name', placeholder: 'Acme Irrigation Co.' },
            { key: 'phone', label: 'Phone', placeholder: '(555) 555-5555' },
            { key: 'email', label: 'Email', placeholder: 'office@example.com' },
            { key: 'address', label: 'Address', placeholder: '123 Main St, City, ST 00000' },
          ].map(({ key, label, placeholder }) => (
            <div key={key} className="mb-4 last:mb-0">
              <label className="block text-sm font-semibold text-field-sub mb-1">{label}</label>
              <input
                type="text"
                placeholder={placeholder}
                className="w-full bg-field-elevated border border-field-border rounded-lg px-4 py-3
                           text-field-text text-base focus:outline-none focus:ring-2 focus:ring-field-accent
                           placeholder:text-field-muted"
                value={local[key] || ''}
                onChange={e => {
                  setLocal(prev => ({ ...prev, [key]: e.target.value }))
                  setSaved(false)
                }}
              />
            </div>
          ))}
        </div>

        {/* ── Parts Library ── */}
        <div className="card p-4">
          <p className="section-label">Parts Library</p>
          <p className="text-xs text-field-muted mb-3">
            Material unit prices used in quote calculations. Update to match your supplier pricing.
          </p>

          {PRICE_GROUPS.map(group => (
            <div key={group.label} className="mb-4 last:mb-0">
              <p className="text-xs font-bold text-field-accent uppercase tracking-widest mb-2">
                {group.label}
              </p>
              <div className="space-y-2">
                {group.items.map(({ key, label, unit }) => (
                  <div key={key} className="flex items-center gap-2">
                    <label className="flex-1 text-sm text-field-sub truncate">{label}</label>
                    <span className="text-xs text-field-muted w-8 text-right shrink-0">{unit}</span>
                    <div className="flex items-center bg-field-elevated border border-field-border rounded-lg px-2 w-24 shrink-0">
                      <span className="text-field-muted text-sm">$</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.001"
                        min={0}
                        className="bg-transparent text-field-text text-sm text-right w-full focus:outline-none py-2 px-1"
                        {...priceField(key)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* App info */}
        <div className="card p-4 text-center">
          <p className="text-xs text-field-muted">IrriCount Quick Quote</p>
          <p className="text-xs text-field-muted">v1.1.0 — fully offline PWA</p>
        </div>

      </div>

      {/* Save button */}
      <div className="flex-shrink-0 px-4 py-3 bg-field-surface border-t border-field-border">
        <button
          type="button"
          onClick={handleSave}
          className={[
            'tap-btn w-full h-14 text-lg font-bold rounded-xl',
            saved
              ? 'bg-field-elevated border border-field-border text-field-muted'
              : 'bg-field-accent text-field-bg',
          ].join(' ')}
        >
          {saved ? '✓ Settings Saved' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}
