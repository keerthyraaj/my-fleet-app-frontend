import { useEffect } from 'react';
import { CircleMarker, MapContainer, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';

import 'leaflet/dist/leaflet.css';

function FitBounds({ fleets }) {
  const map = useMap();

  useEffect(() => {
    if (!fleets.length) {
      return;
    }

    const bounds = L.latLngBounds(fleets.map((fleet) => [fleet.lat, fleet.long]));
    map.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });

    const frameId = window.requestAnimationFrame(() => {
      map.invalidateSize();
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [fleets, map]);

  return null;
}

function statusColor(status) {
  switch (status) {
    case 'active':
      return '#10b981';
    case 'idle':
      return '#f59e0b';
    case 'charging':
      return '#3b82f6';
    case 'maintenance':
      return '#ef4444';
    default:
      return '#71717a';
  }
}

function DashboardActiveMap({ fleets }) {
  if (!fleets.length) {
    return (
      <div className="flex h-[360px] w-full items-center justify-center rounded-sm border border-zinc-900 bg-black text-sm text-zinc-500">
        No active fleet locations available right now.
      </div>
    );
  }

  return (
    <div className="h-[360px] w-full overflow-hidden rounded-sm border border-zinc-900 bg-black">
      <MapContainer
        center={[fleets[0].lat, fleets[0].long]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors &copy; CARTO"
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          maxZoom={20}
        />

        <FitBounds fleets={fleets} />

        {fleets.map((fleet) => (
          <CircleMarker
            key={fleet.fleet_id}
            center={[fleet.lat, fleet.long]}
            radius={7}
            pathOptions={{
              color: statusColor(fleet.current_status),
              fillColor: statusColor(fleet.current_status),
              fillOpacity: 0.9,
              weight: 2
            }}
          >
            <Tooltip direction="top">
              <div>
                <strong>{fleet.vehicle_type}</strong>
                <br />
                Status: {fleet.current_status}
                <br />
                Battery: {fleet.battery_life_percentage}%
              </div>
            </Tooltip>
            <Popup>
              <div>
                <strong>Fleet {fleet.fleet_id.slice(0, 8)}</strong>
                <br />
                Last position: {fleet.current_ts ? new Date(fleet.current_ts).toLocaleString() : 'Unknown'}
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}

export default DashboardActiveMap;
