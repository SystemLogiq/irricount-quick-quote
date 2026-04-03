/**
 * SavedQuotesScreen — list of locally stored quotes with recall/delete.
 */

import { useState } from 'react'
import { loadQuotes, deleteQuote } from '../utils/storage'
import { fmt, fmtHrs } from '../utils/calculations'
import { generateClientProposalPDF } from '../utils/pdf'

export default function SavedQuotesScreen({ settings, onRecall }) {
  const [quotes, setQuotes] = useState(() => loadQuotes())

  function handleDelete(id) {
    deleteQuote(id)
    setQuotes(loadQuotes())
  }

  function handlePDF(quote) {
    generateClientProposalPDF(quote.inputs, quote.results, { ...settings, ...quote.settingsSnapshot })
  }

  if (quotes.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center text-field-muted px-8 text-center gap-3">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <p className="text-base font-medium">No saved quotes yet.</p>
          <p className="text-sm">Generate a quote and tap Save to store it here.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <Header count={quotes.length} />

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6 space-y-3">
        {quotes.map(quote => (
          <QuoteCard
            key={quote.id}
            quote={quote}
            onRecall={() => onRecall(quote)}
            onDelete={() => handleDelete(quote.id)}
            onPDF={() => handlePDF(quote)}
          />
        ))}
      </div>
    </div>
  )
}

function Header({ count }) {
  return (
    <header className="bg-field-surface border-b border-field-border px-4 py-3 flex-shrink-0">
      <p className="text-xs font-semibold text-field-accent uppercase tracking-widest">IrriCount</p>
      <h1 className="text-xl font-bold text-field-text">
        Saved Quotes {count != null && count > 0 ? <span className="text-field-sub font-normal text-base">({count})</span> : null}
      </h1>
    </header>
  )
}

function QuoteCard({ quote, onRecall, onDelete, onPDF }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const date = new Date(quote.createdAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
  const { results } = quote

  return (
    <div className="card p-4">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1 min-w-0">
          <p className="text-base font-bold text-field-text truncate">{quote.jobName || 'Unnamed Quote'}</p>
          <p className="text-xs text-field-muted">{date}</p>
        </div>
        <div className="text-right ml-3">
          <p className="text-xl font-black text-field-accent">${fmt(results.salePrice)}</p>
          <p className="text-xs text-field-sub">{results.minZones} zones</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex gap-3 mb-3 text-xs text-field-sub">
        <span>{quote.inputs.sprayCount || 0} spray</span>
        <span>·</span>
        <span>{quote.inputs.rotorCount || 0} rotor</span>
        <span>·</span>
        <span>{quote.inputs.meterSize} meter</span>
        <span>·</span>
        <span>{fmtHrs(results.labor.totalHours)} hrs</span>
      </div>

      {/* Actions */}
      {confirmDelete ? (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setConfirmDelete(false)}
            className="tap-btn flex-1 h-10 bg-field-elevated border border-field-border text-field-sub text-sm rounded-lg"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="tap-btn flex-1 h-10 bg-field-danger border border-field-danger text-field-bg text-sm font-semibold rounded-lg"
          >
            Delete
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onPDF}
            className="tap-btn w-10 h-10 bg-field-elevated border border-field-border text-field-sub text-xs rounded-lg"
            aria-label="Generate PDF"
          >
            📄
          </button>
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="tap-btn w-10 h-10 bg-field-elevated border border-field-border text-field-danger text-xs rounded-lg"
            aria-label="Delete quote"
          >
            🗑
          </button>
          <button
            type="button"
            onClick={onRecall}
            className="tap-btn flex-1 h-10 bg-field-elevated border border-field-accent text-field-accent text-sm font-semibold rounded-lg"
          >
            Load Quote →
          </button>
        </div>
      )}
    </div>
  )
}
