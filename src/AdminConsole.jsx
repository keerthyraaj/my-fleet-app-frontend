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
    <div style={{ maxWidth: '900px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2>🛠️ System Administration</h2>
        <button onClick={onBack} style={{ padding: '8px 14px', cursor: 'pointer', background: '#111827', color: 'white', border: 'none', borderRadius: '6px' }}>
          Back to Dashboard
        </button>
      </div>

      {msg && <p style={{ padding: '10px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px' }}>{msg}</p>}

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => setActiveTab('users')} style={{ padding: '10px', background: activeTab === 'users' ? '#2563eb' : '#e5e7eb', color: activeTab === 'users' ? 'white' : 'black', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Manage Users</button>
        <button onClick={() => setActiveTab('add-fleet')} style={{ padding: '10px', background: activeTab === 'add-fleet' ? '#2563eb' : '#e5e7eb', color: activeTab === 'add-fleet' ? 'white' : 'black', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Add Fleet Asset</button>
      </div>

      {activeTab === 'users' ? (
        <div>
          <h3>Create New System User Account</h3>
          <form onSubmit={handleCreateUser} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '30px' }}>
            <input type="text" placeholder="Full Name" value={newUser.full_name} onChange={e => setNewUser({...newUser, full_name: e.target.value})} required style={{ padding: '8px' }} />
            <input type="email" placeholder="Email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} required style={{ padding: '8px' }} />
            <input type="password" placeholder="Password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} required style={{ padding: '8px' }} />
            <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} style={{ padding: '8px' }}>
              <option value="operator">Operator</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
            <button type="submit" style={{ padding: '8px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Create User</button>
          </form>

          <h3>System Accounts Log</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f3f4f6' }}>
                <th style={{ padding: '10px' }}>Name</th>
                <th style={{ padding: '10px' }}>Email</th>
                <th style={{ padding: '10px' }}>Role</th>
                <th style={{ padding: '10px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.user_id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '10px' }}>{u.full_name}</td>
                  <td style={{ padding: '10px' }}>{u.email}</td>
                  <td style={{ padding: '10px' }}><span style={{ textTransform: 'uppercase', fontSize: '12px', fontWeight: 'bold' }}>{u.role}</span></td>
                  <td style={{ padding: '10px' }}>
                    <button onClick={() => handleDeleteUser(u.user_id)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <form onSubmit={handleCreateFleet} style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '400px' }}>
          <h3>Register New Fleet Asset</h3>
          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>Vehicle Function Classification:</label>
            <select value={newFleet.vehicle_type} onChange={e => setNewFleet({...newFleet, vehicle_type: e.target.value})} style={{ width: '100%', padding: '8px' }}>
              <option value="snow cleaner">Snow Cleaner</option>
              <option value="lawn mower">Lawn Mower</option>
              <option value="sweeper">Sweeper</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>Initial Battery Percentage Status:</label>
            <input type="number" min="0" max="100" value={newFleet.battery_life_percentage} onChange={e => setNewFleet({...newFleet, battery_life_percentage: parseInt(e.target.value)})} style={{ width: '100%', padding: '8px' }} />
          </div>
          <button type="submit" style={{ padding: '10px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Register Asset</button>
        </form>
      )}
    </div>
  );
}