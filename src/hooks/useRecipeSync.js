import { useEffect, useRef } from 'react'
import { recipeRepository } from '../repositories/recipeRepository'
import { fetchRecipesSnapshot, signIn, signOut, signUp, supabase } from '../utils/supabase'

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

export function useRecipeSync({ setRecipes, addToast, setCurrentUserEmail, onPulledNewRecipes }) {
  const hasLoadedRemoteRecipesRef = useRef(false)
  const hasShownSignedOutToastRef = useRef(false)


  useEffect(() => {
    let isMounted = true

    const restoreSessionAndLoadRecipes = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!isMounted) {
        return
      }

      const sessionUser = session?.user ?? null
      setCurrentUserEmail(sessionUser?.email ?? null)

      if (!sessionUser || hasLoadedRemoteRecipesRef.current) {
        return
      }

      hasLoadedRemoteRecipesRef.current = true

      try {
        const localRecipes = recipeRepository.getRecipes()
        const localRecipeIds = new Set(localRecipes.map((recipe) => recipe.id))
        const remoteRecipes = await fetchRecipesSnapshot(sessionUser.id)

        if (!isMounted) {
          return
        }

        setRecipes((currentRecipes) => {
          if (areRecipesEqual(currentRecipes, remoteRecipes)) {
            return currentRecipes
          }

          recipeRepository.saveRecipes(remoteRecipes)
          return remoteRecipes
        })

        const pulledNewRecipeIds = remoteRecipes
          .filter((recipe) => !localRecipeIds.has(recipe.id))
          .map((recipe) => recipe.id)

        if (pulledNewRecipeIds.length > 0) {
          onPulledNewRecipes?.(pulledNewRecipeIds)
        }
      } catch (error) {
        if (!isMounted) {
          return
        }

        addToast(`Supabase sync: ${error.message ?? 'Неизвестная ошибка'}`, 'error')
      }
    }

    restoreSessionAndLoadRecipes()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const sessionUser = session?.user ?? null
      setCurrentUserEmail(sessionUser?.email ?? null)

      if (event === 'SIGNED_OUT') {
        hasLoadedRemoteRecipesRef.current = false

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
  }, [addToast, onPulledNewRecipes, setCurrentUserEmail, setRecipes])

  return {
    signIn,
    signOut,
    signUp,
  }
}
