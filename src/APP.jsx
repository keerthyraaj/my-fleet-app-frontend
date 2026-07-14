// src/App.jsx
import React, { useState, useEffect } from 'react';
import FleetMap from './FleetMap';
import FleetScheduleDemo from './FleetScheduleDemo';
import AdminConsole from './AdminConsole';

const VIEW_PATHS = {
  login: '/login',
  dashboard: '/dashboard',
  map: '/map',
  'schedule-demo': '/schedule-demo',
  'admin-console': '/admin-console'
};

function getViewFromPath(pathname) {
  switch (pathname) {
    case '/dashboard':
      return 'dashboard';
    case '/map':
      return 'map';
    case '/schedule-demo':
      return 'schedule-demo';
    case '/admin-console':
      return 'admin-console';
    case '/':
    case '/login':
    default:
      return 'login';
  }
}

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [fleetMapData, setFleetMapData] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeView, setActiveView] = useState(() =>
    getViewFromPath(window.location.pathname)
  );
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

  useEffect(() => {
    const handlePopState = () => {
      const nextView = getViewFromPath(window.location.pathname);

      setActiveView(nextView);

      if (nextView === 'login') {
        setLoggedInUser(null);
        setDashboardData(null);
        setFleetMapData([]);
        setErrorMessage('');
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    if (window.location.pathname === '/') {
      window.history.replaceState({ view: 'login' }, '', VIEW_PATHS.login);
      setActiveView('login');
    }
  }, []);

  const apiBaseUrl = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : 'https://my-fleet-app-backend.onrender.com')).replace(/\/$/, '');

  const navigateTo = (view, { replace = false } = {}) => {
    const path = VIEW_PATHS[view] || VIEW_PATHS.login;

    if (replace) {
      window.history.replaceState({ view }, '', path);
    } else {
      window.history.pushState({ view }, '', path);
    }

    setActiveView(view);
  };

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
        navigateTo('dashboard');
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
    setEmail('');
    setPassword('');

    navigateTo('login', { replace: true });
  };

  const handleOpenFleetMap = async () => {
    navigateTo('map');
    if (fleetMapData.length === 0) {
      await fetchFleetMapData();
    }
  };

  const handleOpenFleetScheduleDemo = async () => {
    navigateTo('schedule-demo');
    if (fleetMapData.length === 0) {
      await fetchFleetMapData();
    }
  };

  const renderDashboard = () => {
    const stats = dashboardData?.stats || {};
    const fleetTypes = dashboardData?.fleetTypes || [];
    const maxBarValue = Math.max(...fleetTypes.map((item) => item.count), 1);

    return (
      <div className="max-w-7xl mx-auto px-6 py-12 bg-black min-h-screen text-zinc-100 antialiased">
        
        {!isOnline && (
          <div className="p-3 bg-zinc-900 border-l-2 border-emerald-500 text-zinc-300 text-xs mb-8 tracking-wide">
            Working Offline. Live GPS map telemetry tracking updates are temporarily paused.
          </div>
        )}

        {/* Clean Header Area */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12 border-b border-zinc-900 pb-8">
          <div>
            <p className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase block mb-1">Fleet operations dashboard</p>
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Welcome, {loggedInUser?.fullName}
            </h1>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            {loggedInUser?.role === 'admin' && (
              <button
                onClick={() => navigateTo('admin-console')}
                className="px-4 py-2 bg-emerald-500 text-black font-semibold rounded-sm hover:bg-emerald-400 transition-colors duration-150"
              >
                🛠| Admin Panel
              </button>
            )}
            <button 
              onClick={handleOpenFleetMap} 
              className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-300 font-medium rounded-sm hover:border-zinc-700 hover:text-white transition-colors duration-150"
            >
              🗺| Map
            </button>
            <button 
              onClick={handleOpenFleetScheduleDemo} 
              className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-300 font-medium rounded-sm hover:border-zinc-700 hover:text-white transition-colors duration-150"
            >
              🗓| Schedule demo
            </button>
            <button onClick={handleLogout} className="px-4 py-2 text-zinc-500 hover:text-zinc-300 transition-colors duration-150">
              Logout
            </button>
          </div>
        </div>

        {/* Original Metric Cards Restored */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          <div className="border border-zinc-900 bg-zinc-950 p-6 rounded-sm">
            <span className="text-[10px] font-medium tracking-widest text-zinc-500 uppercase block">Assigned fleets</span>
            <div className="mt-3 text-4xl font-light text-white tracking-tight">{stats.fleetCount || 0}</div>
          </div>
          <div className="border border-zinc-900 bg-zinc-950 p-6 rounded-sm">
            <span className="text-[10px] font-medium tracking-widest text-zinc-500 uppercase block">Distance covered</span>
            <div className="mt-3 text-4xl font-light text-white tracking-tight">
              {Number(stats.totalDistanceKm || 0).toFixed(2)} <span className="text-xs text-zinc-500 font-normal tracking-normal">km</span>
            </div>
          </div>
          <div className="border border-zinc-900 bg-zinc-950 p-6 rounded-sm">
            <span className="text-[10px] font-medium tracking-widest text-zinc-500 uppercase block">Average battery</span>
            <div className="mt-3 text-4xl font-light text-white tracking-tight">
              {Number(stats.averageBattery || 0).toFixed(0)}<span className="text-sm text-zinc-500 font-normal tracking-normal">%</span>
            </div>
          </div>
        </div>

        {/* Content Grids */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 border border-zinc-900 bg-zinc-950 rounded-sm p-6">
            <h3 className="text-xs font-semibold tracking-wider text-zinc-400 uppercase mb-6">Fleet type distribution</h3>
            {fleetTypes.length > 0 ? (
              <div className="flex items-end gap-6 h-56 pt-4">
                {fleetTypes.map((item) => (
                  <div key={item.type} className="flex-1 flex flex-col items-center">
                    <div className="w-full h-40 flex items-end justify-center">
                      <div 
                        style={{ height: `${Math.max((item.count / maxBarValue) * 100, 4)}%` }}
                        className="w-full max-w-[28px] bg-zinc-800 hover:bg-emerald-500 transition-colors duration-150 rounded-t-sm"
                      />
                    </div>
                    <p className="mt-3 text-[10px] tracking-wide uppercase text-zinc-500 truncate w-full text-center">{item.type}</p>
                    <p className="mt-1 font-semibold text-white text-xs">{item.count}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-zinc-600 py-16 text-center text-xs font-mono">No fleet data is available yet. Add data to the database to see charts.</p>
            )}
          </div>

          <div className="border border-zinc-900 bg-zinc-950 rounded-sm p-6">
            <h3 className="text-xs font-semibold tracking-wider text-zinc-400 uppercase mb-6">Operational status</h3>
            <div className="flex flex-col gap-5">
              {[
                { label: 'Idle', value: stats.idleFleets || 0, color: 'bg-zinc-800' },
                { label: 'Active', value: stats.activeFleets || 0, color: 'bg-emerald-500' },
                { label: 'Charging', value: stats.chargingFleets || 0, color: 'bg-zinc-600' },
                { label: 'Maintenance', value: stats.maintenanceFleets || 0, color: 'bg-zinc-700' }
              ].map((item) => (
                <div key={item.label} className="text-xs">
                  <div className="flex justify-between mb-1 text-[10px] font-semibold text-zinc-500">
                    <span>{item.label}</span>
                    <span className="text-white font-bold">{item.value}</span>
                  </div>
                  <div className="h-1 bg-zinc-900 rounded-sm overflow-hidden">
                    <div 
                      className={`h-full ${item.color}`}
                      style={{ width: `${Math.min((item.value / Math.max(stats.fleetCount || 1, 1)) * 100, 100)}%` }}
                    />
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
      <div className="p-6 bg-black min-h-screen text-zinc-100 antialiased font-sans">
        <div className="flex justify-between items-center mb-6 border-b border-zinc-900 pb-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-white uppercase font-mono">Fleet map</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Hover over a dot to see fleet details.</p>
          </div>
          <button onClick={() => navigateTo('dashboard')} className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-300 font-medium text-xs font-mono tracking-wide rounded-sm hover:border-zinc-700 hover:text-white transition-colors duration-150">
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
        onBack={() => navigateTo('dashboard')}
      />
    );
  }
  
  if (loggedInUser && activeView === 'admin-console') {
  return (
    <AdminConsole 
      apiBaseUrl={apiBaseUrl} 
      onBack={() => navigateTo('dashboard')} 
    />
   );
  }

  if (loggedInUser) {
    return renderDashboard();
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-black text-zinc-200 p-4">
      <div className="w-full max-w-[400px] bg-zinc-950 border border-zinc-900 p-8 rounded-sm shadow-2xl">
        <div className="mb-8 border-b border-zinc-900 pb-4">
          <h2 className="text-lg font-semibold tracking-tight text-white uppercase">LOGIN</h2>
        </div>
        
        {errorMessage && <p className="p-3 mb-4 bg-red-950/20 border border-red-950 text-red-400 text-xs rounded-sm">{errorMessage}</p>}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-[10px] font-bold tracking-wider text-zinc-500 uppercase mb-2">Email Address:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-3 bg-black border border-zinc-800 text-white text-sm rounded-sm focus:outline-none focus:border-zinc-700 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold tracking-wider text-zinc-500 uppercase mb-2">Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-3 bg-black border border-zinc-800 text-white text-sm rounded-sm focus:outline-none focus:border-zinc-700 transition-colors"
            />
          </div>

          <button type="submit" className="w-full py-3 bg-emerald-500 text-black font-bold text-xs tracking-widest uppercase rounded-sm hover:bg-emerald-400 transition-colors duration-200 mt-2">
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;