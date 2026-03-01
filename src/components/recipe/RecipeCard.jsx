import { ArchiveIcon, CalendarIcon, CheckIcon, FlameIcon, PotIcon } from '../icons'
import { formatDate } from '../../utils/date'

export function RecipeCard({ recipe }) {
  return (
    <article className="rounded-2xl border border-slate-700/60 bg-gradient-to-br from-slate-900/95 to-slate-800/90 p-5 shadow-lg shadow-black/20">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold text-slate-100">{recipe.title}</h2>
        {recipe.isQueued ? (
          <span className="inline-flex items-center rounded-full bg-amber-200 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-900">
            В очереди
          </span>
        ) : null}
      </div>

      <p className="mt-3 text-slate-300">{recipe.description}</p>

      <dl className="mt-4 grid gap-2 text-sm">
        <div className="meta-row">
          <dt className="meta-term">
            <CalendarIcon className="h-4 w-4" />
            Добавлен
          </dt>
          <dd>{formatDate(recipe.createdAt)}</dd>
        </div>
        <div className="meta-row">
          <dt className="meta-term">
            <FlameIcon className="h-4 w-4" />
            Последняя готовка
          </dt>
          <dd>{formatDate(recipe.lastCookedAt)}</dd>
        </div>
        <div className="meta-row">
          <dt className="meta-term">
            <PotIcon className="h-4 w-4" />
            Готовили раз
          </dt>
          <dd>{recipe.cookCount}</dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap gap-2.5">
        <button type="button" className="btn-primary">
          <CheckIcon className="h-4 w-4" />
          Отметить как приготовленное
        </button>
        <button type="button" className="btn-secondary">
          <ArchiveIcon className="h-4 w-4" />
          В архив
        </button>
      </div>
    </article>
  )
}
