import { useCallback, useEffect, useState } from 'react'
import { ToastViewport } from './components/common/ToastViewport'
import { AppHeader } from './components/recipe/AppHeader'
import { RecipeFormSection } from './components/recipe/RecipeFormSection'
import { RecipeCatalogSection } from './components/recipe/RecipeCatalogSection'
import { RecipeOverlays } from './components/recipe/RecipeOverlays'
import { useRecipeSync } from './hooks/useRecipeSync'
import { useToasts } from './hooks/useToasts'
import { useRecipeFormControls } from './hooks/useRecipeFormControls'
import { recipeRepository } from './repositories/recipeRepository'

export default function App() {
  const [recipes, setRecipes] = useState(() => recipeRepository.getRecipes())
  const [isAuthBusy, setIsAuthBusy] = useState(false)
  const [currentUserEmail, setCurrentUserEmail] = useState(null)
  const [authModalMode, setAuthModalMode] = useState(null)
  const [newRecipeIds, setNewRecipeIds] = useState([])

  const { toasts, addToast, dismissToast } = useToasts()

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

  const applyLocalRecipesChange = useCallback((updater) => {
    setRecipes((prevRecipes) => {
      const nextRecipes = typeof updater === 'function' ? updater(prevRecipes) : updater
      const localUpdateTimestamp = new Date().toISOString()

      recipeRepository.saveRecipes(nextRecipes)
      recipeRepository.saveLastLocalUpdateTimestamp(localUpdateTimestamp)

      return nextRecipes
    })
  }, [])

  const {
    editingId,
    formValues,
    isFormVisible,
    returnScrollRecipeId,
    recipePendingDeletion,
    setFormValues,
    setReturnScrollRecipeId,
    setRecipePendingDeletion,
    openCreateForm,
    closeForm,
    submitForm,
    handleEdit,
    handleDelete,
    handleDeleteConfirmed,
  } = useRecipeFormControls({
    recipes,
    applyLocalRecipesChange,
    animateWindowScrollTo,
  })

  const { signIn, signOut, signUp } = useRecipeSync({
    recipes,
    setRecipes,
    addToast,
    setCurrentUserEmail,
    onPulledNewRecipes: (pulledIds) => {
      setNewRecipeIds((prevIds) => [...new Set([...prevIds, ...pulledIds])])
    },
  })

  useEffect(() => {
    if (!returnScrollRecipeId) {
      return
    }

    const cardElement = document.querySelector(`[data-recipe-id="${returnScrollRecipeId}"]`)

    if (cardElement) {
      const cardRect = cardElement.getBoundingClientRect()
      const targetTop = window.scrollY + cardRect.top - (window.innerHeight - cardRect.height) / 2

      animateWindowScrollTo(targetTop)
    }

    setReturnScrollRecipeId(null)
  }, [animateWindowScrollTo, returnScrollRecipeId, recipes, setReturnScrollRecipeId])

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

  const handleCooked = (recipe) => {
    const now = new Date().toISOString()
    applyLocalRecipesChange((prev) =>
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

  const handleQueue = (recipe) => {
    const now = new Date().toISOString()
    applyLocalRecipesChange((prev) =>
      prev.map((item) =>
        item.id === recipe.id
          ? {
              ...item,
              isQueued: !item.isQueued,
              updatedAt: now,
            }
          : item,
      ),
    )
  }

  const handleArchive = (recipe) => {
    const now = new Date().toISOString()
    applyLocalRecipesChange((prev) =>
      prev.map((item) => (item.id === recipe.id ? { ...item, isArchived: true, updatedAt: now } : item)),
    )
  }

  const handleRestore = (recipe) => {
    const now = new Date().toISOString()
    applyLocalRecipesChange((prev) =>
      prev.map((item) => (item.id === recipe.id ? { ...item, isArchived: false, updatedAt: now } : item)),
    )
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

      <RecipeOverlays
        authModalMode={authModalMode}
        isAuthBusy={isAuthBusy}
        onCloseAuth={() => setAuthModalMode(null)}
        onSignIn={handleSignIn}
        onSignUp={handleSignUp}
        recipePendingDeletion={recipePendingDeletion}
        onCancelDelete={() => setRecipePendingDeletion(null)}
        onConfirmDelete={handleDeleteConfirmed}
      />

      {isFormVisible ? (
        <RecipeFormSection
          isEditing={Boolean(editingId)}
          values={formValues}
          onChange={setFormValues}
          onSubmit={submitForm}
          onCancel={() => closeForm({ shouldReturnToCard: Boolean(editingId) })}
        />
      ) : null}

      <RecipeCatalogSection
        recipes={recipes}
        newRecipeIds={newRecipeIds}
        onCooked={handleCooked}
        onQueue={handleQueue}
        onArchive={handleArchive}
        onRestore={handleRestore}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  )
}
