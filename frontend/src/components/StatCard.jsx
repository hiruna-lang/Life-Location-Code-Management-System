import React from 'react'

export default function StatCard({ label, value, icon, color = 'var(--primary)' }) {
  return (
    <div style={{
      background:'var(--surface)', borderRadius:'var(--radius)',
      padding:'20px 24px', boxShadow:'var(--shadow)',
      display:'flex', alignItems:'center', gap:16,
      borderLeft:`4px solid ${color}`,
    }}>
      <div style={{
        fontSize:28, width:52, height:52, borderRadius:12,
        background: color + '18', display:'flex', alignItems:'center', justifyContent:'center',
      }}>{icon}</div>
      <div>
        <div style={{fontSize:11,color:'var(--text-muted)',fontWeight:600,textTransform:'uppercase',letterSpacing:.8}}>{label}</div>
        <div style={{fontSize:26,fontWeight:700,color:'var(--text)',marginTop:2}}>{value ?? '—'}</div>
      </div>
    </div>
  )
}
