import { useCallback, useEffect, useRef } from 'react'
import { recipeRepository } from '../repositories/recipeRepository'
import { signIn, signOut, signUp, supabase, syncRecipes } from '../utils/supabase'

const SYNC_DELAY_MS = 750

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
      const previousRecipes = recipeRepository.getRecipes()
      const previousRecipeIds = new Set(previousRecipes.map((recipe) => recipe.id))
      const { recipes: syncedRecipes, lastSyncTimestamp, authStatus } = await syncRecipes(
        currentRecipes,
        recipeRepository.getLastSyncTimestamp(),
        { pullRemote, currentUser: currentUserRef.current },
      )

      recipeRepository.saveRecipes(syncedRecipes)
      recipeRepository.saveLastSyncTimestamp(lastSyncTimestamp)
      lastSyncedFingerprintRef.current = JSON.stringify(syncedRecipes)

      setRecipes((existingRecipes) => (areRecipesEqual(existingRecipes, syncedRecipes) ? existingRecipes : syncedRecipes))
      hasCompletedInitialSyncRef.current = true

      if (authStatus === 'signed_in') {
        const pulledNewRecipeIds = syncedRecipes
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
        if (!isMounted) {
          return
        }

        hasRestoredSessionRef.current = true
        void runSync({ pullRemote: true })
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
