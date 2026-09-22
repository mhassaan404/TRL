import React, { useEffect, useRef, useState } from 'react'
import { useIsDarkMode } from '../../hooks/useIsDarkMode'

// options: [{ value, label }]
const SearchableSelect = ({ options, value, onChange, placeholder = 'Select...', disabled }) => {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef(null)
  const isDark = useIsDarkMode()

  const selected = options.find((o) => String(o.value) === String(value))
  const filtered = search.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(search.trim().toLowerCase()))
    : options

  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div
        className="form-select"
        style={{ cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1 }}
        onClick={() => !disabled && setOpen((o) => !o)}
      >
        {selected ? selected.label : <span className="text-muted">{placeholder}</span>}
      </div>

      {open && !disabled && (
        <div
          className={`border rounded shadow-sm ${isDark ? 'bg-dark' : 'bg-white'}`}
          style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1055, marginTop: 2 }}
        >
          <input
            autoFocus
            type="text"
            className="form-control"
            style={{ border: 'none', borderBottom: '1px solid rgba(128,128,128,0.3)', borderRadius: 0 }}
            placeholder="Type to search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            {filtered.length === 0 && (
              <div className="px-3 py-2 text-muted small">No matches</div>
            )}
            {filtered.map((o) => (
              <div
                key={o.value}
                className={`px-3 py-2 ${isDark ? 'hover-dark' : 'hover-light'}`}
                style={{
                  cursor: 'pointer',
                  backgroundColor: String(o.value) === String(value)
                    ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)')
                    : 'transparent',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = String(o.value) === String(value)
                  ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)') : 'transparent')}
                onClick={() => { onChange(o.value); setOpen(false); setSearch('') }}
              >
                {o.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default SearchableSelect