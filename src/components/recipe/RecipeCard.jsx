import { ArchiveIcon, CalendarIcon, CheckIcon, FlameIcon, PotIcon } from '../icons'
import { formatDate } from '../../utils/date'

const ingredientsPlaceholder = `- 2 яйца\n- 1 кг свинины\n- 1 ст.ложка муки\n- Приправы по вкусу`

export function RecipeCard({ recipe }) {
  return (
    <article className="rounded-xl border border-slate-700/60 bg-gradient-to-br from-slate-900/95 to-slate-800/90 p-4 shadow-lg shadow-black/20">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="text-lg font-semibold leading-tight text-slate-100">{recipe.title}</h2>
        {recipe.isQueued ? (
          <span className="inline-flex items-center rounded-full bg-amber-200 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-900">
            В очереди
          </span>
        ) : null}
      </div>

      <p className="mt-2 text-sm text-slate-300">{recipe.description}</p>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <section className="placeholder-box">
          <p className="placeholder-title">Видео рецепта</p>
          <div className="mt-2 flex h-24 items-center justify-center rounded-lg border border-dashed border-slate-600/90 bg-slate-900/70 text-center text-xs text-slate-400">
            Здесь будет видео
          </div>
        </section>
        <section className="placeholder-box">
          <p className="placeholder-title">Текст рецепта</p>
          <pre className="mt-2 whitespace-pre-wrap text-xs leading-5 text-slate-300">{ingredientsPlaceholder}</pre>
        </section>
      </div>

      <dl className="mt-3 grid gap-1.5 text-xs">
        <div className="meta-row">
          <dt className="meta-term">
            <CalendarIcon className="h-3.5 w-3.5" />
            Добавлен
          </dt>
          <dd>{formatDate(recipe.createdAt)}</dd>
        </div>
        <div className="meta-row">
          <dt className="meta-term">
            <FlameIcon className="h-3.5 w-3.5" />
            Последняя готовка
          </dt>
          <dd>{formatDate(recipe.lastCookedAt)}</dd>
        </div>
        <div className="meta-row">
          <dt className="meta-term">
            <PotIcon className="h-3.5 w-3.5" />
            Готовили раз
          </dt>
          <dd>{recipe.cookCount}</dd>
        </div>
      </dl>

      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="btn-primary btn-compact">
          <CheckIcon className="h-3.5 w-3.5" />
          Приготовлено
        </button>
        <button type="button" className="btn-secondary btn-compact">
          <ArchiveIcon className="h-3.5 w-3.5" />
          В архив
        </button>
      </div>
    </article>
  )
}
