import React from 'react'

const buttonStyle = active => ({
  padding: '6px 11px', border: '1px solid var(--border)', borderRadius: 2,
  background: active ? 'var(--primary)' : 'var(--surface)',
  color: active ? '#fff' : 'var(--text)', cursor: 'pointer', fontSize: 13,
})

export default function Pagination({ meta, onPage }) {
  if (!meta || meta.last_page <= 1) return null
  const pages = Array.from({ length: Math.min(meta.last_page, 10) }, (_, index) => index + 1)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 14, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 12, color: 'var(--text-muted)', marginRight: 8 }}>
        Page {meta.current_page} of {meta.last_page} · {meta.total} records
      </span>
      <button style={buttonStyle(false)} disabled={meta.current_page === 1} onClick={() => onPage(meta.current_page - 1)}>‹ Previous</button>
      {pages.map(page => <button key={page} style={buttonStyle(page === meta.current_page)} onClick={() => onPage(page)}>{page}</button>)}
      {meta.last_page > 10 && <span style={{ fontSize: 12 }}>… {meta.last_page}</span>}
      <button style={buttonStyle(false)} disabled={meta.current_page === meta.last_page} onClick={() => onPage(meta.current_page + 1)}>Next ›</button>
    </div>
  )
}
