import React, { useState, useEffect, useRef } from 'react'
import api from '../api/axios'
import Table from '../components/Table'
import StatusBadge from '../components/StatusBadge'
import PrintLetterModal from '../components/PrintLetterModal'
import { useAuth } from '../context/AuthContext'

const sel = { padding:'8px 10px', border:'1px solid var(--border)', borderRadius:6, fontSize:13, background:'#fff', minWidth:180 }

export default function Reports() {
  const { user } = useAuth()
  const [provinces, setProvs]   = useState([])
  const [districts, setDists]   = useState([])
  const [status, setStatus]     = useState([])
  const [logs, setLogs]         = useState([])
  const [filter, setFilter]     = useState({ province_id:'', district_id:'', ds_search:'' })
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading]   = useState(false)
  const [printTarget, setPrintTarget] = useState(null)
  const [unlocking, setUnlocking] = useState(null)
  const logsRef = useRef(null)

  const handleUnlock = async dsId => {
    if (!window.confirm('Unlock this DS division? It will switch to draft state and become editable for the Divisional Secretary.')) return
    setUnlocking(dsId)
    try {
      await api.post(`/admin/ds/${dsId}/unlock`)
      load()
    } catch {
      alert('Failed to unlock. Please try again.')
    } finally {
      setUnlocking(null)
    }
  }

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/dashboard/verification-status', { params: filter })
      setStatus(data)
    } finally { setLoading(false) }
  }

  useEffect(() => { api.get('/provinces').then(r=>setProvs(r.data)) }, [])
  useEffect(() => { api.get('/dashboard/recent-logs').then(r=>setLogs(r.data)) }, [])
  useEffect(() => {
    setFilter(p=>({...p,district_id:''})); setDists([])
    if (filter.province_id) api.get('/districts',{params:{province_id:filter.province_id}}).then(r=>setDists(r.data))
  }, [filter.province_id])
  useEffect(() => { load() }, [filter.province_id, filter.district_id])

  const filteredStatus = status.filter(row => {
    const search = filter.ds_search.trim().toLowerCase()
    if (search && !(row.ds_name || '').toLowerCase().includes(search)) return false
    if (statusFilter !== 'all' && row.status !== statusFilter) return false
    return true
  })

  const cols = [
    { key:'province_name', label:'Province' },
    { key:'district_name', label:'District' },
    { key:'ds_name',       label:'DS Division' },
    { key:'status',        label:'Status', render:r=><StatusBadge status={r.status} /> },
    { key:'final_at',      label:'Verified At', render:r=>r.final_at?new Date(r.final_at).toLocaleDateString():'—' },
    { key:'verified_by_name', label:'Verified By' },
    { key:'locked_at', label:'Locked At', render:r=>r.locked_at?new Date(r.locked_at).toLocaleDateString():'—' },
    { key:'actions', label:'', render: r => {
      if (r.status === 'pending') {
        return (
          <button onClick={() => setPrintTarget(r)} style={{padding:'5px 10px',background:'var(--warning)',color:'#fff',border:'none',borderRadius:5,fontSize:12,fontWeight:700,cursor:'pointer'}}>
            Print Letter
          </button>
        )
      }
      if (r.status === 'locked' && user?.role === 'admin') {
        return (
          <button onClick={() => handleUnlock(r.id)} disabled={unlocking === r.id} style={{padding:'5px 10px',background:'#c0392b',color:'#fff',border:'none',borderRadius:5,fontSize:12,fontWeight:700,cursor:'pointer'}}>
            {unlocking === r.id ? 'Unlocking...' : 'Unlock'}
          </button>
        )
      }
      return null
    }},
  ]

  const logCols = [
    { key: 'created_at', label: 'Time', render: r => new Date(r.created_at).toLocaleString() },
    { key: 'action', label: 'Action', render: r => <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{r.action}</span> },
    { key: 'user', label: 'User', render: r => r.user?.name || '—' },
    { key: 'description', label: 'Description' },
  ]

  const counts = {
    total:    status.length,
    pending:  status.filter(r=>r.status==='pending').length,
    draft:    status.filter(r=>r.status==='draft').length,
    final:    status.filter(r=>r.status==='final').length,
    locked:   status.filter(r=>r.status==='locked').length,
  }

  return (
    <div>
      <h2 style={{marginBottom:20, color:'var(--primary)', fontWeight:700}}>Verification Reports</h2>

      <div style={{background:'var(--surface)',borderRadius:'var(--radius)',padding:'16px 20px',boxShadow:'var(--shadow)',marginBottom:20,display:'flex',gap:12,flexWrap:'wrap',alignItems:'flex-end'}}>
        <div>
          <div style={{fontSize:11,fontWeight:700,marginBottom:5,color:'var(--text-muted)',textTransform:'uppercase'}}>Province</div>
          <select style={sel} value={filter.province_id} onChange={e=>setFilter(p=>({...p,province_id:e.target.value}))}>
            <option value="">All</option>
            {provinces.map(x=><option key={x.id} value={x.id}>{x.name_english}</option>)}
          </select>
        </div>
        <div>
          <div style={{fontSize:11,fontWeight:700,marginBottom:5,color:'var(--text-muted)',textTransform:'uppercase'}}>District</div>
          <select style={sel} value={filter.district_id} onChange={e=>setFilter(p=>({...p,district_id:e.target.value}))} disabled={!filter.province_id}>
            <option value="">All</option>
            {districts.map(x=><option key={x.id} value={x.id}>{x.name_english}</option>)}
          </select>
        </div>
        <div>
          <div style={{fontSize:11,fontWeight:700,marginBottom:5,color:'var(--text-muted)',textTransform:'uppercase'}}>Status</div>
          <select style={sel} value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
            <option value="all">Total</option>
            <option value="pending">Pending</option>
            <option value="draft">Draft</option>
            <option value="final">Verified</option>
            <option value="locked">Locked</option>
          </select>
        </div>
        <div>
          <div style={{fontSize:11,fontWeight:700,marginBottom:5,color:'var(--text-muted)',textTransform:'uppercase'}}>DS Division</div>
          <input type="search" placeholder="Search DS division" style={sel} value={filter.ds_search} onChange={e=>setFilter(p=>({...p,ds_search:e.target.value}))} />
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <button onClick={() => logsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })} style={{padding:'9px 20px',background:'var(--primary)',color:'#fff',border:'none',borderRadius:6,fontWeight:700,height:37,whiteSpace:'nowrap'}}>View Verification Logs</button>
        </div>
      </div>

      <div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap'}}>
        {[['Total',counts.total,'#1E3A5F'],['Pending',counts.pending,'#d68910'],['Draft',counts.draft,'#2980b9'],['Verified',counts.final,'#27ae60'],['Locked',counts.locked,'#c0392b']].map(([l,v,c])=>(
          <div key={l} style={{background:c,color:'#fff',borderRadius:8,padding:'10px 20px',minWidth:100,textAlign:'center'}}>
            <div style={{fontSize:22,fontWeight:800}}>{v}</div>
            <div style={{fontSize:11,fontWeight:600,opacity:.85}}>{l}</div>
          </div>
        ))}
      </div>
      <Table columns={cols} data={filteredStatus} loading={loading} emptyMsg="No results." />

      <div ref={logsRef} style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', padding: 20, boxShadow: 'var(--shadow)', marginTop: 24 }}>
        <h3 style={{ color: 'var(--primary)', fontSize: 15, marginBottom: 14 }}>Recent Verification Logs</h3>
        <Table columns={logCols} data={logs} emptyMsg="No logs found." />
      </div>

      <PrintLetterModal target={printTarget} onClose={() => setPrintTarget(null)} />
    </div>
  )
}
