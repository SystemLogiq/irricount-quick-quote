/**
 * Select — grid of large tap buttons for a set of discrete options.
 * Used for meter size and other multi-choice fields.
 */
export default function Select({ label, value, options, onChange, hint = '' }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-semibold text-field-sub mb-1">{label}</label>
      <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
        {options.map(opt => {
          const active = value === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={[
                'tap-btn h-12 text-sm font-semibold rounded-xl border transition-colors',
                active
                  ? 'bg-field-accent border-field-accent text-field-bg'
                  : 'bg-field-elevated border-field-border text-field-sub',
              ].join(' ')}
              aria-pressed={active}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
      {hint && <p className="text-xs text-field-muted mt-1">{hint}</p>}
    </div>
  )
}
