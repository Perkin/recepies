import { useEffect, useRef } from 'react'
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

  useEffect(() => {
    let isMounted = true

    const restoreSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!isMounted) {
        return
      }

      const sessionUser = session?.user ?? null
      setCurrentUserEmail(sessionUser?.email ?? null)
      hasRestoredSessionRef.current = true
    }

    restoreSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const sessionUser = session?.user ?? null
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
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [addToast, setCurrentUserEmail])

  useEffect(() => {
    if (!hasRestoredSessionRef.current) {
      return undefined
    }

    const fingerprint = JSON.stringify(recipes)

    if (fingerprint === lastSyncedFingerprintRef.current) {
      return undefined
    }

    const runSync = async () => {
      if (isSyncingRef.current) {
        pendingSyncRef.current = true
        return
      }

      isSyncingRef.current = true

      try {
        const previousRecipes = recipeRepository.getRecipes()
        const previousRecipeIds = new Set(previousRecipes.map((recipe) => recipe.id))
        const { recipes: syncedRecipes, lastSyncTimestamp, authStatus } = await syncRecipes(
          recipes,
          recipeRepository.getLastSyncTimestamp(),
        )

        recipeRepository.saveRecipes(syncedRecipes)
        recipeRepository.saveLastSyncTimestamp(lastSyncTimestamp)
        lastSyncedFingerprintRef.current = JSON.stringify(syncedRecipes)

        setRecipes((currentRecipes) => (areRecipesEqual(currentRecipes, syncedRecipes) ? currentRecipes : syncedRecipes))

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
          void runSync()
        }
      }
    }

    syncTimeoutRef.current = window.setTimeout(() => {
      void runSync()
    }, SYNC_DELAY_MS)

    return () => {
      if (syncTimeoutRef.current) {
        window.clearTimeout(syncTimeoutRef.current)
      }
    }
  }, [addToast, onPulledNewRecipes, recipes, setRecipes])

  return {
    signIn,
    signOut,
    signUp,
  }
}
