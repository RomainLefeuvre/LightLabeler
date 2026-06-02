import { useEffect, useState } from 'react'
import LoadScreen from './components/LoadScreen'
import LabelScreen from './components/LabelScreen'
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const url = params.get('url')
    if (url) {
      setInitialUrl(url)
    } else {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        try {
          const { items: its, config: cfg, current: cur } = JSON.parse(saved)
          setItems(its)
          setConfig(cfg)
          setCurrent(cur ?? 0)
          setScreen('label')
        } catch {
          localStorage.removeItem(STORAGE_KEY)
        }
      }
    }
  }, [])

  useEffect(() => {
    if (items.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ items, config, current }))
    }
  }, [items, config, current])

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
    setScreen('load')
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
        <LoadScreen onLoad={handleLoad} initialUrl={initialUrl} />
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
