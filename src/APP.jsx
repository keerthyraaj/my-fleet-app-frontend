// src/App.jsx
import React, { useEffect, useState } from 'react';
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

const PROTECTED_VIEWS = new Set(['dashboard', 'map', 'schedule-demo', 'admin-console']);

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
  const apiBaseUrl = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : 'https://my-fleet-app-backend.onrender.com')).replace(/\/$/, '');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [fleetMapData, setFleetMapData] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [activeView, setActiveView] = useState(() => getViewFromPath(window.location.pathname));
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  function navigateTo(view, { replace = false } = {}) {
    const path = VIEW_PATHS[view] || VIEW_PATHS.login;

    if (replace) {
      window.history.replaceState({ view }, '', path);
    } else {
      window.history.pushState({ view }, '', path);
    }

    setActiveView(view);
  }

  async function fetchDashboardData() {
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
  }

  async function fetchFleetMapData() {
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
  }

  async function restoreSession() {
    const nextView = getViewFromPath(window.location.pathname);

    if (!PROTECTED_VIEWS.has(nextView)) {
      setCheckingSession(false);
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/me`, {
        credentials: 'include'
      });

      if (!response.ok) {
        setLoggedInUser(null);
        setDashboardData(null);
        setFleetMapData([]);
        setErrorMessage('');
        navigateTo('login', { replace: true });
        return;
      }

      const user = await response.json();
  const resolvedView = nextView;

      setLoggedInUser({
        fullName: user.fullName,
        email: user.email,
        role: user.role
      });

      setActiveView(resolvedView);
      await fetchDashboardData();

      if (resolvedView === 'map' || resolvedView === 'schedule-demo') {
        await fetchFleetMapData();
      }
    } catch (error) {
      setLoggedInUser(null);
      setDashboardData(null);
      setFleetMapData([]);
      setErrorMessage('');
    } finally {
      setCheckingSession(false);
    }
  }

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
    void restoreSession();
  }, []);

  async function handleLogin(event) {
    event.preventDefault();
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

      if (!response.ok) {
        setErrorMessage(data.message || 'Unable to log in.');
        return;
      }

      setLoggedInUser({
        fullName: data.fullName,
        role: data.role,
        email
      });

      navigateTo('dashboard', { replace: true });
      await fetchDashboardData();
    } catch (error) {
      setErrorMessage('Could not connect to the server.');
    }
  }

  async function handleLogout() {
    try {
      await fetch(`${apiBaseUrl}/api/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      // Ignore logout errors and clear UI locally.
    }

    setLoggedInUser(null);
    setDashboardData(null);
    setFleetMapData([]);
    setEmail('');
    setPassword('');
    navigateTo('login', { replace: true });
  }

  async function handleOpenFleetMap() {
    navigateTo('map');

    if (fleetMapData.length === 0) {
      await fetchFleetMapData();
    }
  }

  async function handleOpenFleetScheduleDemo() {
    navigateTo('schedule-demo');

    if (fleetMapData.length === 0) {
      await fetchFleetMapData();
    }
  }

  function renderDashboard() {
    const stats = dashboardData?.stats || {};
    const fleetTypes = dashboardData?.fleetTypes || [];
    const maxBarValue = Math.max(...fleetTypes.map((item) => item.count), 1);

    return (
      <div className="min-h-screen w-full bg-black text-zinc-100 antialiased">
        <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
          {!isOnline && (
            <div className="mb-6 border border-zinc-900 bg-zinc-950 px-4 py-3 text-[11px] tracking-wide text-zinc-400">
              Working offline. Live GPS map telemetry updates are temporarily paused.
            </div>
          )}

          <div className="mb-8 flex flex-col gap-6 border-b border-zinc-900 pb-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="mb-1 block text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Fleet operations dashboard</p>
              <h1 className="text-2xl font-semibold tracking-tight text-white">Welcome, {loggedInUser?.fullName}</h1>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              {loggedInUser?.role === 'admin' && (
                <button
                  onClick={() => navigateTo('admin-console')}
                  className="rounded-sm border border-emerald-500 bg-emerald-500 px-4 py-2 font-semibold text-black transition-colors duration-150 hover:bg-emerald-400"
                >
                  Admin Panel
                </button>
              )}
              <button
                onClick={handleOpenFleetMap}
                className="rounded-sm border border-zinc-800 bg-zinc-900 px-4 py-2 font-medium text-zinc-300 transition-colors duration-150 hover:border-zinc-700 hover:text-white"
              >
                Map
              </button>
              <button
                onClick={handleOpenFleetScheduleDemo}
                className="rounded-sm border border-zinc-800 bg-zinc-900 px-4 py-2 font-medium text-zinc-300 transition-colors duration-150 hover:border-zinc-700 hover:text-white"
              >
                Schedule Demo
              </button>
              <button onClick={handleLogout} className="rounded-sm px-4 py-2 text-zinc-500 transition-colors duration-150 hover:text-zinc-300">
                Logout
              </button>
            </div>
          </div>

          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3 lg:gap-6">
            <div className="rounded-sm border border-zinc-900 bg-zinc-950 p-6">
              <span className="block text-[10px] font-medium uppercase tracking-[0.3em] text-zinc-500">Assigned fleets</span>
              <div className="mt-3 text-4xl font-light tracking-tight text-white">{stats.fleetCount || 0}</div>
            </div>
            <div className="rounded-sm border border-zinc-900 bg-zinc-950 p-6">
              <span className="block text-[10px] font-medium uppercase tracking-[0.3em] text-zinc-500">Distance covered</span>
              <div className="mt-3 text-4xl font-light tracking-tight text-white">
                {Number(stats.totalDistanceKm || 0).toFixed(2)} <span className="text-xs font-normal tracking-normal text-zinc-500">km</span>
              </div>
            </div>
            <div className="rounded-sm border border-zinc-900 bg-zinc-950 p-6">
              <span className="block text-[10px] font-medium uppercase tracking-[0.3em] text-zinc-500">Average battery</span>
              <div className="mt-3 text-4xl font-light tracking-tight text-white">
                {Number(stats.averageBattery || 0).toFixed(0)}<span className="text-sm font-normal tracking-normal text-zinc-500">%</span>
              </div>
            </div>
          </div>

          <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="rounded-sm border border-zinc-900 bg-zinc-950 p-6 lg:col-span-2">
              <h3 className="mb-6 text-xs font-semibold uppercase tracking-wider text-zinc-400">Fleet type distribution</h3>
              {fleetTypes.length > 0 ? (
                <div className="flex h-56 items-end gap-6 pt-4">
                  {fleetTypes.map((item) => (
                    <div key={item.type} className="flex flex-1 flex-col items-center">
                      <div className="flex h-40 w-full items-end justify-center">
                        <div
                          style={{ height: `${Math.max((item.count / maxBarValue) * 100, 4)}%` }}
                          className="w-full max-w-[28px] rounded-t-sm bg-zinc-800 transition-colors duration-150 hover:bg-emerald-500"
                        />
                      </div>
                      <p className="mt-3 w-full truncate text-center text-[10px] uppercase tracking-wide text-zinc-500">{item.type}</p>
                      <p className="mt-1 text-xs font-semibold text-white">{item.count}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-16 text-center text-xs font-mono text-zinc-600">No fleet data is available yet. Add data to the database to see charts.</p>
              )}
            </div>

            <div className="rounded-sm border border-zinc-900 bg-zinc-950 p-6">
              <h3 className="mb-6 text-xs font-semibold uppercase tracking-wider text-zinc-400">Operational status</h3>
              <div className="flex flex-col gap-5">
                {[
                  { label: 'Idle', value: stats.idleFleets || 0, color: 'bg-zinc-800' },
                  { label: 'Active', value: stats.activeFleets || 0, color: 'bg-emerald-500' },
                  { label: 'Charging', value: stats.chargingFleets || 0, color: 'bg-zinc-600' },
                  { label: 'Maintenance', value: stats.maintenanceFleets || 0, color: 'bg-zinc-700' }
                ].map((item) => (
                  <div key={item.label} className="text-xs">
                    <div className="mb-1 flex justify-between text-[10px] font-semibold text-zinc-500">
                      <span>{item.label}</span>
                      <span className="font-bold text-white">{item.value}</span>
                    </div>
                    <div className="h-1 overflow-hidden rounded-sm bg-zinc-900">
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
      </div>
    );
  }

  if (checkingSession) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-black px-4 text-zinc-200">
        <div className="w-full max-w-md rounded-sm border border-zinc-900 bg-zinc-950 p-8 text-center">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Fleet Management PWA</p>
          <h2 className="text-lg font-semibold tracking-tight text-white">Restoring your session</h2>
          <p className="mt-3 text-sm text-zinc-400">Reloading the current page view and verifying your login state.</p>
        </div>
      </div>
    );
  }

  if (loggedInUser && activeView === 'map') {
    return (
      <div className="min-h-screen w-full bg-black px-4 py-6 text-zinc-100 antialiased sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
          <div className="flex flex-col justify-between gap-4 border-b border-zinc-900 pb-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-white uppercase">Fleet map</h2>
              <p className="mt-1 text-xs text-zinc-500">Hover over a dot to see fleet details.</p>
            </div>
            <button
              onClick={() => navigateTo('dashboard')}
              className="rounded-sm border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-300 transition-colors duration-150 hover:border-zinc-700 hover:text-white"
            >
              Back to dashboard
            </button>
          </div>
          <FleetMap fleets={fleetMapData} />
        </div>
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
    return <AdminConsole apiBaseUrl={apiBaseUrl} onBack={() => navigateTo('dashboard')} />;
  }

  if (loggedInUser) {
    return renderDashboard();
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-black p-4 text-zinc-200">
      <div className="w-full max-w-[420px] rounded-sm border border-zinc-900 bg-zinc-950 p-8 shadow-2xl">
        <div className="mb-8 border-b border-zinc-900 pb-4">
          <h2 className="text-lg font-semibold tracking-tight text-white uppercase">Login</h2>
        </div>

        {errorMessage && <p className="mb-4 rounded-sm border border-red-950 bg-red-950/20 p-3 text-xs text-red-400">{errorMessage}</p>}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-zinc-500">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full rounded-sm border border-zinc-800 bg-black p-3 text-sm text-white transition-colors focus:border-zinc-700 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-zinc-500">Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="w-full rounded-sm border border-zinc-800 bg-black p-3 text-sm text-white transition-colors focus:border-zinc-700 focus:outline-none"
            />
          </div>

          <button type="submit" className="mt-2 w-full rounded-sm bg-emerald-500 py-3 text-xs font-bold uppercase tracking-widest text-black transition-colors duration-200 hover:bg-emerald-400">
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;