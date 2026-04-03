/**
 * InputScreen — quote input form.
 * Sections: Spray, Rotor, System, Drip, Sleeving, Accessories, Labor.
 * Includes: backflow toggle, zone count override, 2-wire decoder qty fields.
 */

import NumInput from '../components/NumInput'
import Toggle from '../components/Toggle'
import Select from '../components/Select'

const SPACING_OPTIONS = [
  { value: 'short', label: 'Short' },
  { value: 'long',  label: 'Long' },
]

const METER_OPTIONS = [
  { value: '0.75in', label: '¾"' },
  { value: '1in',    label: '1"' },
  { value: '1.5in',  label: '1½"' },
  { value: '2in',    label: '2"' },
]

const BACKFLOW_OPTIONS = [
  { value: true,  label: 'Include' },
  { value: false, label: 'Exclude' },
]

export default function InputScreen({ inputs, settings, onChange, onCalculate }) {
  function field(key) {
    return {
      value: inputs[key],
      onChange: val => onChange({ ...inputs, [key]: val }),
    }
  }

  const is2Wire = settings.wireType === '2-Wire Decoder Path'

  // Calculate minimum zones for the zone override hint
  // (mirror of the calc engine logic so the hint stays accurate)
  const sprayGpm = (inputs.sprayCount || 0) * (inputs.spraySpacing === 'short' ? 1.5 : 2.0)
  const rotorGpm = (inputs.rotorCount || 0) * (inputs.rotorSpacing === 'short' ? 3.0 : 3.5)
  const systemGpm = sprayGpm + rotorGpm
  const availableGpmMap = { '0.75in': 15, '1in': 25, '1.5in': 40, '2in': 65 }
  const availableGpm = availableGpmMap[inputs.meterSize || '1in']
  const minZones = systemGpm > 0
    ? Math.ceil(systemGpm / availableGpm)
    : ((inputs.sprayCount || 0) + (inputs.rotorCount || 0) > 0 ? 1 : 0)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="bg-field-surface border-b border-field-border px-4 py-3 flex-shrink-0">
        <p className="text-xs font-semibold text-field-accent uppercase tracking-widest">IrriCount</p>
        <h1 className="text-xl font-bold text-field-text leading-tight">Quick Quote</h1>
      </header>

      {/* Scrollable form */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 pt-4">

        {/* Job name */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-field-sub mb-1">Job Name (optional)</label>
          <input
            type="text"
            value={inputs.jobName || ''}
            onChange={e => onChange({ ...inputs, jobName: e.target.value })}
            placeholder="e.g. Smith Residence"
            className="w-full bg-field-elevated border border-field-border rounded-lg px-4 py-3
                       text-field-text text-base focus:outline-none focus:ring-2 focus:ring-field-accent
                       placeholder:text-field-muted"
          />
        </div>

        {/* ── Spray Heads ── */}
        <div className="card p-4 mb-4">
          <p className="section-label">Spray Heads</p>
          <NumInput
            label="Spray Head Count"
            {...field('sprayCount')}
            hint="Pop-up spray bodies"
          />
          <Toggle
            label="Spray Spacing"
            options={SPACING_OPTIONS}
            value={inputs.spraySpacing}
            onChange={val => onChange({ ...inputs, spraySpacing: val })}
            hint="Short = 8–12 ft radius  |  Long = 12–15 ft radius"
          />
        </div>

        {/* ── Rotor Heads ── */}
        <div className="card p-4 mb-4">
          <p className="section-label">Rotor Heads</p>
          <NumInput
            label="Rotor Head Count"
            {...field('rotorCount')}
            hint="Gear-drive rotors"
          />
          <Toggle
            label="Rotor Spacing"
            options={SPACING_OPTIONS}
            value={inputs.rotorSpacing}
            onChange={val => onChange({ ...inputs, rotorSpacing: val })}
            hint="Short = 25–35 ft radius  |  Long = 35–45 ft radius"
          />
        </div>

        {/* ── System Sizing ── */}
        <div className="card p-4 mb-4">
          <p className="section-label">System Sizing</p>
          <NumInput
            label="Main Line Length"
            {...field('mainLineLength')}
            suffix="ft"
            hint="Total mainline footage from meter to farthest valve"
          />
          <Select
            label="Meter Size"
            options={METER_OPTIONS}
            value={inputs.meterSize}
            onChange={val => onChange({ ...inputs, meterSize: val })}
            hint="Determines available GPM and main line size"
          />
          <NumInput
            label="Zone Count Override"
            value={inputs.zoneCountOverride || 0}
            onChange={val => onChange({ ...inputs, zoneCountOverride: val })}
            hint={`Calculated minimum: ${minZones} zone${minZones !== 1 ? 's' : ''}. Leave at 0 to use calculated.`}
          />
        </div>

        {/* ── 2-Wire Decoder Quantities (conditional) ── */}
        {is2Wire && (
          <div className="card p-4 mb-4">
            <p className="section-label">Decoder Quantities</p>
            <p className="text-xs text-field-muted mb-3">Enter decoder quantities for 2-wire path system.</p>
            <NumInput
              label="2-Station Decoders"
              {...field('decoder2stQty')}
              hint="Hunter DC-2 or equivalent"
            />
            <NumInput
              label="4-Station Decoders"
              {...field('decoder4stQty')}
            />
            <NumInput
              label="6-Station Decoders"
              {...field('decoder6stQty')}
            />
          </div>
        )}

        {/* ── Drip System ── */}
        <div className="card p-4 mb-4">
          <p className="section-label">Drip System</p>
          <NumInput
            label="Drip Tubing Footage"
            {...field('dripFootage')}
            suffix="ft"
          />
          <NumInput
            label="Drip Zones"
            {...field('dripZones')}
          />
        </div>

        {/* ── Sleeving ── */}
        <div className="card p-4 mb-4">
          <p className="section-label">Sleeving</p>
          <NumInput
            label='2" Sleeving'
            {...field('sleeving2in')}
            suffix="ft"
            hint="Under hardscape, driveways"
          />
          <NumInput
            label='4" Sleeving'
            {...field('sleeving4in')}
            suffix="ft"
            hint="Under roadways, wide crossings"
          />
        </div>

        {/* ── Accessories ── */}
        <div className="card p-4 mb-4">
          <p className="section-label">Accessories</p>
          <NumInput
            label="QCV Count"
            {...field('qcvCount')}
            hint="Quick coupler valves"
          />
          <NumInput
            label="Isolation Valve Count"
            {...field('isolationValveCount')}
          />
          <NumInput
            label="Misc Parts / Electrical ($)"
            {...field('miscCost')}
            suffix="$"
            step={25}
            hint="Any additional materials or electrical"
          />
          <Toggle
            label="Backflow Assembly"
            options={BACKFLOW_OPTIONS}
            value={inputs.includeBackflow !== false}
            onChange={val => onChange({ ...inputs, includeBackflow: val })}
            hint="Exclude if connecting to existing backflow"
          />
        </div>

        {/* ── Labor & Margin ── */}
        <div className="card p-4 mb-4">
          <p className="section-label">Labor &amp; Pricing</p>
          <NumInput
            label="Labor Rate"
            value={settings.laborRate}
            onChange={val => onChange(inputs, { ...settings, laborRate: val })}
            suffix="$/hr"
            step={0.5}
            hint="Default set in Settings"
          />
          <div className="mb-2">
            <label className="block text-sm font-semibold text-field-sub mb-1">
              Gross Margin Target — {Math.round((settings.grossMargin || 0.40) * 100)}%
            </label>
            <input
              type="range"
              min="10"
              max="65"
              step="1"
              value={Math.round((settings.grossMargin || 0.40) * 100)}
              onChange={e => onChange(inputs, { ...settings, grossMargin: Number(e.target.value) / 100 })}
              className="w-full h-3 rounded-full appearance-none bg-field-elevated accent-field-accent cursor-pointer"
            />
            <div className="flex justify-between text-xs text-field-muted mt-1">
              <span>10%</span><span>65%</span>
            </div>
          </div>
        </div>

      </div>

      {/* Main line wire-cost warning */}
      {inputs.mainLineLength === 0 && (inputs.sprayCount > 0 || inputs.rotorCount > 0) && (
        <div className="mx-4 mb-2 px-3 py-2 rounded-lg bg-yellow-900/50 border border-yellow-600 text-yellow-300 text-sm">
          ⚠ Main line length is 0 — wire cost will be $0. Enter footage or tap Calculate to proceed.
        </div>
      )}

      {/* Calculate CTA */}
      <div className="flex-shrink-0 px-4 py-3 bg-field-surface border-t border-field-border">
        <button
          type="button"
          onClick={onCalculate}
          className="tap-btn w-full h-14 bg-field-accent text-field-bg text-lg font-bold rounded-xl
                     active:bg-field-accent-dark"
        >
          Calculate Quote
        </button>
      </div>
    </div>
  )
}
