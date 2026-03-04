import { useEffect, useMemo, useRef, useState } from 'react'
import { AppHeader } from './components/recipe/AppHeader'
import { RecipeCard } from './components/recipe/RecipeCard'
import { SortControls } from './components/recipe/SortControls'
import { recipeSorters } from './utils/recipeSorters.js'

const STORAGE_KEY = 'recipes'
const LIGHTWEIGHT_VIEW_STORAGE_KEY = 'recipes-lightweight-view'
const RECIPES_PER_PAGE = 10

function getInitialPageFromUrl() {
  const params = new URLSearchParams(window.location.search)
  const rawPage = Number.parseInt(params.get('page') ?? '1', 10)

  return Number.isNaN(rawPage) || rawPage < 1 ? 1 : rawPage
}

function setPageInUrl(page, { replace = false } = {}) {
  const params = new URLSearchParams(window.location.search)

  if (page <= 1) {
    params.delete('page')
  } else {
    params.set('page', String(page))
  }

  const query = params.toString()
  const nextUrl = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`

  if (replace) {
    window.history.replaceState(null, '', nextUrl)
    return
  }

  window.history.pushState(null, '', nextUrl)
}

const defaultRecipes = [
  {
    id: 'r1',
    title: 'Томатная паста с базиликом',
    description: 'Быстрый ужин: паста, томаты в собственном соку и немного пармезана.',
    createdAt: '2026-02-15',
    lastCookedAt: '2026-02-23',
    cookCount: 3,
    isQueued: true,
    isArchived: false,
    isDeleted: false,
    ingredients:
      '- 400 г спагетти\n- 1 банка томатов в собственном соку\n- 2 зубчика чеснока\n- Пучок базилика\n- 50 г пармезана',
    instructions:
      '1. Отварить пасту\n2. Обжарить чеснок\n3. Добавить томаты\n4. Подавать с базиликом',
  },
  {
    id: 'r2',
    title: 'Овсяные панкейки',
    description: 'Завтрак из банана, яйца и овсяных хлопьев, подаётся с йогуртом.',
    createdAt: '2026-01-20',
    lastCookedAt: '2026-02-25',
    cookCount: 5,
    isQueued: false,
    isArchived: false,
    isDeleted: false,
    ingredients: '- 1 спелый банан\n- 1 яйцо\n- 4 ст.л. овсяных хлопьев\n- Йогурт для подачи',
    instructions: '1. Размять банан\n2. Смешать с яйцом и хлопьями\n3. Жарить на сковороде',
  },
  {
    id: 'r3',
    title: 'Курица терияки в духовке',
    description: 'Маринад из соевого соуса, имбиря и мёда, запекание 35 минут.',
    createdAt: '2025-12-30',
    lastCookedAt: null,
    cookCount: 0,
    isQueued: false,
    isArchived: false,
    isDeleted: false,
    ingredients: '- 4 куриных бедра\n- 4 ст.л. соевого соуса\n- 1 ч.л. натёртого имбиря\n- 1 ст.л. мёда',
    instructions: '1. Сделать маринад\n2. Замариновать курицу\n3. Запекать 35 минут',
  },
]

const emptyForm = {
  title: '',
  description: '',
  ingredients: '',
  instructions: '',
  videoUrl: '',
  isQueued: false,
}

function getInitialRecipes() {
  const raw = localStorage.getItem(STORAGE_KEY)

  if (!raw) {
    return defaultRecipes
  }

  try {
    return JSON.parse(raw)
  } catch {
    return defaultRecipes
  }
}

export default function App() {
  const recipeListRef = useRef(null)
  const [recipes, setRecipes] = useState(getInitialRecipes)
  const [currentPage, setCurrentPage] = useState(getInitialPageFromUrl)
  const [sortField, setSortField] = useState('createdAt')
  const [sortDirection, setSortDirection] = useState('desc')
  const [showArchivedOnly, setShowArchivedOnly] = useState(false)
  const [isLightweightView, setIsLightweightView] = useState(() => {
    return localStorage.getItem(LIGHTWEIGHT_VIEW_STORAGE_KEY) === 'true'
  })
  const [editingId, setEditingId] = useState(null)
  const [formValues, setFormValues] = useState(emptyForm)
  const [isFormVisible, setIsFormVisible] = useState(false)
  const [shouldScrollToRecipes, setShouldScrollToRecipes] = useState(false)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes))
  }, [recipes])

  useEffect(() => {
    localStorage.setItem(LIGHTWEIGHT_VIEW_STORAGE_KEY, String(isLightweightView))
  }, [isLightweightView])

  useEffect(() => {
    const syncPageFromUrl = () => {
      setCurrentPage(getInitialPageFromUrl())
    }

    window.addEventListener('popstate', syncPageFromUrl)

    return () => {
      window.removeEventListener('popstate', syncPageFromUrl)
    }
  }, [])

  const visibleRecipes = useMemo(() => {
    const sorted = [...recipes].sort((a, b) => {
      if (a.isQueued !== b.isQueued) return a.isQueued ? -1 : 1
      const baseResult = recipeSorters[sortField](a, b)
      return sortDirection === 'asc' ? baseResult : -baseResult
    })

    return sorted.filter((recipe) => {
      if (recipe.isDeleted) return false
      return showArchivedOnly ? recipe.isArchived : !recipe.isArchived
    })
  }, [recipes, showArchivedOnly, sortDirection, sortField])

  const totalPages = Math.max(1, Math.ceil(visibleRecipes.length / RECIPES_PER_PAGE))
  const normalizedPage = Math.min(currentPage, totalPages)
  const paginatedRecipes = visibleRecipes.slice(0, normalizedPage * RECIPES_PER_PAGE)
  const hasMoreRecipes = normalizedPage < totalPages
  const shouldShowPagination = visibleRecipes.length > RECIPES_PER_PAGE
  const paginationItems = Array.from({ length: totalPages }, (_, index) => index + 1)

  useEffect(() => {
    if (normalizedPage !== currentPage) {
      setCurrentPage(normalizedPage)
      setPageInUrl(normalizedPage, { replace: true })
    }
  }, [currentPage, normalizedPage])

  useEffect(() => {
    if (!shouldScrollToRecipes || !recipeListRef.current) {
      return
    }

    const targetTop = window.scrollY + recipeListRef.current.getBoundingClientRect().top
    const startTop = window.scrollY
    const animationDurationMs = 300
    const animationStart = performance.now()

    const animateScroll = (timestamp) => {
      const elapsed = timestamp - animationStart
      const progress = Math.min(elapsed / animationDurationMs, 1)
      const easedProgress = 1 - (1 - progress) ** 3
      const nextTop = startTop + (targetTop - startTop) * easedProgress

      window.scrollTo(0, nextTop)

      if (progress < 1) {
        window.requestAnimationFrame(animateScroll)
        return
      }

      setShouldScrollToRecipes(false)
    }

    window.requestAnimationFrame(animateScroll)
  }, [normalizedPage, shouldScrollToRecipes])

  const setPaginationPage = (nextPage) => {
    if (nextPage === normalizedPage) return

    setShouldScrollToRecipes(true)
    setCurrentPage(nextPage)
    setPageInUrl(nextPage)
  }

  const loadMoreRecipes = () => {
    const nextPage = normalizedPage + 1

    if (nextPage > totalPages) return

    setCurrentPage(nextPage)
    setPageInUrl(nextPage)
  }

  const scrollToTopAndFirstPage = () => {
    if (normalizedPage !== 1) {
      setCurrentPage(1)
      setPageInUrl(1)
    }

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const openCreateForm = () => {
    setEditingId(null)
    setFormValues(emptyForm)
    setIsFormVisible(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const resetForm = () => {
    setEditingId(null)
    setFormValues(emptyForm)
    setIsFormVisible(false)
  }

  const submitForm = (event) => {
    event.preventDefault()

    const now = new Date().toISOString().slice(0, 10)

    if (editingId) {
      setRecipes((prev) =>
        prev.map((recipe) =>
          recipe.id === editingId
            ? {
                ...recipe,
                ...formValues,
              }
            : recipe,
        ),
      )
      resetForm()
      return
    }

    setRecipes((prev) => [
      {
        id: crypto.randomUUID(),
        createdAt: now,
        lastCookedAt: null,
        cookCount: 0,
        isArchived: false,
        isDeleted: false,
        ...formValues,
      },
      ...prev,
    ])

    resetForm()
  }

  return (
    <div className="mx-auto max-w-5xl px-3 pb-14 pt-5 text-slate-100 sm:px-4 sm:pt-9">
      <AppHeader onAddRecipe={openCreateForm} isFormVisible={isFormVisible} />

      {isFormVisible ? (
        <section className="mt-5 rounded-2xl border border-slate-700/60 bg-slate-900/40 p-3 sm:p-4">
          <h2 className="text-base font-semibold text-slate-100">
            {editingId ? 'Редактирование рецепта' : 'Новый рецепт'}
          </h2>
          <form className="mt-3 grid gap-2" onSubmit={submitForm}>
            <label className="text-sm text-slate-200">
              Название <span className="text-rose-400">*</span>
              <input
                className="input-base mt-1"
                placeholder="Название"
                required
                value={formValues.title}
                onChange={(event) => setFormValues((prev) => ({ ...prev, title: event.target.value }))}
              />
            </label>
            <label className="text-sm text-slate-200">
              Краткое описание <span className="text-rose-400">*</span>
              <textarea
                className="input-base mt-1 min-h-20"
                placeholder="Краткое описание"
                required
                value={formValues.description}
                onChange={(event) =>
                  setFormValues((prev) => ({ ...prev, description: event.target.value }))
                }
              />
            </label>
            <label className="text-sm text-slate-200">
              Ингредиенты
              <textarea
                className="input-base mt-1 min-h-24"
                placeholder="Ингредиенты"
                value={formValues.ingredients}
                onChange={(event) =>
                  setFormValues((prev) => ({ ...prev, ingredients: event.target.value }))
                }
              />
            </label>
            <label className="text-sm text-slate-200">
              Инструкции
              <textarea
                className="input-base mt-1 min-h-24"
                placeholder="Инструкции"
                value={formValues.instructions}
                onChange={(event) =>
                  setFormValues((prev) => ({ ...prev, instructions: event.target.value }))
                }
              />
            </label>
            <label className="text-sm text-slate-200">
              Ссылка на видео
              <input
                className="input-base mt-1"
                placeholder="Ссылка на видео"
                value={formValues.videoUrl}
                onChange={(event) =>
                  setFormValues((prev) => ({ ...prev, videoUrl: event.target.value }))
                }
              />
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-slate-200">
              <input
                type="checkbox"
                className="checkbox-base"
                checked={formValues.isQueued}
                onChange={(event) =>
                  setFormValues((prev) => ({ ...prev, isQueued: event.target.checked }))
                }
              />
              Добавить в очередь
            </label>

            <div className="flex flex-wrap gap-2">
              <button type="submit" className="btn-primary btn-emphasis">
                {editingId ? 'Сохранить' : 'Добавить'}
              </button>
              <button type="button" className="btn-secondary" onClick={resetForm}>
                {editingId ? 'Отменить' : 'Скрыть форму'}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <SortControls
        sortField={sortField}
        sortDirection={sortDirection}
        showArchivedOnly={showArchivedOnly}
        isLightweightView={isLightweightView}
        onSortChange={(nextSortField) => {
          if (nextSortField === sortField) {
            setSortDirection((prevDirection) => (prevDirection === 'asc' ? 'desc' : 'asc'))
            return
          }

          setSortField(nextSortField)
        }}
        onArchiveFilterChange={setShowArchivedOnly}
        onLightweightViewChange={setIsLightweightView}
      />

      <main ref={recipeListRef} className="mt-4 grid gap-4">
        {paginatedRecipes.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            isArchiveView={showArchivedOnly}
            isLightweightView={isLightweightView}
            onCooked={() => {
              const today = new Date().toISOString().slice(0, 10)
              setRecipes((prev) =>
                prev.map((item) =>
                  item.id === recipe.id
                    ? {
                        ...item,
                        cookCount: item.cookCount + 1,
                        lastCookedAt: today,
                        isQueued: false,
                      }
                    : item,
                ),
              )
            }}
            onArchive={() => {
              setRecipes((prev) =>
                prev.map((item) =>
                  item.id === recipe.id ? { ...item, isArchived: true } : item,
                ),
              )
            }}
            onRestore={() => {
              setRecipes((prev) =>
                prev.map((item) =>
                  item.id === recipe.id ? { ...item, isArchived: false } : item,
                ),
              )
            }}
            onEdit={() => {
              setEditingId(recipe.id)
              setIsFormVisible(true)
              setFormValues({
                title: recipe.title,
                description: recipe.description,
                ingredients: recipe.ingredients,
                instructions: recipe.instructions,
                videoUrl: recipe.videoUrl ?? '',
                isQueued: recipe.isQueued,
              })
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            onDelete={() => {
              setRecipes((prev) =>
                prev.map((item) =>
                  item.id === recipe.id ? { ...item, isDeleted: true } : item,
                ),
              )
              if (editingId === recipe.id) {
                resetForm()
              }
            }}
          />
        ))}
      </main>

      {shouldShowPagination ? (
        <section className="mt-6 flex flex-col items-center gap-3">
          <nav className="flex flex-wrap items-center justify-center gap-2" aria-label="Пагинация рецептов">
            {paginationItems.map((pageNumber) => (
              pageNumber === normalizedPage ? (
                <span
                  key={pageNumber}
                  className="btn-primary pointer-events-none opacity-70"
                  aria-current="page"
                >
                  {pageNumber}
                </span>
              ) : (
                <button
                  key={pageNumber}
                  type="button"
                  className="btn-secondary"
                  onClick={() => setPaginationPage(pageNumber)}
                >
                  {pageNumber}
                </button>
              )
            ))}
          </nav>

          {hasMoreRecipes ? (
            <button type="button" className="btn-secondary" onClick={loadMoreRecipes}>
              Показать ещё
            </button>
          ) : null}

          {normalizedPage > 1 ? (
            <button type="button" className="btn-secondary" onClick={scrollToTopAndFirstPage}>
              В начало
            </button>
          ) : null}
        </section>
      ) : null}
    </div>
  )
}
