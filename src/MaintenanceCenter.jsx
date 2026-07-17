import React from 'react';
import AppMenuBar from './AppMenuBar';
import { BrandMark } from './AppBrand';

const THRESHOLDS = {
  optimalMax: 150,
  serviceMin: 300,
};

function classifyFleetByDistance(fleet) {
  const distance = Number(fleet.distance_covered_km || 0);

  if (distance >= THRESHOLDS.serviceMin) {
    return 'serviceRequired';
  }

  if (distance >= THRESHOLDS.optimalMax) {
    return 'monitoring';
  }

  return 'optimal';
}

function FleetCard({ fleet, accentClass }) {
  return (
    <article
      className={`rounded-sm border border-zinc-700 bg-black/80 p-3 text-xs text-zinc-100 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)] ${accentClass}`}
    >
      <p className="font-mono text-[11px] text-zinc-200">
        ID: <span className="tracking-wide">{fleet.fleet_id.slice(0, 8)}</span>
      </p>
      <p className="mt-1 uppercase text-zinc-200">Type: {fleet.vehicle_type}</p>
      <p className="mt-1 text-zinc-300">Dist: {Number(fleet.distance_covered_km || 0).toFixed(2)} km</p>
    </article>
  );
}

function FleetColumn({ title, subtitle, accent, fleets }) {
  return (
    <section className={`rounded-md border bg-zinc-950/85 p-4 ${accent.columnBorder}`}>
      <header className="mb-4 border-b border-zinc-800 pb-2">
        <h2 className={`text-2xl font-semibold tracking-tight ${accent.titleColor}`}>{title}</h2>
        <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-zinc-500">{subtitle}</p>
      </header>

      <div className="max-h-[68vh] space-y-3 overflow-y-auto pr-1">
        {fleets.length > 0 ? (
          fleets.map((fleet) => (
            <FleetCard
              key={fleet.fleet_id}
              fleet={fleet}
              accentClass={accent.cardBorder}
            />
          ))
        ) : (
          <div className="rounded-sm border border-dashed border-zinc-800 bg-black/40 p-4 text-xs text-zinc-500">
            No fleet units in this band.
          </div>
        )}
      </div>
    </section>
  );
}

function MaintenanceCenter({ fleets, menuActions }) {
  const groupedFleets = fleets.reduce(
    (groups, fleet) => {
      const bucket = classifyFleetByDistance(fleet);
      groups[bucket].push(fleet);
      return groups;
    },
    {
      optimal: [],
      monitoring: [],
      serviceRequired: [],
    }
  );

  return (
    <div className="min-h-screen w-full bg-black text-zinc-200 antialiased">
      <AppMenuBar
        leftContent={<BrandMark showTitle />}
        actions={menuActions}
      />

      <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <FleetColumn
            title="Optimal"
            subtitle="Performance Nominal"
            fleets={groupedFleets.optimal}
            accent={{
              columnBorder: 'border-emerald-500/70 shadow-[0_0_22px_rgba(16,185,129,0.18)]',
              titleColor: 'text-emerald-400',
              cardBorder: 'border-emerald-500/45',
            }}
          />

          <FleetColumn
            title="Monitoring"
            subtitle="Attention Required"
            fleets={groupedFleets.monitoring}
            accent={{
              columnBorder: 'border-amber-400/70 shadow-[0_0_22px_rgba(251,191,36,0.16)]',
              titleColor: 'text-amber-300',
              cardBorder: 'border-amber-400/45',
            }}
          />

          <FleetColumn
            title="Service Required"
            subtitle="Immediate Action"
            fleets={groupedFleets.serviceRequired}
            accent={{
              columnBorder: 'border-rose-500/70 shadow-[0_0_22px_rgba(244,63,94,0.16)]',
              titleColor: 'text-rose-400',
              cardBorder: 'border-rose-500/45',
            }}
          />
        </div>
      </main>
    </div>
  );
}

export default MaintenanceCenter;
