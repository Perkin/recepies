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
  searchQuery,
  appendedFromPage,
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

  const normalizedSearchQuery = searchQuery.trim().toLowerCase()
  const isQuickSearchActive = normalizedSearchQuery.length >= 3

  const filteredRecipes = useMemo(() => {
    if (!isQuickSearchActive) {
      return visibleRecipes
    }

    const titleMatches = []
    const contentMatches = []

    visibleRecipes.forEach((recipe) => {
      const normalizedTitle = recipe.title.toLowerCase()
      const normalizedIngredients = recipe.ingredients.toLowerCase()
      const normalizedInstructions = recipe.instructions.toLowerCase()

      if (normalizedTitle.includes(normalizedSearchQuery)) {
        titleMatches.push(recipe)
        return
      }

      if (normalizedIngredients.includes(normalizedSearchQuery) || normalizedInstructions.includes(normalizedSearchQuery)) {
        contentMatches.push(recipe)
      }
    })

    return [...titleMatches, ...contentMatches]
  }, [isQuickSearchActive, normalizedSearchQuery, visibleRecipes])

  const totalPages = isQuickSearchActive ? 1 : Math.max(1, Math.ceil(filteredRecipes.length / RECIPES_PER_PAGE))
  const normalizedPage = isQuickSearchActive ? 1 : Math.min(currentPage, totalPages)
  const normalizedAppendedFromPage = isQuickSearchActive
    ? null
    : appendedFromPage == null
      ? null
      : Math.min(appendedFromPage, normalizedPage)
  const pageStartIndex = normalizedAppendedFromPage == null ? (normalizedPage - 1) * RECIPES_PER_PAGE : 0
  const pageEndIndex = normalizedPage * RECIPES_PER_PAGE
  const paginatedRecipes = isQuickSearchActive
    ? filteredRecipes
    : filteredRecipes.slice(pageStartIndex, pageEndIndex)
  const hasMoreRecipes = isQuickSearchActive ? false : normalizedPage < totalPages
  const shouldShowPagination = isQuickSearchActive ? false : filteredRecipes.length > RECIPES_PER_PAGE

  useEffect(() => {
    if (normalizedPage !== currentPage) {
      setCurrentPage(normalizedPage)
      setPageInUrl(normalizedPage, { replace: true })
    }
  }, [currentPage, isQuickSearchActive, normalizedPage, setCurrentPage])

  return {
    hasMoreRecipes,
    normalizedPage,
    paginatedRecipes,
    shouldShowPagination,
    totalPages,
  }
}
