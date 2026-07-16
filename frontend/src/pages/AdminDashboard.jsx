import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import StatCard from '../components/StatCard';
import Table from '../components/Table';
import StatusBadge from '../components/StatusBadge';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [status, setStatus] = useState([]);
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [dsOptions, setDsOptions] = useState([]);
  const [newUser, setNewUser] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    role: 'officer', 
    ds_id: '' 
  });
  const [editingUser, setEditingUser] = useState(null);
  const [creatingUser, setCreatingUser] = useState(false);
  const [savingUser, setSavingUser] = useState(false);
  const [accountMsg, setAccountMsg] = useState('');
  const [accountError, setAccountError] = useState('');
  const [filter, setFilter] = useState({ 
    province_id: '', 
    district_id: '', 
    before_date: '', 
    ds_search: '' 
  });
  const [provinces, setProvs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/stats'),
      api.get('/dashboard/verification-status'),
      api.get('/dashboard/recent-logs'),
      api.get('/admin/users'),
      api.get('/divisional-secretariats'),
      api.get('/provinces'),
    ]).then(([s, vs, l, u, ds, p]) => {
      setStats(s.data);
      setStatus(vs.data);
      setLogs(l.data);
      setUsers(u.data);
      setDsOptions(ds.data);
      setProvs(p.data);
    }).finally(() => setLoading(false));
  }, []);

  const applyFilter = async () => {
    const { data } = await api.get('/dashboard/verification-status', { params: filter });
    setStatus(data);
  };

  const refreshUsers = async () => {
    const { data } = await api.get('/admin/users');
    setUsers(data);
  };

  const createAccount = async (event) => {
    event.preventDefault();
    setAccountMsg('');
    setAccountError('');
    setCreatingUser(true);
    try {
      const payload = {
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
        ds_id: newUser.role === 'officer' ? newUser.ds_id : null,
      };
      const { data } = await api.post('/admin/users', payload);
      await refreshUsers();
      setNewUser({ name: '', email: '', password: '', role: 'officer', ds_id: '' });
      setAccountMsg(`${data.user.name} account created.`);
    } catch (error) {
      const errors = error.response?.data?.errors;
      setAccountError(errors 
        ? Object.values(errors).flat().join(' ') 
        : (error.response?.data?.message || 'Unable to create account.'));
    } finally {
      setCreatingUser(false);
    }
  };

  const startEdit = (user) => {
    setAccountMsg('');
    setAccountError('');
    setEditingUser({
      id: user.id,
      name: user.name,
      email: user.email,
      password: '',
      role: 'officer',
      ds_id: user.active_ds_assignment?.divisional_secretariat_id || '',
      is_active: user.is_active,
    });
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setAccountError('');
  };

  const saveEdit = async (event) => {
    event.preventDefault();
    setAccountMsg('');
    setAccountError('');
    setSavingUser(true);
    try {
      const payload = {
        name: editingUser.name,
        email: editingUser.email,
        role: 'officer',
        ds_id: editingUser.ds_id,
        is_active: editingUser.is_active,
      };
      if (editingUser.password) payload.password = editingUser.password;

      const { data } = await api.put(`/admin/users/${editingUser.id}`, payload);
      await refreshUsers();
      setEditingUser(null);
      setAccountMsg(data.message || 'Account updated.');
    } catch (error) {
      const errors = error.response?.data?.errors;
      setAccountError(errors 
        ? Object.values(errors).flat().join(' ') 
        : (error.response?.data?.message || 'Unable to update account.'));
    } finally {
      setSavingUser(false);
    }
  };

  const toggleActive = async (user) => {
    setAccountMsg('');
    setAccountError('');
    try {
      const { data } = await api.put(`/admin/users/${user.id}`, {
        name: user.name,
        email: user.email,
        role: 'officer',
        ds_id: user.active_ds_assignment?.divisional_secretariat_id,
        is_active: !user.is_active,
      });
      await refreshUsers();
      setAccountMsg(data.message || 'Account updated.');
    } catch (error) {
      setAccountError(error.response?.data?.message || 'Unable to update account status.');
    }
  };

  const deleteAccount = async (user) => {
    if (!window.confirm(`Delete ${user.name}? This cannot be undone.`)) return;
    setAccountMsg('');
    setAccountError('');
    try {
      const { data } = await api.delete(`/admin/users/${user.id}`);
      await refreshUsers();
      setAccountMsg(data.message || 'Account deleted.');
    } catch (error) {
      setAccountError(error.response?.data?.message || 'Unable to delete account.');
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading dashboard...</div>;

  const filteredStatus = status.filter(row => {
    const search = filter.ds_search.trim().toLowerCase();
    if (!search) return true;
    return (row.ds_name || '').toLowerCase().includes(search);
  });

  const logCols = [
    { key: 'created_at', label: 'Time', render: r => new Date(r.created_at).toLocaleString() },
    { key: 'action', label: 'Action', render: r => <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{r.action}</span> },
    { key: 'user', label: 'User', render: r => r.user?.name || '—' },
    { key: 'description', label: 'Description' },
  ];

  const statusCols = [
    { key: 'province_name', label: 'Province' },
    { key: 'district_name', label: 'District' },
    { key: 'ds_name', label: 'DS Division' },
    { key: 'status', label: 'Status', render: r => <StatusBadge status={r.status} /> },
    { key: 'final_at', label: 'Verified At', render: r => r.final_at ? new Date(r.final_at).toLocaleDateString() : '—' },
    { key: 'verified_by_name', label: 'By' },
  ];

  const userCols = [
    { key: 'name', label: 'Name', render: r => <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{r.name}</span> },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role', render: r => <span className="role-badge">{r.role === 'admin' ? 'System Administrator' : 'Divisional Secretary'}</span> },
    { key: 'is_active', label: 'Status', render: r => <StatusBadge status={r.is_active ? 'active' : 'disabled'} /> },
    { key: 'ds', label: 'Assigned DS', render: r => r.active_ds_assignment?.divisional_secretariat?.name_english || '-' },
    { key: 'created_at', label: 'Created', render: r => r.created_at ? new Date(r.created_at).toLocaleDateString() : '-' },
    { key: 'actions', label: 'Actions', render: r => r.role === 'officer' ? (
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button onClick={() => startEdit(r)} style={{ padding: '5px 9px', border: '1px solid var(--border)', background: '#fff', color: 'var(--primary)', borderRadius: 5, fontWeight: 700, fontSize: 12 }}>Edit</button>
        <button onClick={() => toggleActive(r)} style={{ padding: '5px 9px', border: 'none', background: r.is_active ? 'var(--warning)' : 'var(--success)', color: '#fff', borderRadius: 5, fontWeight: 700, fontSize: 12 }}>
          {r.is_active ? 'Deactivate' : 'Activate'}
        </button>
        <button onClick={() => deleteAccount(r)} style={{ padding: '5px 9px', border: 'none', background: 'var(--accent)', color: '#fff', borderRadius: 5, fontWeight: 700, fontSize: 12 }}>Delete</button>
      </div>
    ) : '-' },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 20, color: 'var(--primary)', fontWeight: 700 }}>📊 Admin Dashboard</h2>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        <StatCard label="Provinces" value={stats?.provinces} icon="🌏" color="var(--primary)" />
        <StatCard label="Districts" value={stats?.districts} icon="🏙️" color="var(--info)" />
        <StatCard label="DS Divisions" value={stats?.ds_divisions} icon="🏛️" color="#8e44ad" />
        <StatCard label="GN Divisions" value={stats?.gn_divisions} icon="🏘️" color="var(--warning)" />
        <StatCard label="Villages" value={stats?.villages} icon="🏡" color="#16a085" />
        <StatCard label="Verified DS" value={stats?.verified_ds} icon="✅" color="var(--success)" />
        <StatCard label="Unverified DS" value={stats?.non_verified_ds} icon="⏳" color="var(--accent)" />
      </div>

      {/* User Accounts Section */}
      <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', padding: 20, boxShadow: 'var(--shadow)', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <h3 style={{ color: 'var(--primary)', fontSize: 15, margin: 0 }}>All User Accounts</h3>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700 }}>{users.length} accounts</span>
        </div>

        {/* Create Account Form */}
        <form 
          onSubmit={createAccount} 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
            gap: 14, 
            padding: 16, 
            border: '1px solid var(--border)', 
            borderRadius: 8, 
            background: '#faf9f8',
            marginBottom: 20 
          }}
        >
          <label style={{ display: 'grid', gap: 5, fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}>
            Account type
            <select 
              value={newUser.role} 
              onChange={e => setNewUser(p => ({ ...p, role: e.target.value, ds_id: e.target.value === 'admin' ? '' : p.ds_id }))} 
              style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13 }}
              required
            >
              <option value="officer">Divisional Secretary</option>
              <option value="admin">System Administrator</option>
            </select>
          </label>

          <label style={{ display: 'grid', gap: 5, fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}>
            Name
            <input value={newUser.name} onChange={e => setNewUser(p => ({ ...p, name: e.target.value }))} style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13 }} required />
          </label>

          <label style={{ display: 'grid', gap: 5, fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}>
            Email
            <input type="email" value={newUser.email} onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))} style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13 }} required />
          </label>

          <label style={{ display: 'grid', gap: 5, fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}>
            Password
            <input type="password" minLength={8} value={newUser.password} onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))} style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13 }} required />
          </label>

          {newUser.role === 'officer' && (
            <label style={{ display: 'grid', gap: 5, fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}>
              Divisional Secretariat
              <select 
                value={newUser.ds_id} 
                onChange={e => setNewUser(p => ({ ...p, ds_id: e.target.value }))} 
                style={{ 
                  padding: '8px 10px', 
                  border: '1px solid var(--border)', 
                  borderRadius: 6, 
                  fontSize: 13,
                  maxWidth: '100%' 
                }} 
                required
              >
                <option value="">Select DS</option>
                {dsOptions.map(ds => <option key={ds.id} value={ds.id}>{ds.name_english}</option>)}
              </select>
            </label>
          )}

          <button 
            type="submit" 
            disabled={creatingUser}
            style={{ 
              padding: '10px 16px', 
              background: 'var(--primary)', 
              color: '#fff', 
              border: 'none', 
              borderRadius: 6, 
              fontWeight: 700, 
              fontSize: 14,
              gridColumn: '1 / -1',
              marginTop: 8
            }}
          >
            {creatingUser ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        {/* Edit Account Form */}
        {editingUser && (
          <form 
            onSubmit={saveEdit} 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
              gap: 14, 
              padding: 16, 
              border: '2px solid var(--info)', 
              borderRadius: 8, 
              background: '#eaf4fb',
              marginBottom: 20 
            }}
          >
            <label style={{ display: 'grid', gap: 5, fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}>
              Name
              <input value={editingUser.name} onChange={e => setEditingUser(p => ({ ...p, name: e.target.value }))} style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13 }} required />
            </label>

            <label style={{ display: 'grid', gap: 5, fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}>
              Email
              <input type="email" value={editingUser.email} onChange={e => setEditingUser(p => ({ ...p, email: e.target.value }))} style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13 }} required />
            </label>

            <label style={{ display: 'grid', gap: 5, fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}>
              New Password (optional)
              <input 
                type="password" 
                minLength={8} 
                value={editingUser.password} 
                onChange={e => setEditingUser(p => ({ ...p, password: e.target.value }))} 
                placeholder="Leave blank to keep current" 
                style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13 }} 
              />
            </label>

            <label style={{ display: 'grid', gap: 5, fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}>
              Divisional Secretariat
              <select 
                value={editingUser.ds_id} 
                onChange={e => setEditingUser(p => ({ ...p, ds_id: e.target.value }))} 
                style={{ 
                  padding: '8px 10px', 
                  border: '1px solid var(--border)', 
                  borderRadius: 6, 
                  fontSize: 13,
                  maxWidth: '100%' 
                }} 
                required
              >
                <option value="">Select DS</option>
                {dsOptions.map(ds => <option key={ds.id} value={ds.id}>{ds.name_english}</option>)}
              </select>
            </label>

            {/* Checkbox - Fixed positioning */}
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 8, 
              fontSize: 13, 
              fontWeight: 700, 
              color: 'var(--primary)',
              padding: '8px 0',
              gridColumn: '1 / -1'   // Full width for checkbox
            }}>
              <input 
                type="checkbox" 
                checked={editingUser.is_active} 
                onChange={e => setEditingUser(p => ({ ...p, is_active: e.target.checked }))} 
                style={{ width: 18, height: 18 }}
              />
              Active Account
            </label>

            <div style={{ 
              display: 'flex', 
              gap: 12, 
              gridColumn: '1 / -1',
              marginTop: 8 
            }}>
              <button 
                type="submit" 
                disabled={savingUser}
                style={{ 
                  flex: 1,
                  padding: '10px 16px', 
                  background: 'var(--primary)', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: 6, 
                  fontWeight: 700, 
                  fontSize: 14 
                }}
              >
                {savingUser ? 'Saving...' : 'Save Changes'}
              </button>
              <button 
                type="button" 
                onClick={cancelEdit}
                style={{ 
                  flex: 1,
                  padding: '10px 16px', 
                  background: '#fff', 
                  color: 'var(--primary)', 
                  border: '1px solid var(--border)', 
                  borderRadius: 6, 
                  fontWeight: 700, 
                  fontSize: 14 
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {accountMsg && <div style={{ background: '#eafaf1', border: '1px solid #82e0aa', color: '#1e8449', padding: '10px 12px', borderRadius: 6, marginBottom: 14, fontSize: 13 }}>{accountMsg}</div>}
        {accountError && <div style={{ background: '#fdedec', border: '1px solid #f1948a', color: '#c0392b', padding: '10px 12px', borderRadius: 6, marginBottom: 14, fontSize: 13 }}>{accountError}</div>}

        <Table columns={userCols} data={users} emptyMsg="No user accounts found." />
      </div>

      {/* Verification Status & Logs remain unchanged */}
      <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', padding: 20, boxShadow: 'var(--shadow)', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 12 }}>
          <h3 style={{ color: 'var(--primary)', fontSize: 15, margin: 0 }}>DS Verification Status</h3>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <input type="search" placeholder="Search DS division" style={{ padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13, minWidth: 200 }} value={filter.ds_search} onChange={e => setFilter(p => ({ ...p, ds_search: e.target.value }))} />
            <select style={{ padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13 }} value={filter.province_id} onChange={e => setFilter(p => ({ ...p, province_id: e.target.value }))}>
              <option value="">All Provinces</option>
              {provinces.map(x => <option key={x.id} value={x.id}>{x.name_english}</option>)}
            </select>
            <input type="date" style={{ padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13 }} value={filter.before_date} onChange={e => setFilter(p => ({ ...p, before_date: e.target.value }))} />
            <button onClick={applyFilter} style={{ padding: '7px 14px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600 }}>Apply Filter</button>
          </div>
        </div>
        <Table columns={statusCols} data={filteredStatus} />
      </div>

      <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', padding: 20, boxShadow: 'var(--shadow)' }}>
        <h3 style={{ color: 'var(--primary)', fontSize: 15, marginBottom: 14 }}>Recent Verification Logs</h3>
        <Table columns={logCols} data={logs} />
      </div>
    </div>
  );
}