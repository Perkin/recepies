import { useEffect, useMemo } from 'react'
import { RECIPES_PER_PAGE } from '../constants/recipes'
import { recipeSorters } from '../utils/recipeSorters'
import { setPageInUrl } from '../utils/pagination'

export function useRecipePagination({
  recipes,
  sortField,
  sortDirection,
  showArchivedOnly,
  currentPage,
  setCurrentPage,
}) {
  const visibleRecipes = useMemo(() => {
    const sorted = [...recipes].sort((a, b) => {
      if (a.isQueued !== b.isQueued) return a.isQueued ? -1 : 1
      const baseResult = recipeSorters[sortField](a, b)
      return sortDirection === 'asc' ? baseResult : -baseResult
    })

    return sorted.filter((recipe) => {
      if (recipe.deletedAt) return false
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
  }, [currentPage, normalizedPage, setCurrentPage])

  return {
    hasMoreRecipes,
    normalizedPage,
    paginatedRecipes,
    shouldShowPagination,
    totalPages,
  }
}
