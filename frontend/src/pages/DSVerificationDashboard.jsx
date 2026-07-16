import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import Table from '../components/Table';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';

export default function DSVerificationDashboard() {
  const { user } = useAuth();
  const [gns, setGns] = useState([]);
  const [dsInfo, setDsInfo] = useState(null);
  const [status, setStatus] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/verification/my-gn-divisions');
      setGns(data.gn_divisions || []);
      setStatus(data.status);
      setDsInfo({
        ds_id: data.ds_id,
        ds_name: data.ds_name,
        gn_count: data.gn_count,
        village_count: data.village_count,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Removed action handler since buttons are gone
  // const act = async action => { ... }  ← removed

  const filteredGns = gns.filter(gn => {
    const q = search.trim().toLowerCase();
    if (!q) return true;

    const gnMatch = [
      gn.name_english,
      gn.name_sinhala,
      gn.name_tamil,
      gn.grama_niladhari_division_code,
      gn.lifecode,
      gn.mpa_code,
    ].some(value => String(value || '').toLowerCase().includes(q));

    const villageMatch = (gn.villages || []).some(village =>
      [
        village.name_english,
        village.name_sinhala,
        village.name_tamil,
        village.village_code,
        village.lifecode,
      ].some(value => String(value || '').toLowerCase().includes(q))
    );

    return gnMatch || villageMatch;
  });

  const totals = filteredGns.reduce((acc, gn) => {
    acc.gn += 1;
    acc.villages += (gn.villages || []).length;
    return acc;
  }, { gn: 0, villages: 0 });

  const cols = [
    { key: 'name_english', label: 'GN Division', render: r => (
      <div>
        <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{r.name_english}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.name_sinhala || '-'} / {r.name_tamil || '-'}</div>
      </div>
    )},
    { key: 'grama_niladhari_division_code', label: 'GN Code' },
    { key: 'lifecode', label: 'Lifecode' },
    { key: 'village_count', label: 'Villages', render: r => `${(r.villages || []).length}` },
    { key: 'villages', label: 'Village Names', render: r => (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {(r.villages || []).length === 0 ? (
          <span style={{ color: 'var(--text-muted)' }}>No villages</span>
        ) : (
          (r.villages || []).map(village => (
            <span key={village.id} style={{ padding: '4px 8px', borderRadius: 999, background: '#eef3fb', color: 'var(--primary)', fontSize: 12, fontWeight: 600 }}>
              {village.name_english}
            </span>
          ))
        )}
      </div>
    )},
  ];

  const locked = status === 'locked';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <h2 style={{ color: 'var(--primary)', fontWeight: 700 }}>Divisional Secretary Dashboard</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            Logged in as <strong>{user?.name}</strong> · {dsInfo?.ds_name || 'Assigned divisional secretariat'} · DS ID: {dsInfo?.ds_id || '-'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <StatusBadge status={status} />
          {locked && <span style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 600 }}>Locked by Admin</span>}
        </div>
      </div>

      {msg && (
        <div style={{ background: '#eafaf1', border: '1px solid #82e0aa', color: '#1e8449', padding: '10px 16px', borderRadius: 6, marginBottom: 16, fontSize: 13 }}>
          {msg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 20 }}>
        <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', padding: 18, boxShadow: 'var(--shadow)' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>GN Divisions</div>
          <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--primary)', marginTop: 6 }}>{dsInfo?.gn_count ?? gns.length}</div>
        </div>
        <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', padding: 18, boxShadow: 'var(--shadow)' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Villages</div>
          <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--primary)', marginTop: 6 }}>{dsInfo?.village_count ?? 0}</div>
        </div>
        <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', padding: 18, boxShadow: 'var(--shadow)' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Showing</div>
          <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--primary)', marginTop: 6 }}>{totals.gn}</div>
        </div>
      </div>

      <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', padding: 20, boxShadow: 'var(--shadow)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
          <h4 style={{ color: 'var(--primary)', margin: 0 }}>Grama Niladhari Divisions and Villages</h4>
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search GN divisions or villages"
            style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 6, minWidth: 260, fontSize: 13 }}
          />
        </div>
        <Table columns={cols} data={filteredGns} loading={loading} emptyMsg="No GN divisions assigned." />
      </div>
    </div>
  );
}