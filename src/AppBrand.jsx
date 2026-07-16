import React from 'react';

export function BrandMark({ showTitle = true }) {
  return (
    <div className="flex items-center gap-3">
      <img src="/icon-192x192.png" alt="Multibotix logo" className="h-9 w-9 rounded-full object-cover" />
      {showTitle && <span className="text-lg font-bold tracking-wide text-emerald-600">MULTIBOTIX</span>}
    </div>
  );
}

export function PageTitle({ icon, title, subtitle }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-zinc-500">{subtitle}</p>
      <h1 className="mt-1 truncate text-base font-semibold tracking-tight text-zinc-900 sm:text-lg">
        <span aria-hidden="true" className="mr-2">{icon}</span>
        {title}
      </h1>
    </div>
  );
}

export function TitleIcon({ type }) {
  const common = 'h-4 w-4 text-emerald-600';

  if (type === 'live-status') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}>
        <path d="M5 12a7 7 0 0 1 14 0" />
        <path d="M8 12a4 4 0 0 1 8 0" />
        <circle cx="12" cy="12" r="1.7" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  if (type === 'route-stimulation') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}>
        <path d="M5 18c3.5-6 10.5-6 14-12" />
        <path d="M15 6h4v4" />
        <circle cx="5" cy="18" r="2" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  if (type === 'admin-console') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={common}>
        <rect x="4" y="5" width="16" height="14" rx="2" />
        <path d="M8 10h8M8 14h5" />
      </svg>
    );
  }

  return null;
}