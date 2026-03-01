const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Дата добавления' },
  { value: 'lastCookedAt', label: 'Дата последней готовки' },
  { value: 'cookCount', label: 'Число приготовлений' },
]

function SortDirectionIcon({ direction }) {
  const rotationClass = direction === 'asc' ? 'rotate-180' : ''

  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className={`h-4 w-4 shrink-0 text-amber-300 transition-transform ${rotationClass}`}
    >
      <path
        d="M10 15.5a1 1 0 0 1-.7-.3l-4-4a1 1 0 1 1 1.4-1.4l2.3 2.3V5a1 1 0 1 1 2 0v7.1l2.3-2.3a1 1 0 0 1 1.4 1.4l-4 4a1 1 0 0 1-.7.3Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function SortControls({ sortField, sortDirection, onSortChange }) {
  return (
    <section
      className="mt-5 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-700/60 bg-slate-900/40 p-4"
      aria-label="Сортировка списка рецептов"
    >
      <span className="mr-1 text-xs uppercase tracking-wider text-slate-300">Сортировка:</span>

      {SORT_OPTIONS.map((option) => {
        const isActive = option.value === sortField

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onSortChange(option.value)}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm transition ${
              isActive
                ? 'border-amber-300/80 bg-amber-300/10 text-amber-100'
                : 'border-slate-600/60 bg-slate-800/70 text-slate-200 hover:border-slate-500 hover:bg-slate-800'
            }`}
            aria-pressed={isActive}
          >
            <span>{option.label}</span>
            {isActive ? <SortDirectionIcon direction={sortDirection} /> : null}
          </button>
        )
      })}
    </section>
  )
}
