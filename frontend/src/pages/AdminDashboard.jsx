import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import StatCard from '../components/StatCard';
import Table from '../components/Table';
import StatusBadge from '../components/StatusBadge';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [dsOptions, setDsOptions] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUser, setNewUser] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    role: 'officer', 
    ds_id: '' 
  });
  const [dsSearch, setDsSearch] = useState('');
  const [dsDropdownOpen, setDsDropdownOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [creatingUser, setCreatingUser] = useState(false);
  const [savingUser, setSavingUser] = useState(false);
  const [accountMsg, setAccountMsg] = useState('');
  const [accountError, setAccountError] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/stats'),
      api.get('/admin/users'),
      api.get('/divisional-secretariats'),
    ]).then(([s, u, ds]) => {
      setStats(s.data);
      setUsers(u.data);
      setDsOptions(ds.data);
    }).finally(() => setLoading(false));
  }, []);

  const refreshUsers = async () => {
    const { data } = await api.get('/admin/users');
    setUsers(data);
  };

  const filteredUsers = users.filter(user => {
    if (userRoleFilter === 'all') return true;
    if (userRoleFilter === 'admin') return user.role === 'admin';
    if (userRoleFilter === 'officer') return user.role === 'officer';
    return true;
  });

  const openAddForm = () => {
    setNewUser({ name: '', email: '', password: '', role: 'officer', ds_id: '' });
    setDsSearch('');
    setAccountMsg('');
    setAccountError('');
    setShowAddForm(true);
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
      setShowAddForm(false);
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

  const filteredDs = dsOptions.filter(ds =>
    ds.name_english.toLowerCase().includes(dsSearch.toLowerCase())
  );

  const userCols = [
    { key: 'name', label: 'Name', render: r => <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{r.name}</span> },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role', render: r => <span className="role-badge">{r.role === 'admin' ? 'System Administrator' : 'Divisional Secretary'}</span> },
    { key: 'is_active', label: 'Status', render: r => <StatusBadge status={r.is_active ? 'active' : 'disabled'} /> },
    { key: 'ds', label: 'Assigned DS', render: r => r.active_ds_assignment?.divisional_secretariat?.name_english || '-' },
    { key: 'created_at', label: 'Created', render: r => r.created_at ? new Date(r.created_at).toLocaleDateString() : '-' },
    { key: 'actions', label: 'Actions', render: r => r.role === 'officer' ? (
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={() => startEdit(r)} style={{ padding: '6px 12px', border: '1px solid var(--border)', background: '#fff', color: 'var(--primary)', borderRadius: 6, fontWeight: 600, fontSize: 13 }}>Edit</button>
        <button onClick={() => toggleActive(r)} style={{ padding: '6px 12px', border: 'none', background: r.is_active ? 'var(--warning)' : 'var(--success)', color: '#fff', borderRadius: 6, fontWeight: 600, fontSize: 13 }}>
          {r.is_active ? 'Deactivate' : 'Activate'}
        </button>
        <button onClick={() => deleteAccount(r)} style={{ padding: '6px 12px', border: 'none', background: 'var(--accent)', color: '#fff', borderRadius: 6, fontWeight: 600, fontSize: 13 }}>Delete</button>
      </div>
    ) : '-' },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <h2 style={{ margin: 0, color: 'var(--primary)', fontWeight: 700, fontSize: '28px', letterSpacing: '-0.02em' }}>
          Admin Dashboard
        </h2>
        <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </div>
      </div>

      {/* Professional Stats Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', 
        gap: 20, 
        marginBottom: 40 
      }}>
        <StatCard 
          label="Provinces" 
          value={stats?.provinces} 
          icon="🏛️" 
          color="var(--primary)" 
        />
        <StatCard 
          label="Districts" 
          value={stats?.districts} 
          icon="📍" 
          color="var(--info)" 
        />
        <StatCard 
          label="DS Divisions" 
          value={stats?.ds_divisions} 
          icon="🏢" 
          color="#6f42c1" 
        />
        <StatCard 
          label="GN Divisions" 
          value={stats?.gn_divisions} 
          icon="🏘️" 
          color="var(--warning)" 
        />
        <StatCard 
          label="Villages" 
          value={stats?.villages} 
          icon="🌾" 
          color="#16a085" 
        />
        <StatCard 
          label="Verified DS" 
          value={stats?.verified_ds} 
          icon="✅" 
          color="var(--success)" 
        />
        <StatCard 
          label="Unverified DS" 
          value={stats?.non_verified_ds} 
          icon="⏳" 
          color="#e74c3c" 
        />
      </div>

      {/* User Accounts Section - More Professional Card */}
      <div style={{ 
        background: 'var(--surface)', 
        borderRadius: 12, 
        padding: 28, 
        boxShadow: 'var(--shadow)', 
        border: '1px solid var(--border)' 
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 16 
        }}>
          <div>
            <h3 style={{ 
              color: 'var(--primary)', 
              fontSize: 20, 
              fontWeight: 700, 
              margin: 0,
              letterSpacing: '-0.01em'
            }}>
              User Accounts
            </h3>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>
              Manage system administrators and divisional secretaries
            </p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button 
              onClick={openAddForm}
              style={{ 
                padding: '10px 20px', 
                background: 'var(--primary)', 
                color: '#fff', 
                border: 'none', 
                borderRadius: 8, 
                fontWeight: 700, 
                fontSize: 14,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
              }}
            >
              + Add New User
            </button>

            <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>
              {filteredUsers.length} total accounts
            </span>

            <select 
              value={userRoleFilter} 
              onChange={e => setUserRoleFilter(e.target.value)}
              style={{ 
                padding: '8px 14px', 
                border: '1px solid var(--border)', 
                borderRadius: 8, 
                fontSize: 14,
                background: 'white',
                minWidth: 180
              }}
            >
              <option value="all">All Accounts</option>
              <option value="admin">System Administrators</option>
              <option value="officer">Divisional Secretaries</option>
            </select>
          </div>
        </div>

        {/* Messages */}
        {accountMsg && (
          <div style={{ 
            background: '#eafaf1', 
            border: '1px solid #82e0aa', 
            color: '#1e8449', 
            padding: '12px 16px', 
            borderRadius: 8, 
            marginBottom: 20, 
            fontSize: 14 
          }}>
            {accountMsg}
          </div>
        )}
        {accountError && (
          <div style={{ 
            background: '#fdedec', 
            border: '1px solid #f1948a', 
            color: '#c0392b', 
            padding: '12px 16px', 
            borderRadius: 8, 
            marginBottom: 20, 
            fontSize: 14 
          }}>
            {accountError}
          </div>
        )}

        <Table columns={userCols} data={filteredUsers} emptyMsg="No user accounts found." />

        {/* Add User Modal - Enhanced Professional Design */}
        {showAddForm && (
          <div
            style={{
              position: 'fixed', 
              inset: 0, 
              background: 'rgba(0,0,0,0.5)', 
              zIndex: 1000,
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center'
            }}
            onClick={() => setShowAddForm(false)}
          >
            <div
              style={{
                background: '#fff', 
                borderRadius: 16, 
                padding: 32, 
                width: 460,
                boxShadow: '0 25px 70px rgba(0,0,0,0.3)', 
                maxHeight: '92vh', 
                overflow: 'auto'
              }}
              onClick={e => e.stopPropagation()}
            >
              <h3 style={{ 
                color: 'var(--primary)', 
                fontSize: 22, 
                fontWeight: 700, 
                marginBottom: 24,
                letterSpacing: '-0.02em'
              }}>
                Create New User Account
              </h3>

              <form onSubmit={createAccount} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Role Selection */}
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Account Type
                  </label>
                  <select 
                    value={newUser.role} 
                    onChange={e => { 
                      setNewUser(p => ({ ...p, role: e.target.value, ds_id: e.target.value === 'admin' ? '' : p.ds_id })); 
                      setDsSearch(''); 
                    }} 
                    style={{ 
                      width: '100%', 
                      padding: '11px 14px', 
                      border: '1px solid var(--border)', 
                      borderRadius: 8, 
                      fontSize: 15 
                    }}
                    required
                  >
                    <option value="officer">Divisional Secretary</option>
                    <option value="admin">System Administrator</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Full Name
                  </label>
                  <input 
                    value={newUser.name} 
                    onChange={e => setNewUser(p => ({ ...p, name: e.target.value }))} 
                    style={{ width: '100%', padding: '11px 14px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 15 }} 
                    required 
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Email Address
                  </label>
                  <input 
                    type="email" 
                    value={newUser.email} 
                    onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))} 
                    style={{ width: '100%', padding: '11px 14px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 15 }} 
                    required 
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Password
                  </label>
                  <input 
                    type="password" 
                    minLength={8} 
                    value={newUser.password} 
                    onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))} 
                    style={{ width: '100%', padding: '11px 14px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 15 }} 
                    required 
                  />
                </div>

                {newUser.role === 'officer' && (
                  <div style={{ position: 'relative' }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Divisional Secretariat
                    </label>
                    <input
                      type="text"
                      placeholder="Search and select DS division..."
                      value={dsSearch}
                      onChange={e => { 
                        setDsSearch(e.target.value); 
                        setDsDropdownOpen(true); 
                        setNewUser(p => ({ ...p, ds_id: '' })); 
                      }}
                      onFocus={() => setDsDropdownOpen(true)}
                      style={{ 
                        width: '100%', 
                        padding: '11px 14px', 
                        border: '1px solid var(--border)', 
                        borderRadius: 8, 
                        fontSize: 15 
                      }}
                      required={newUser.role === 'officer'}
                    />
                    
                    {dsDropdownOpen && (
                      <div style={{
                        position: 'absolute', 
                        top: '100%', 
                        left: 0, 
                        right: 0, 
                        zIndex: 20,
                        background: '#fff', 
                        border: '1px solid var(--border)', 
                        borderRadius: 8,
                        maxHeight: 240, 
                        overflow: 'auto', 
                        marginTop: 6, 
                        boxShadow: '0 12px 40px rgba(0,0,0,0.15)'
                      }}>
                        {filteredDs.length === 0 ? (
                          <div style={{ padding: '14px 16px', color: 'var(--text-muted)', fontSize: 14 }}>No matching divisions found</div>
                        ) : (
                          filteredDs.map(ds => (
                            <div
                              key={ds.id}
                              onClick={() => { 
                                setNewUser(p => ({ ...p, ds_id: ds.id })); 
                                setDsSearch(ds.name_english); 
                                setDsDropdownOpen(false); 
                              }}
                              style={{
                                padding: '12px 16px', 
                                cursor: 'pointer', 
                                fontSize: 15,
                                borderBottom: '1px solid var(--border)',
                                background: newUser.ds_id === ds.id ? '#f0f4ff' : 'transparent'
                              }}
                              onMouseEnter={e => e.target.style.background = '#f8f9fa'}
                              onMouseLeave={e => e.target.style.background = newUser.ds_id === ds.id ? '#f0f4ff' : 'transparent'}
                            >
                              {ds.name_english}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                  <button 
                    type="submit" 
                    disabled={creatingUser}
                    style={{ 
                      flex: 1, 
                      padding: '13px 20px', 
                      background: 'var(--primary)', 
                      color: '#fff', 
                      border: 'none', 
                      borderRadius: 8, 
                      fontWeight: 700, 
                      fontSize: 15 
                    }}
                  >
                    {creatingUser ? 'Creating Account...' : 'Create Account'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowAddForm(false)}
                    style={{ 
                      flex: 1, 
                      padding: '13px 20px', 
                      background: '#fff', 
                      color: 'var(--primary)', 
                      border: '1px solid var(--border)', 
                      borderRadius: 8, 
                      fontWeight: 700, 
                      fontSize: 15 
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit User Form - Professional Inline Design */}
        {editingUser && (
          <form 
            onSubmit={saveEdit} 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
              gap: 18, 
              padding: 24, 
              border: '2px solid var(--info)', 
              borderRadius: 12, 
              background: '#f8fbff',
              marginBottom: 28 
            }}
          >
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: 'var(--primary)' }}>
                Full Name
              </label>
              <input 
                value={editingUser.name} 
                onChange={e => setEditingUser(p => ({ ...p, name: e.target.value }))} 
                style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 15 }} 
                required 
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: 'var(--primary)' }}>
                Email
              </label>
              <input 
                type="email" 
                value={editingUser.email} 
                onChange={e => setEditingUser(p => ({ ...p, email: e.target.value }))} 
                style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 15 }} 
                required 
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: 'var(--primary)' }}>
                New Password <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span>
              </label>
              <input 
                type="password" 
                minLength={8} 
                value={editingUser.password} 
                onChange={e => setEditingUser(p => ({ ...p, password: e.target.value }))} 
                placeholder="Leave blank to keep current" 
                style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 15 }} 
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: 'var(--primary)' }}>
                Divisional Secretariat
              </label>
              <select 
                value={editingUser.ds_id} 
                onChange={e => setEditingUser(p => ({ ...p, ds_id: e.target.value }))} 
                style={{ 
                  width: '100%', 
                  padding: '10px 12px', 
                  border: '1px solid var(--border)', 
                  borderRadius: 8, 
                  fontSize: 15 
                }} 
                required
              >
                <option value="">Select DS Division</option>
                {dsOptions.map(ds => (
                  <option key={ds.id} value={ds.id}>{ds.name_english}</option>
                ))}
              </select>
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
              <input 
                type="checkbox" 
                checked={editingUser.is_active} 
                onChange={e => setEditingUser(p => ({ ...p, is_active: e.target.checked }))} 
                style={{ width: 20, height: 20 }}
              />
              <label style={{ fontSize: 15, fontWeight: 600, color: 'var(--primary)' }}>
                Account is active
              </label>
            </div>

            <div style={{ 
              display: 'flex', 
              gap: 12, 
              gridColumn: '1 / -1',
              marginTop: 12 
            }}>
              <button 
                type="submit" 
                disabled={savingUser}
                style={{ 
                  flex: 1,
                  padding: '12px 20px', 
                  background: 'var(--primary)', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: 8, 
                  fontWeight: 700, 
                  fontSize: 15 
                }}
              >
                {savingUser ? 'Saving Changes...' : 'Save Changes'}
              </button>
              <button 
                type="button" 
                onClick={cancelEdit}
                style={{ 
                  flex: 1,
                  padding: '12px 20px', 
                  background: '#fff', 
                  color: 'var(--primary)', 
                  border: '1px solid var(--border)', 
                  borderRadius: 8, 
                  fontWeight: 700, 
                  fontSize: 15 
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
} 