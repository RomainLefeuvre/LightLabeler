import { useEffect } from 'react'

export default function ReconcileScreen({ items, config, diffIndices, diffPos, onToggle, onChoose, onNavigate, onDone, onStartOver }) {
  const current = diffIndices[diffPos]
  const item = items[current]
  const attrs = config.attribute_to_show || Object.keys(item).filter(k => !k.startsWith('_') && k !== 'ground_truth')
  const selected = new Set(item.ground_truth || [])
  const resolvedCount = diffIndices.filter(i => items[i]._resolved).length
  const progress = (resolvedCount / diffIndices.length) * 100
  const isLast = diffPos === diffIndices.length - 1

  useEffect(() => {
    function onKey(e) {
      if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return
      const num = parseInt(e.key)
      if (!isNaN(num) && num >= 1 && num <= config.categories.length) {
        onToggle(config.categories[num - 1])
        return
      }
      if (e.key === 'a' || e.key === 'A') { onChoose('A'); return }
      if (e.key === 'b' || e.key === 'B') { onChoose('B'); return }
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        if (isLast) onDone()
        else onNavigate(1)
        return
      }
      if (e.key === 'ArrowLeft')  onNavigate(-1)
      if (e.key === 'ArrowRight') onNavigate(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [config.categories, onToggle, onChoose, onNavigate, onDone, isLast])

  return (
    <div className="label-screen">
      <header className="label-header">
        <h1>Reconcile Annotations</h1>
        <div className="label-header-actions">
          <button className="btn" onClick={onStartOver}>Load new files</button>
          <button className="btn-primary" onClick={onDone}>Done / Download</button>
        </div>
      </header>

      <div className="progress-wrap">
        <span className="progress-text">Difference {diffPos + 1} / {diffIndices.length} · {resolvedCount} resolved</span>
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

        <div className="prediction-row">
          <span className="prediction-label">Annotator A</span>
          <span className="prediction-badge">{item._annotatorA.length > 0 ? item._annotatorA.join(', ') : '—'}</span>
          <button className="btn btn-blue" onClick={() => onChoose('A')}>Use A <span className="key-hint">[a]</span></button>
        </div>
        <div className="prediction-row">
          <span className="prediction-label">Annotator B</span>
          <span className="prediction-badge">{item._annotatorB.length > 0 ? item._annotatorB.join(', ') : '—'}</span>
          <button className="btn btn-blue" onClick={() => onChoose('B')}>Use B <span className="key-hint">[b]</span></button>
        </div>
      </div>

      <p className="category-hint">
        Toggle categories for the final decision · <kbd>a</kbd>/<kbd>b</kbd> quick-pick · <kbd>Enter</kbd> next difference · <kbd>←</kbd><kbd>→</kbd> navigate
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

      <p className="current-label">
        {item._resolved ? '✓ Final: ' : '○ Final (defaults to A): '}
        {item.ground_truth?.length ? item.ground_truth.join(', ') : '—'}
      </p>

      <div className="nav-row">
        <button className="btn" onClick={() => onNavigate(-1)} disabled={diffPos === 0}>← Prev</button>
        <button className="btn" onClick={isLast ? onDone : () => onNavigate(1)}>
          {isLast ? 'Finish →' : 'Next →'}
        </button>
      </div>
    </div>
  )
}
