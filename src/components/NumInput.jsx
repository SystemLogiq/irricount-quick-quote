/**
 * NumInput — large numeric field with +/- tap buttons.
 * Optimised for single-hand glare-visible field use.
 */
export default function NumInput({ label, value, onChange, min = 0, max, step = 1, suffix = '', hint = '' }) {
  const num = Number(value) || 0

  function adjust(delta) {
    let next = num + delta
    if (min !== undefined) next = Math.max(min, next)
    if (max !== undefined) next = Math.min(max, next)
    onChange(next)
  }

  function handleChange(e) {
    const raw = e.target.value.replace(/[^0-9.]/g, '')
    let parsed = raw === '' ? 0 : parseFloat(raw)
    if (isNaN(parsed)) parsed = 0
    if (min !== undefined) parsed = Math.max(min, parsed)
    if (max !== undefined) parsed = Math.min(max, parsed)
    onChange(parsed)
  }

  return (
    <div className="mb-4">
      <label className="block text-sm font-semibold text-field-sub mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => adjust(-step)}
          className="tap-btn w-12 h-12 bg-field-elevated border border-field-border text-field-text text-2xl font-light rounded-xl active:bg-field-muted"
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <div className="relative flex-1">
          <input
            type="number"
            inputMode="decimal"
            value={num === 0 ? '' : num}
            placeholder="0"
            onChange={handleChange}
            min={min}
            max={max}
            className="input-base"
            aria-label={label}
          />
          {suffix && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-field-sub text-sm pointer-events-none">
              {suffix}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => adjust(step)}
          className="tap-btn w-12 h-12 bg-field-elevated border border-field-border text-field-accent text-2xl font-light rounded-xl active:bg-field-muted"
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
      {hint && <p className="text-xs text-field-muted mt-1 pl-14">{hint}</p>}
    </div>
  )
}
