function isLabeled(item) {
  return Array.isArray(item.ground_truth) && item.ground_truth.length > 0
}

export default function SummaryScreen({ items, config, onBack }) {
  const labeled = items.filter(isLabeled).length
  const counts = Object.fromEntries(config.categories.map(c => [c, 0]))
  items.forEach(x => (x.ground_truth || []).forEach(c => { counts[c] = (counts[c] || 0) + 1 }))

  function download() {
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'labeled.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="summary-screen">
      <h1>Summary</h1>

      <div className="stats-card">
        <table className="stats-table">
          <tbody>
            {config.categories.map(c => (
              <tr key={c}>
                <td>{c}</td>
                <td className="count">{counts[c] || 0}</td>
              </tr>
            ))}
            <tr className="total-row">
              <td>Total labeled</td>
              <td className="count">{labeled} / {items.length}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="summary-actions">
        <button className="btn-primary" onClick={download}>↓ Download labeled.json</button>
        <button className="btn" onClick={onBack}>← Back to labeling</button>
        {items.length - labeled > 0 && (
          <span className="hint">{items.length - labeled} item(s) still unlabeled</span>
        )}
      </div>
    </div>
  )
}
