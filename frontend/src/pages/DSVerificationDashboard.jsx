import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import Table from '../components/Table'
import StatusBadge from '../components/StatusBadge'
import { useAuth } from '../context/AuthContext'

export default function DSVerificationDashboard() {
  const { user } = useAuth()
  const [gns, setGns]         = useState([])
  const [dsInfo, setDsInfo]   = useState(null)
  const [status, setStatus]   = useState('pending')
  const [loading, setLoading] = useState(true)
  const [msg, setMsg]         = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/verification/my-gn-divisions')
      setGns(data.gn_divisions)
      setStatus(data.status)
      setDsInfo({ ds_id: data.ds_id, ds_name: data.ds_name })
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const act = async (action) => {
    setMsg('')
    try {
      const { data } = await api.post(`/verification/${action}`)
      setStatus(data.status)
      setMsg(data.message)
    } catch (e) {
      setMsg(e.response?.data?.message || 'Error occurred.')
    }
  }

  const cols = [
    { key:'name_english',              label:'GN Division' },
    { key:'grama_niladhari_division_code', label:'GN Code' },
    { key:'lifecode',                  label:'Lifecode' },
    { key:'mpa_code',                  label:'MPA Code' },
    { key:'actions', label:'', render: r => (
      <Link to={`/verify/gn/${r.id}`} style={{padding:'4px 12px', background:'var(--primary)', color:'#fff', borderRadius:4, fontSize:12, fontWeight:600}}>Edit</Link>
    )},
  ]

  const locked = status === 'locked'

  return (
    <div>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12, marginBottom:20}}>
        <div>
          <h2 style={{color:'var(--primary)', fontWeight:700}}>Divisional Secretary Dashboard</h2>
          <p style={{color:'var(--text-muted)', fontSize:13, marginTop:4}}>
            Logged in as <strong>{user?.name}</strong> · {dsInfo?.ds_name || 'Assigned divisional secretariat'} · DS ID: {dsInfo?.ds_id || '-'}
          </p>
        </div>
        <div style={{display:'flex', gap:10, flexWrap:'wrap', alignItems:'center'}}>
          <StatusBadge status={status} />
          {!locked && (
            <>
              <button onClick={()=>act('draft')} style={{padding:'8px 16px', background:'var(--info)', color:'#fff', border:'none', borderRadius:6, fontWeight:600, fontSize:13}}>📝 Save Draft</button>
              <button onClick={()=>act('final')} style={{padding:'8px 16px', background:'var(--success)', color:'#fff', border:'none', borderRadius:6, fontWeight:600, fontSize:13}}>🔒 Mark as Verified</button>
            </>
          )}
          {locked && <span style={{color:'var(--accent)', fontSize:13, fontWeight:600}}>🔒 Locked by Admin</span>}
        </div>
      </div>

      {msg && (
        <div style={{background:'#eafaf1', border:'1px solid #82e0aa', color:'#1e8449', padding:'10px 16px', borderRadius:6, marginBottom:16, fontSize:13}}>
          ✅ {msg}
        </div>
      )}

      <div style={{background:'var(--surface)', borderRadius:'var(--radius)', padding:20, boxShadow:'var(--shadow)'}}>
        <h4 style={{marginBottom:14, color:'var(--primary)'}}>Grama Niladhari Divisions ({gns.length})</h4>
        <Table columns={cols} data={gns} loading={loading} emptyMsg="No GN divisions assigned." />
      </div>
    </div>
  )
}
