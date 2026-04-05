import { useState, useCallback, useMemo } from 'react'
import './styles.css'

// Safely highlight JSON tokens by escaping HTML first, then wrapping tokens in spans
function syntaxHighlight(json) {
  const escaped = json
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  return escaped.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      if (/^"/.test(match)) {
        return /:$/.test(match)
          ? `<span class="jt-key">${match}</span>`
          : `<span class="jt-string">${match}</span>`
      }
      if (/true|false/.test(match)) return `<span class="jt-boolean">${match}</span>`
      if (/null/.test(match)) return `<span class="jt-null">${match}</span>`
      return `<span class="jt-number">${match}</span>`
    }
  )
}

const SAMPLE_JSON = `{
  "name": "JSON Formatter",
  "day": 23,
  "features": ["format", "minify", "validate"],
  "syntax": {
    "highlighting": true,
    "theme": "dark"
  },
  "author": null,
  "ready": true
}`

export default function App() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [isMinified, setIsMinified] = useState(false)
  const [copied, setCopied] = useState(false)

  const inputStatus = useMemo(() => {
    if (!input.trim()) return null
    try { JSON.parse(input); return 'valid' }
    catch { return 'invalid' }
  }, [input])

  const stats = useMemo(() => {
    if (!output) return null
    return {
      lines: output.split('\n').length,
      chars: output.length,
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
      setOutput(JSON.stringify(parsed, null, 2))
      setError('')
      setIsMinified(false)
    } catch (e) {
      setError(e.message)
      setOutput('')
    }
  }, [input])

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

  const copyOutput = useCallback(() => {
    if (!output) return
    navigator.clipboard.writeText(output).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    })
  }, [output])

  const clearAll = useCallback(() => {
    setInput('')
    setOutput('')
    setError('')
    setIsMinified(false)
  }, [])

  const loadSample = useCallback(() => {
    setInput(SAMPLE_JSON)
    setOutput('')
    setError('')
    setIsMinified(false)
  }, [])

  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      formatJSON()
    }
    if (e.key === 'Tab') {
      e.preventDefault()
      const start = e.target.selectionStart
      const end = e.target.selectionEnd
      const newVal = input.substring(0, start) + '  ' + input.substring(end)
      setInput(newVal)
      requestAnimationFrame(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 2
      })
    }
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-inner">
          <div className="header-left">
            <div>
              <h1 className="header-title">JSON Formatter</h1>
              <p className="header-sub">Format, validate &amp; minify JSON instantly</p>
            </div>
          </div>
          <div className="header-right">
            <button className="btn-ghost" onClick={clearAll} aria-label="Clear all">
              Clear
            </button>
            <button
              className={`btn-primary${copied ? ' copied' : ''}`}
              onClick={copyOutput}
              disabled={!output}
              aria-label="Copy formatted JSON"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="toolbar-inner">
          <div className="toolbar-left">
            <button
              className="toolbar-btn"
              onClick={formatJSON}
              disabled={!input.trim()}
              aria-label="Format JSON"
            >
              <IconFormat />
              Format
            </button>
            <button
              className={`toolbar-btn${isMinified && output ? ' active' : ''}`}
              onClick={minifyJSON}
              disabled={!input.trim()}
              aria-label="Minify JSON"
            >
              <IconMinify />
              Minify
            </button>
            <div className="toolbar-divider" />
            <button
              className="toolbar-btn"
              onClick={loadSample}
              aria-label="Load sample JSON"
            >
              Sample
            </button>
          </div>
          <div className="toolbar-right">
            {stats && (
              <span className="stats-text">
                {isMinified ? '1 line' : `${stats.lines} lines`} · {stats.chars.toLocaleString()} chars
              </span>
            )}
            {inputStatus && (
              <span className={`status-badge status-${inputStatus}`}>
                {inputStatus === 'valid' ? '✓ Valid' : '✗ Invalid'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="error-banner" role="alert">
          <IconError />
          <span>{error}</span>
        </div>
      )}

      {/* Main panels */}
      <main className="main">
        <div className="panel input-panel">
          <div className="panel-header">
            <span className="panel-label">Input</span>
            <span className="panel-hint">⌘ ↵ to format</span>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={'{\n  "paste": "your JSON here"\n}'}
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            aria-label="JSON input"
          />
        </div>

        <div className="panel output-panel">
          <div className="panel-header">
            <div className="panel-label-row">
              <span className="panel-label">Output</span>
              {isMinified && output && <span className="mini-badge">Minified</span>}
            </div>
          </div>
          {output ? (
            isMinified ? (
              <pre className="output-pre output-pre--minified">{output}</pre>
            ) : (
              <pre
                className="output-pre"
                dangerouslySetInnerHTML={{ __html: highlighted }}
              />
            )
          ) : (
            <div className="output-empty">
              <IconDoc />
              <span>Formatted output will appear here</span>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function IconFormat() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <line x1="2" y1="4" x2="14" y2="4"/>
      <line x1="4" y1="8" x2="12" y2="8"/>
      <line x1="2" y1="12" x2="14" y2="12"/>
    </svg>
  )
}

function IconMinify() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <line x1="2" y1="5" x2="14" y2="5"/>
      <line x1="2" y1="8" x2="10" y2="8"/>
      <line x1="2" y1="11" x2="12" y2="11"/>
      <path d="M12 6.5L14 8l-2 1.5"/>
    </svg>
  )
}

function IconError() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="8" r="6"/>
      <line x1="8" y1="5" x2="8" y2="8.5" strokeLinecap="round"/>
      <circle cx="8" cy="11" r="0.6" fill="currentColor"/>
    </svg>
  )
}

function IconDoc() {
  return (
    <svg width="36" height="36" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round">
      <rect x="5" y="3" width="18" height="24" rx="3"/>
      <path d="M9 9h10M9 13h7M9 17h9M9 21h5"/>
      <path d="M19 3v5h4"/>
    </svg>
  )
}
