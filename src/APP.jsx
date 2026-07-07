// src/App.jsx
import React, { useState } from 'react';

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchDashboardData = async (userEmail) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/dashboard/stats?email=${encodeURIComponent(userEmail)}`
      );
      const data = await response.json();

      if (response.ok) {
        setDashboardData(data);
      } else {
        setDashboardData(null);
      }
    } catch (error) {
      setDashboardData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setDashboardData(null);

    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        setLoggedInUser(data.fullName);
        await fetchDashboardData(data.email);
      } else {
        setErrorMessage(data.message);
      }
    } catch (error) {
      setErrorMessage('Could not connect to the server.');
    }
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    setDashboardData(null);
    setEmail('');
    setPassword('');
  };

  const renderDashboard = () => {
    const stats = dashboardData?.stats || {};
    const fleetTypes = dashboardData?.fleetTypes || [];
    const maxBarValue = Math.max(...fleetTypes.map((item) => item.count), 1);

    return (
      <div style={{ maxWidth: '1100px', margin: '40px auto', padding: '24px', fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <p style={{ margin: 0, color: '#4b5563' }}>Fleet operations dashboard</p>
            <h1 style={{ margin: '6px 0 0', color: '#111827' }}>Welcome, {loggedInUser}</h1>
          </div>
          <button onClick={handleLogout} style={{ padding: '10px 16px', cursor: 'pointer', border: 'none', borderRadius: '6px', background: '#111827', color: 'white' }}>
            Logout
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style={{ background: 'linear-gradient(135deg, #2563eb, #4f46e5)', color: 'white', padding: '18px', borderRadius: '12px' }}>
            <p style={{ margin: 0, opacity: 0.9 }}>Assigned fleets</p>
            <h2 style={{ margin: '8px 0 0', fontSize: '28px' }}>{stats.fleetCount || 0}</h2>
          </div>
          <div style={{ background: 'linear-gradient(135deg, #0f766e, #14b8a6)', color: 'white', padding: '18px', borderRadius: '12px' }}>
            <p style={{ margin: 0, opacity: 0.9 }}>Distance covered</p>
            <h2 style={{ margin: '8px 0 0', fontSize: '28px' }}>{Number(stats.totalDistanceKm || 0).toFixed(2)} km</h2>
          </div>
          <div style={{ background: 'linear-gradient(135deg, #b45309, #f59e0b)', color: 'white', padding: '18px', borderRadius: '12px' }}>
            <p style={{ margin: 0, opacity: 0.9 }}>Average battery</p>
            <h2 style={{ margin: '8px 0 0', fontSize: '28px' }}>{Number(stats.averageBattery || 0).toFixed(0)}%</h2>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.9fr', gap: '20px' }}>
          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '18px' }}>
            <h3 style={{ marginTop: 0 }}>Fleet type distribution</h3>
            {fleetTypes.length > 0 ? (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '220px', marginTop: '16px' }}>
                {fleetTypes.map((item) => (
                  <div key={item.type} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: '100%', height: '180px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                      <div style={{ width: '100%', maxWidth: '70px', height: `${Math.max((item.count / maxBarValue) * 100, 8)}%`, background: '#2563eb', borderRadius: '8px 8px 0 0' }} />
                    </div>
                    <p style={{ margin: '8px 0 0', fontSize: '13px', textAlign: 'center', color: '#374151' }}>{item.type}</p>
                    <p style={{ margin: '2px 0 0', fontWeight: 700 }}>{item.count}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#6b7280' }}>No fleet data is available yet. Add data to the database to see charts.</p>
            )}
          </div>

          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '18px' }}>
            <h3 style={{ marginTop: 0 }}>Operational status</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
              {[
                { label: 'Idle', value: stats.idleFleets || 0, color: '#6b7280' },
                { label: 'Active', value: stats.activeFleets || 0, color: '#10b981' },
                { label: 'Charging', value: stats.chargingFleets || 0, color: '#f59e0b' },
                { label: 'Maintenance', value: stats.maintenanceFleets || 0, color: '#ef4444' }
              ].map((item) => (
                <div key={item.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                  <div style={{ height: '8px', background: '#e5e7eb', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min((item.value / Math.max(stats.fleetCount || 1, 1)) * 100, 100)}%`, height: '100%', background: item.color, borderRadius: '999px' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loggedInUser) {
    return renderDashboard();
  }

  return (
    <div style={{ maxWidth: '400px', margin: '100px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', fontFamily: 'sans-serif' }}>
      <h2>Fleet Management Login</h2>
      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}

      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Email Address:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>

        <button type="submit" style={{ width: '100%', padding: '10px', background: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}

export default App;
