import { useState, useRef } from 'react'

const PLACEHOLDER = `{
  "content": [
    { "step_name": "Checkout", "project": "org/repo", "Class": "Cloning and source management" }
  ],
  "config": {
    "attribute_to_show": ["step_name", "project", "workflow_filename"],
    "prediction_attribute": "Class",
    "categories": ["Cloning and source management", "Testing", "Other"]
  }
}`

const SCHEMA = [
  {
    field: 'content',
    type: 'object[]',
    required: true,
    desc: 'List of items to label. Each item is a flat JSON object — any keys are accepted.',
  },
  {
    field: 'config.categories',
    type: 'string[]',
    required: true,
    desc: 'Labels the annotator can assign. Multi-select: several categories can be picked per item. Keys 1–9 map to the first nine entries.',
  },
  {
    field: 'config.attribute_to_show',
    type: 'string[]',
    required: false,
    desc: 'Keys from each item to display during labeling. If omitted, all keys are shown (except ground_truth).',
  },
  {
    field: 'config.prediction_attribute',
    type: 'string',
    required: false,
    desc: 'Key holding an existing prediction (e.g. from an LLM). Shown as an amber badge below the attributes so you can compare before assigning the ground truth.',
  },
]

export default function LoadScreen({ onLoad }) {
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)
  const [showSchema, setShowSchema] = useState(false)
  const textRef = useRef()
  const fileRef = useRef()

  function parse(raw) {
    setError('')
    if (!raw?.trim()) { setError('Paste or drop a JSON file first.'); return }
    let parsed
    try { parsed = JSON.parse(raw) } catch (e) { setError('Invalid JSON: ' + e.message); return }
    if (!Array.isArray(parsed.content)) { setError('"content" must be an array.'); return }
    if (!Array.isArray(parsed.config?.categories) || parsed.config.categories.length === 0) {
      setError('"config.categories" must be a non-empty array.'); return
    }
    onLoad(parsed)
  }

  function handleFile(file) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = e => parse(e.target.result)
    reader.readAsText(file)
  }

  return (
    <div className="load-screen">
      <h1>Data Labeler</h1>

      <div
        className={`drop-zone${dragging ? ' drag-over' : ''}`}
        onClick={() => fileRef.current.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }}
      >
        Drop JSON file here or click to browse
        <input ref={fileRef} type="file" accept=".json,application/json" hidden
          onChange={e => handleFile(e.target.files[0])} />
      </div>

      <textarea
        ref={textRef}
        className="json-input"
        placeholder={PLACEHOLDER}
        onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) parse(textRef.current.value) }}
      />

      <div className="load-actions">
        <button className="btn-primary" onClick={() => parse(textRef.current.value)}>
          Load &amp; Start →
        </button>
        <span className="hint">Ctrl+Enter to start</span>
        <button className="btn-ghost" onClick={() => setShowSchema(s => !s)}>
          {showSchema ? 'Hide' : 'Show'} format reference
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {showSchema && (
        <div className="schema-box">
          <div className="schema-title">Expected JSON format</div>

          <table className="schema-table">
            <thead>
              <tr>
                <th>Field</th>
                <th>Type</th>
                <th>Required</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {SCHEMA.map(row => (
                <tr key={row.field}>
                  <td><code>{row.field}</code></td>
                  <td><span className="type-badge">{row.type}</span></td>
                  <td>{row.required ? <span className="req">yes</span> : <span className="opt">no</span>}</td>
                  <td>{row.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="schema-title" style={{ marginTop: '16px' }}>Output</div>
          <p className="schema-note">
            Each labeled item receives a <code>ground_truth: string[]</code> field.
            Unlabeled items are left unchanged. Download the result as <code>labeled.json</code> from the summary screen.
          </p>

          <div className="schema-title" style={{ marginTop: '16px' }}>Keyboard shortcuts</div>
          <div className="shortcuts">
            <div className="shortcut-row"><kbd>1</kbd>–<kbd>9</kbd><span>Toggle category at that position</span></div>
            <div className="shortcut-row"><kbd>Enter</kbd> / <kbd>Space</kbd><span>Advance to next unlabeled item</span></div>
            <div className="shortcut-row"><kbd>←</kbd> <kbd>→</kbd><span>Navigate freely</span></div>
          </div>
        </div>
      )}
    </div>
  )
}
