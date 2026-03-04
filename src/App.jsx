import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ToastViewport } from './components/common/ToastViewport'
import { AppHeader } from './components/recipe/AppHeader'
import { AuthPanel } from './components/recipe/AuthPanel'
import { RecipeFormSection } from './components/recipe/RecipeFormSection'
import { RecipeList } from './components/recipe/RecipeList'
import { RecipePagination } from './components/recipe/RecipePagination'
import { SortControls } from './components/recipe/SortControls'
import { emptyRecipeForm, RECIPES_PER_PAGE } from './constants/recipes'
import { recipeRepository } from './repositories/recipeRepository'
import { recipeSorters } from './utils/recipeSorters.js'
import { getInitialPageFromUrl, setPageInUrl } from './utils/pagination'
import { signIn, signOut, signUp, supabase, syncRecipes } from './utils/supabase'

function areRecipesEqual(left, right) {
  if (left === right) {
    return true
  }

  if (left.length !== right.length) {
    return false
  }

  return left.every((recipe, index) => {
    const other = right[index]

    if (!other) {
      return false
    }

    return (
      recipe.id === other.id &&
      recipe.title === other.title &&
      recipe.description === other.description &&
      recipe.ingredients === other.ingredients &&
      recipe.instructions === other.instructions &&
      recipe.videoUrl === other.videoUrl &&
      recipe.cookCount === other.cookCount &&
      recipe.isArchived === other.isArchived &&
      recipe.isQueued === other.isQueued &&
      recipe.createdAt === other.createdAt &&
      recipe.updatedAt === other.updatedAt &&
      recipe.lastCookedAt === other.lastCookedAt &&
      recipe.deletedAt === other.deletedAt
    )
  })
}

export default function App() {
  const recipeListRef = useRef(null)
  const syncTimeoutRef = useRef(null)
  const isSyncInProgressRef = useRef(false)
  const hasShownSignedOutToastRef = useRef(false)
  const recipesRevisionRef = useRef(0)

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
  const [toasts, setToasts] = useState([])
  const [isAuthBusy, setIsAuthBusy] = useState(false)
  const [currentUserEmail, setCurrentUserEmail] = useState(null)
  const [authModalMode, setAuthModalMode] = useState(null)


  const addToast = useCallback((message, type = 'info') => {
    const id = crypto.randomUUID()

    setToasts((prev) => [...prev, { id, message, type }])

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, 4500)
  }, [])

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const runSync = useCallback(async () => {
    if (isSyncInProgressRef.current) {
      return
    }

    isSyncInProgressRef.current = true
    const syncStartRevision = recipesRevisionRef.current

    try {
      const localRecipes = recipeRepository.getRecipes()
      const lastSyncTimestamp = recipeRepository.getLastSyncTimestamp()
      const syncResult = await syncRecipes(localRecipes, lastSyncTimestamp)

      if (syncResult.authStatus === 'signed_out') {
        setCurrentUserEmail(null)

        if (!hasShownSignedOutToastRef.current) {
          addToast('Supabase sync: выполнен офлайн-режим, войдите для синхронизации', 'info')
          hasShownSignedOutToastRef.current = true
        }

        return
      }

      hasShownSignedOutToastRef.current = false

      if (syncStartRevision !== recipesRevisionRef.current) {
        return
      }

      recipeRepository.saveLastSyncTimestamp(syncResult.lastSyncTimestamp)

      setRecipes((currentRecipes) => {
        if (areRecipesEqual(currentRecipes, syncResult.recipes)) {
          return currentRecipes
        }

        recipeRepository.saveRecipes(syncResult.recipes)
        return syncResult.recipes
      })

      if (syncResult.stats.pushedCount || syncResult.stats.pulledCount) {
        addToast(
          `Supabase: отправлено ${syncResult.stats.pushedCount}, получено ${syncResult.stats.pulledCount}`,
          'success',
        )
      }
    } catch (error) {
      addToast(`Supabase sync: ${error.message ?? 'Неизвестная ошибка'}`, 'error')
    } finally {
      isSyncInProgressRef.current = false
    }
  }, [addToast])

  useEffect(() => {
    recipesRevisionRef.current += 1
    recipeRepository.saveRecipes(recipes)

    if (syncTimeoutRef.current) {
      window.clearTimeout(syncTimeoutRef.current)
    }

    syncTimeoutRef.current = window.setTimeout(() => {
      runSync()
    }, 800)

    return () => {
      if (syncTimeoutRef.current) {
        window.clearTimeout(syncTimeoutRef.current)
      }
    }
  }, [recipes, runSync])

  useEffect(() => {
    recipeRepository.saveIsLightweightView(isLightweightView)
  }, [isLightweightView])

  useEffect(() => {
    runSync()

    const handleOnline = () => {
      runSync()
    }

    window.addEventListener('online', handleOnline)

    return () => {
      window.removeEventListener('online', handleOnline)
    }
  }, [runSync])

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const sessionUser = session?.user ?? null
      setCurrentUserEmail(sessionUser?.email ?? null)

      if ((event === 'INITIAL_SESSION' || event === 'SIGNED_IN') && sessionUser) {
        runSync()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [runSync])

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

  const handleSignIn = async (email, password) => {
    setIsAuthBusy(true)

    try {
      const data = await signIn(email, password)
      const sessionUser = data.user ?? data.session?.user ?? null
      setCurrentUserEmail(sessionUser?.email ?? email)
      addToast('Supabase auth: вход выполнен', 'success')
      setAuthModalMode(null)
    } catch (error) {
      addToast(`Supabase auth: ${error.message ?? 'Не удалось войти'}`, 'error')
    } finally {
      setIsAuthBusy(false)
    }
  }

  const handleSignUp = async (email, password) => {
    setIsAuthBusy(true)

    try {
      const signUpResult = await signUp(email, password)

      if (signUpResult.isExistingAccount) {
        addToast('Supabase auth: аккаунт уже существует. Войдите через форму входа.', 'info')
        setAuthModalMode('signin')
        return
      }

      addToast('Supabase auth: регистрация выполнена. Подтвердите email, если включено подтверждение.', 'success')
      setAuthModalMode(null)
    } catch (error) {
      addToast(`Supabase auth: ${error.message ?? 'Не удалось зарегистрироваться'}`, 'error')
    } finally {
      setIsAuthBusy(false)
    }
  }

  const handleSignOut = async () => {
    setIsAuthBusy(true)

    try {
      await signOut()
      setCurrentUserEmail(null)
      addToast('Supabase auth: выход выполнен', 'success')
    } catch (error) {
      addToast(`Supabase auth: ${error.message ?? 'Не удалось выйти'}`, 'error')
    } finally {
      setIsAuthBusy(false)
    }
  }

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

    const now = new Date().toISOString()

    if (editingId) {
      setRecipes((prev) =>
        prev.map((recipe) =>
          recipe.id === editingId
            ? {
                ...recipe,
                ...formValues,
                updatedAt: now,
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
        updatedAt: now,
        lastCookedAt: null,
        cookCount: 0,
        isArchived: false,
        deletedAt: null,
        ...formValues,
      },
      ...prev,
    ])

    closeForm()
  }

  const handleCooked = (recipe) => {
    const now = new Date().toISOString()
    setRecipes((prev) =>
      prev.map((item) =>
        item.id === recipe.id
          ? {
              ...item,
              cookCount: item.cookCount + 1,
              lastCookedAt: now,
              isQueued: false,
              updatedAt: now,
            }
          : item,
      ),
    )
  }

  const handleArchive = (recipe) => {
    const now = new Date().toISOString()
    setRecipes((prev) =>
      prev.map((item) => (item.id === recipe.id ? { ...item, isArchived: true, updatedAt: now } : item)),
    )
  }

  const handleRestore = (recipe) => {
    const now = new Date().toISOString()
    setRecipes((prev) =>
      prev.map((item) => (item.id === recipe.id ? { ...item, isArchived: false, updatedAt: now } : item)),
    )
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

    const now = new Date().toISOString()
    setRecipes((prev) =>
      prev.map((item) => (item.id === recipe.id ? { ...item, deletedAt: now, updatedAt: now } : item)),
    )

    if (editingId === recipe.id) {
      closeForm()
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-3 pb-14 pt-5 text-slate-100 sm:px-4 sm:pt-9">
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />

      <AppHeader
        onAddRecipe={openCreateForm}
        isFormVisible={isFormVisible}
        userEmail={currentUserEmail}
        isAuthBusy={isAuthBusy}
        onOpenSignIn={() => setAuthModalMode('signin')}
        onOpenSignUp={() => setAuthModalMode('signup')}
        onSignOut={handleSignOut}
      />
      {authModalMode ? (
        <AuthPanel
          mode={authModalMode}
          isBusy={isAuthBusy}
          onClose={() => setAuthModalMode(null)}
          onSignIn={handleSignIn}
          onSignUp={handleSignUp}
        />
      ) : null}

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
