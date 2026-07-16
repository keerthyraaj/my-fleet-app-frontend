import { useEffect, useState } from 'react';
import { CircleMarker, MapContainer, Popup, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import AppMenuBar from './AppMenuBar';
import { BrandMark } from './AppBrand';

import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';

function formatTimestamp(value) {
  if (!value) {
    return 'Not available';
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? 'Not available' : date.toLocaleString();
}

function calculateRouteDistanceKm(coordinates) {
  if (!coordinates || coordinates.length < 2) {
    return 0;
  }

  const toRad = (value) => (value * Math.PI) / 180;
  let distanceKm = 0;

  for (let index = 1; index < coordinates.length; index += 1) {
    const [lat1, lon1] = coordinates[index - 1];
    const [lat2, lon2] = coordinates[index];
    const earthRadiusKm = 6371;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    distanceKm += earthRadiusKm * c;
  }

  return distanceKm;
}

function RouteDemoLayer({ schedule, selectedFleet }) {
  const map = useMap();
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [routeDistanceKm, setRouteDistanceKm] = useState(0);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [routeRequestId, setRouteRequestId] = useState(0);

  const handleRouteClick = () => {
    if (!schedule) {
      return;
    }

    const start = [schedule.start_lat, schedule.start_long];
    setRouteCoordinates([]);
    setRouteDistanceKm(0);
    setCurrentPosition(start);
    setIsAnimating(false);
    setRouteRequestId((previousId) => previousId + 1);
  };

  useEffect(() => {
    if (!schedule || !map || routeRequestId === 0) {
      return undefined;
    }

    const start = [schedule.start_lat, schedule.start_long];
    const end = [schedule.end_lat, schedule.end_long];

    const routingControl = L.Routing.control({
      waypoints: [L.latLng(start[0], start[1]), L.latLng(end[0], end[1])],
      router: L.Routing.osrmv1({
        serviceUrl: 'https://router.project-osrm.org/route/v1',
      }),
      lineOptions: {
        styles: [{ color: '#10b981', weight: 4, opacity: 0.85 }],
      },
      show: false,
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      createMarker: () => null,
    }).addTo(map);

    routingControl.on('routesfound', (event) => {
      const route = event.routes?.[0];

      if (route?.coordinates?.length) {
        const coordinates = route.coordinates.map((coordinate) => [coordinate.lat, coordinate.lng]);
        setRouteCoordinates(coordinates);
        setRouteDistanceKm(calculateRouteDistanceKm(coordinates));
        setCurrentPosition(coordinates[0]);
        setIsAnimating(true);
      }
    });

    routingControl.on('routingerror', () => {
      setRouteCoordinates([]);
      setRouteDistanceKm(0);
      setCurrentPosition(start);
      setIsAnimating(false);
    });

    return () => {
      routingControl.off('routesfound');
      routingControl.off('routingerror');
      map.removeControl(routingControl);
    };
  }, [map, routeRequestId, schedule?.schedule_id]);

  useEffect(() => {
    if (!isAnimating || routeCoordinates.length < 2) {
      return undefined;
    }

    let cancelled = false;
    let startTime = null;
    const durationMs = Math.max(4000, routeCoordinates.length * 70);

    const animate = (timestamp) => {
      if (cancelled) {
        return;
      }

      if (startTime === null) {
        startTime = timestamp;
      }

      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const pointIndex = Math.min(Math.floor(progress * (routeCoordinates.length - 1)), routeCoordinates.length - 2);
      const localProgress = progress * (routeCoordinates.length - 1) - pointIndex;
      const from = routeCoordinates[pointIndex];
      const to = routeCoordinates[pointIndex + 1];

      setCurrentPosition([
        from[0] + (to[0] - from[0]) * localProgress,
        from[1] + (to[1] - from[1]) * localProgress,
      ]);

      if (progress < 1) {
        window.requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };

    const frameId = window.requestAnimationFrame(animate);

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frameId);
    };
  }, [isAnimating, routeCoordinates]);

  if (!schedule) {
    return null;
  }

  return (
    <>
      {routeCoordinates.length > 1 && (
        <Polyline
          positions={routeCoordinates}
          pathOptions={{ color: '#10b981', weight: 4, opacity: 0.85 }}
        />
      )}

      <CircleMarker
        center={[schedule.start_lat, schedule.start_long]}
        radius={6}
        pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 1, weight: 2 }}
        eventHandlers={{ click: handleRouteClick }}
      >
        <Tooltip direction="top">Click waypoint node to simulate route</Tooltip>
      </CircleMarker>

      <CircleMarker
        center={[schedule.end_lat, schedule.end_long]}
        radius={6}
        pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 1, weight: 2 }}
      >
        <Tooltip direction="top">Destination waypoint</Tooltip>
      </CircleMarker>

      {currentPosition && (
        <CircleMarker
          center={currentPosition}
          radius={8}
          pathOptions={{ color: '#000000', fillColor: '#ffffff', fillOpacity: 1, weight: 3 }}
        >
          <Popup>
            <div className="min-w-[220px] bg-zinc-950 text-zinc-100 p-1 text-xs space-y-1">
              <strong className="text-white text-sm font-semibold uppercase tracking-wide block border-b border-zinc-800 pb-1">{selectedFleet?.vehicle_type || 'Fleet Asset'}</strong>
              <div><span className="text-zinc-500 font-mono">START:</span> {formatTimestamp(schedule.start_time)}</div>
              <div><span className="text-zinc-500 font-mono">END:</span> {formatTimestamp(schedule.end_time)}</div>
              <div><span className="text-zinc-500 font-mono">SPEED:</span> {Number(schedule.speed_kmh || 0).toFixed(2)} km/h</div>
              <div><span className="text-zinc-500 font-mono">DISTANCE:</span> {Number(routeDistanceKm || selectedFleet?.distance_covered_km || 0).toFixed(2)} km</div>
            </div>
          </Popup>
        </CircleMarker>
      )}
    </>
  );
}

function MapAutoResize({ trigger }) {
  const map = useMap();

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      map.invalidateSize();
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [map, trigger]);

  return null;
}

function FleetScheduleDemo({ fleets, apiBaseUrl, menuActions }) {
  const [selectedFleetId, setSelectedFleetId] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!fleets.length) {
      return;
    }

    if (!selectedFleetId) {
      setSelectedFleetId(fleets[0].fleet_id);
    }
  }, [fleets, selectedFleetId]);

  useEffect(() => {
    if (!selectedFleetId || !apiBaseUrl) {
      return;
    }

    const loadSchedule = async () => {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const response = await fetch(`${apiBaseUrl}/api/fleet_schedule_demo/${selectedFleetId}`, {
          credentials: 'include',
        });
        const data = await response.json();

        if (response.ok) {
          setSchedule(data.schedule);
        } else {
          setSchedule(null);
          setErrorMessage(data.message || 'No schedule was found for this fleet.');
        }
      } catch (error) {
        setSchedule(null);
        setErrorMessage('Unable to load the demo route right now.');
      } finally {
        setIsLoading(false);
      }
    };

    loadSchedule();
  }, [apiBaseUrl, selectedFleetId]);

  const selectedFleet = fleets.find((fleet) => fleet.fleet_id === selectedFleetId) || null;

  return (
    <div className="min-h-screen w-full bg-black text-zinc-200 antialiased">
      <AppMenuBar
        leftContent={<BrandMark showTitle />}
        actions={menuActions}
      />

      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      
      <div className="space-y-6">
        {/* Fleet Hardware Selector Layout */}
        <div>
          <label className="block mb-2 text-[10px] font-bold tracking-wider text-zinc-500 uppercase font-mono">Select Fleet Unit for Simulation Route:</label>
          <div className="flex flex-wrap gap-2">
            {fleets.map((fleet) => (
              <button
                key={fleet.fleet_id}
                onClick={() => setSelectedFleetId(fleet.fleet_id)}
                className={`px-4 py-2 border font-mono text-xs font-semibold rounded-sm transition-colors duration-150 uppercase ${selectedFleetId === fleet.fleet_id ? 'bg-emerald-500 text-black border-emerald-500' : 'bg-black border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'}`}
              >
                {fleet.vehicle_type} ({fleet.fleet_id.slice(0, 8)})
              </button>
            ))}
          </div>
        </div>

        {/* Status Messaging Panels */}
        {isLoading && (
          <div className="p-4 bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-mono rounded-sm animate-pulse">
            PINGING ROUTING MATRICES... CALCULATING VECTOR COORDS
          </div>
        )}

        {errorMessage && !isLoading && (
          <div className="p-4 bg-zinc-900 border border-zinc-800 text-zinc-500 text-xs font-mono rounded-sm">
            STATUS LOG: {errorMessage}
          </div>
        )}

        {/* Live Map Canvas Component Frame */}
        {schedule && !isLoading && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-black border border-zinc-900 p-4 rounded-sm font-mono text-xs text-zinc-400">
              <div><span className="text-zinc-600">SCHEDULE ID:</span> <span className="text-zinc-200 font-semibold">{schedule.schedule_id}</span></div>
              <div><span className="text-zinc-600">TARGET DISPLACEMENT SPEED:</span> <span className="text-zinc-200 font-semibold">{schedule.speed_kmh} km/h</span></div>
            </div>

            <div className="h-[450px] w-full border border-zinc-900 bg-black rounded-sm overflow-hidden relative shadow-inner z-0">
              <MapContainer
                center={[schedule.start_lat, schedule.start_long]}
                zoom={13}
                style={{ height: '100%', width: '100%', background: '#000000' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                />
                <MapAutoResize trigger={schedule.schedule_id} />
                <RouteDemoLayer schedule={schedule} selectedFleet={selectedFleet} />
              </MapContainer>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

export default FleetScheduleDemo;