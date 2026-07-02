import React from 'react'

const colors = {
  pending: { bg:'#fef9e7', color:'#d68910', border:'#f9ca24' },
  draft:   { bg:'#eaf4fb', color:'#2980b9', border:'#85c1e9' },
  final:   { bg:'#eafaf1', color:'#1e8449', border:'#82e0aa' },
  locked:  { bg:'#fdedec', color:'#c0392b', border:'#f1948a' },
  active:  { bg:'#eafaf1', color:'#1e8449', border:'#82e0aa' },
  disabled:{ bg:'#fdedec', color:'#c0392b', border:'#f1948a' },
}

export default function StatusBadge({ status }) {
  const c = colors[status] || colors.pending
  return (
    <span style={{
      padding:'3px 10px', borderRadius:12, fontSize:11, fontWeight:700,
      textTransform:'uppercase', letterSpacing:.5,
      background:c.bg, color:c.color, border:`1px solid ${c.border}`,
    }}>{status || 'pending'}</span>
  )
}
