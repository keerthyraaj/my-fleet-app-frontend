import React, { useEffect, useMemo, useState } from 'react';

function AppMenuBar({ leftContent, actions = [] }) {
  const visibleActions = useMemo(() => actions.filter((action) => !action.hidden), [actions]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 640px)');

    const syncMenuState = (event) => {
      if (event.matches) {
        setIsMenuOpen(false);
      }
    };

    syncMenuState(mediaQuery);
    mediaQuery.addEventListener('change', syncMenuState);

    return () => {
      mediaQuery.removeEventListener('change', syncMenuState);
    };
  }, []);

  const handleActionClick = (action) => () => {
    if (action.disabled) {
      return;
    }

    action.onClick?.();
    setIsMenuOpen(false);
  };

  const getActionClassName = (action, { mobile = false } = {}) => {
    const baseClass = mobile
      ? 'app-menu-bar__action w-full rounded-sm border px-4 py-3 text-left text-sm font-semibold tracking-wide transition-all duration-150'
      : 'app-menu-bar__action rounded-sm border px-3 py-1.5 text-xs font-semibold tracking-wide transition-all duration-150 sm:px-4 sm:py-2';

    if (action.disabled) {
      return `${baseClass} cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-400`;
    }

    if (action.active) {
      return `${baseClass} border-emerald-600 bg-emerald-600 text-white`;
    }

    return `${baseClass} border-zinc-200 bg-white text-zinc-700 hover:border-emerald-500 hover:text-emerald-700`;
  };

  return (
    <header className="border-b border-zinc-200 bg-white shadow-sm">
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">{leftContent}</div>

          {visibleActions.length > 0 && (
            <button
              type="button"
              aria-expanded={isMenuOpen}
              aria-controls="app-menu-bar-mobile-nav"
              aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              onClick={() => setIsMenuOpen((open) => !open)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border border-zinc-200 bg-white text-zinc-700 transition-colors hover:border-emerald-500 hover:text-emerald-700 sm:hidden"
            >
              <span className="sr-only">Toggle navigation</span>
              <span className="relative block h-4 w-5">
                <span
                  className={`absolute left-0 top-0 block h-0.5 w-5 bg-current transition-transform duration-150 ${isMenuOpen ? 'translate-y-[7px] rotate-45' : ''}`}
                />
                <span
                  className={`absolute left-0 top-[7px] block h-0.5 w-5 bg-current transition-opacity duration-150 ${isMenuOpen ? 'opacity-0' : 'opacity-100'}`}
                />
                <span
                  className={`absolute left-0 top-[14px] block h-0.5 w-5 bg-current transition-transform duration-150 ${isMenuOpen ? '-translate-y-[7px] -rotate-45' : ''}`}
                />
              </span>
            </button>
          )}
        </div>

        <nav className="hidden flex-wrap items-center justify-end gap-2 sm:flex">
          {visibleActions.map((action) => (
            <button
              key={action.key}
              type="button"
              onClick={handleActionClick(action)}
              disabled={action.disabled}
              className={getActionClassName(action)}
            >
              {action.label}
            </button>
          ))}
        </nav>
      </div>

      {visibleActions.length > 0 && (
        <div
          id="app-menu-bar-mobile-nav"
          className={`app-menu-bar__mobile-panel overflow-hidden border-t border-zinc-200 bg-white transition-all duration-200 sm:hidden ${isMenuOpen ? 'max-h-[32rem] opacity-100' : 'max-h-0 border-t-0 opacity-0'}`}
        >
          <nav className="mx-auto flex w-full max-w-[1500px] flex-col gap-2 px-4 py-3">
            {visibleActions.map((action) => (
              <button
                key={action.key}
                type="button"
                onClick={handleActionClick(action)}
                disabled={action.disabled}
                className={getActionClassName(action, { mobile: true })}
              >
                {action.label}
              </button>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

export default AppMenuBar;
