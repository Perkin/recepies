import { useCallback, useEffect, useRef } from 'react'
import { recipeRepository } from '../repositories/recipeRepository'
import { signIn, signOut, signUp, supabase, syncRecipes } from '../utils/supabase'

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

export function useRecipeSync({ recipes, setRecipes, addToast, setCurrentUserEmail }) {
  const syncTimeoutRef = useRef(null)
  const isSyncInProgressRef = useRef(false)
  const hasShownSignedOutToastRef = useRef(false)
  const recipesRevisionRef = useRef(0)

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
  }, [addToast, setCurrentUserEmail, setRecipes])

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
  }, [runSync, setCurrentUserEmail])

  return {
    signIn,
    signOut,
    signUp,
  }
}
