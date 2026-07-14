import React, { useState, useEffect } from 'react';

export default function AdminConsole({ apiBaseUrl, onBack }) {
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('users');
  const [newUser, setNewUser] = useState({ full_name: '', email: '', password: '', role: 'operator' });
  const [newFleet, setNewFleet] = useState({ vehicle_type: 'snow cleaner', battery_life_percentage: 100, current_status: 'idle' });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/admin/users`, { credentials: 'include' });
      if (res.ok) setUsers(await res.json());
    } catch (e) { setMsg('Error loading users.'); }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiBaseUrl}/api/admin/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newUser)
      });
      if (res.ok) {
        setMsg('User created successfully!');
        setNewUser({ full_name: '', email: '', password: '', role: 'operator' });
        fetchUsers();
      } else {
        const err = await res.json();
        setMsg(err.message);
      }
    } catch (e) { setMsg('Network error.'); }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      const res = await fetch(`${apiBaseUrl}/api/admin/users/${id}`, { method: 'DELETE', credentials: 'include' });
      const data = await res.json();
      setMsg(data.message);
      fetchUsers();
    } catch (e) { setMsg('Failed to process deletion.'); }
  };

  const handleCreateFleet = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiBaseUrl}/api/admin/fleets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newFleet)
      });
      if (res.ok) {
        setMsg('Fleet vehicle registered successfully!');
        setNewFleet({ vehicle_type: 'snow cleaner', battery_life_percentage: 100, current_status: 'idle' });
      }
    } catch (e) { setMsg('Network error updating fleets.'); }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '32px', backgroundColor: '#09090b', border: '1px solid #1f2937', borderRadius: '8px', color: '#f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', borderBottom: '1px solid #1f2937', paddingBottom: '16px' }}>
        <h2 style={{ fontFamily: 'Orbitron', fontSize: '24px', fontWeight: '700', color: '#ffffff', margin: 0 }}>⚙️ CORE ADMINISTRATION LOGISTICS</h2>
        <button onClick={onBack} style={{ padding: '10px 20px', cursor: 'pointer', background: '#111827', color: '#9ca3af', border: '1px solid #374151', borderRadius: '4px', fontFamily: 'Orbitron', fontSize: '12px', transition: 'all 0.3s' }}>
          RETURN TO MONITOR
        </button>
      </div>

      {msg && <p style={{ padding: '12px', background: 'rgba(6,182,212,0.1)', border: '1px solid #06b6d4', color: '#06b6d4', borderRadius: '4px', fontFamily: 'Orbitron', fontSize: '13px' }}>{msg}</p>}

      <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
        <button onClick={() => setActiveTab('users')} style={{ padding: '12px 24px', background: activeTab === 'users' ? 'rgba(6,182,212,0.15)' : 'transparent', color: activeTab === 'users' ? '#06b6d4' : '#6b7280', border: '1px solid', borderColor: activeTab === 'users' ? '#06b6d4' : '#1f2937', borderRadius: '4px', fontFamily: 'Orbitron', fontSize: '12px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.3s' }}>PERSONNEL DIRECTORY</button>
        <button onClick={() => setActiveTab('add-fleet')} style={{ padding: '12px 24px', background: activeTab === 'add-fleet' ? 'rgba(6,182,212,0.15)' : 'transparent', color: activeTab === 'add-fleet' ? '#06b6d4' : '#6b7280', border: '1px solid', borderColor: activeTab === 'add-fleet' ? '#06b6d4' : '#1f2937', borderRadius: '4px', fontFamily: 'Orbitron', fontSize: '12px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.3s' }}>PROVISION ASSET</button>
      </div>

      {activeTab === 'users' ? (
        <div>
          <h3 style={{ fontFamily: 'Orbitron', fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>INITIALIZE NEW OPERATIONAL CREDENTIALS</h3>
          <form onSubmit={handleCreateUser} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '40px', background: '#030712', padding: '20px', borderRadius: '6px', border: '1px solid #1f2937' }}>
            <input type="text" placeholder="Identity Name" value={newUser.full_name} onChange={e => setNewUser({...newUser, full_name: e.target.value})} required style={{ padding: '10px', background: '#09090b', border: '1px solid #374151', color: '#ffffff', borderRadius: '4px', fontSize: '14px' }} />
            <input type="email" placeholder="Network Mail Secure" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} required style={{ padding: '10px', background: '#09090b', border: '1px solid #374151', color: '#ffffff', borderRadius: '4px', fontSize: '14px' }} />
            <input type="password" placeholder="Pass-Token Hash" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} required style={{ padding: '10px', background: '#09090b', border: '1px solid #374151', color: '#ffffff', borderRadius: '4px', fontSize: '14px' }} />
            <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} style={{ padding: '10px', background: '#09090b', border: '1px solid #374151', color: '#ffffff', borderRadius: '4px', fontSize: '14px', fontFamily: 'Orbitron' }}>
              <option value="operator">OPERATOR</option>
              <option value="manager">MANAGER</option>
              <option value="admin">ADMINISTRATOR</option>
            </select>
            <button type="submit" style={{ padding: '10px 20px', background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid #10b981', borderRadius: '4px', fontFamily: 'Orbitron', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>COMMENCE DEPLOYMENT</button>
          </form>

          <h3 style={{ fontFamily: 'Orbitron', fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>AUTHORIZED SYSTEM COHORT ARCHIVE</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', background: '#030712', borderRadius: '6px', border: '1px solid #1f2937', overflow: 'hidden' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1f2937', background: '#09090b' }}>
                <th style={{ padding: '16px', fontFamily: 'Orbitron', fontSize: '11px', color: '#6b7280' }}>NOMENCLATURE</th>
                <th style={{ padding: '16px', fontFamily: 'Orbitron', fontSize: '11px', color: '#6b7280' }}>NETWORK ALIAS</th>
                <th style={{ padding: '16px', fontFamily: 'Orbitron', fontSize: '11px', color: '#6b7280' }}>CLEARANCE INTERCEPT</th>
                <th style={{ padding: '16px', fontFamily: 'Orbitron', fontSize: '11px', color: '#6b7280' }}>ACTION STATUS</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.user_id} style={{ borderBottom: '1px solid #1f2937' }}>
                  <td style={{ padding: '16px', fontSize: '14px', fontWeight: '500' }}>{u.full_name}</td>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#9ca3af' }}>{u.email}</td>
                  <td style={{ padding: '16px' }}><span style={{ fontFamily: 'Orbitron', fontSize: '11px', fontWeight: '700', padding: '4px 8px', background: u.role === 'admin' ? 'rgba(217,119,6,0.15)' : 'rgba(6,182,212,0.15)', color: u.role === 'admin' ? '#fbbf24' : '#06b6d4', borderRadius: '2px', border: u.role === 'admin' ? '1px solid #d97706' : '1px solid #0891b2' }}>{u.role}</span></td>
                  <td style={{ padding: '16px' }}>
                    <button onClick={() => handleDeleteUser(u.user_id)} style={{ background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', padding: '6px 12px', borderRadius: '4px', fontFamily: 'Orbitron', fontSize: '11px', cursor: 'pointer', transition: 'all 0.3s' }} onMouseEnter={(e)=>e.target.style.background='rgba(239,68,68,0.1)'} onMouseLeave={(e)=>e.target.style.background='transparent'}>PURGE</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <form onSubmit={handleCreateFleet} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '450px', background: '#030712', padding: '24px', borderRadius: '6px', border: '1px solid #1f2937' }}>
          <h3 style={{ margin: '0 0 8px 0', fontFamily: 'Orbitron', fontSize: '14px', color: '#ffffff' }}>PROVISION NEW HARDWARE HARDPLANE</h3>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontFamily: 'Orbitron', color: '#9ca3af' }}>FUNCTIONAL VEHICLE SPECIATION:</label>
            <select value={newFleet.vehicle_type} onChange={e => setNewFleet({...newFleet, vehicle_type: e.target.value})} style={{ width: '100%', padding: '10px', background: '#09090b', border: '1px solid #374151', color: '#ffffff', borderRadius: '4px', fontFamily: 'Orbitron' }}>
              <option value="snow cleaner">SNOW DISPLACEMENT COMBINE</option>
              <option value="lawn mower">VEGETATION LANDSCAPE INTERCEPTOR</option>
              <option value="sweeper">SURFACE CLEANING ARRAY</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontFamily: 'Orbitron', color: '#9ca3af' }}>POTENTIAL ENERGETIC INTEGRITY RESERVOIR (%):</label>
            <input type="number" min="0" max="100" value={newFleet.battery_life_percentage} onChange={e => setNewFleet({...newFleet, battery_life_percentage: parseInt(e.target.value)})} style={{ width: '100%', padding: '10px', background: '#09090b', border: '1px solid #374151', color: '#ffffff', borderRadius: '4px', fontFamily: 'Orbitron' }} />
          </div>
          <button type="submit" style={{ padding: '12px', background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid #10b981', borderRadius: '4px', fontFamily: 'Orbitron', fontWeight: '700', cursor: 'pointer', marginTop: '8px' }}>PROVISION ASSET</button>
        </form>
      )}
    </div>
  );
};