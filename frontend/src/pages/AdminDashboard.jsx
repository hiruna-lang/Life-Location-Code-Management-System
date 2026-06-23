import React, { useState, useEffect } from 'react'
import api from '../api/axios'
import StatCard from '../components/StatCard'
import Table from '../components/Table'
import StatusBadge from '../components/StatusBadge'

export default function AdminDashboard() {
  const [stats, setStats]   = useState(null)
  const [status, setStatus] = useState([])
  const [logs, setLogs]     = useState([])
  const [filter, setFilter] = useState({ province_id:'', district_id:'', before_date:'' })
  const [provinces, setProvs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/stats'),
      api.get('/dashboard/verification-status'),
      api.get('/dashboard/recent-logs'),
      api.get('/provinces'),
    ]).then(([s, vs, l, p]) => {
      setStats(s.data); setStatus(vs.data); setLogs(l.data); setProvs(p.data)
    }).finally(() => setLoading(false))
  }, [])

  const applyFilter = async () => {
    const { data } = await api.get('/dashboard/verification-status', { params: filter })
    setStatus(data)
  }

  if (loading) return <div style={{padding:40, textAlign:'center'}}>⏳ Loading dashboard…</div>

  const logCols = [
    { key:'created_at', label:'Time', render:r=>new Date(r.created_at).toLocaleString() },
    { key:'action',     label:'Action', render:r=><span style={{fontWeight:600,color:'var(--primary)'}}>{r.action}</span> },
    { key:'user',       label:'User', render:r=>r.user?.name||'—' },
    { key:'description',label:'Description' },
  ]

  const statusCols = [
    { key:'province_name', label:'Province' },
    { key:'district_name', label:'District' },
    { key:'ds_name',       label:'DS Division' },
    { key:'status',        label:'Status', render:r=><StatusBadge status={r.status} /> },
    { key:'final_at',      label:'Verified At', render:r=>r.final_at?new Date(r.final_at).toLocaleDateString():'—' },
    { key:'verified_by_name', label:'By' },
  ]

  return (
    <div>
      <h2 style={{marginBottom:20, color:'var(--primary)', fontWeight:700}}>📊 Admin Dashboard</h2>

      {/* Stats grid */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:16, marginBottom:28}}>
        <StatCard label="Provinces"       value={stats?.provinces}       icon="🌏" color="var(--primary)" />
        <StatCard label="Districts"       value={stats?.districts}       icon="🏙️" color="var(--info)" />
        <StatCard label="DS Divisions"    value={stats?.ds_divisions}    icon="🏛️" color="#8e44ad" />
        <StatCard label="GN Divisions"    value={stats?.gn_divisions}    icon="🏘️" color="var(--warning)" />
        <StatCard label="Villages"        value={stats?.villages}        icon="🏡" color="#16a085" />
        <StatCard label="Verified DS"     value={stats?.verified_ds}     icon="✅" color="var(--success)" />
        <StatCard label="Unverified DS"   value={stats?.non_verified_ds} icon="⏳" color="var(--accent)" />
      </div>

      {/* Verification status table */}
      <div style={{background:'var(--surface)', borderRadius:'var(--radius)', padding:20, boxShadow:'var(--shadow)', marginBottom:24}}>
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14, flexWrap:'wrap', gap:8}}>
          <h3 style={{color:'var(--primary)', fontSize:15}}>DS Verification Status</h3>
          <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
            <select style={{padding:'6px 10px', border:'1px solid var(--border)', borderRadius:6, fontSize:12}} value={filter.province_id} onChange={e=>setFilter(p=>({...p,province_id:e.target.value}))}>
              <option value="">All Provinces</option>
              {provinces.map(x=><option key={x.id} value={x.id}>{x.name_english}</option>)}
            </select>
            <input type="date" style={{padding:'6px 10px', border:'1px solid var(--border)', borderRadius:6, fontSize:12}} value={filter.before_date} onChange={e=>setFilter(p=>({...p,before_date:e.target.value}))} />
            <button onClick={applyFilter} style={{padding:'6px 14px', background:'var(--primary)', color:'#fff', border:'none', borderRadius:6, fontSize:12, fontWeight:600}}>Apply</button>
          </div>
        </div>
        <Table columns={statusCols} data={status} />
      </div>

      {/* Recent logs */}
      <div style={{background:'var(--surface)', borderRadius:'var(--radius)', padding:20, boxShadow:'var(--shadow)'}}>
        <h3 style={{color:'var(--primary)', fontSize:15, marginBottom:14}}>Recent Verification Logs</h3>
        <Table columns={logCols} data={logs} />
      </div>
    </div>
  )
}
