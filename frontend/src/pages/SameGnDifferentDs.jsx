import React, { useState, useEffect } from 'react'
import api from '../api/axios'
import Table from '../components/Table'
import StatCard from '../components/StatCard'

const COLS = [
  { key:'province_name', label:'Province' },
  { key:'district_name', label:'District' },
  { key:'ds_name',       label:'DS Division' },
  { key:'gn_name',       label:'GN Division' },
  { key:'gn_lifecode',   label:'GN Lifecode' },
  { key:'gn_code',       label:'GN Code' },
  { key:'mpa_code',      label:'MPA Code' },
  { key:'gn_id',         label:'GN ID' },
]

const sel = { padding:'8px 10px', border:'1px solid var(--border)', borderRadius:6, fontSize:13, background:'#fff', minWidth:180 }

export default function SameGnDifferentDs() {
  const [data, setData]         = useState([])
  const [summary, setSummary]   = useState(null)
  const [loading, setLoading]   = useState(false)
  const [provinces, setProvinces] = useState([])
  const [districts, setDistricts] = useState([])
  const [filters, setFilters]   = useState({ province_id:'', district_id:'' })
  const [keyword, setKeyword]   = useState('')

  useEffect(() => { api.get('/v1/locations/provinces').then(r => setProvinces(r.data)) }, [])

  useEffect(() => {
    setFilters(p=>({...p, district_id:''}))
    setDistricts([])
    if (filters.province_id) api.get('/v1/locations/districts',{params:{province_id:filters.province_id}}).then(r=>setDistricts(r.data))
  }, [filters.province_id])

  const load = async () => {
    setLoading(true)
    try {
      const { data: res } = await api.get('/duplicate-gn', { params: filters })
      setData(res.data); setSummary(res.summary)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const filtered = keyword ? data.filter(r =>
    Object.values(r).some(v => String(v).toLowerCase().includes(keyword.toLowerCase()))
  ) : data

  return (
    <div>
      <h2 style={{marginBottom:6, color:'var(--primary)', fontWeight:700}}>🔄 Same GN – Different DS Analysis</h2>
      <p style={{color:'var(--text-muted)', marginBottom:20, fontSize:13}}>
        GN divisions with the same name appearing under different DS divisions within the same district.
      </p>

      {/* Summary cards */}
      {summary && (
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:16, marginBottom:24}}>
          <StatCard label="Total Rows"    value={summary.total_rows}     icon="📋" color="var(--primary)" />
          <StatCard label="Provinces"     value={summary.province_count} icon="🌏" color="#8e44ad" />
          <StatCard label="Districts"     value={summary.district_count} icon="🏙️" color="var(--info)" />
          <StatCard label="DS Divisions"  value={summary.ds_count}       icon="🏛️" color="var(--warning)" />
          <StatCard label="GN Groups"     value={summary.gn_group_count} icon="🔄" color="var(--accent)" />
        </div>
      )}

      {/* Filters */}
      <div style={{
        background:'var(--surface)', borderRadius:'var(--radius)', padding:'16px 20px',
        boxShadow:'var(--shadow)', marginBottom:20, display:'flex', gap:12, flexWrap:'wrap', alignItems:'flex-end',
      }}>
        <div>
          <div style={{fontSize:11, fontWeight:700, marginBottom:5, color:'var(--text-muted)', textTransform:'uppercase'}}>Province</div>
          <select style={sel} value={filters.province_id} onChange={e=>setFilters(p=>({...p,province_id:e.target.value}))}>
            <option value="">All</option>
            {provinces.map(x=><option key={x.id} value={x.id}>{x.name_english}</option>)}
          </select>
        </div>
        <div>
          <div style={{fontSize:11, fontWeight:700, marginBottom:5, color:'var(--text-muted)', textTransform:'uppercase'}}>District</div>
          <select style={sel} value={filters.district_id} onChange={e=>setFilters(p=>({...p,district_id:e.target.value}))} disabled={!filters.province_id}>
            <option value="">All</option>
            {districts.map(x=><option key={x.id} value={x.id}>{x.name_english}</option>)}
          </select>
        </div>
        <div>
          <div style={{fontSize:11, fontWeight:700, marginBottom:5, color:'var(--text-muted)', textTransform:'uppercase'}}>Quick Filter</div>
          <input style={sel} placeholder="Type to filter…" value={keyword} onChange={e=>setKeyword(e.target.value)} />
        </div>
        <button onClick={load} style={{padding:'9px 20px', background:'var(--primary)', color:'#fff', border:'none', borderRadius:6, fontWeight:700, height:37}}>Apply</button>
        <div style={{marginLeft:'auto', display:'flex', gap:8}}>
          <a href="/api/export/duplicate-gn/excel" style={{padding:'8px 14px',background:'#27ae60',color:'#fff',borderRadius:6,fontSize:12,fontWeight:600,display:'flex',alignItems:'center'}}>⬇ Excel</a>
          <a href="/api/export/duplicate-gn/pdf"   style={{padding:'8px 14px',background:'var(--accent)',color:'#fff',borderRadius:6,fontSize:12,fontWeight:600,display:'flex',alignItems:'center'}}>⬇ PDF</a>
        </div>
      </div>

      <Table columns={COLS} data={filtered} loading={loading} emptyMsg="No duplicate GN names found." />
    </div>
  )
}
