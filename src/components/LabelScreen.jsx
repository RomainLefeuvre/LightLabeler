import { useEffect } from 'react'

function isLabeled(item) {
  return Array.isArray(item.ground_truth) && item.ground_truth.length > 0
}

export default function LabelScreen({ items, config, current, onToggle, onNavigate, onAdvance, onDone }) {
  const item = items[current]
  const attrs = config.attribute_to_show || Object.keys(item).filter(k => k !== 'ground_truth')
  const selected = new Set(item.ground_truth || [])
  const labeled = items.filter(isLabeled).length
  const progress = (labeled / items.length) * 100
  const predAttr = config.prediction_attribute
  const prediction = predAttr != null ? item[predAttr] : undefined

  useEffect(() => {
    function onKey(e) {
      if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return
      const num = parseInt(e.key)
      if (!isNaN(num) && num >= 1 && num <= config.categories.length) {
        onToggle(config.categories[num - 1])
        return
      }
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onAdvance() }
      if (e.key === 'ArrowLeft')  onNavigate(-1)
      if (e.key === 'ArrowRight') onNavigate(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [config.categories, onToggle, onAdvance, onNavigate])

  return (
    <div className="label-screen">
      <header className="label-header">
        <h1>Data Labeler</h1>
        <button className="btn-primary" onClick={onDone}>Done / Download</button>
      </header>

      <div className="progress-wrap">
        <span className="progress-text">{current + 1} / {items.length} · {labeled} labeled</span>
        <div className="progress-bar-track">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="item-card">
        {attrs.map(key => {
          const val = item[key]
          const display = val == null ? '—'
            : typeof val === 'object' ? JSON.stringify(val, null, 2)
            : String(val)
          return (
            <div key={key} className="attr-row">
              <span className="attr-key">{key}</span>
              <span className="attr-val">{display}</span>
            </div>
          )
        })}

        {prediction != null && (
          <div className="prediction-row">
            <span className="prediction-label">LLM prediction</span>
            <span className="prediction-badge">{String(prediction)}</span>
          </div>
        )}
      </div>

      <p className="category-hint">
        Toggle categories · <kbd>Enter</kbd> / <kbd>Space</kbd> to advance · <kbd>←</kbd><kbd>→</kbd> to navigate
      </p>

      <div className="categories">
        {config.categories.map((cat, i) => (
          <button
            key={cat}
            className={`cat-btn${selected.has(cat) ? ' selected' : ''}`}
            onClick={() => onToggle(cat)}
          >
            {cat}
            {i < 9 && <span className="key-hint">[{i + 1}]</span>}
          </button>
        ))}
      </div>

      {isLabeled(item) && (
        <p className="current-label">✓ {item.ground_truth.join(', ')}</p>
      )}

      <div className="nav-row">
        <button className="btn" onClick={() => onNavigate(-1)} disabled={current === 0}>← Prev</button>
        <button className="btn" onClick={() => onNavigate(1)} disabled={current === items.length - 1}>Next →</button>
      </div>
    </div>
  )
}
