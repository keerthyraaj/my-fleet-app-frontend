// src/App.jsx
import React, { useEffect, useState } from 'react';
import FleetMap from './FleetMap';
import FleetScheduleDemo from './FleetScheduleDemo';
import AdminConsole from './AdminConsole';
import DashboardPanel from './DashboardPanel';
import AppMenuBar from './AppMenuBar';
import { BrandMark } from './AppBrand';

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
  const [insightsData, setInsightsData] = useState(null);
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

  async function fetchDashboardInsights() {
    try {
      const response = await fetch(`${apiBaseUrl}/api/dashboard/insights`, {
        credentials: 'include'
      });
      const data = await response.json();

      if (response.ok) {
        setInsightsData(data);
      } else {
        setInsightsData(null);
      }
    } catch (error) {
      setInsightsData(null);
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
        setInsightsData(null);
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
      await Promise.all([fetchDashboardData(), fetchDashboardInsights()]);

      if (resolvedView === 'map' || resolvedView === 'schedule-demo') {
        await fetchFleetMapData();
      }
    } catch (error) {
      setLoggedInUser(null);
      setDashboardData(null);
      setInsightsData(null);
      setFleetMapData([]);
      setErrorMessage('');
    } finally {
      setCheckingSession(false);
    }
  }

  async function syncRouteFromLocation() {
    const nextView = getViewFromPath(window.location.pathname);

    if (!PROTECTED_VIEWS.has(nextView)) {
      setActiveView('login');
      setLoggedInUser(null);
      setDashboardData(null);
      setInsightsData(null);
      setFleetMapData([]);
      setErrorMessage('');
      return;
    }

    if (!loggedInUser) {
      await restoreSession();
      return;
    }

    setActiveView(nextView);

    if (nextView === 'map' || nextView === 'schedule-demo') {
      if (fleetMapData.length === 0) {
        await fetchFleetMapData();
      }
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
      void syncRouteFromLocation();
    };

    const handlePageShow = () => {
      void syncRouteFromLocation();
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [fleetMapData.length, loggedInUser]);

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
      await Promise.all([fetchDashboardData(), fetchDashboardInsights()]);
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
    setInsightsData(null);
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
    const menuActions = [
      {
        key: 'admin-console',
        label: 'Admin Console',
        onClick: () => navigateTo('admin-console'),
        active: activeView === 'admin-console',
        hidden: loggedInUser?.role !== 'admin'
      },
      {
        key: 'live-status',
        label: 'Live Status',
        onClick: handleOpenFleetMap,
        active: activeView === 'map'
      },
      {
        key: 'route-simulation',
        label: 'Route Stimulation',
        onClick: handleOpenFleetScheduleDemo,
        active: activeView === 'schedule-demo'
      },
      {
        key: 'logout',
        label: 'Logout',
        onClick: handleLogout,
        active: false
      }
    ];

    return (
      <DashboardPanel
        loggedInUser={loggedInUser}
        isOnline={isOnline}
        dashboardData={dashboardData}
        insightsData={insightsData}
        menuActions={menuActions}
      />
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
    const menuActions = [
      {
        key: 'admin-console',
        label: 'Admin Console',
        onClick: () => navigateTo('admin-console'),
        active: false,
        hidden: loggedInUser?.role !== 'admin'
      },
      {
        key: 'live-status',
        label: 'Live Status',
        onClick: handleOpenFleetMap,
        active: true
      },
      {
        key: 'route-simulation',
        label: 'Route Stimulation',
        onClick: handleOpenFleetScheduleDemo,
        active: false
      },
      {
        key: 'back-dashboard',
        label: 'Back to Dashboard',
        onClick: () => navigateTo('dashboard'),
        active: false
      }
    ];

    return (
      <div className="min-h-screen w-full bg-black text-zinc-100 antialiased">
        <AppMenuBar
          leftContent={<BrandMark showTitle />}
          actions={menuActions}
        />
        <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
          <FleetMap fleets={fleetMapData} />
        </div>
      </div>
    );
  }

  if (loggedInUser && activeView === 'schedule-demo') {
    const menuActions = [
      {
        key: 'admin-console',
        label: 'Admin Console',
        onClick: () => navigateTo('admin-console'),
        active: false,
        hidden: loggedInUser?.role !== 'admin'
      },
      {
        key: 'live-status',
        label: 'Live Status',
        onClick: handleOpenFleetMap,
        active: false
      },
      {
        key: 'route-simulation',
        label: 'Route Stimulation',
        onClick: handleOpenFleetScheduleDemo,
        active: true
      },
      {
        key: 'back-dashboard',
        label: 'Back to Dashboard',
        onClick: () => navigateTo('dashboard'),
        active: false
      }
    ];

    return (
      <FleetScheduleDemo
        fleets={fleetMapData}
        apiBaseUrl={apiBaseUrl}
        menuActions={menuActions}
      />
    );
  }

  if (loggedInUser && activeView === 'admin-console') {
    const menuActions = [
      {
        key: 'admin-console',
        label: 'Admin Console',
        onClick: () => navigateTo('admin-console'),
        active: true,
        hidden: loggedInUser?.role !== 'admin'
      },
      {
        key: 'live-status',
        label: 'Live Status',
        onClick: handleOpenFleetMap,
        active: false
      },
      {
        key: 'route-simulation',
        label: 'Route Stimulation',
        onClick: handleOpenFleetScheduleDemo,
        active: false
      },
      {
        key: 'back-dashboard',
        label: 'Back to Dashboard',
        onClick: () => navigateTo('dashboard'),
        active: false
      }
    ];

    return <AdminConsole apiBaseUrl={apiBaseUrl} menuActions={menuActions} />;
  }

  if (loggedInUser) {
    return renderDashboard();
  }

  return (
    <div className="min-h-screen w-full bg-black text-zinc-200">
      <AppMenuBar leftContent={<BrandMark showTitle />} actions={[]} />

      <div className="flex w-full items-center justify-center p-4 pt-10">
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
    </div>
  );
}

export default App;