import { SortIcon } from '../icons'

export function SortControls({ sortField, sortDirection, onSortFieldChange, onSortDirectionToggle }) {
  return (
    <section
      className="mt-5 flex flex-wrap items-end gap-3 rounded-2xl border border-slate-700/60 bg-slate-900/40 p-4"
      aria-label="Сортировка списка рецептов"
    >
      <label className="space-y-1.5">
        <span className="text-xs uppercase tracking-wider text-slate-300">Сортировка</span>
        <div className="relative">
          <SortIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <select
            value={sortField}
            onChange={(event) => onSortFieldChange(event.target.value)}
            className="input-base appearance-none pl-9 pr-8"
          >
            <option value="createdAt">Дата добавления</option>
            <option value="lastCookedAt">Дата последней готовки</option>
            <option value="cookCount">Число приготовлений</option>
          </select>
        </div>
      </label>

      <button type="button" onClick={onSortDirectionToggle} className="btn-primary">
        <SortIcon className="h-4 w-4" />
        {sortDirection === 'asc' ? 'По возрастанию' : 'По убыванию'}
      </button>
    </section>
  )
}
