/**
 * ResultsScreen — full calculated quote breakdown.
 * Sections: System Summary, Material by Category, Labor, Pricing.
 * Actions: Save Quote, Generate PDF, Back to Input.
 */

import { useState } from 'react'
import { fmt, fmtHrs, buildProposalLine } from '../utils/calculations'
import { generateClientProposalPDF, generateInternalPDF, generateMaterialsListPDF } from '../utils/pdf'
import { saveQuote } from '../utils/storage'

export default function ResultsScreen({ inputs, results, settings, prices, onBack, onSaved }) {
  const [saved, setSaved] = useState(false)

  function handleSave() {
    saveQuote(inputs, results, settings)
    setSaved(true)
    onSaved?.()
  }

  function handleClientPDF() {
    generateClientProposalPDF(inputs, results, settings)
  }

  function handleInternalPDF() {
    generateInternalPDF(inputs, results, settings)
  }

  function handleMaterialsPDF() {
    generateMaterialsListPDF(inputs, results, settings, prices)
  }

  const { costs, labor } = results
  const proposalLine = buildProposalLine(inputs, results, settings)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="bg-field-surface border-b border-field-border px-4 py-3 flex-shrink-0 flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="tap-btn w-10 h-10 rounded-lg bg-field-elevated border border-field-border text-field-sub"
          aria-label="Back to input"
        >
          ‹
        </button>
        <div>
          <p className="text-xs font-semibold text-field-accent uppercase tracking-widest">Results</p>
          <h1 className="text-lg font-bold text-field-text leading-tight truncate max-w-[220px]">
            {inputs.jobName || 'Quick Quote'}
          </h1>
        </div>
      </header>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 pt-4 space-y-4">

        {/* ── Client Proposal Line ── */}
        <div className="rounded-xl bg-field-elevated border border-field-accent px-4 py-4">
          <p className="text-xs font-semibold text-field-accent uppercase tracking-widest mb-2">Proposal</p>
          <p className="text-sm text-field-text leading-relaxed">{proposalLine}</p>
        </div>

        {/* ── Sale Price Hero ── */}
        <div className="rounded-xl bg-field-accent p-5 text-field-bg">
          <p className="text-sm font-semibold opacity-80 uppercase tracking-wider">Total Sale Price</p>
          <p className="text-4xl font-black mt-1">${fmt(results.salePrice)}</p>
          <div className="flex gap-4 mt-2 text-sm font-medium opacity-90">
            <span>GM {Math.round(results.grossMarginPct)}%</span>
            <span>·</span>
            <span>{fmtHrs(labor.totalHours)} labor hrs</span>
            <span>·</span>
            <span>{results.minZones} zone{results.minZones !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* ── System Summary ── */}
        <div className="card p-4">
          <p className="section-label">System Summary</p>
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Spray GPM" value={fmt(results.sprayGpm)} />
            <Stat label="Rotor GPM" value={fmt(results.rotorGpm)} />
            <Stat label="System GPM" value={fmt(results.systemGpm)} />
            <Stat label="Avail GPM" value={results.availableGpm} />
            <Stat label={results.effectiveZones > results.minZones ? `Zones (min ${results.minZones})` : 'Min Zones'} value={results.effectiveZones ?? results.minZones} accent />
            <Stat label="Main Line" value={results.mainLineSize} />
            <Stat label="Spray Lat" value={`${results.sprayLateral} ft`} />
            <Stat label="Rotor Lat" value={`${results.rotorLateral} ft`} />
            <Stat label="Total Lat" value={`${results.totalLateral} ft`} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Stat label="Common Wire" value={`${results.commonWireFt} ft`} />
            <Stat label="Hot Wire" value={`${results.hotWireFt} ft`} />
            <Stat label="Splice Kits" value={results.spliceKitQty} />
            <Stat label="Primer/Cement" value={`${results.primerCementQty} can${results.primerCementQty !== 1 ? 's' : ''}`} />
            <Stat label="Swing Pipe" value={`${fmtHrs(results.swingPipeFt)} ft`} />
            <Stat label="Valve Boxes" value={`${results.smallValveBoxQty} + ${results.largeValveBoxQty}`} />
          </div>
        </div>

        {/* ── Material Breakdown ── */}
        <div className="card p-4">
          <p className="section-label">Material Breakdown</p>
          <CostRow label="Pipe & Fittings" value={costs.pipe.total} />
          <CostRow label="Heads & Nozzles" value={costs.heads.total} />
          <CostRow label="Valves & Controls" value={costs.valves.total} />
          <CostRow label="Electrical & Wire" value={costs.electrical.total} />
          <CostRow label="Accessories" value={costs.accessories.total} />
          {(inputs.dripFootage > 0 || inputs.dripZones > 0) && (
            <CostRow label="Drip System" value={costs.drip.total} />
          )}
          {((inputs.sleeving2in || 0) + (inputs.sleeving4in || 0)) > 0 && (
            <CostRow label="Sleeving" value={costs.sleeving.total} />
          )}
          {costs.misc > 0 && <CostRow label="Misc / Electrical" value={costs.misc} />}
          <div className="border-t border-field-border mt-2 pt-2">
            <CostRow label="Material Total" value={results.totalMaterial} bold />
          </div>
        </div>

        {/* ── Labor ── */}
        <div className="card p-4">
          <p className="section-label">Labor Summary</p>
          <LaborRow label="Laterals" hrs={labor.laterals} rate={labor.rate} />
          <LaborRow label="Head Install" hrs={labor.headInstall} rate={labor.rate} />
          <LaborRow label="Valve Install" hrs={labor.valveInstall} rate={labor.rate} />
          {labor.dripTubing > 0 && <LaborRow label="Drip Tubing" hrs={labor.dripTubing} rate={labor.rate} />}
          {labor.dripControlValve > 0 && <LaborRow label="Drip Control Valves" hrs={labor.dripControlValve} rate={labor.rate} />}
          {labor.sleeving > 0 && <LaborRow label="Sleeving" hrs={labor.sleeving} rate={labor.rate} />}
          <div className="border-t border-field-border mt-2 pt-2 flex justify-between items-baseline">
            <span className="text-sm font-bold text-field-text">Total Labor</span>
            <div className="text-right">
              <span className="text-xs text-field-sub">{fmtHrs(labor.totalHours)} hrs @ ${fmt(labor.rate)}/hr  </span>
              <span className="text-base font-bold text-field-text">${fmt(labor.cost)}</span>
            </div>
          </div>
        </div>

        {/* ── Pricing Summary ── */}
        <div className="card p-4">
          <p className="section-label">Pricing Summary</p>
          <PriceRow label="Material Subtotal" value={results.totalMaterial} />
          <PriceRow label="Labor" value={results.labor.cost} />
          <PriceRow label={`Sales Tax (${((results.salesTax / results.totalMaterial) * 100).toFixed(2)}%)`} value={results.salesTax} />
          <div className="border-t border-field-border my-2" />
          <PriceRow label="Total Direct Cost" value={results.totalDirectCost} />
          <PriceRow label={`Gross Margin (${Math.round(results.grossMarginPct)}%)`} value={results.salePrice - results.totalDirectCost} />
          <div className="mt-3 rounded-lg bg-field-elevated border border-field-accent px-4 py-3 flex justify-between items-center">
            <span className="text-sm font-bold text-field-accent">SALE PRICE</span>
            <span className="text-2xl font-black text-field-accent">${fmt(results.salePrice)}</span>
          </div>
        </div>

      </div>

      {/* Action buttons */}
      <div className="flex-shrink-0 px-4 py-3 bg-field-surface border-t border-field-border space-y-2">
        {/* PDF row — top */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleClientPDF}
            className="tap-btn flex-1 h-12 bg-field-elevated border border-field-border text-field-text text-sm font-semibold rounded-xl"
          >
            📄 Client Proposal
          </button>
          <button
            type="button"
            onClick={handleInternalPDF}
            className="tap-btn flex-1 h-12 bg-field-elevated border border-field-border text-field-text text-sm font-semibold rounded-xl"
          >
            🔒 Internal Estimate
          </button>
        </div>
        {/* PDF row — materials list */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleMaterialsPDF}
            className="tap-btn flex-1 h-12 bg-field-elevated border border-field-border text-field-text text-sm font-semibold rounded-xl"
          >
            📦 Materials List
          </button>
        </div>
        {/* Save / Edit row */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saved}
            className={[
              'tap-btn flex-1 h-12 text-sm font-semibold rounded-xl border',
              saved
                ? 'bg-field-elevated border-field-border text-field-muted cursor-default'
                : 'bg-field-positive border-field-positive text-field-bg',
            ].join(' ')}
          >
            {saved ? '✓ Saved' : '💾 Save'}
          </button>
          <button
            type="button"
            onClick={onBack}
            className="tap-btn flex-1 h-12 bg-field-elevated border border-field-border text-field-sub text-sm font-semibold rounded-xl"
          >
            ‹ Edit
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Stat({ label, value, accent }) {
  return (
    <div className="bg-field-elevated rounded-lg px-3 py-2">
      <p className="text-xs text-field-muted leading-none mb-1">{label}</p>
      <p className={`text-sm font-bold ${accent ? 'text-field-accent' : 'text-field-text'}`}>{value}</p>
    </div>
  )
}

function CostRow({ label, value, bold }) {
  return (
    <div className={`flex justify-between items-center py-1.5 ${bold ? 'mt-1' : ''}`}>
      <span className={`text-sm ${bold ? 'font-bold text-field-text' : 'text-field-sub'}`}>{label}</span>
      <span className={`text-sm font-mono ${bold ? 'font-bold text-field-text' : 'text-field-text'}`}>
        ${fmt(value)}
      </span>
    </div>
  )
}

function LaborRow({ label, hrs, rate }) {
  return (
    <div className="flex justify-between items-center py-1.5">
      <span className="text-sm text-field-sub">{label}</span>
      <div className="text-right">
        <span className="text-xs text-field-muted">{fmtHrs(hrs)} hrs  </span>
        <span className="text-sm font-mono text-field-text">${fmt(hrs * rate)}</span>
      </div>
    </div>
  )
}

function PriceRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-1.5">
      <span className="text-sm text-field-sub">{label}</span>
      <span className="text-sm font-mono text-field-text">${fmt(value)}</span>
    </div>
  )
}
