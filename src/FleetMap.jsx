import { useEffect } from "react";

import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";

import L from "leaflet";

import "leaflet/dist/leaflet.css";

function FitFleetBounds({ fleets }) {
  const map = useMap();

  useEffect(() => {
    const positionedFleets = fleets.filter(
      (fleet) =>
        fleet.lat !== null &&
        fleet.long !== null
    );

    if (positionedFleets.length === 0) {
      return;
    }

    const bounds = L.latLngBounds(
      positionedFleets.map((fleet) => [
        fleet.lat,
        fleet.long,
      ])
    );

    map.fitBounds(bounds, {
      padding: [40, 40],
      maxZoom: 15,
    });
  }, [fleets, map]);

  return null;
}

function getMarkerColor(status) {
  switch (status) {
    case "active":
      return "#10b981";
    case "idle":
      return "#fbbf24";
    case "charging":
      return "#3b82f6";
    case "maintenance":
      return "#ef4444";
    default:
      return "#6b7280";
  }
}

function FleetMap({ fleets }) {
  const positionedFleets = fleets.filter(
    (fleet) =>
      fleet.lat !== null &&
      fleet.long !== null
  );

  return (
    <MapContainer
      center={[30.2672, -97.7431]}
      zoom={13}
      style={{
        height: "600px",
        width: "100%",
      }}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />

      <FitFleetBounds fleets={positionedFleets} />

      {positionedFleets.map((fleet) => (
        <CircleMarker
          key={fleet.fleet_id}
          center={[fleet.lat, fleet.long]}
          radius={8}
          pathOptions={{
            color: getMarkerColor(fleet.current_status),
            fillColor: getMarkerColor(fleet.current_status),
            fillOpacity: 0.9,
            weight: 2,
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
              <strong>Fleet Details</strong>

              <hr />

              Fleet ID: {fleet.fleet_id}
              <br />

              Vehicle: {fleet.vehicle_type}
              <br />

              Status: {fleet.current_status}
              <br />

              Battery: {fleet.battery_life_percentage}%
              <br />

              Distance: {fleet.distance_covered_km} km
              <br />

              Position Time:{" "}
              {fleet.current_ts
                ? new Date(fleet.current_ts).toLocaleString()
                : "Unknown"}
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}

export default FleetMap;