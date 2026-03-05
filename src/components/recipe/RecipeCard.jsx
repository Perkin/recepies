import { useMemo, useState } from 'react'
import { ArchiveIcon, CalendarIcon, CheckIcon, DeleteIcon, EditIcon, FlameIcon, PotIcon, VideoUnavailableIcon } from '../icons'
import { formatDate } from '../../utils/date'
import { parseRecipeVideo } from '../../utils/video'

export function RecipeCard({
  recipe,
  recipeId,
  isArchiveView,
  isLightweightView,
  onCooked,
  onQueue,
  onArchive,
  onRestore,
  onEdit,
  onDelete,
  isNew = false,
}) {
  const [isExpandedInLightweight, setIsExpandedInLightweight] = useState(false)
  const shouldShowFullCard = !isLightweightView || isExpandedInLightweight

  const borderClass = recipe.isQueued ? 'border-amber-300/70' : 'border-slate-700/60'
  const lastCookedCompact = recipe.lastCookedAt ? formatDate(recipe.lastCookedAt) : '—'
  const parsedVideo = useMemo(() => parseRecipeVideo(recipe.videoUrl?.trim() ?? ''), [recipe.videoUrl])
  const hasInstructions = Boolean(recipe.instructions?.trim())

  const handleLightweightClick = () => {
    if (!isLightweightView) {
      return
    }

    setIsExpandedInLightweight((prev) => !prev)
  }

  return (
    <article
      data-recipe-id={recipeId}
      className={`rounded-xl border bg-gradient-to-br from-slate-900/95 to-slate-800/90 p-3 shadow-lg shadow-black/20 sm:p-4 ${borderClass}`}
      onClick={handleLightweightClick}
      onKeyDown={(event) => {
        if (!isLightweightView) {
          return
        }

        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          setIsExpandedInLightweight((prev) => !prev)
        }
      }}
      role={isLightweightView ? 'button' : undefined}
      tabIndex={isLightweightView ? 0 : undefined}
      aria-expanded={isLightweightView ? shouldShowFullCard : undefined}
    >
      {shouldShowFullCard ? (
        <>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {isNew ? (
                <span className="rounded-md border border-amber-300/80 bg-amber-300/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-100">
                  new
                </span>
              ) : null}
              <h2 className="text-lg font-semibold leading-tight text-slate-100">{recipe.title}</h2>
            </div>
          </div>

          <>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <section className="placeholder-box">
                <p className="placeholder-title">Видео рецепта</p>
                <div className="mt-2 text-xs text-slate-300">
                  {recipe.videoUrl ? (
                    <div className="relative aspect-video w-full rounded-md bg-slate-950">
                      {parsedVideo.type === 'direct' ? (
                        <video
                          controls
                          preload="metadata"
                          className="h-full w-full rounded-md bg-slate-950"
                        >
                          <source src={parsedVideo.sourceUrl} />
                          Ваш браузер не поддерживает видео.
                        </video>
                      ) : parsedVideo.type === 'youtube' || parsedVideo.type === 'vk' || parsedVideo.type === 'rutube' ? (
                        <>
                          <iframe
                            src={parsedVideo.embedUrl}
                            title={`Видео рецепта: ${recipe.title}`}
                            className="h-full w-full rounded-md border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="strict-origin-when-cross-origin"
                          />
                          {parsedVideo.type === 'youtube' && parsedVideo.watchUrl ? (
                            <a
                              href={parsedVideo.watchUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="absolute bottom-2 left-2 rounded bg-slate-900/80 px-2 py-1 text-[11px] text-slate-200 underline decoration-slate-400 hover:text-white"
                              onClick={(event) => event.stopPropagation()}
                            >
                              Открыть на YouTube
                            </a>
                          ) : null}
                        </>
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-md border border-slate-700 bg-slate-950/80 text-slate-400">
                          <VideoUnavailableIcon className="h-8 w-8" />
                          <span className="px-3 text-center">Неподдерживаемая ссылка на видео</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-md border border-slate-700 bg-slate-950/80 text-slate-400">
                      <VideoUnavailableIcon className="h-8 w-8" />
                      <span>Видео не загружено</span>
                    </div>
                  )}
                </div>
              </section>
              <section className="placeholder-box">
                <p className="placeholder-title">Ингредиенты</p>
                <pre className="mt-2 whitespace-pre-wrap text-xs leading-5 text-slate-300">{recipe.ingredients}</pre>
              </section>
            </div>

            {hasInstructions ? (
              <section className="placeholder-box mt-2">
                <p className="placeholder-title">Инструкции</p>
                <pre className="mt-2 whitespace-pre-wrap text-xs leading-5 text-slate-300">{recipe.instructions}</pre>
              </section>
            ) : null}
          </>

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
            <div className="grid flex-1 grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:flex-none">
              {isArchiveView ? null : (
                <>
                  <button
                    type="button"
                    className="btn-primary btn-emphasis btn-compact justify-center"
                    onClick={(event) => {
                      event.stopPropagation()
                      onCooked()
                    }}
                  >
                    <CheckIcon className="h-3.5 w-3.5" />
                    Приготовлено
                  </button>
                  <button
                    type="button"
                    className={`btn-compact justify-center ${recipe.isQueued ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={(event) => {
                      event.stopPropagation()
                      onQueue()
                    }}
                  >
                    В очередь
                  </button>
                </>
              )}
              <button
                type="button"
                className="btn-secondary btn-compact justify-center"
                onClick={(event) => {
                  event.stopPropagation()
                  onEdit()
                }}
              >
                <EditIcon className="h-3.5 w-3.5" />
                Изменить
              </button>
            </div>

            <div className="ml-auto grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
              {isArchiveView ? (
                <button
                  type="button"
                  className="btn-secondary btn-compact justify-center"
                  onClick={(event) => {
                    event.stopPropagation()
                    onRestore()
                  }}
                >
                  <ArchiveIcon className="h-3.5 w-3.5" />Из архива
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-secondary btn-compact justify-center"
                  onClick={(event) => {
                    event.stopPropagation()
                    onArchive()
                  }}
                >
                  <ArchiveIcon className="h-3.5 w-3.5" />В архив
                </button>
              )}
              <button
                type="button"
                className="btn-secondary btn-compact btn-danger justify-center"
                onClick={(event) => {
                  event.stopPropagation()
                  onDelete()
                }}
              >
                <DeleteIcon className="h-3.5 w-3.5" />
                Удалить
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              {isNew ? (
                <span className="rounded-md border border-amber-300/80 bg-amber-300/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-100">
                  new
                </span>
              ) : null}
              <p className="truncate text-sm font-semibold text-slate-100">{recipe.title}</p>
            </div>
          </div>

          <div className="grid grid-cols-[5.5rem_4.5rem_5.5rem] gap-2 text-center tabular-nums">
            <div className="grid">
              <span className="text-[10px] uppercase tracking-wide text-slate-400">Доб.</span>
              <span className="truncate text-xs text-slate-200">{formatDate(recipe.createdAt)}</span>
            </div>
            <div className="grid">
              <span className="text-[10px] uppercase tracking-wide text-slate-400">Раз</span>
              <span className="truncate text-xs text-slate-200">{recipe.cookCount}</span>
            </div>
            <div className="grid">
              <span className="text-[10px] uppercase tracking-wide text-slate-400">Посл.</span>
              <span className="truncate text-xs text-slate-200">{lastCookedCompact}</span>
            </div>
          </div>
        </div>
      )}

    </article>
  )
}
