import { useEffect, useState } from 'react'
import LoadScreen from './components/LoadScreen'
import LabelScreen from './components/LabelScreen'
import ReconcileScreen from './components/ReconcileScreen'
import SummaryScreen from './components/SummaryScreen'

const STORAGE_KEY = 'labeler_session'

function isLabeled(item) {
  return Array.isArray(item.ground_truth) && item.ground_truth.length > 0
}

export default function App() {
  const [screen, setScreen] = useState('load')
  const [items, setItems] = useState([])
  const [config, setConfig] = useState({})
  const [current, setCurrent] = useState(0)
  const [initialUrl, setInitialUrl] = useState('')
  const [diffIndices, setDiffIndices] = useState([])
  const [diffPos, setDiffPos] = useState(0)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const url = params.get('url')
    if (url) {
      setInitialUrl(url)
    } else {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        try {
          const { items: its, config: cfg, current: cur, screen: scr, diffIndices: diffs, diffPos: dpos } = JSON.parse(saved)
          setItems(its)
          setConfig(cfg)
          setCurrent(cur ?? 0)
          if (scr === 'reconcile' && Array.isArray(diffs) && diffs.length > 0) {
            setDiffIndices(diffs)
            setDiffPos(dpos ?? 0)
            setScreen('reconcile')
          } else {
            setScreen('label')
          }
        } catch {
          localStorage.removeItem(STORAGE_KEY)
        }
      }
    }
  }, [])

  useEffect(() => {
    if (items.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ items, config, current, screen, diffIndices, diffPos }))
    }
  }, [items, config, current, screen, diffIndices, diffPos])

  function handleLoad(parsed) {
    const its = parsed.content
    const cfg = parsed.config
    setItems(its)
    setConfig(cfg)
    const first = its.findIndex(x => !isLabeled(x))
    setCurrent(first === -1 ? 0 : first)
    setScreen('label')
  }

  function handleStartOver() {
    localStorage.removeItem(STORAGE_KEY)
    setItems([])
    setConfig({})
    setCurrent(0)
    setDiffIndices([])
    setDiffPos(0)
    setScreen('load')
  }

  function handleLoadReconcile(parsedA, parsedB) {
    const contentA = parsedA.content
    const contentB = parsedB.content
    const merged = contentA.map((itemA, i) => {
      const itemB = contentB[i] || {}
      const gtA = Array.isArray(itemA.ground_truth) ? itemA.ground_truth : []
      const gtB = Array.isArray(itemB.ground_truth) ? itemB.ground_truth : []
      const same = JSON.stringify([...gtA].sort()) === JSON.stringify([...gtB].sort())
      const item = { ...itemA }
      if (same) {
        item.ground_truth = gtA.length > 0 ? gtA : undefined
      } else {
        item.ground_truth = gtA.length > 0 ? [...gtA] : undefined
        item._isDiff = true
        item._annotatorA = gtA
        item._annotatorB = gtB
        item._resolved = false
      }
      return item
    })
    const diffs = merged.reduce((acc, it, i) => {
      if (it._isDiff) acc.push(i)
      return acc
    }, [])
    setItems(merged)
    setConfig(parsedA.config)
    setDiffIndices(diffs)
    setDiffPos(0)
    setScreen(diffs.length > 0 ? 'reconcile' : 'summary')
  }

  function handleReconcileToggle(cat) {
    setItems(prev => {
      const next = [...prev]
      const idx = diffIndices[diffPos]
      const item = { ...next[idx] }
      const gt = Array.isArray(item.ground_truth) ? [...item.ground_truth] : []
      const i = gt.indexOf(cat)
      if (i === -1) gt.push(cat)
      else gt.splice(i, 1)
      item.ground_truth = gt.length > 0 ? gt : undefined
      item._resolved = true
      next[idx] = item
      return next
    })
  }

  function handleReconcileChoose(source) {
    setItems(prev => {
      const next = [...prev]
      const idx = diffIndices[diffPos]
      const item = { ...next[idx] }
      const gt = source === 'A' ? item._annotatorA : item._annotatorB
      item.ground_truth = gt.length > 0 ? [...gt] : undefined
      item._resolved = true
      next[idx] = item
      return next
    })
  }

  function handleReconcileNavigate(delta) {
    setDiffPos(prev => Math.max(0, Math.min(diffIndices.length - 1, prev + delta)))
  }

  function handleReconcileDone() {
    setItems(prev => prev.map(item => {
      if (!item._isDiff) return item
      const { _isDiff, _annotatorA, _annotatorB, _resolved, ...rest } = item
      return rest
    }))
    setDiffIndices([])
    setDiffPos(0)
    setScreen('summary')
  }

  function handleToggle(cat) {
    setItems(prev => {
      const next = [...prev]
      const item = { ...next[current] }
      const gt = Array.isArray(item.ground_truth) ? [...item.ground_truth] : []
      const idx = gt.indexOf(cat)
      if (idx === -1) gt.push(cat)
      else gt.splice(idx, 1)
      item.ground_truth = gt.length > 0 ? gt : undefined
      next[current] = item
      return next
    })
  }

  function handleNavigate(delta) {
    setCurrent(prev => Math.max(0, Math.min(items.length - 1, prev + delta)))
  }

  function handleAdvance() {
    const next = items.findIndex((x, i) => i > current && !isLabeled(x))
    if (next !== -1) setCurrent(next)
    else if (current < items.length - 1) setCurrent(c => c + 1)
  }

  return (
    <div className="app">
      {screen === 'load' && (
        <LoadScreen onLoad={handleLoad} onLoadReconcile={handleLoadReconcile} initialUrl={initialUrl} />
      )}
      {screen === 'reconcile' && (
        <ReconcileScreen
          items={items}
          config={config}
          diffIndices={diffIndices}
          diffPos={diffPos}
          onToggle={handleReconcileToggle}
          onChoose={handleReconcileChoose}
          onNavigate={handleReconcileNavigate}
          onDone={handleReconcileDone}
          onStartOver={handleStartOver}
        />
      )}
      {screen === 'label' && (
        <LabelScreen
          items={items}
          config={config}
          current={current}
          onToggle={handleToggle}
          onNavigate={handleNavigate}
          onAdvance={handleAdvance}
          onDone={() => setScreen('summary')}
          onStartOver={handleStartOver}
        />
      )}
      {screen === 'summary' && (
        <SummaryScreen
          items={items}
          config={config}
          onBack={() => setScreen('label')}
        />
      )}
    </div>
  )
}
