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
    <div className="max-w-5xl mx-auto my-12 p-8 bg-zinc-950 border border-zinc-900 rounded-sm text-zinc-200 antialiased">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b border-zinc-900 pb-5">
        <div>
          <span className="text-[10px] font-bold tracking-widest text-zinc-500 font-mono uppercase block mb-1">Administrative Privilege Node</span>
          <h2 className="text-lg font-semibold tracking-tight text-white uppercase font-mono">LOGISTICS MANIFEST CONFIG</h2>
        </div>
        <button onClick={onBack} className="px-4 py-2 text-xs font-mono font-bold tracking-wider bg-black border border-zinc-900 text-zinc-400 rounded-sm hover:border-zinc-700 hover:text-white transition-colors duration-150">
          MONITOR NODE
        </button>
      </div>

      {msg && <p className="p-3 mb-6 bg-zinc-900 border border-zinc-800 text-emerald-400 text-xs font-mono font-medium tracking-wide rounded-sm">{msg}</p>}

      <div className="flex gap-4 mb-8 border-b border-zinc-900 pb-px font-mono text-xs font-bold">
        <button 
          onClick={() => setActiveTab('users')} 
          className={`pb-3 tracking-wider transition-all uppercase ${activeTab === 'users' ? 'text-emerald-500 border-b-2 border-emerald-500' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          PERSONNEL DIRECTORY
        </button>
        <button 
          onClick={() => setActiveTab('add-fleet')} 
          className={`pb-3 tracking-wider transition-all uppercase ${activeTab === 'add-fleet' ? 'text-emerald-500 border-b-2 border-emerald-500' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          PROVISION ASSET
        </button>
      </div>

      {activeTab === 'users' ? (
        <div>
          <h3 className="font-mono text-[10px] font-bold text-zinc-500 mb-4 tracking-widest uppercase">INITIALIZE SYSTEM OPERATIONAL CREDENTIALS</h3>
          <form onSubmit={handleCreateUser} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 p-5 mb-8 bg-black border border-zinc-900 rounded-sm items-end font-mono text-xs">
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-zinc-600 block uppercase">IDENTITY</span>
              <input type="text" placeholder="Identity Name" value={newUser.full_name} onChange={e => setNewUser({...newUser, full_name: e.target.value})} required className="w-full p-2.5 bg-zinc-950 border border-zinc-800 text-white rounded-sm focus:outline-none focus:border-zinc-600 text-xs" />
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-zinc-600 block uppercase">NETWORK MAIL</span>
              <input type="email" placeholder="Network Mail Secure" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} required className="w-full p-2.5 bg-zinc-950 border border-zinc-800 text-white rounded-sm focus:outline-none focus:border-zinc-600 text-xs" />
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-zinc-600 block uppercase">PASSWORD</span>
              <input type="password" placeholder="Token Hash" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} required className="w-full p-2.5 bg-zinc-950 border border-zinc-800 text-white rounded-sm focus:outline-none focus:border-zinc-600 text-xs" />
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-zinc-600 block uppercase">CLEARANCE</span>
              <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} className="w-full p-2.5 bg-zinc-950 border border-zinc-800 text-white rounded-sm focus:outline-none focus:border-zinc-600 text-xs font-mono uppercase">
                <option value="operator">Operator</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button type="submit" className="w-full py-2.5 bg-emerald-500 text-black font-bold text-xs rounded-sm hover:bg-emerald-400 transition-colors duration-150 h-[37px]">COMMIT USER</button>
          </form>

          <h3 className="font-mono text-[10px] font-bold text-zinc-500 mb-4 tracking-widest uppercase">AUTHORIZED COHORT ARCHIVE REGISTER</h3>
          <div className="overflow-x-auto border border-zinc-900 rounded-sm bg-black">
            <table className="w-full text-left border-collapse font-sans">
              <thead>
                <tr className="bg-zinc-950 border-b border-zinc-900 font-mono text-[9px] tracking-widest text-zinc-500">
                  <th className="p-4 font-bold">NOMENCLATURE</th>
                  <th className="p-4 font-bold">NETWORK ALIAS</th>
                  <th className="p-4 font-bold">CLEARANCE MODE</th>
                  <th className="p-4 font-bold text-right">SYSTEM ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 text-zinc-300 text-xs">
                {users.map(u => (
                  <tr key={u.user_id} className="hover:bg-zinc-950 transition-colors duration-100">
                    <td className="p-4 font-medium text-zinc-100 uppercase font-mono tracking-tight text-[13px]">{u.full_name}</td>
                    <td className="p-4 text-zinc-400 font-mono">{u.email}</td>
                    <td className="p-4"><span className="text-[9px] font-mono font-bold tracking-widest uppercase text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded-sm border border-zinc-800">{u.role}</span></td>
                    <td className="p-4 text-right">
                      <button onClick={() => handleDeleteUser(u.user_id)} className="text-zinc-600 hover:text-red-400 font-mono text-[11px] uppercase transition-colors duration-100">Purge</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <form onSubmit={handleCreateFleet} className="flex flex-col gap-5 max-w-md bg-black border border-zinc-900 p-6 rounded-sm">
          <h3 className="text-xs font-bold text-white tracking-widest uppercase font-mono border-b border-zinc-900 pb-3">PROVISION UNMANNED HARDWARE PLATES</h3>
          <div>
            <label className="block mb-2 text-[9px] font-mono font-bold text-zinc-500 tracking-wider">HARDWARE CLASS CONFIGURATION:</label>
            <select value={newFleet.vehicle_type} onChange={e => setNewFleet({...newFleet, vehicle_type: e.target.value})} className="w-full p-2.5 bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-sm focus:outline-none focus:border-zinc-700 text-xs font-mono uppercase">
              <option value="snow cleaner">SNOW DISPLACEMENT COMBINE</option>
              <option value="lawn mower">VEGETATION INTERCEPT ARRAY</option>
              <option value="sweeper">SURFACE SCRUB MATRIX</option>
            </select>
          </div>
          <div>
            <label className="block mb-2 text-[9px] font-mono font-bold text-zinc-500 tracking-wider">INITIAL POTENCY CELL RESERVOIR STATUS (%):</label>
            <input type="number" min="0" max="100" value={newFleet.battery_life_percentage} onChange={e => setNewFleet({...newFleet, battery_life_percentage: parseInt(e.target.value)})} className="w-full p-2 bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-sm focus:outline-none focus:border-zinc-700 text-xs font-mono font-bold" />
          </div>
          <button type="submit" className="w-full mt-2 py-3 bg-emerald-500 text-black font-mono font-bold text-xs tracking-wider uppercase rounded-sm hover:bg-emerald-400 transition-colors duration-200">
            PROVISION NEW MACHINE ASSEMBLY
          </button>
        </form>
      )}
    </div>
  );
}