import { useEffect, useMemo, useRef, useState } from 'react'
import { AppHeader } from './components/recipe/AppHeader'
import { RecipeFormSection } from './components/recipe/RecipeFormSection'
import { RecipeList } from './components/recipe/RecipeList'
import { RecipePagination } from './components/recipe/RecipePagination'
import { SortControls } from './components/recipe/SortControls'
import { emptyRecipeForm, RECIPES_PER_PAGE } from './constants/recipes'
import { recipeRepository } from './repositories/recipeRepository'
import { recipeSorters } from './utils/recipeSorters.js'
import { getInitialPageFromUrl, setPageInUrl } from './utils/pagination'

export default function App() {
  const recipeListRef = useRef(null)
  const [recipes, setRecipes] = useState(() => recipeRepository.getRecipes())
  const [currentPage, setCurrentPage] = useState(getInitialPageFromUrl)
  const [sortField, setSortField] = useState('createdAt')
  const [sortDirection, setSortDirection] = useState('desc')
  const [showArchivedOnly, setShowArchivedOnly] = useState(false)
  const [isLightweightView, setIsLightweightView] = useState(() => recipeRepository.getIsLightweightView())
  const [editingId, setEditingId] = useState(null)
  const [formValues, setFormValues] = useState(emptyRecipeForm)
  const [isFormVisible, setIsFormVisible] = useState(false)
  const [shouldScrollToRecipes, setShouldScrollToRecipes] = useState(false)
  const [returnScrollRecipeId, setReturnScrollRecipeId] = useState(null)

  useEffect(() => {
    recipeRepository.saveRecipes(recipes)
  }, [recipes])

  useEffect(() => {
    recipeRepository.saveIsLightweightView(isLightweightView)
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

  useEffect(() => {
    if (!returnScrollRecipeId) {
      return
    }

    const cardElement = document.querySelector(`[data-recipe-id="${returnScrollRecipeId}"]`)

    if (cardElement) {
      cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }

    setReturnScrollRecipeId(null)
  }, [returnScrollRecipeId, paginatedRecipes])

  const openCreateForm = () => {
    setEditingId(null)
    setFormValues(emptyRecipeForm)
    setIsFormVisible(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const closeForm = ({ shouldReturnToCard = false } = {}) => {
    if (shouldReturnToCard && editingId) {
      setReturnScrollRecipeId(editingId)
    }

    setEditingId(null)
    setFormValues(emptyRecipeForm)
    setIsFormVisible(false)
  }

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
      closeForm({ shouldReturnToCard: true })
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

    closeForm()
  }

  const handleCooked = (recipe) => {
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
  }

  const handleArchive = (recipe) => {
    setRecipes((prev) => prev.map((item) => (item.id === recipe.id ? { ...item, isArchived: true } : item)))
  }

  const handleRestore = (recipe) => {
    setRecipes((prev) => prev.map((item) => (item.id === recipe.id ? { ...item, isArchived: false } : item)))
  }

  const handleEdit = (recipe) => {
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
  }

  const handleDelete = (recipe) => {
    const isConfirmed = window.confirm(`Удалить рецепт «${recipe.title}»?`)

    if (!isConfirmed) {
      return
    }

    setRecipes((prev) => prev.map((item) => (item.id === recipe.id ? { ...item, isDeleted: true } : item)))

    if (editingId === recipe.id) {
      closeForm()
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-3 pb-14 pt-5 text-slate-100 sm:px-4 sm:pt-9">
      <AppHeader onAddRecipe={openCreateForm} isFormVisible={isFormVisible} />

      {isFormVisible ? (
        <RecipeFormSection
          isEditing={Boolean(editingId)}
          values={formValues}
          onChange={setFormValues}
          onSubmit={submitForm}
          onCancel={() => closeForm({ shouldReturnToCard: Boolean(editingId) })}
        />
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

      <RecipeList
        listRef={recipeListRef}
        recipes={paginatedRecipes}
        isArchiveView={showArchivedOnly}
        isLightweightView={isLightweightView}
        onCooked={handleCooked}
        onArchive={handleArchive}
        onRestore={handleRestore}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {shouldShowPagination ? (
        <RecipePagination
          currentPage={normalizedPage}
          totalPages={totalPages}
          hasMoreRecipes={hasMoreRecipes}
          onPageChange={setPaginationPage}
          onLoadMore={loadMoreRecipes}
          onScrollToTop={scrollToTopAndFirstPage}
        />
      ) : null}
    </div>
  )
}
