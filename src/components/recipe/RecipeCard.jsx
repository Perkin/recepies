import { useMemo, useState } from 'react'
import { ArchiveIcon, CalendarIcon, CheckIcon, DeleteIcon, EditIcon, FlameIcon, PotIcon, VideoUnavailableIcon } from '../icons'
import { formatDate } from '../../utils/date'
import { parseRecipeVideo } from '../../utils/video'

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
  const [isExpandedInLightweight, setIsExpandedInLightweight] = useState(false)
  const shouldShowFullCard = !isLightweightView || isExpandedInLightweight

  const borderClass = recipe.isQueued ? 'border-amber-300/70' : 'border-slate-700/60'
  const lastCookedCompact = recipe.lastCookedAt ? formatDate(recipe.lastCookedAt) : '—'
  const parsedVideo = useMemo(() => parseRecipeVideo(recipe.videoUrl?.trim() ?? ''), [recipe.videoUrl])
  const [isVideoStarted, setIsVideoStarted] = useState(false)

  const handleLightweightClick = () => {
    if (!isLightweightView) {
      return
    }

    setIsExpandedInLightweight((prev) => !prev)
  }

  return (
    <article
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
            <h2 className="text-lg font-semibold leading-tight text-slate-100">{recipe.title}</h2>
          </div>

          <p className="mt-2 text-sm text-slate-300">{recipe.description}</p>

          <>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <section className="placeholder-box">
                <p className="placeholder-title">Видео рецепта</p>
                <div className="mt-2 flex justify-center rounded-lg border border-dashed border-slate-600/90 bg-slate-900/70 p-2 text-xs text-slate-300">
                  {recipe.videoUrl ? (
                    <div className="relative h-[160px] w-[240px] max-w-full rounded-md bg-slate-950 sm:h-[180px] sm:w-[320px]">
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
                        isVideoStarted ? (
                          <iframe
                            src={parsedVideo.autoplayEmbedUrl}
                            title={`Видео рецепта: ${recipe.title}`}
                            className="h-full w-full rounded-md border-0"
                            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="strict-origin-when-cross-origin"
                          />
                        ) : (
                          <button
                            type="button"
                            className="group relative h-full w-full overflow-hidden rounded-md border border-slate-700 bg-slate-950 text-slate-100"
                            onClick={(event) => {
                              event.stopPropagation()
                              setIsVideoStarted(true)
                            }}
                          >
                            {parsedVideo.thumbnailUrl ? (
                              <img
                                src={parsedVideo.thumbnailUrl}
                                alt={`Превью видео: ${recipe.title}`}
                                className="h-full w-full object-cover opacity-90 transition group-hover:opacity-100"
                                loading="lazy"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-slate-900/90 text-xs text-slate-300">
                                Нажмите, чтобы запустить видео
                              </div>
                            )}
                            <span className="absolute inset-0 flex items-center justify-center">
                              <span className="rounded-full bg-black/65 px-3 py-2 text-xs font-semibold tracking-wide text-white">▶ Смотреть</span>
                            </span>
                          </button>
                        )
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-md border border-slate-700 bg-slate-950/80 text-slate-400">
                          <VideoUnavailableIcon className="h-8 w-8" />
                          <span className="px-3 text-center">Неподдерживаемая ссылка на видео</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex h-[160px] w-[240px] max-w-full flex-col items-center justify-center gap-2 rounded-md border border-slate-700 bg-slate-950/80 text-slate-400 sm:h-[180px] sm:w-[320px]">
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

            <section className="placeholder-box mt-2">
              <p className="placeholder-title">Инструкции</p>
              <pre className="mt-2 whitespace-pre-wrap text-xs leading-5 text-slate-300">{recipe.instructions}</pre>
            </section>
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

          <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            {isArchiveView ? null : (
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
            )}
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
              className="btn-secondary btn-compact justify-center"
              onClick={(event) => {
                event.stopPropagation()
                onEdit()
              }}
            >
              <EditIcon className="h-3.5 w-3.5" />
              Изменить
            </button>
            <button
              type="button"
              className="btn-secondary btn-compact justify-center"
              onClick={(event) => {
                event.stopPropagation()
                onDelete()
              }}
            >
              <DeleteIcon className="h-3.5 w-3.5" />
              Удалить
            </button>
          </div>
        </>
      ) : (
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-100">{recipe.title}</p>
            <p className="truncate text-xs text-slate-300">{recipe.description}</p>
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
