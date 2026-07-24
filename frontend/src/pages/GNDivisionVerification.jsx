import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import Table from '../components/Table'
import StatusBadge from '../components/StatusBadge'
import PrintDraftModal from '../components/PrintDraftModal'
import { useAuth } from '../context/AuthContext'

export default function GNDivisionVerification() {
  const { user } = useAuth()
  const [gns, setGns] = useState([])
  const [dsInfo, setDsInfo] = useState(null)
  const [status, setStatus] = useState('pending')
  const [draftAt, setDraftAt] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showDraftPrint, setShowDraftPrint] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const { data } = await api.get('/verification/my-gn-divisions')
        setGns(data.gn_divisions || [])
        setStatus(data.status)
        setDraftAt(data.draft_at || null)
        setDsInfo({
          ds_id: data.ds_id,
          ds_name: data.ds_name,
        })
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const filtered = gns.filter(gn => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return [
      gn.name_english,
      gn.name_sinhala,
      gn.name_tamil,
      gn.grama_niladhari_division_code,
      gn.lifecode,
      gn.mpa_code,
      ...(gn.villages || []).map(v => v.name_english),
    ].some(value => String(value || '').toLowerCase().includes(q))
  })

  const cols = [
    { key: 'name_english', label: 'GN Division', render: r => (
      <div>
        <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{r.name_english}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.name_sinhala || '-'} / {r.name_tamil || '-'}</div>
      </div>
    ) },
    { key: 'grama_niladhari_division_code', label: 'GN Code' },
    { key: 'lifecode', label: 'Lifecode' },
    { key: 'village_count', label: 'Villages', render: r => (r.villages || []).length },
    { key: 'villages', label: 'Village Names', render: r => (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {(r.villages || []).length === 0 ? (
          <span style={{ color: 'var(--text-muted)' }}>No villages</span>
        ) : (
          (r.villages || []).slice(0, 4).map(village => (
            <span key={village.id} style={{ padding: '4px 8px', borderRadius: 999, background: '#eef3fb', color: 'var(--primary)', fontSize: 12, fontWeight: 600 }}>
              {village.name_english}
            </span>
          ))
        )}
      </div>
    ) },
    { key: 'actions', label: 'Actions', render: r => (
      <Link to={`/ds-gn-verification/gn/${r.id}`} style={{ padding: '5px 10px', background: 'var(--primary)', color: '#fff', borderRadius: 5, fontSize: 12, fontWeight: 700 }}>
        Edit
      </Link>
    ) },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <h2 style={{ color: 'var(--primary)', fontWeight: 700 }}>GN Division Modification</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            Logged in as <strong>{user?.name}</strong> · {dsInfo?.ds_name || 'Assigned divisional secretariat'} · DS ID: {dsInfo?.ds_id || '-'}
          </p>
          {draftAt && (
            <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>
              Last edited: {new Date(draftAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <StatusBadge status={status} />
          {status === 'draft' && (
            <button onClick={() => setShowDraftPrint(true)} style={{ padding: '7px 16px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
              Print Draft
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 20 }}>
        <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', padding: 18, boxShadow: 'var(--shadow)' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>GN Divisions</div>
          <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--primary)', marginTop: 6 }}>{filtered.length}</div>
        </div>
        <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', padding: 18, boxShadow: 'var(--shadow)' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Search Results</div>
          <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--primary)', marginTop: 6 }}>{filtered.reduce((count, gn) => count + (gn.villages || []).length, 0)}</div>
        </div>
      </div>

      <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', padding: 20, boxShadow: 'var(--shadow)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
          <h4 style={{ color: 'var(--primary)', margin: 0 }}>Assigned GN Divisions</h4>
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search GN divisions or villages"
            style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 6, minWidth: 260, fontSize: 13 }}
          />
        </div>
        <Table columns={cols} data={filtered} loading={loading} emptyMsg="No GN divisions assigned." />
      </div>

      <PrintDraftModal
        dsName={dsInfo?.ds_name || ''}
        draftAt={draftAt}
        gns={gns}
        show={showDraftPrint}
        onClose={() => setShowDraftPrint(false)}
      />
    </div>
  )
}
