import { useState, useCallback, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Check, Copy, Trash2, Eye, Minimize2, 
  Settings2, History, Database, Code2, 
  Terminal, FileJson, X, ChevronRight, 
  Download, Upload, Zap, Layers,
  Globe, Info, Moon, Sun, Monitor,
  Command, Cpu, Share2, Sparkles,
  Search, ShieldCheck, Activity
} from 'lucide-react'
import './styles.css'

// ─── HELPER COMPONENTS ──────────────────────────────────

function SidebarItem({ icon, active, onClick, label }) {
  return (
    <div className={`sidebar-btn ${active ? 'active' : ''}`} onClick={onClick} title={label}>
      {icon}
      {active && <motion.div layoutId="sidebar-active" className="active-rail" />}
    </div>
  )
}

function SettingGroup({ title, children }) {
  return (
    <div className="settings-group">
      <h2 className="group-label">{title}</h2>
      <div className="group-content">{children}</div>
    </div>
  )
}

function SettingItem({ label, control }) {
  return (
    <div className="setting-item">
      <span className="setting-label">{label}</span>
      {control}
    </div>
  )
}

function Toggle({ active = false }) {
  const [isOn, setIsOn] = useState(active)
  return (
    <div className={`pro-toggle ${isOn ? 'active' : ''}`} onClick={() => setIsOn(!isOn)}>
      <motion.div 
        layout
        transition={{ type: 'spring', damping: 25, stiffness: 400 }}
        className="toggle-thumb" 
      />
    </div>
  )
}

function ThemeToggle() {
  return (
    <div className="theme-switch">
      <div className="switch-opt active"><Moon size={12} /></div>
      <div className="switch-opt"><Sun size={12} /></div>
    </div>
  )
}

// Safely highlight JSON tokens
function syntaxHighlight(json) {
  if (!json) return ''
  const escaped = json
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  return escaped.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      let cls = 'jt-number'
      if (/^"/.test(match)) {
        if (/:$/.test(match)) cls = 'jt-key'
        else cls = 'jt-string'
      } else if (/true|false/.test(match)) cls = 'jt-boolean'
      else if (/null/.test(match)) cls = 'jt-null'
      return `<span class="${cls}">${match}</span>`
    }
  )
}

const SAMPLE_JSON = `{
  "id": "formula-pro-v5",
  "name": "JSON Formula Pro",
  "status": "ready",
  "engine": {
    "version": "5.0.0-PRO",
    "speed": "instant"
  },
  "author": "Berkin Yılmaz"
}`

// ─── MAIN APPLICATION ────────────────────────────────────

export default function App() {
  const [activeTab, setActiveTab] = useState('formatter') 
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [isMinified, setIsMinified] = useState(false)
  const [copied, setCopied] = useState(false)
  const [indent, setIndent] = useState(2)
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('json-pro-v5-history')
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })

  // Auto-save history
  useEffect(() => {
    localStorage.setItem('json-pro-v5-history', JSON.stringify(history.slice(0, 30)))
  }, [history])

  const inputStatus = useMemo(() => {
    if (!input.trim()) return null
    try { JSON.parse(input); return 'valid' }
    catch { return 'invalid' }
  }, [input])

  const stats = useMemo(() => {
    if (!output) return null
    return {
      lines: output.split('\n').length,
      chars: output.length.toLocaleString(),
      size: (new Blob([output]).size / 1024).toFixed(2)
    }
  }, [output])

  const highlighted = useMemo(() => {
    if (!output || isMinified) return null
    return syntaxHighlight(output)
  }, [output, isMinified])

  const formatJSON = useCallback(() => {
    const val = input.trim()
    if (!val) return
    try {
      const parsed = JSON.parse(val)
      const formatted = JSON.stringify(parsed, null, indent)
      setOutput(formatted)
      setError('')
      setIsMinified(false)
      
      // Add to history
      if (!history.find(h => h.content === val)) {
        setHistory(prev => [{
          id: Date.now(),
          content: val,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }, ...prev])
      }
    } catch (e) {
      setError(e.message)
      setOutput('')
    }
  }, [input, indent, history])

  const minifyJSON = useCallback(() => {
    const val = input.trim()
    if (!val) return
    try {
      const parsed = JSON.parse(val)
      setOutput(JSON.stringify(parsed))
      setError('')
      setIsMinified(true)
    } catch (e) {
      setError(e.message)
      setOutput('')
    }
  }, [input])

  const copyToClipboard = () => {
    if (!output) return
    navigator.clipboard.writeText(output).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (re) => setInput(re.target.result)
    reader.readAsText(file)
  }

  const downloadJSON = () => {
    if (!output) return
    const blob = new Blob([output], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pro_export_${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="pro-layout">
      {/* ─── SIDEBAR ─────────────────────────────────── */}
      <aside className="pro-sidebar">
        <div className="sidebar-top">
          <div className="logo-box">
             <Code2 size={22} color="#fff" strokeWidth={2.5} />
          </div>
          <div className="nav-group">
            <SidebarItem 
              icon={<Terminal size={22} />} 
              active={activeTab === 'formatter'} 
              onClick={() => setActiveTab('formatter')} 
              label="Editor"
            />
            <SidebarItem 
              icon={<History size={22} />} 
              active={activeTab === 'history'} 
              onClick={() => setActiveTab('history')} 
              label="Logs"
            />
            <SidebarItem 
              icon={<Settings2 size={22} />} 
              active={activeTab === 'settings'} 
              onClick={() => setActiveTab('settings')} 
              label="Config"
            />
          </div>
        </div>
        <div className="sidebar-bottom">
           <SidebarItem icon={<Globe size={20} />} label="Repo" />
        </div>
      </aside>

      {/* ─── MAIN CONTENT ───────────────────────────── */}
      <main className="pro-main">
        
        {/* TOP BAR */}
        <header className="pro-topbar">
          <div className="topbar-left">
            <h1 className="pro-brand">Formula Pro <span className="v-badge">Stable V5</span></h1>
            <div className="topbar-divider" />
            <div className="topbar-stats">
              {stats ? (
                <>
                  <span className="stat-unit">{stats.lines} Lines</span>
                  <div className="dot" />
                  <span className="stat-unit">{stats.chars} Chars</span>
                  <div className="dot" />
                  <span className="stat-unit">{stats.size} KB</span>
                </>
              ) : (
                <span className="stat-hint">Active Status: Standby</span>
              )}
            </div>
          </div>
          <div className="topbar-right">
            <button className="pro-btn ghost" onClick={() => { setInput(''); setOutput(''); setError(''); }}>
              <Trash2 size={14} /> <span>Clear</span>
            </button>
            <button className="pro-btn primary" onClick={copyToClipboard} disabled={!output}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? 'Copied' : 'Copy Output'}</span>
            </button>
          </div>
        </header>

        {/* WORKSPACE */}
        <div className="pro-workspace">
          <AnimatePresence mode="wait">
            {activeTab === 'formatter' && (
              <motion.div 
                key="formatter"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="workspace-grid"
              >
                {/* INPUT PANEL */}
                <div className="panel-container">
                  <div className="panel-chrome">
                    <span className="panel-title">Source Input</span>
                    <div className="panel-ctrls">
                      <label className="ctrl-btn">
                        <Upload size={14} />
                        <input type="file" hidden onChange={handleFileUpload} />
                      </label>
                      <button className="ctrl-btn" onClick={() => setInput(SAMPLE_JSON)}>
                        <Database size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="panel-content">
                    <textarea 
                      className="pro-textarea"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Paste your JSON dataset..."
                      spellCheck={false}
                    />
                    <div className="panel-action-bar">
                      <button className={`mode-btn ${!isMinified ? 'active' : ''}`} onClick={formatJSON}>
                        <Zap size={13} /> Beautify
                      </button>
                      <button className={`mode-btn ${isMinified ? 'active' : ''}`} onClick={minifyJSON}>
                        <Minimize2 size={13} /> Minify
                      </button>
                      <div style={{ flex: 1 }} />
                      {inputStatus && (
                         <div className={`status-flag ${inputStatus}`}>
                           {inputStatus === 'valid' ? '✓ Valid' : '✗ Error'}
                         </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* OUTPUT PANEL */}
                <div className="panel-container">
                  <div className="panel-chrome">
                    <span className="panel-title">Formatted Output</span>
                    <div className="panel-ctrls">
                      <select 
                        className="pro-select-ui"
                        value={indent}
                        onChange={(e) => setIndent(Number(e.target.value))}
                      >
                        <option value={2}>2 Spaces</option>
                        <option value={4}>4 Spaces</option>
                        <option value={8}>8 Spaces</option>
                      </select>
                      <button className="ctrl-btn" onClick={downloadJSON} disabled={!output}>
                        <Download size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="panel-content">
                    <div className="output-viewer">
                      {output ? (
                        <pre 
                          className={`syntax-pre ${isMinified ? 'minified' : ''}`}
                          dangerouslySetInnerHTML={!isMinified ? { __html: highlighted } : undefined}
                        >
                          {isMinified ? output : undefined}
                        </pre>
                      ) : (
                        <div className="empty-scene">
                          <Layers size={40} opacity={0.1} />
                          <p>Transformed data will appear here.</p>
                        </div>
                      )}
                    </div>
                    {error && (
                      <div className="error-toast">
                        <Info size={14} /> <span>{error}</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'history' && (
              <motion.div 
                key="history"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="pro-view-container"
              >
                <div className="view-header">
                  <h2 className="view-title">Interaction Logs</h2>
                  <button className="pro-btn ghost" onClick={() => setHistory([])}>Clear History</button>
                </div>
                <div className="history-grid">
                  {history.map(item => (
                    <div key={item.id} className="history-row" onClick={() => { setInput(item.content); setActiveTab('formatter'); }}>
                      <div className="row-info">
                         <span className="row-time">{item.timestamp}</span>
                         <span className="row-peek">{item.content.substring(0, 100).replace(/\n/g, ' ')}...</span>
                      </div>
                      <ChevronRight size={14} className="row-arrow" />
                    </div>
                  ))}
                  {history.length === 0 && <div className="empty-scene">No history logs found in the system.</div>}
                </div>
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div 
                key="settings"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="pro-view-container thinner"
              >
                <h2 className="view-title">Configurations</h2>
                <div className="settings-stack">
                  <SettingGroup title="UI Preferences">
                    <SettingItem label="Syntax Highlight Glow" control={<Toggle active />} />
                    <SettingItem label="Ligatures" control={<Toggle active />} />
                  </SettingGroup>
                  <SettingGroup title="Engine Protocol">
                     <SettingItem label="Theme Mode" control={<ThemeToggle />} />
                     <SettingItem label="Auto-detect" control={<Toggle />} />
                  </SettingGroup>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}
