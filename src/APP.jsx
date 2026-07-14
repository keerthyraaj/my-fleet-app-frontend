// src/App.jsx
import React, { useState, useEffect } from 'react';
import FleetMap from './FleetMap';
import FleetScheduleDemo from './FleetScheduleDemo';
import AdminConsole from './AdminConsole';

function App() {
  const [email, setEmail] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnlineStatus = () => setIsOnline(true);
    const handleOfflineStatus = () => setIsOnline(false);

    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOfflineStatus);

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOfflineStatus);
    };
  }, []);
  const [password, setPassword] = useState('');
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [fleetMapData, setFleetMapData] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');

  const apiBaseUrl = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : 'https://my-fleet-app-backend.onrender.com')).replace(/\/$/, '');

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/dashboard/stats`, {
        credentials: 'include'
      });
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

  const fetchFleetMapData = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/fleets`, {
        credentials: 'include'
      });
      const data = await response.json();

      if (response.ok) {
        setFleetMapData(data.fleets || []);
      } else {
        setFleetMapData([]);
      }
    } catch (error) {
      setFleetMapData([]);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setDashboardData(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        setLoggedInUser({
          fullName: data.fullName,
          role: data.role // <-- Tracks structural roles globally inside your React UI
      });
        setActiveView('dashboard');
        await fetchDashboardData();
      } else {
        setErrorMessage(data.message);
      }
    } catch (error) {
      setErrorMessage('Could not connect to the server.');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${apiBaseUrl}/api/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      // Ignore logout errors and clear UI locally
    }

    setLoggedInUser(null);
    setDashboardData(null);
    setFleetMapData([]);
    setActiveView('dashboard');
    setEmail('');
    setPassword('');
  };

  const handleOpenFleetMap = async () => {
    setActiveView('map');
    if (fleetMapData.length === 0) {
      await fetchFleetMapData();
    }
  };

  const handleOpenFleetScheduleDemo = async () => {
    setActiveView('schedule-demo');
    if (fleetMapData.length === 0) {
      await fetchFleetMapData();
    }
  };

  const renderDashboard = () => {
    const stats = dashboardData?.stats || {};
    const fleetTypes = dashboardData?.fleetTypes || [];
    const maxBarValue = Math.max(...fleetTypes.map((item) => item.count), 1);

    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px', backgroundColor: '#030712', minHeight: '100vh' }}>
        
        {!isOnline && (
          <div style={{ padding: '14px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '8px', marginBottom: '24px', fontWeight: '500', textAlign: 'center', boxShadow: '0 0 15px rgba(239,68,68,0.15)', backdropFilter: 'blur(4px)' }}>
            ⚡ SYSTEM LINK INTERRUPTED — OPERATING ON LOCAL CACHED TELEMETRY
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: '1px solid #1f2937', paddingBottom: '24px' }}>
          <div>
            <p style={{ margin: 0, color: '#06b6d4', fontSize: '12px', fontWeight: '700', tracking: '0.15em', textTransform: 'uppercase', fontfamily: 'Orbitron' }}>Autonomous Command Node</p>
            <h1 style={{ margin: '4px 0 0', color: '#ffffff', fontSize: '32px', fontFamily: 'Orbitron', fontWeight: '700' }}>WELCOME, {loggedInUser?.fullName?.toUpperCase()}</h1>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {loggedInUser?.role === 'admin' && (
              <button
                onClick={() => setActiveView('admin-console')}
                style={{ padding: '10px 20px', cursor: 'pointer', border: '1px solid #d97706', borderRadius: '4px', background: 'rgba(217, 119, 6, 0.1)', color: '#fbbf24', fontFamily: 'Orbitron', fontSize: '13px', fontWeight: '700', transition: 'all 0.3s', boxShadow: '0 0 10px rgba(217,119,6,0.1)' }}
                onMouseEnter={(e) => { e.target.style.background = '#d97706'; e.target.style.color = '#000000'; }}
                onMouseLeave={(e) => { e.target.style.background = 'rgba(217, 119, 6, 0.1)'; e.target.style.color = '#fbbf24'; }}
              >
                🛠️ CORE CONTROL
              </button>
            )}
            <button 
              onClick={handleOpenFleetMap} 
              style={{ padding: '10px 20px', cursor: 'pointer', border: '1px solid #0f766e', borderRadius: '4px', background: 'rgba(15, 118, 110, 0.1)', color: '#2dd4bf', fontFamily: 'Orbitron', fontSize: '13px', fontWeight: '700', transition: 'all 0.3s' }}
              onMouseEnter={(e) => { e.target.style.background = '#0f766e'; e.target.style.color = '#ffffff'; }}
              onMouseLeave={(e) => { e.target.style.background = 'rgba(15, 118, 110, 0.1)'; e.target.style.color = '#2dd4bf'; }}
            >
              🗺️ MAP MATRIX
            </button>
            <button 
              onClick={handleOpenFleetScheduleDemo} 
              style={{ padding: '10px 20px', cursor: 'pointer', border: '1px solid #7c3aed', borderRadius: '4px', background: 'rgba(124, 58, 237, 0.1)', color: '#a78bfa', fontFamily: 'Orbitron', fontSize: '13px', fontWeight: '700', transition: 'all 0.3s' }}
              onMouseEnter={(e) => { e.target.style.background = '#7c3aed'; e.target.style.color = '#ffffff'; }}
              onMouseLeave={(e) => { e.target.style.background = 'rgba(124, 58, 237, 0.1)'; e.target.style.color = '#a78bfa'; }}
            >
              🗓️ CHRONO FLOW
            </button>
            <button onClick={handleLogout} style={{ padding: '10px 20px', cursor: 'pointer', border: '1px solid #374151', borderRadius: '4px', background: '#111827', color: '#9ca3af', fontFamily: 'Orbitron', fontSize: '13px', transition: 'all 0.3s' }}>
              DISCONNECT
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '32px' }}>
          <div style={{ background: '#09090b', border: '1px solid #1f2937', padding: '24px', borderRadius: '8px', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.6)' }}>
            <p style={{ margin: 0, fontSize: '11px', textTransform: 'uppercase', tracking: '0.1em', color: '#6b7280', fontFamily: 'Orbitron' }}>ACTIVE ASSET REGISTRY</p>
            <h2 style={{ margin: '12px 0 0', fontSize: '36px', color: '#ffffff', fontFamily: 'Orbitron', fontWeight: '900', textShadow: '0 0 10px rgba(255,255,255,0.1)' }}>{stats.fleetCount || 0} <span style={{ fontSize: '14px', color: '#4b5563' }}>UNITS</span></h2>
          </div>
          <div style={{ background: '#09090b', border: '1px solid #1f2937', padding: '24px', borderRadius: '8px', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.6)' }}>
            <p style={{ margin: 0, fontSize: '11px', textTransform: 'uppercase', tracking: '0.1em', color: '#6b7280', fontFamily: 'Orbitron' }}>AGGREGATE DISPLACEMENT</p>
            <h2 style={{ margin: '12px 0 0', fontSize: '36px', color: '#06b6d4', fontFamily: 'Orbitron', fontWeight: '900', textShadow: '0 0 15px rgba(6,182,212,0.2)' }}>{Number(stats.totalDistanceKm || 0).toFixed(2)} <span style={{ fontSize: '14px', color: '#0f766e' }}>KM</span></h2>
          </div>
          <div style={{ background: '#09090b', border: '1px solid #1f2937', padding: '24px', borderRadius: '8px', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.6)' }}>
            <p style={{ margin: 0, fontSize: '11px', textTransform: 'uppercase', tracking: '0.1em', color: '#6b7280', fontFamily: 'Orbitron' }}>POWER MATRIX MEDIAN</p>
            <h2 style={{ margin: '12px 0 0', fontSize: '36px', color: '#10b981', fontFamily: 'Orbitron', fontWeight: '900', textShadow: '0 0 15px rgba(16,185,129,0.2)' }}>{Number(stats.averageBattery || 0).toFixed(0)}<span style={{ fontSize: '20px', color: '#047857' }}>%</span></h2>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px' }}>
          <div style={{ background: '#09090b', border: '1px solid #1f2937', borderRadius: '8px', padding: '24px' }}>
            <h3 style={{ marginTop: 0, fontFamily: 'Orbitron', fontSize: '14px', tracking: '0.05em', color: '#ffffff', borderBottom: '1px solid #1f2937', paddingBottom: '12px' }}>VEHICLE VECTOR VECTORING</h3>
            {fleetTypes.length > 0 ? (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px', height: '240px', marginTop: '24px' }}>
                {fleetTypes.map((item) => (
                  <div key={item.type} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: '100%', height: '180px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                      <div style={{ width: '100%', maxWidth: '44px', height: `${Math.max((item.count / maxBarValue) * 100, 6)}%`, background: 'linear-gradient(to top, #0f766e, #06b6d4)', borderRadius: '2px 2px 0 0', boxShadow: '0 0 15px rgba(6,182,212,0.3)' }} />
                    </div>
                    <p style={{ margin: '12px 0 0', fontSize: '11px', fontFamily: 'Orbitron', textTransform: 'uppercase', color: '#9ca3af' }}>{item.type}</p>
                    <p style={{ margin: '2px 0 0', fontFamily: 'Orbitron', fontWeight: 700, color: '#ffffff' }}>{item.count}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#4b5563', padding: '40px 0', textAlign: 'center' }}>NO TELEMETRY LOGS COMPILED.</p>
            )}
          </div>

          <div style={{ background: '#09090b', border: '1px solid #1f2937', borderRadius: '8px', padding: '24px' }}>
            <h3 style={{ marginTop: 0, fontFamily: 'Orbitron', fontSize: '14px', tracking: '0.05em', color: '#ffffff', borderBottom: '1px solid #1f2937', paddingBottom: '12px' }}>TACTICAL RUNTIME STATUS</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px' }}>
              {[
                { label: 'STANDBY (IDLE)', value: stats.idleFleets || 0, color: '#6b7280', glow: 'transparent' },
                { label: 'OPERATIONAL (ACTIVE)', value: stats.activeFleets || 0, color: '#06b6d4', glow: 'rgba(6,182,212,0.3)' },
                { label: 'RECHARGING CELL', value: stats.chargingFleets || 0, color: '#10b981', glow: 'rgba(16,185,129,0.3)' },
                { label: 'CRITICAL MAINTENANCE', value: stats.maintenanceFleets || 0, color: '#ef4444', glow: 'rgba(239,68,68,0.3)' }
              ].map((item) => (
                <div key={item.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '11px', fontFamily: 'Orbitron', color: '#9ca3af' }}>
                    <span>{item.label}</span>
                    <span style={{ color: '#ffffff', fontWeight: '700' }}>{item.value}</span>
                  </div>
                  <div style={{ height: '6px', background: '#111827', borderRadius: '1px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min((item.value / Math.max(stats.fleetCount || 1, 1)) * 100, 100)}%`, height: '100%', background: item.color, boxShadow: `0 0 8px ${item.glow}` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  if (loggedInUser && activeView === 'map') {
    return (
      <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ margin: 0 }}>Fleet map</h2>
            <p style={{ margin: '4px 0 0', color: '#6b7280' }}>Hover over a dot to see fleet details.</p>
          </div>
          <button onClick={() => setActiveView('dashboard')} style={{ padding: '10px 14px', cursor: 'pointer', border: 'none', borderRadius: '6px', background: '#111827', color: 'white' }}>
            Back to dashboard
          </button>
        </div>
        <FleetMap fleets={fleetMapData} />
      </div>
    );
  }

  if (loggedInUser && activeView === 'schedule-demo') {
    return (
      <FleetScheduleDemo
        fleets={fleetMapData}
        apiBaseUrl={apiBaseUrl}
        onBack={() => setActiveView('dashboard')}
      />
    );
  }
  
  if (loggedInUser && activeView === 'admin-console') {
  return (
    <AdminConsole 
      apiBaseUrl={apiBaseUrl} 
      onBack={() => setActiveView('dashboard')} 
    />
   );
  }

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
