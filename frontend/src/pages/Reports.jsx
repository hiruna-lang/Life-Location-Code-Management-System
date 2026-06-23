import React, { useState, useEffect } from 'react'
import api from '../api/axios'
import Table from '../components/Table'
import StatusBadge from '../components/StatusBadge'

const sel = { padding:'8px 10px', border:'1px solid var(--border)', borderRadius:6, fontSize:13, background:'#fff', minWidth:180 }

export default function Reports() {
  const [provinces, setProvs]   = useState([])
  const [districts, setDists]   = useState([])
  const [status, setStatus]     = useState([])
  const [filter, setFilter]     = useState({ province_id:'', district_id:'', before_date:'' })
  const [loading, setLoading]   = useState(false)
  const [searched, setSearched] = useState(false)

  useEffect(() => { api.get('/provinces').then(r=>setProvs(r.data)) }, [])
  useEffect(() => {
    setFilter(p=>({...p,district_id:''})); setDists([])
    if (filter.province_id) api.get('/districts',{params:{province_id:filter.province_id}}).then(r=>setDists(r.data))
  }, [filter.province_id])

  const load = async () => {
    setLoading(true); setSearched(true)
    try {
      const { data } = await api.get('/dashboard/verification-status', { params: filter })
      setStatus(data)
    } finally { setLoading(false) }
  }

  const cols = [
    { key:'province_name', label:'Province' },
    { key:'district_name', label:'District' },
    { key:'ds_name',       label:'DS Division' },
    { key:'status',        label:'Status', render:r=><StatusBadge status={r.status} /> },
    { key:'final_at',      label:'Verified At', render:r=>r.final_at?new Date(r.final_at).toLocaleDateString():'—' },
    { key:'verified_by_name', label:'Verified By' },
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
      <h2 style={{marginBottom:20, color:'var(--primary)', fontWeight:700}}>📋 Verification Reports</h2>

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
          <div style={{fontSize:11,fontWeight:700,marginBottom:5,color:'var(--text-muted)',textTransform:'uppercase'}}>Not Verified Before</div>
          <input type="date" style={sel} value={filter.before_date} onChange={e=>setFilter(p=>({...p,before_date:e.target.value}))} />
        </div>
        <button onClick={load} style={{padding:'9px 20px',background:'var(--primary)',color:'#fff',border:'none',borderRadius:6,fontWeight:700,height:37}}>Generate Report</button>
      </div>

      {searched && (
        <>
          <div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap'}}>
            {[['Total',counts.total,'#1E3A5F'],['Pending',counts.pending,'#d68910'],['Draft',counts.draft,'#2980b9'],['Verified',counts.final,'#27ae60'],['Locked',counts.locked,'#c0392b']].map(([l,v,c])=>(
              <div key={l} style={{background:c,color:'#fff',borderRadius:8,padding:'10px 20px',minWidth:100,textAlign:'center'}}>
                <div style={{fontSize:22,fontWeight:800}}>{v}</div>
                <div style={{fontSize:11,fontWeight:600,opacity:.85}}>{l}</div>
              </div>
            ))}
          </div>
          <Table columns={cols} data={status} loading={loading} emptyMsg="No results." />
        </>
      )}
    </div>
  )
}
