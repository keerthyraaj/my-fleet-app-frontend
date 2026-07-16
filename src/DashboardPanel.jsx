import React, { useMemo, useState } from 'react';
import DashboardActiveMap from './DashboardActiveMap';
import AppMenuBar from './AppMenuBar';
import { BrandMark } from './AppBrand';

function formatDateTime(value) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString();
}

function formatDay(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { weekday: 'short' });
}

function statusBadgeClass(status) {
  switch (status) {
    case 'active':
      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    case 'idle':
      return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    case 'charging':
      return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
    case 'maintenance':
      return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
    default:
      return 'bg-zinc-700/20 text-zinc-300 border-zinc-700/40';
  }
}

function DashboardPanel({
  loggedInUser,
  isOnline,
  dashboardData,
  insightsData,
  menuActions
}) {
  const stats = dashboardData?.stats || {};
  const fleetTypes = dashboardData?.fleetTypes || [];
  const insights = insightsData || {};
  const batteryDistribution = insights.batteryDistribution || [];
  const utilizationTrend = insights.utilizationTrend || [];
  const activeFleetLocations = insights.activeFleetLocations || [];
  const recentSchedules = insights.recentSchedules || [];
  const performanceScores = insights.performanceScores || [];
  const lowBatteryAlerts = insights.lowBatteryAlerts || [];
  const fleetRows = insights.fleetRows || [];

  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState('last_ping_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  const maxFleetTypeBar = Math.max(...fleetTypes.map((item) => item.count), 1);
  const maxBatteryBucket = Math.max(...batteryDistribution.map((item) => item.count), 1);
  const maxUtilization = Math.max(...utilizationTrend.map((item) => item.activeHours), 1);
  const maxPerformanceDistance = Math.max(...performanceScores.map((item) => item.distance_covered_km), 1);

  const filteredRows = useMemo(() => {
    const rows = statusFilter === 'all' ? fleetRows : fleetRows.filter((row) => row.current_status === statusFilter);

    const sorted = [...rows].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (aValue === bValue) {
        return 0;
      }

      const aDate = sortField.includes('at') ? new Date(aValue || 0).getTime() : null;
      const bDate = sortField.includes('at') ? new Date(bValue || 0).getTime() : null;

      const comparableA = aDate !== null && !Number.isNaN(aDate) ? aDate : aValue;
      const comparableB = bDate !== null && !Number.isNaN(bDate) ? bDate : bValue;

      if (comparableA < comparableB) {
        return sortDirection === 'asc' ? -1 : 1;
      }

      return sortDirection === 'asc' ? 1 : -1;
    });

    return sorted;
  }, [fleetRows, sortDirection, sortField, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const paginatedRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortField(field);
    setSortDirection('desc');
  };

  return (
    <div className="min-h-screen w-full bg-black text-zinc-100 antialiased">
      <AppMenuBar
        leftContent={<BrandMark showTitle />}
        actions={menuActions}
      />

      <div className="mx-auto flex min-h-screen w-full max-w-[1500px] flex-col px-4 py-6 sm:px-6 lg:px-8">
        {!isOnline && (
          <div className="mb-6 border border-zinc-900 bg-zinc-950 px-4 py-3 text-sm text-zinc-400">
            Working offline. Live telemetry updates are temporarily paused.
          </div>
        )}

        <div className="mb-8 border-b border-zinc-900 pb-6">
          <div>
            <p className="mb-2 block text-xs font-bold uppercase tracking-[0.3em] text-zinc-500">Fleet operations dashboard</p>
            <h1 className="text-2xl font-semibold tracking-tight text-white">Welcome, {loggedInUser?.fullName}</h1>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-sm border border-zinc-900 bg-zinc-950 p-6">
            <span className="block text-xs font-medium uppercase tracking-[0.3em] text-zinc-500">Assigned fleets</span>
            <div className="mt-4 text-5xl font-light tracking-tight text-white">{stats.fleetCount || 0}</div>
          </div>
          <div className="rounded-sm border border-zinc-900 bg-zinc-950 p-6">
            <span className="block text-xs font-medium uppercase tracking-[0.3em] text-zinc-500">Distance covered</span>
            <div className="mt-4 text-5xl font-light tracking-tight text-white">
              {Number(stats.totalDistanceKm || 0).toFixed(2)} <span className="text-lg font-normal tracking-normal text-zinc-500">km</span>
            </div>
          </div>
          <div className="rounded-sm border border-zinc-900 bg-zinc-950 p-6">
            <span className="block text-xs font-medium uppercase tracking-[0.3em] text-zinc-500">Average battery</span>
            <div className="mt-4 text-5xl font-light tracking-tight text-white">
              {Number(stats.averageBattery || 0).toFixed(0)}<span className="text-lg font-normal tracking-normal text-zinc-500">%</span>
            </div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="rounded-sm border border-zinc-900 bg-zinc-950 p-5 xl:col-span-6">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-300">Active fleet locations</h3>
            <DashboardActiveMap fleets={activeFleetLocations} />
          </div>

          <div className="rounded-sm border border-zinc-900 bg-zinc-950 p-5 xl:col-span-3">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-300">Fleet type distribution</h3>
            <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-zinc-500">Categorical color + direct labels + visual refinement</p>
            {fleetTypes.length > 0 ? (
              <div className="flex h-[360px] items-end gap-4">
                {fleetTypes.map((item, index) => {
                  const colorPalette = ['#56d9c7', '#f8a46b', '#ad7cf5', '#8ad36b', '#5ea1ff', '#f074a1'];
                  const barColor = colorPalette[index % colorPalette.length];

                  return (
                  <div key={item.type} className="flex flex-1 flex-col items-center">
                    <div className="flex h-[300px] w-full items-end justify-center">
                      <div
                        style={{ height: `${Math.max((item.count / maxFleetTypeBar) * 100, 5)}%` }}
                        className="group relative flex w-full max-w-[52px] items-start justify-center rounded-t-md border border-white/30 pt-3 text-white shadow-[0_0_18px_rgba(255,255,255,0.12)] transition-transform duration-150 hover:-translate-y-1"
                      >
                        <div
                          className="absolute inset-0 rounded-t-md"
                          style={{ background: `linear-gradient(180deg, ${barColor}, rgba(17,24,39,0.92))` }}
                        />
                        <span className="relative z-10 text-2xl font-bold leading-none">{item.count}</span>
                      </div>
                    </div>
                    <p className="mt-2 w-full truncate text-center text-xs uppercase text-zinc-400">{item.type}</p>
                  </div>
                );
                })}
              </div>
            ) : (
              <p className="text-sm text-zinc-500">No data available.</p>
            )}
          </div>

          <div className="rounded-sm border border-zinc-900 bg-zinc-950 p-5 xl:col-span-3">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-300">Battery health distribution</h3>
            {batteryDistribution.length > 0 ? (
              <div className="space-y-3">
                {batteryDistribution.map((item) => (
                  <div key={item.label}>
                    <div className="mb-1 flex items-center justify-between text-xs text-zinc-400">
                      <span>{item.label}</span>
                      <span className="font-semibold text-white">{item.count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-sm bg-zinc-900">
                      <div
                        style={{ width: `${Math.max((item.count / maxBatteryBucket) * 100, item.count > 0 ? 6 : 0)}%` }}
                        className="h-full bg-emerald-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-500">No battery data available.</p>
            )}

            <div className="mt-8">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Low battery alerts (&lt;20%)</h4>
              {lowBatteryAlerts.length === 0 ? (
                <p className="text-sm text-zinc-500">No immediate charging alerts.</p>
              ) : (
                <div className="space-y-2">
                  {lowBatteryAlerts.slice(0, 5).map((alert) => (
                    <div key={alert.fleet_id} className="rounded-sm border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-zinc-100">{alert.vehicle_type}</span>
                        <span className="font-bold text-rose-300">{alert.battery_life_percentage}%</span>
                      </div>
                      <p className="mt-1 text-zinc-400">Fleet {alert.fleet_id.slice(0, 8)} • {alert.current_status}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="rounded-sm border border-zinc-900 bg-zinc-950 p-5 xl:col-span-5">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-300">Fleet utilization trend (7 days)</h3>
            {utilizationTrend.length > 0 ? (
              <div className="space-y-3">
                {utilizationTrend.map((point) => (
                  <div key={point.day}>
                    <div className="mb-1 flex items-center justify-between text-xs text-zinc-400">
                      <span>{formatDay(point.day)}</span>
                      <span className="font-semibold text-white">{point.activeHours.toFixed(1)} h</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-sm bg-zinc-900">
                      <div
                        className="h-full bg-emerald-500"
                        style={{ width: `${Math.max((point.activeHours / maxUtilization) * 100, point.activeHours > 0 ? 4 : 0)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-500">No utilization trend available.</p>
            )}
          </div>

          <div className="rounded-sm border border-zinc-900 bg-zinc-950 p-5 xl:col-span-7">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-300">Fleet performance score</h3>
            {performanceScores.length > 0 ? (
              <div className="space-y-3">
                {performanceScores.slice(0, 8).map((fleet) => (
                  <div key={fleet.fleet_id}>
                    <div className="mb-1 flex items-center justify-between text-xs text-zinc-400">
                      <span className="uppercase">{fleet.vehicle_type} ({fleet.fleet_id.slice(0, 8)})</span>
                      <span className="font-semibold text-white">{fleet.distance_covered_km.toFixed(2)} km</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-sm bg-zinc-900">
                      <div
                        className="h-full bg-emerald-500"
                        style={{ width: `${Math.max((fleet.distance_covered_km / maxPerformanceDistance) * 100, fleet.distance_covered_km > 0 ? 4 : 0)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-500">No performance data available.</p>
            )}
          </div>
        </div>

        <div className="rounded-sm border border-zinc-900 bg-zinc-950 p-5">
          <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">Recent schedules and fleet status</h3>
            <div className="flex flex-wrap gap-2">
              {['all', 'active', 'idle', 'charging', 'maintenance'].map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusFilter(status)}
                  className={`rounded-sm border px-3 py-1 text-xs font-medium uppercase tracking-wide transition-colors ${
                    statusFilter === status
                      ? 'border-emerald-500 bg-emerald-500 text-black'
                      : 'border-zinc-800 bg-black text-zinc-300 hover:border-zinc-700 hover:text-white'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto rounded-sm border border-zinc-900">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead className="bg-zinc-950 text-xs uppercase tracking-[0.2em] text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Fleet ID</th>
                  <th className="px-4 py-3">Vehicle Type</th>
                  <th className="px-4 py-3">
                    <button onClick={() => handleSort('current_status')} className="hover:text-zinc-300">Status</button>
                  </th>
                  <th className="px-4 py-3">Battery</th>
                  <th className="px-4 py-3">
                    <button onClick={() => handleSort('distance_covered_km')} className="hover:text-zinc-300">Distance</button>
                  </th>
                  <th className="px-4 py-3">
                    <button onClick={() => handleSort('last_ping_at')} className="hover:text-zinc-300">Last Ping</button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedRows.map((fleet) => (
                  <tr key={fleet.fleet_id} className="border-t border-zinc-900 bg-black/40">
                    <td className="px-4 py-3 font-mono text-xs text-zinc-300">{fleet.fleet_id.slice(0, 8)}</td>
                    <td className="px-4 py-3 uppercase text-zinc-300">{fleet.vehicle_type}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-sm border px-2 py-1 text-xs font-semibold uppercase ${statusBadgeClass(fleet.current_status)}`}>
                        {fleet.current_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-200">{fleet.battery_life_percentage}%</td>
                    <td className="px-4 py-3 text-zinc-200">{Number(fleet.distance_covered_km || 0).toFixed(2)} km</td>
                    <td className="px-4 py-3 text-zinc-400">{formatDateTime(fleet.last_ping_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-zinc-400">
            <span>
              Showing {paginatedRows.length} of {filteredRows.length} fleets
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="rounded-sm border border-zinc-800 bg-black px-3 py-1 disabled:opacity-40"
              >
                Prev
              </button>
              <span>
                Page {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="rounded-sm border border-zinc-800 bg-black px-3 py-1 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>

          <div className="mt-8">
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Recent operational history</h4>
            <div className="overflow-x-auto rounded-sm border border-zinc-900">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead className="bg-zinc-950 text-xs uppercase tracking-[0.2em] text-zinc-500">
                  <tr>
                    <th className="px-4 py-3">Schedule</th>
                    <th className="px-4 py-3">Fleet</th>
                    <th className="px-4 py-3">Start</th>
                    <th className="px-4 py-3">End</th>
                    <th className="px-4 py-3">Speed</th>
                    <th className="px-4 py-3">Distance</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSchedules.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-4 text-zinc-500">No recent schedule history found.</td>
                    </tr>
                  ) : (
                    recentSchedules.map((schedule) => (
                      <tr key={schedule.schedule_id} className="border-t border-zinc-900 bg-black/40">
                        <td className="px-4 py-3 text-zinc-200">#{schedule.schedule_id}</td>
                        <td className="px-4 py-3 uppercase text-zinc-300">{schedule.vehicle_type} ({schedule.fleet_id.slice(0, 8)})</td>
                        <td className="px-4 py-3 text-zinc-400">{formatDateTime(schedule.start_time)}</td>
                        <td className="px-4 py-3 text-zinc-400">{formatDateTime(schedule.end_time)}</td>
                        <td className="px-4 py-3 text-zinc-200">{Number(schedule.speed_kmh || 0).toFixed(2)} km/h</td>
                        <td className="px-4 py-3 text-zinc-200">{Number(schedule.route_distance_km || 0).toFixed(2)} km</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPanel;
