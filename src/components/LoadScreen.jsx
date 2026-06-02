import { useEffect, useRef, useState } from 'react'
import exampleData from '../../labeler_input.example.json'

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

export default function LoadScreen({ onLoad, initialUrl = '' }) {
  const [error, setError] = useState('')
  const [loadingUrl, setLoadingUrl] = useState(false)
  const [urlValue, setUrlValue] = useState(initialUrl)
  const [showUrlLoader, setShowUrlLoader] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [showSchema, setShowSchema] = useState(false)
  const textRef = useRef()
  const fileRef = useRef()
  const autoLoadedUrlRef = useRef('')

  useEffect(() => {
    if (!initialUrl || autoLoadedUrlRef.current === initialUrl) return
    autoLoadedUrlRef.current = initialUrl
    setUrlValue(initialUrl)
    loadFromUrl(initialUrl)
  }, [initialUrl])

  function parse(raw) {
    setError('')
    if (!raw?.trim()) { setError('Paste, drop, or load a JSON file first.'); return false }
    let parsed
    try { parsed = JSON.parse(raw) } catch (e) { setError('Invalid JSON: ' + e.message); return false }
    if (!Array.isArray(parsed.content)) { setError('"content" must be an array.'); return false }
    if (!Array.isArray(parsed.config?.categories) || parsed.config.categories.length === 0) {
      setError('"config.categories" must be a non-empty array.'); return false
    }
    onLoad(parsed)
    return true
  }

  async function loadFromUrl(rawUrl) {
    const url = rawUrl.trim()
    if (!url) {
      setError('Enter a URL first.')
      return
    }

    setError('')
    setLoadingUrl(true)
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`)
      }
      const loaded = await response.text()
      if (parse(loaded)) {
        window.history.replaceState({}, '', `${import.meta.env.BASE_URL}?url=${encodeURIComponent(url)}`)
      }
    } catch (e) {
      setError('Unable to load URL: ' + e.message)
    } finally {
      setLoadingUrl(false)
    }
  }

  function handleFile(file) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = e => parse(e.target.result)
    reader.readAsText(file)
  }

  return (
    <div className="load-screen">
      <h1>Light Labeler</h1>

      <div className="intro">
        <p className="intro-lead">A lightweight tool to label your data.</p>
        <p className="intro-sub">
          Drop in a JSON file, assign a label to each item, download the result. That's all this tool does — by design.
        </p>
        <ul className="intro-bullets">
          <li>One job only: present data for manual labeling.</li>
          <li>Everything runs in your browser — your data never leaves your machine.</li>
          <li>Export <code>labeled.json</code> and analyze it with Python, R, or any tool you choose.</li>
        </ul>
      </div>

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
          Start →
        </button>
        <span className="hint">Ctrl+Enter to start</span>
        <button className="btn btn-amber" onClick={() => {
          textRef.current.value = JSON.stringify(exampleData, null, 2)
          textRef.current.scrollTop = 0
        }}>
          Load an example
        </button>
        <button className="btn btn-blue" onClick={() => setShowSchema(s => !s)}>
          {showSchema ? 'Hide' : 'Show'} format spec
        </button>
        <button className="btn btn-blue" onClick={() => setShowUrlLoader(true)}>
          Load from URL
        </button>
      </div>

      {showUrlLoader && (
        <div className="url-loader">
          <div className="url-loader-label">Load from URL</div>
          <div className="url-loader-row">
            <input
              className="url-input"
              type="url"
              placeholder="https://example.com/labeler_input.json"
              value={urlValue}
              onChange={e => setUrlValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') loadFromUrl(urlValue) }}
            />
            <button className="btn btn-blue" onClick={() => loadFromUrl(urlValue)} disabled={loadingUrl}>
              {loadingUrl ? 'Loading…' : 'Load'}
            </button>
          </div>
          <p className="url-loader-hint">
            Use a raw JSON URL or pass <code>?url=</code> in the share link to open the data directly.
          </p>
        </div>
      )}

      {error && <div className="error">{error}</div>}

      <p className="source-link">
        Open source ·{' '}
        <a href="https://github.com/RomainLefeuvre/LightLabeler" target="_blank" rel="noreferrer">
          github.com/RomainLefeuvre/LightLabeler
        </a>
      </p>

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
