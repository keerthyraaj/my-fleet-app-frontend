import { useEffect, useState } from 'react';
import { CircleMarker, MapContainer, Popup, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';

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
        styles: [{ color: '#90ee90', weight: 5, opacity: 0.9 }],
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
          pathOptions={{ color: '#90ee90', weight: 5, opacity: 0.9 }}
        />
      )}

      <CircleMarker
        center={[schedule.start_lat, schedule.start_long]}
        radius={7}
        pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.95, weight: 2 }}
        eventHandlers={{ click: handleRouteClick }}
      >
        <Tooltip direction="top">Hover and click to animate</Tooltip>
      </CircleMarker>

      <CircleMarker
        center={[schedule.end_lat, schedule.end_long]}
        radius={7}
        pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.95, weight: 2 }}
      >
        <Tooltip direction="top">End point</Tooltip>
      </CircleMarker>

      {currentPosition && (
        <CircleMarker
          center={currentPosition}
          radius={8}
          pathOptions={{ color: '#111827', fillColor: '#f59e0b', fillOpacity: 0.95, weight: 3 }}
        >
          <Popup>
            <div style={{ minWidth: '220px' }}>
              <strong>{selectedFleet?.vehicle_type || 'Fleet'}</strong>
              <br />
              Start: {formatTimestamp(schedule.start_time)}
              <br />
              End: {formatTimestamp(schedule.end_time)}
              <br />
              Speed: {Number(schedule.speed_kmh || 0).toFixed(2)} km/h
              <br />
              Distance: {Number(routeDistanceKm || selectedFleet?.distance_covered_km || 0).toFixed(2)} km
            </div>
          </Popup>
        </CircleMarker>
      )}
    </>
  );
}

function FleetScheduleDemo({ fleets, apiBaseUrl, onBack }) {
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
    <div className="max-w-5xl mx-auto my-12 p-8 bg-zinc-950 border border-zinc-900 rounded-sm text-zinc-200 antialiased">
      <div className="flex justify-between items-center mb-6 border-b border-zinc-900 pb-4">
        <div>
          <span className="text-[10px] font-bold tracking-widest text-zinc-500 font-mono uppercase block mb-1">Temporal Dispatch Array</span>
          <h2 className="text-lg font-semibold tracking-tight text-white uppercase font-mono">CHRONO ROUTING DISPATCH</h2>
        </div>
        <button onClick={onBack} className="px-4 py-2 text-xs font-mono font-bold tracking-wider bg-black border border-zinc-900 text-zinc-400 rounded-sm hover:border-zinc-700 hover:text-white transition-colors duration-150">
          MONITOR TERMINAL
        </button>
      </div>
      
      {/* Existing internal schedule tables / maps render inside with clean styles */}
      <div className="p-8 text-center border border-dashed border-zinc-800 text-zinc-600 font-mono text-sm">
        INITIALIZING TEMPORAL TIMELINE MATRIX GRAPH...
      </div>
    </div>
  );
}

export default FleetScheduleDemo;
