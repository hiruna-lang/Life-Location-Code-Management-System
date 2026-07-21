import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../api/axios'
import Table from '../components/Table'

const inp = {
  width:'100%', padding:'9px 12px', border:'1px solid var(--border)',
  borderRadius:6, fontSize:13,
}
const label = { display:'block', fontSize:11, fontWeight:700, marginBottom:5, color:'var(--text-muted)', textTransform:'uppercase' }

export default function GNEdit() {
  const { gnId }   = useParams()
  const navigate   = useNavigate()
  const [gn, setGn]           = useState(null)
  const [villages, setVillages] = useState([])
  const [gnForm, setGnForm]   = useState({})
  const [editVillage, setEditVillage] = useState(null)
  const [villageForm, setVillageForm] = useState({})
  const [msg, setMsg]         = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get(`/verification/my-gn-divisions`),
      api.get(`/verification/gn/${gnId}/villages`),
    ]).then(([gnRes, vRes]) => {
      const found = gnRes.data.gn_divisions.find(g => g.id == gnId)
      if (found) { setGn(found); setGnForm(found) }
      setVillages(vRes.data)
    }).finally(() => setLoading(false))
  }, [gnId])

  const saveGn = async e => {
    e.preventDefault(); setMsg('')
    try {
      const { data } = await api.put(`/verification/gn/${gnId}`, gnForm)
      setGn(data.gn); setMsg('GN Division updated successfully.')
    } catch (e) { setMsg(e.response?.data?.message || 'Error.') }
  }

  const saveVillage = async e => {
    e.preventDefault(); setMsg('')
    try {
      const { data } = await api.put(`/verification/village/${editVillage.id}`, villageForm)
      setVillages(v => v.map(x => x.id===editVillage.id ? data.village : x))
      setEditVillage(null)
      setMsg('Village updated.')
    } catch (e) { setMsg(e.response?.data?.message || 'Error.') }
  }

  const villageCols = [
    { key:'name_english', label:'Village' },
    { key:'village_code', label:'Village Code' },
    { key:'lifecode',     label:'Lifecode' },
    { key:'edit', label:'', render: v => (
      <button onClick={()=>{setEditVillage(v);setVillageForm(v)}} style={{padding:'4px 12px', background:'var(--info)', color:'#fff', border:'none', borderRadius:4, fontSize:12, cursor:'pointer'}}>Edit</button>
    )},
  ]

  if (loading) return <div style={{padding:40,textAlign:'center'}}>⏳ Loading…</div>

  return (
    <div>
      <div style={{marginBottom:20}}>
        <Link to="/ds-gn-verification" style={{color:'var(--primary)', fontSize:13}}>← Back to GN Division Verification</Link>
      </div>
      <h2 style={{color:'var(--primary)', fontWeight:700, marginBottom:4}}>✏️ Edit GN Division</h2>
      {gn && <p style={{color:'var(--text-muted)', fontSize:13, marginBottom:20}}>GN: <strong>{gn.name_english}</strong> · Code: {gn.grama_niladhari_division_code}</p>}

      {msg && <div style={{background:'#eafaf1',border:'1px solid #82e0aa',color:'#1e8449',padding:'10px 16px',borderRadius:6,marginBottom:16,fontSize:13}}>✅ {msg}</div>}

      {/* GN Edit Form */}
      <div style={{background:'var(--surface)',borderRadius:'var(--radius)',padding:20,boxShadow:'var(--shadow)',marginBottom:24}}>
        <h4 style={{marginBottom:16,color:'var(--primary)'}}>GN Division Details</h4>
        <form onSubmit={saveGn}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16}}>
            {[{k:'name_english',l:'Name (English)'},{k:'name_sinhala',l:'Name (Sinhala)'},{k:'name_tamil',l:'Name (Tamil)'},{k:'grama_niladhari_division_code',l:'GN Code'},{k:'lifecode',l:'Lifecode'},{k:'mpa_code',l:'MPA Code'}].map(f=>(
              <div key={f.k}>
                <label style={label}>{f.l}</label>
                <input style={inp} value={gnForm[f.k]||''} onChange={e=>setGnForm(p=>({...p,[f.k]:e.target.value}))} />
              </div>
            ))}
          </div>
          <div style={{marginTop:16, display:'flex', gap:10}}>
            <button type="submit" style={{padding:'9px 20px',background:'var(--success)',color:'#fff',border:'none',borderRadius:6,fontWeight:700}}>💾 Save GN</button>
            <button type="button" onClick={()=>window.print()} style={{padding:'9px 20px',background:'var(--primary)',color:'#fff',border:'none',borderRadius:6,fontWeight:700}}>🖨️ Print</button>
          </div>
        </form>
      </div>

      {/* Villages */}
      <div style={{background:'var(--surface)',borderRadius:'var(--radius)',padding:20,boxShadow:'var(--shadow)'}}>
        <h4 style={{marginBottom:14,color:'var(--primary)'}}>Villages ({villages.length})</h4>
        <Table columns={villageCols} data={villages} emptyMsg="No villages." />
      </div>

      {/* Village Edit Modal */}
      {editVillage && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200}}>
          <div style={{background:'#fff',borderRadius:10,padding:28,width:480,boxShadow:'0 20px 60px rgba(0,0,0,.3)'}}>
            <h4 style={{marginBottom:16,color:'var(--primary)'}}>Edit Village: {editVillage.name_english}</h4>
            <form onSubmit={saveVillage}>
              {[{k:'name_english',l:'Name (English)'},{k:'name_sinhala',l:'Name (Sinhala)'},{k:'name_tamil',l:'Name (Tamil)'},{k:'village_code',l:'Village Code'},{k:'lifecode',l:'Lifecode'}].map(f=>(
                <div key={f.k} style={{marginBottom:12}}>
                  <label style={label}>{f.l}</label>
                  <input style={inp} value={villageForm[f.k]||''} onChange={e=>setVillageForm(p=>({...p,[f.k]:e.target.value}))} />
                </div>
              ))}
              <div style={{display:'flex',gap:10,marginTop:8}}>
                <button type="submit" style={{padding:'9px 20px',background:'var(--success)',color:'#fff',border:'none',borderRadius:6,fontWeight:700}}>💾 Save</button>
                <button type="button" onClick={()=>setEditVillage(null)} style={{padding:'9px 20px',background:'var(--bg)',color:'var(--text)',border:'1px solid var(--border)',borderRadius:6}}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
