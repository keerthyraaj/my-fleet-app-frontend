import React from 'react';

function AppMenuBar({ leftContent, actions = [] }) {
  return (
    <header className="border-b border-zinc-200 bg-white shadow-sm">
      <div className="mx-auto flex w-full max-w-[1500px] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">{leftContent}</div>

        <nav className="flex flex-wrap items-center justify-end gap-2">
          {actions.map((action) => {
            if (action.hidden) {
              return null;
            }

            const baseClass =
              'rounded-sm border px-3 py-1.5 text-xs font-semibold tracking-wide transition-all duration-150 sm:px-4 sm:py-2';

            const className = action.disabled
              ? `${baseClass} cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-400`
              : action.active
                ? `${baseClass} border-emerald-600 bg-emerald-600 text-white`
                : `${baseClass} border-zinc-200 bg-white text-zinc-700 hover:border-emerald-500 hover:text-emerald-700`;

            return (
              <button
                key={action.key}
                type="button"
                onClick={action.onClick}
                disabled={action.disabled}
                className={className}
              >
                {action.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

export default AppMenuBar;
