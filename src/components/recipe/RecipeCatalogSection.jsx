import { useCallback, useEffect, useRef, useState } from 'react'
import { SortControls } from './SortControls'
import { RecipeList } from './RecipeList'
import { RecipePagination } from './RecipePagination'
import { useRecipePagination } from '../../hooks/useRecipePagination'
import { recipeRepository } from '../../repositories/recipeRepository'
import { getInitialPageFromUrl, setPageInUrl } from '../../utils/pagination'

export function RecipeCatalogSection({
  recipes,
  newRecipeIds,
  onCooked,
  onQueue,
  onArchive,
  onRestore,
  onEdit,
  onDelete,
}) {
  const recipeListRef = useRef(null)
  const [currentPage, setCurrentPage] = useState(getInitialPageFromUrl)
  const [sortField, setSortField] = useState('createdAt')
  const [sortDirection, setSortDirection] = useState('desc')
  const [showArchivedOnly, setShowArchivedOnly] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [isLightweightView, setIsLightweightView] = useState(() => recipeRepository.getIsLightweightView())
  const [shouldScrollToRecipes, setShouldScrollToRecipes] = useState(false)

  const animateWindowScrollTo = useCallback((targetTop, durationMs = 300) => {
    const startTop = window.scrollY
    const safeTargetTop = Math.max(0, targetTop)
    const animationStart = performance.now()

    const animateScroll = (timestamp) => {
      const elapsed = timestamp - animationStart
      const progress = Math.min(elapsed / durationMs, 1)
      const easedProgress = 1 - (1 - progress) ** 3
      const nextTop = startTop + (safeTargetTop - startTop) * easedProgress

      window.scrollTo(0, nextTop)

      if (progress < 1) {
        window.requestAnimationFrame(animateScroll)
      }
    }

    window.requestAnimationFrame(animateScroll)
  }, [])

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

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [searchQuery])

  const { hasMoreRecipes, normalizedPage, paginatedRecipes, shouldShowPagination, totalPages } = useRecipePagination({
    recipes,
    sortField,
    sortDirection,
    showArchivedOnly,
    currentPage,
    setCurrentPage,
    searchQuery: debouncedSearchQuery,
  })

  useEffect(() => {
    if (!shouldScrollToRecipes || !recipeListRef.current) {
      return
    }

    const targetTop = window.scrollY + recipeListRef.current.getBoundingClientRect().top
    animateWindowScrollTo(targetTop)
    setShouldScrollToRecipes(false)
  }, [animateWindowScrollTo, normalizedPage, shouldScrollToRecipes])

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

  return (
    <>
      <SortControls
        sortField={sortField}
        sortDirection={sortDirection}
        showArchivedOnly={showArchivedOnly}
        isLightweightView={isLightweightView}
        searchQuery={searchQuery}
        onSortChange={(nextSortField) => {
          if (nextSortField === sortField) {
            setSortDirection((prevDirection) => (prevDirection === 'asc' ? 'desc' : 'asc'))
            return
          }

          setSortField(nextSortField)
        }}
        onSearchQueryChange={setSearchQuery}
        onArchiveFilterChange={setShowArchivedOnly}
        onLightweightViewChange={setIsLightweightView}
      />

      <RecipeList
        listRef={recipeListRef}
        recipes={paginatedRecipes}
        newRecipeIds={newRecipeIds}
        isArchiveView={showArchivedOnly}
        isLightweightView={isLightweightView}
        onCooked={onCooked}
        onQueue={onQueue}
        onArchive={onArchive}
        onRestore={onRestore}
        onEdit={onEdit}
        onDelete={onDelete}
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
    </>
  )
}
