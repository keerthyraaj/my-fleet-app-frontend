// src/App.jsx
import React, { useEffect, useState } from 'react';
import FleetMap from './FleetMap';
import FleetScheduleDemo from './FleetScheduleDemo';
import AdminConsole from './AdminConsole';
import DashboardPanel from './DashboardPanel';
import MaintenanceCenter from './MaintenanceCenter';
import AppMenuBar from './AppMenuBar';
import { BrandMark } from './AppBrand';

const VIEW_PATHS = {
  login: '/login',
  dashboard: '/dashboard',
  map: '/map',
  'schedule-demo': '/schedule-demo',
  'maintenance-center': '/maintenance-center',
  'admin-console': '/admin-console'
};

const PROTECTED_VIEWS = new Set(['dashboard', 'map', 'schedule-demo', 'maintenance-center', 'admin-console']);

const QUICK_LOGIN_OPTIONS = [
  {
    key: 'admin',
    title: 'Admin Access',
    email: 'amit.sharma@example.com',
    password: 'password123',
    buttonLabel: 'Login as Admin'
  },
  {
    key: 'operator',
    title: 'Operator Access',
    email: 'gaurav.gupta@example.com',
    password: 'password123',
    buttonLabel: 'Login as Operator'
  }
];

function getViewFromPath(pathname) {
  switch (pathname) {
    case '/dashboard':
      return 'dashboard';
    case '/map':
      return 'map';
    case '/schedule-demo':
      return 'schedule-demo';
    case '/maintenance-center':
      return 'maintenance-center';
    case '/admin-console':
      return 'admin-console';
    case '/':
    case '/login':
    default:
      return 'login';
  }
}

function App() {
  const configuredApiUrl = (import.meta.env.VITE_API_URL || '').trim();
  const allowDirectApiInProd = import.meta.env.VITE_ALLOW_DIRECT_API_IN_PROD === 'true';
  const useSameOriginApi = import.meta.env.PROD && !allowDirectApiInProd;
  const apiBaseUrl = useSameOriginApi ? '' : configuredApiUrl.replace(/\/$/, '');

  if (useSameOriginApi) {
    console.warn('[App] Production is using same-origin /api requests via proxy.', {
      allowDirectApiInProd,
      mode: import.meta.env.MODE
    });
  } else if (!configuredApiUrl) {
    console.warn('[App] VITE_API_URL is not configured. Using same-origin /api requests.', {
      requestBase: '/api',
      mode: import.meta.env.MODE
    });
  }

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

  async function readJsonBody(response, endpoint) {
    try {
      return await response.json();
    } catch (error) {
      console.error('[API] Failed to parse JSON response.', {
        endpoint,
        status: response.status,
        statusText: response.statusText,
        error
      });
      return null;
    }
  }

  async function fetchDashboardData() {
    setIsLoading(true);

    try {
      const response = await fetch(`${apiBaseUrl}/api/dashboard/stats`, {
        credentials: 'include'
      });
      const data = await readJsonBody(response, '/api/dashboard/stats');

      if (response.ok) {
        setDashboardData(data);
      } else {
        console.error('[Dashboard] Failed to fetch stats.', {
          endpoint: '/api/dashboard/stats',
          status: response.status,
          statusText: response.statusText,
          responseData: data
        });
        setDashboardData(null);
      }
    } catch (error) {
      console.error('[Dashboard] Network/CORS error while fetching stats.', {
        endpoint: '/api/dashboard/stats',
        apiBaseUrl,
        isOnline: navigator.onLine,
        error
      });
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
      const data = await readJsonBody(response, '/api/fleets');

      if (response.ok) {
        setFleetMapData(data.fleets || []);
      } else {
        console.error('[FleetMap] Failed to fetch fleets.', {
          endpoint: '/api/fleets',
          status: response.status,
          statusText: response.statusText,
          responseData: data
        });
        setFleetMapData([]);
      }
    } catch (error) {
      console.error('[FleetMap] Network/CORS error while fetching fleets.', {
        endpoint: '/api/fleets',
        apiBaseUrl,
        isOnline: navigator.onLine,
        error
      });
      setFleetMapData([]);
    }
  }

  async function fetchDashboardInsights() {
    try {
      const response = await fetch(`${apiBaseUrl}/api/dashboard/insights`, {
        credentials: 'include'
      });
      const data = await readJsonBody(response, '/api/dashboard/insights');

      if (response.ok) {
        setInsightsData(data);
      } else {
        console.error('[Dashboard] Failed to fetch insights.', {
          endpoint: '/api/dashboard/insights',
          status: response.status,
          statusText: response.statusText,
          responseData: data
        });
        setInsightsData(null);
      }
    } catch (error) {
      console.error('[Dashboard] Network/CORS error while fetching insights.', {
        endpoint: '/api/dashboard/insights',
        apiBaseUrl,
        isOnline: navigator.onLine,
        error
      });
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
        console.error('[Auth] Session restore failed.', {
          endpoint: '/api/auth/me',
          status: response.status,
          statusText: response.statusText,
          apiBaseUrl
        });
        setLoggedInUser(null);
        setDashboardData(null);
        setInsightsData(null);
        setFleetMapData([]);
        setErrorMessage('');
        navigateTo('login', { replace: true });
        return;
      }

      const user = await readJsonBody(response, '/api/auth/me');

      if (!user) {
        setLoggedInUser(null);
        setDashboardData(null);
        setInsightsData(null);
        setFleetMapData([]);
        setErrorMessage('');
        navigateTo('login', { replace: true });
        return;
      }
      const resolvedView = nextView;

      setLoggedInUser({
        fullName: user.fullName,
        email: user.email,
        role: user.role
      });

      setActiveView(resolvedView);
      await Promise.all([fetchDashboardData(), fetchDashboardInsights()]);

      if (resolvedView === 'map' || resolvedView === 'schedule-demo' || resolvedView === 'maintenance-center') {
        await fetchFleetMapData();
      }
    } catch (error) {
      console.error('[Auth] Network/CORS error while restoring session.', {
        endpoint: '/api/auth/me',
        apiBaseUrl,
        isOnline: navigator.onLine,
        error
      });
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

    if (nextView === 'map' || nextView === 'schedule-demo' || nextView === 'maintenance-center') {
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
    const initializeSession = async () => {
      try {
        await restoreSession();
      } catch (error) {
        console.error('[App] Unhandled error during initial data fetch.', {
          apiBaseUrl,
          isOnline: navigator.onLine,
          error
        });
      }
    };

    void initializeSession();
  }, []);

  async function submitLogin(nextEmail, nextPassword) {
    setErrorMessage('');
    setDashboardData(null);
    setIsLoading(true);

    try {
      const response = await fetch(`${apiBaseUrl}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: nextEmail, password: nextPassword })
      });

      const data = await readJsonBody(response, '/api/login');

      if (!response.ok) {
        setErrorMessage(data?.message || 'Unable to log in.');
        console.error('[Auth] Login failed.', {
          endpoint: '/api/login',
          status: response.status,
          statusText: response.statusText,
          responseData: data
        });
        return;
      }

      setLoggedInUser({
        fullName: data.fullName,
        role: data.role,
        email: nextEmail
      });

      navigateTo('dashboard', { replace: true });
      await Promise.all([fetchDashboardData(), fetchDashboardInsights()]);
    } catch (error) {
      setErrorMessage('Could not connect to the server.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    await submitLogin(email, password);
  }

  async function handleQuickLogin(nextEmail, nextPassword) {
    setEmail(nextEmail);
    setPassword(nextPassword);
    await submitLogin(nextEmail, nextPassword);
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

  async function handleOpenMaintenanceCenter() {
    navigateTo('maintenance-center');

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
        key: 'route-stimulation',
        label: 'Route Stimulation',
        onClick: handleOpenFleetScheduleDemo,
        active: activeView === 'schedule-demo'
      },
      {
        key: 'maintenance-center',
        label: 'Maintenance Center',
        onClick: handleOpenMaintenanceCenter,
        active: activeView === 'maintenance-center'
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
        key: 'route-stimulation',
        label: 'Route Stimulation',
        onClick: handleOpenFleetScheduleDemo,
        active: false
      },
      {
        key: 'maintenance-center',
        label: 'Maintenance Center',
        onClick: handleOpenMaintenanceCenter,
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
        key: 'route-stimulation',
        label: 'Route Stimulation',
        onClick: handleOpenFleetScheduleDemo,
        active: true
      },
      {
        key: 'maintenance-center',
        label: 'Maintenance Center',
        onClick: handleOpenMaintenanceCenter,
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
      <FleetScheduleDemo
        fleets={fleetMapData}
        apiBaseUrl={apiBaseUrl}
        menuActions={menuActions}
      />
    );
  }

  if (loggedInUser && activeView === 'maintenance-center') {
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
        key: 'route-stimulation',
        label: 'Route Stimulation',
        onClick: handleOpenFleetScheduleDemo,
        active: false
      },
      {
        key: 'maintenance-center',
        label: 'Maintenance Center',
        onClick: handleOpenMaintenanceCenter,
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
      <MaintenanceCenter
        fleets={fleetMapData}
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
        key: 'route-stimulation',
        label: 'Route Stimulation',
        onClick: handleOpenFleetScheduleDemo,
        active: false
      },
      {
        key: 'maintenance-center',
        label: 'Maintenance Center',
        onClick: handleOpenMaintenanceCenter,
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

  const loginCardClassName = 'w-full rounded-sm border border-zinc-900 bg-zinc-950 p-8 shadow-2xl';
  const readOnlyInputClassName = 'w-full rounded-sm border border-zinc-800 bg-white/10 p-3 text-sm text-zinc-200';

  return (
    <div className="min-h-screen w-full bg-black text-zinc-200">
      <AppMenuBar leftContent={<BrandMark showTitle />} actions={[]} />

      <div className="mx-auto w-full max-w-[1500px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-[1080px] gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1.25fr)]">
          <div className={loginCardClassName}>
            <div className="mb-8 border-b border-zinc-900 pb-4">
              <h2 className="text-lg font-semibold tracking-tight text-white uppercase">Secure Login</h2>
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

              <button
                type="submit"
                disabled={isLoading}
                className="mt-2 w-full rounded-sm bg-emerald-500 py-3 text-xs font-bold uppercase tracking-widest text-black transition-colors duration-200 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-500/70"
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </button>
            </form>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {QUICK_LOGIN_OPTIONS.map((option) => (
              <section key={option.key} className={loginCardClassName}>
                <div className="mb-8 border-b border-zinc-900 pb-4">
                  <h2 className="text-lg font-semibold tracking-tight text-white uppercase">{option.title}</h2>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-zinc-500">Email</label>
                    <input type="text" value={option.email} readOnly className={readOnlyInputClassName} />
                  </div>

                  <div>
                    <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-zinc-500">Password</label>
                    <input type="text" value={option.password} readOnly className={readOnlyInputClassName} />
                  </div>

                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => void handleQuickLogin(option.email, option.password)}
                    className="mt-2 w-full rounded-sm bg-emerald-500 py-3 text-xs font-bold uppercase tracking-widest text-black transition-colors duration-200 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-500/70"
                  >
                    {isLoading ? 'Logging in...' : option.buttonLabel}
                  </button>
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
