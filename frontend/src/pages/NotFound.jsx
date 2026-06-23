import React from 'react'
import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div style={{
      minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      flexDirection:'column', textAlign:'center', background:'var(--bg)',
    }}>
      <div style={{fontSize:80, marginBottom:16}}>🗺️</div>
      <h1 style={{fontSize:48, fontWeight:800, color:'var(--primary)'}}>404</h1>
      <p style={{color:'var(--text-muted)', fontSize:16, marginBottom:24}}>Page not found.</p>
      <Link to="/" style={{
        background:'var(--primary)', color:'#fff', padding:'10px 24px',
        borderRadius:8, fontWeight:700, fontSize:14,
      }}>← Back to Home</Link>
    </div>
  )
}
