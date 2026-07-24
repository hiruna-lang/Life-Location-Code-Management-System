import React from 'react'

export default function ConfirmModal({ show, title, message, confirmLabel, onConfirm, onCancel }) {
  if (!show) return null

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:300,padding:20}} onClick={onCancel}>
      <div style={{background:'#fff',borderRadius:10,width:440,maxWidth:'100%',boxShadow:'0 20px 60px rgba(0,0,0,.3)',padding:28}} onClick={e=>e.stopPropagation()}>
        <h4 style={{margin:'0 0 12px',color:'var(--primary)',fontWeight:700}}>{title}</h4>
        <p style={{color:'var(--text)',fontSize:14,lineHeight:1.6,margin:'0 0 20px'}}>{message}</p>
        <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
          <button onClick={onCancel} style={{padding:'9px 20px',background:'#fff',color:'var(--text)',border:'1px solid var(--border)',borderRadius:6,fontWeight:600,fontSize:13,cursor:'pointer'}}>Cancel</button>
          <button onClick={onConfirm} style={{padding:'9px 20px',background:'#c0392b',color:'#fff',border:'none',borderRadius:6,fontWeight:700,fontSize:13,cursor:'pointer'}}>{confirmLabel || 'Confirm'}</button>
        </div>
      </div>
    </div>
  )
}
