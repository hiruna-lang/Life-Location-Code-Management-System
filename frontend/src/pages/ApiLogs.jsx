import React, { useState, useEffect } from 'react'
import api from '../api/axios'
import Table from '../components/Table'
import Pagination from '../components/Pagination'

const inp = { padding:'8px 10px', border:'1px solid var(--border)', borderRadius:6, fontSize:13, background:'#fff', minWidth:160 }

export default function ApiLogs() {
  const [logs, setLogs]       = useState([])
  const [meta, setMeta]       = useState(null)
  const [summary, setSummary] = useState(null)
  const [filter, setFilter]   = useState({ endpoint:'', date_from:'', date_to:'', ip:'' })
  const [loading, setLoading] = useState(false)
  const [page, setPage]       = useState(1)

  useEffect(() => { api.get('/admin/api-logs/summary').then(r => setSummary(r.data)) }, [])
  useEffect(() => { load(1) }, [])

  const load = async (p = 1) => {
    setLoading(true)
    try {
      const { data } = await api.get('/admin/api-logs', { params: { ...filter, page: p } })
      setLogs(data.data); setMeta(data)
    } finally { setLoading(false) }
  }

  const cols = [
    { key:'accessed_at', label:'Time',     render:r=>new Date(r.accessed_at).toLocaleString(), style:{whiteSpace:'nowrap'} },
    { key:'method',      label:'Method',   render:r=><span style={{padding:'2px 8px',borderRadius:4,background:r.method==='GET'?'#eafaf1':'#fdecea',color:r.method==='GET'?'#1e8449':'#c0392b',fontWeight:700,fontSize:11}}>{r.method}</span> },
    { key:'endpoint',    label:'Endpoint', render:r=><code style={{fontSize:12}}>{r.endpoint}</code> },
    { key:'ip_address',  label:'IP' },
    { key:'response_code', label:'Status', render:r=>{
      const ok = r.response_code < 400
      return <span style={{fontWeight:700,color:ok?'var(--success)':'var(--accent)'}}>{r.response_code}</span>
    }},
    { key:'query_params', label:'Params',  render:r=>r.query_params&&r.query_params!=='{}'?<code style={{fontSize:11}}>{r.query_params}</code>:'—' },
  ]

  return (
    <div>
      <h2 style={{marginBottom:20, color:'var(--primary)', fontWeight:700}}>📡 API Access Logs</h2>

      {summary && (
        <div style={{display:'flex',gap:14,marginBottom:24,flexWrap:'wrap'}}>
          {[['Today',summary.today,'#2980b9'],['Last 7 Days',summary.last_7_days,'#8e44ad'],['Total',summary.total,'#1E3A5F']].map(([l,v,c])=>(
            <div key={l} style={{background:c,color:'#fff',borderRadius:8,padding:'12px 22px',minWidth:120,textAlign:'center'}}>
              <div style={{fontSize:24,fontWeight:800}}>{v?.toLocaleString()}</div>
              <div style={{fontSize:11,fontWeight:600,opacity:.85}}>{l}</div>
            </div>
          ))}
          <div style={{background:'var(--surface)',borderRadius:8,padding:'12px 20px',boxShadow:'var(--shadow)',flex:1,minWidth:200}}>
            <div style={{fontSize:12,fontWeight:700,color:'var(--text-muted)',marginBottom:8,textTransform:'uppercase'}}>Top Endpoints</div>
            {summary.top_endpoints?.slice(0,5).map(e=>(
              <div key={e.endpoint} style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:4}}>
                <code>{e.endpoint}</code><strong>{e.hits}</strong>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{background:'var(--surface)',borderRadius:'var(--radius)',padding:'14px 18px',boxShadow:'var(--shadow)',marginBottom:18,display:'flex',gap:10,flexWrap:'wrap',alignItems:'flex-end'}}>
        <input style={inp} placeholder="Endpoint filter…" value={filter.endpoint} onChange={e=>setFilter(p=>({...p,endpoint:e.target.value}))} />
        <input style={inp} placeholder="IP…" value={filter.ip} onChange={e=>setFilter(p=>({...p,ip:e.target.value}))} />
        <input type="date" style={inp} value={filter.date_from} onChange={e=>setFilter(p=>({...p,date_from:e.target.value}))} />
        <input type="date" style={inp} value={filter.date_to}   onChange={e=>setFilter(p=>({...p,date_to:e.target.value}))} />
        <button onClick={()=>load(1)} style={{padding:'9px 18px',background:'var(--primary)',color:'#fff',border:'none',borderRadius:6,fontWeight:700,height:37}}>Filter</button>
        <button onClick={()=>{setFilter({endpoint:'',date_from:'',date_to:'',ip:''});setTimeout(()=>load(1),0)}} style={{padding:'9px 14px',background:'var(--bg)',border:'1px solid var(--border)',borderRadius:6,height:37}}>Clear</button>
      </div>

      <Table columns={cols} data={logs} loading={loading} />
      <Pagination meta={meta} onPage={p=>{setPage(p);load(p)}} />
    </div>
  )
}
