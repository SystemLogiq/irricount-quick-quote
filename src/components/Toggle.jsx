/**
 * Toggle — two-option horizontal selector.
 * Full-width, large tap targets, high-contrast active state.
 */
export default function Toggle({ label, value, options, onChange, hint = '' }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-semibold text-field-sub mb-1">{label}</label>
      <div className="flex gap-2">
        {options.map(opt => {
          const active = value === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={[
                'tap-btn flex-1 h-12 text-base font-semibold rounded-xl border transition-colors',
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
