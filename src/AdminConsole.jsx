import React, { useState, useEffect } from 'react';
import AppMenuBar from './AppMenuBar';
import { BrandMark } from './AppBrand';

export default function AdminConsole({ apiBaseUrl, menuActions }) {
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
    <div className="min-h-screen w-full bg-black text-zinc-200 antialiased">
      <AppMenuBar
        leftContent={<BrandMark showTitle />}
        actions={menuActions}
      />

      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">

      {msg && <p className="p-3 bg-zinc-900 border border-zinc-800 text-emerald-400 text-xs rounded-sm">{msg}</p>}

      <div className="flex gap-4 border-b border-zinc-900 pb-px text-xs font-bold">
        <button 
          onClick={() => setActiveTab('users')} 
          className={`pb-3 tracking-wider transition-all uppercase ${activeTab === 'users' ? 'text-emerald-500 border-b-2 border-emerald-500' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          Manage Users
        </button>
        <button 
          onClick={() => setActiveTab('add-fleet')} 
          className={`pb-3 tracking-wider transition-all uppercase ${activeTab === 'add-fleet' ? 'text-emerald-500 border-b-2 border-emerald-500' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          Add Fleet Asset
        </button>
      </div>

      {activeTab === 'users' ? (
        <div>
          <h3 className="text-xs font-bold text-zinc-500 mb-4 tracking-wider">Create New System User Account</h3>
          <form onSubmit={handleCreateUser} className="flex flex-col md:flex-row gap-3 p-5 mb-8 bg-black border border-zinc-900 rounded-sm items-end text-xs">
            <input type="text" placeholder="Full Name" value={newUser.full_name} onChange={e => setNewUser({...newUser, full_name: e.target.value})} required className="w-full p-2.5 bg-zinc-950 border border-zinc-800 text-white rounded-sm focus:outline-none focus:border-zinc-600 text-xs" />
            <input type="email" placeholder="Email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} required className="w-full p-2.5 bg-zinc-950 border border-zinc-800 text-white rounded-sm focus:outline-none focus:border-zinc-600 text-xs" />
            <input type="password" placeholder="Password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} required className="w-full p-2.5 bg-zinc-950 border border-zinc-800 text-white rounded-sm focus:outline-none focus:border-zinc-600 text-xs" />
            <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} className="w-full p-2.5 bg-zinc-950 border border-zinc-800 text-white rounded-sm focus:outline-none focus:border-zinc-600 text-xs uppercase">
              <option value="operator">Operator</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
            <button type="submit" className="w-full py-2.5 bg-emerald-500 text-black font-bold text-xs rounded-sm hover:bg-emerald-400 transition-colors duration-150 h-[37px]">Create User</button>
          </form>

          <h3 className="text-xs font-bold text-zinc-500 mb-4 tracking-wider">System Accounts Log</h3>
          <div className="overflow-x-auto border border-zinc-900 rounded-sm bg-black">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-950 border-b border-zinc-900 text-[10px] tracking-widest text-zinc-500">
                  <th className="p-4 font-bold">Name</th>
                  <th className="p-4 font-bold">Email</th>
                  <th className="p-4 font-bold">Role</th>
                  <th className="p-4 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 text-zinc-300 text-xs">
                {users.map(u => (
                  <tr key={u.user_id} className="hover:bg-zinc-950 transition-colors duration-100">
                    <td className="p-4 font-medium text-zinc-100">{u.full_name}</td>
                    <td className="p-4 text-zinc-400">{u.email}</td>
                    <td className="p-4"><span className="text-[10px] font-bold uppercase text-zinc-300 bg-zinc-900 px-2 py-0.5 rounded-sm border border-zinc-800">{u.role}</span></td>
                    <td className="p-4 text-right">
                      <button onClick={() => handleDeleteUser(u.user_id)} className="text-red-500 hover:text-red-400 font-medium transition-colors duration-100">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <form onSubmit={handleCreateFleet} className="flex flex-col gap-5 max-w-md bg-black border border-zinc-900 p-6 rounded-sm">
          <h3 className="text-xs font-bold text-white tracking-widest uppercase border-b border-zinc-900 pb-3">Register New Fleet Asset</h3>
          <div>
            <label className="block mb-2 text-[10px] font-bold text-zinc-500 tracking-wider">Vehicle Function Classification:</label>
            <select value={newFleet.vehicle_type} onChange={e => setNewFleet({...newFleet, vehicle_type: e.target.value})} className="w-full p-2.5 bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-sm focus:outline-none focus:border-zinc-700 text-xs uppercase">
              <option value="snow cleaner">Snow Cleaner</option>
              <option value="lawn mower">Lawn Mower</option>
              <option value="sweeper">Sweeper</option>
            </select>
          </div>
          <div>
            <label className="block mb-2 text-[10px] font-bold text-zinc-500 tracking-wider">Initial Battery Percentage Status:</label>
            <input type="number" min="0" max="100" value={newFleet.battery_life_percentage} onChange={e => setNewFleet({...newFleet, battery_life_percentage: parseInt(e.target.value)})} className="w-full p-2 bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-sm focus:outline-none focus:border-zinc-700 text-xs font-bold" />
          </div>
          <button type="submit" className="w-full mt-2 py-3 bg-emerald-500 text-black font-bold text-xs tracking-wider uppercase rounded-sm hover:bg-emerald-400 transition-colors duration-200">
            Register Asset
          </button>
        </form>
      )}
      </div>
    </div>
  );
}