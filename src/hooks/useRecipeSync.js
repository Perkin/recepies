import { useCallback, useEffect, useRef } from 'react'
import { recipeRepository } from '../repositories/recipeRepository'
import { signIn, signOut, signUp, supabase, syncRecipes } from '../utils/supabase'

const SYNC_DELAY_MS = 750

function mergeRecipesByNewestUpdate(localRecipes, syncedRecipes) {
  const recipesById = new Map(localRecipes.map((recipe) => [recipe.id, recipe]))

  syncedRecipes.forEach((syncedRecipe) => {
    const localRecipe = recipesById.get(syncedRecipe.id)

    if (!localRecipe) {
      recipesById.set(syncedRecipe.id, syncedRecipe)
      return
    }

    const localUpdatedAt = localRecipe.updatedAt ?? localRecipe.createdAt ?? ''
    const syncedUpdatedAt = syncedRecipe.updatedAt ?? syncedRecipe.createdAt ?? ''

    if (syncedUpdatedAt > localUpdatedAt) {
      recipesById.set(syncedRecipe.id, syncedRecipe)
    }
  })

  return [...recipesById.values()].sort((left, right) => {
    const leftUpdatedAt = left.updatedAt ?? left.createdAt ?? ''
    const rightUpdatedAt = right.updatedAt ?? right.createdAt ?? ''

    if (leftUpdatedAt !== rightUpdatedAt) {
      return rightUpdatedAt.localeCompare(leftUpdatedAt)
    }

    const leftCreatedAt = left.createdAt ?? ''
    const rightCreatedAt = right.createdAt ?? ''

    if (leftCreatedAt !== rightCreatedAt) {
      return rightCreatedAt.localeCompare(leftCreatedAt)
    }

    return left.id.localeCompare(right.id)
  })
}

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

export function useRecipeSync({ recipes, setRecipes, addToast, setCurrentUserEmail, onPulledNewRecipes }) {
  const hasRestoredSessionRef = useRef(false)
  const hasShownSignedOutToastRef = useRef(false)
  const syncTimeoutRef = useRef(null)
  const isSyncingRef = useRef(false)
  const pendingSyncRef = useRef(false)
  const lastSyncedFingerprintRef = useRef(null)
  const latestRecipesRef = useRef(recipes)
  const hasCompletedInitialSyncRef = useRef(false)
  const lastProcessedLocalUpdateRef = useRef(recipeRepository.getLastLocalUpdateTimestamp())
  const currentUserRef = useRef(undefined)

  latestRecipesRef.current = recipes

  const runSync = useCallback(async ({ pullRemote } = { pullRemote: true }) => {
    if (isSyncingRef.current) {
      pendingSyncRef.current = true
      return
    }

    isSyncingRef.current = true

    try {
      const currentRecipes = latestRecipesRef.current
      const syncStartLocalTimestamp = recipeRepository.getLastLocalUpdateTimestamp()
      const previousRecipes = recipeRepository.getRecipes()
      const previousRecipeIds = new Set(previousRecipes.map((recipe) => recipe.id))
      const { recipes: syncedRecipes, lastSyncTimestamp, authStatus } = await syncRecipes(
        currentRecipes,
        recipeRepository.getLastSyncTimestamp(),
        { pullRemote, currentUser: currentUserRef.current },
      )
      const localTimestampAfterSync = recipeRepository.getLastLocalUpdateTimestamp()
      const shouldMergeWithLatestLocal =
        Boolean(syncStartLocalTimestamp) &&
        localTimestampAfterSync &&
        localTimestampAfterSync !== syncStartLocalTimestamp
      const finalRecipes = shouldMergeWithLatestLocal
        ? mergeRecipesByNewestUpdate(latestRecipesRef.current, syncedRecipes)
        : syncedRecipes

      recipeRepository.saveRecipes(finalRecipes)
      recipeRepository.saveLastSyncTimestamp(lastSyncTimestamp)
      lastSyncedFingerprintRef.current = JSON.stringify(finalRecipes)

      setRecipes((existingRecipes) => (areRecipesEqual(existingRecipes, finalRecipes) ? existingRecipes : finalRecipes))
      hasCompletedInitialSyncRef.current = true

      if (authStatus === 'signed_in') {
        const pulledNewRecipeIds = finalRecipes
          .filter((recipe) => !previousRecipeIds.has(recipe.id))
          .map((recipe) => recipe.id)

        if (pulledNewRecipeIds.length > 0) {
          onPulledNewRecipes?.(pulledNewRecipeIds)
        }
      }
    } catch (error) {
      addToast(`Supabase sync: ${error.message ?? 'Неизвестная ошибка'}`, 'error')
    } finally {
      isSyncingRef.current = false

      if (pendingSyncRef.current) {
        pendingSyncRef.current = false
        void runSync({ pullRemote })
      }
    }
  }, [addToast, onPulledNewRecipes, setRecipes])

  useEffect(() => {
    let isMounted = true

    const restoreSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!isMounted) {
          return
        }

        const sessionUser = session?.user ?? null
        currentUserRef.current = sessionUser
        setCurrentUserEmail(sessionUser?.email ?? null)
      } catch (error) {
        if (isMounted) {
          addToast(`Supabase auth: ${error.message ?? 'Не удалось восстановить сессию'}`, 'error')
        }
      } finally {
        if (isMounted) {
          hasRestoredSessionRef.current = true
          void runSync({ pullRemote: true })
        }
      }
    }

    restoreSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const sessionUser = session?.user ?? null
      currentUserRef.current = sessionUser
      setCurrentUserEmail(sessionUser?.email ?? null)

      if (event === 'SIGNED_OUT') {
        recipeRepository.saveLastSyncTimestamp(null)
        lastSyncedFingerprintRef.current = null

        if (!hasShownSignedOutToastRef.current) {
          addToast('Supabase sync: выполнен офлайн-режим, войдите для синхронизации', 'info')
          hasShownSignedOutToastRef.current = true
        }
      }

      if (event === 'SIGNED_IN') {
        hasShownSignedOutToastRef.current = false
      }

      if (hasRestoredSessionRef.current && ['SIGNED_IN', 'INITIAL_SESSION', 'TOKEN_REFRESHED'].includes(event)) {
        void runSync({ pullRemote: true })
      }
    })

    const handleWindowFocus = () => {
      if (!hasRestoredSessionRef.current) {
        return
      }

      void runSync({ pullRemote: true })
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible' || !hasRestoredSessionRef.current) {
        return
      }

      void runSync({ pullRemote: true })
    }

    window.addEventListener('focus', handleWindowFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      isMounted = false
      subscription.unsubscribe()
      window.removeEventListener('focus', handleWindowFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [addToast, runSync, setCurrentUserEmail])

  useEffect(() => {
    if (!hasRestoredSessionRef.current || !hasCompletedInitialSyncRef.current) {
      return undefined
    }

    const localUpdateTimestamp = recipeRepository.getLastLocalUpdateTimestamp()

    if (!localUpdateTimestamp || localUpdateTimestamp === lastProcessedLocalUpdateRef.current) {
      return undefined
    }

    const fingerprint = JSON.stringify(recipes)

    if (fingerprint === lastSyncedFingerprintRef.current) {
      lastProcessedLocalUpdateRef.current = localUpdateTimestamp
      return undefined
    }

    syncTimeoutRef.current = window.setTimeout(() => {
      lastProcessedLocalUpdateRef.current = localUpdateTimestamp
      void runSync({ pullRemote: false })
    }, SYNC_DELAY_MS)

    return () => {
      if (syncTimeoutRef.current) {
        window.clearTimeout(syncTimeoutRef.current)
      }
    }
  }, [recipes, runSync])

  return {
    signIn,
    signOut,
    signUp,
  }
}
