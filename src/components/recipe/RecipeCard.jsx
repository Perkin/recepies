import { ArchiveIcon, CalendarIcon, CheckIcon, DeleteIcon, EditIcon, FlameIcon, PotIcon } from '../icons'
import { formatDate } from '../../utils/date'

export function RecipeCard({
  recipe,
  isArchiveView,
  isLightweightView,
  onCooked,
  onArchive,
  onRestore,
  onEdit,
  onDelete,
}) {
  return (
    <article className="rounded-xl border border-slate-700/60 bg-gradient-to-br from-slate-900/95 to-slate-800/90 p-3 shadow-lg shadow-black/20 sm:p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="text-lg font-semibold leading-tight text-slate-100">{recipe.title}</h2>
        {recipe.isQueued ? (
          <span className="inline-flex items-center rounded-full bg-amber-200 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-900">
            В очереди
          </span>
        ) : null}
      </div>

      <p className="mt-2 text-sm text-slate-300">{recipe.description}</p>

      {isLightweightView ? null : (
        <>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <section className="placeholder-box">
              <p className="placeholder-title">Видео рецепта</p>
              <div className="mt-2 rounded-lg border border-dashed border-slate-600/90 bg-slate-900/70 p-2 text-xs text-slate-300">
                {recipe.videoUrl ? (
                  <a href={recipe.videoUrl} target="_blank" rel="noreferrer" className="text-amber-200 underline">
                    Открыть видео
                  </a>
                ) : (
                  'Не добавлено'
                )}
              </div>
            </section>
            <section className="placeholder-box">
              <p className="placeholder-title">Ингредиенты</p>
              <pre className="mt-2 whitespace-pre-wrap text-xs leading-5 text-slate-300">{recipe.ingredients}</pre>
            </section>
          </div>

          <section className="placeholder-box mt-2">
            <p className="placeholder-title">Инструкции</p>
            <pre className="mt-2 whitespace-pre-wrap text-xs leading-5 text-slate-300">{recipe.instructions}</pre>
          </section>
        </>
      )}

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

      <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        {isArchiveView ? null : (
          <button type="button" className="btn-primary btn-compact justify-center" onClick={onCooked}>
            <CheckIcon className="h-3.5 w-3.5" />
            Приготовлено
          </button>
        )}
        {isArchiveView ? (
          <button type="button" className="btn-secondary btn-compact justify-center" onClick={onRestore}>
            <ArchiveIcon className="h-3.5 w-3.5" />Из архива
          </button>
        ) : (
          <button type="button" className="btn-secondary btn-compact justify-center" onClick={onArchive}>
            <ArchiveIcon className="h-3.5 w-3.5" />В архив
          </button>
        )}
        <button type="button" className="btn-secondary btn-compact justify-center" onClick={onEdit}>
          <EditIcon className="h-3.5 w-3.5" />
          Изменить
        </button>
        <button type="button" className="btn-secondary btn-compact justify-center" onClick={onDelete}>
          <DeleteIcon className="h-3.5 w-3.5" />
          Удалить
        </button>
      </div>
    </article>
  )
}
