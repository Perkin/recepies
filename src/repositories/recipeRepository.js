import {
  LAST_LOCAL_UPDATE_STORAGE_KEY,
  LAST_SYNC_TIMESTAMP_STORAGE_KEY,
  LIGHTWEIGHT_VIEW_STORAGE_KEY,
  STORAGE_KEY,
} from '../constants/recipes'

function readJson(key, fallbackValue) {
  const raw = localStorage.getItem(key)

  if (!raw) {
    return fallbackValue
  }

  try {
    return JSON.parse(raw)
  } catch {
    return fallbackValue
  }
}

function normalizeRecipe(recipe) {
  return {
    ...recipe,
    deletedAt: recipe.deletedAt ?? null,
    updatedAt: recipe.updatedAt ?? recipe.createdAt ?? new Date().toISOString(),
  }
}

export const recipeRepository = {
  getRecipes() {
    const recipes = readJson(STORAGE_KEY, [])
    return recipes.map(normalizeRecipe)
  },

  saveRecipes(recipes) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes.map(normalizeRecipe)))
  },

  getLastSyncTimestamp() {
    return localStorage.getItem(LAST_SYNC_TIMESTAMP_STORAGE_KEY)
  },

  saveLastSyncTimestamp(timestamp) {
    if (!timestamp) {
      localStorage.removeItem(LAST_SYNC_TIMESTAMP_STORAGE_KEY)
      return
    }

    localStorage.setItem(LAST_SYNC_TIMESTAMP_STORAGE_KEY, timestamp)
  },

  getLastLocalUpdateTimestamp() {
    return localStorage.getItem(LAST_LOCAL_UPDATE_STORAGE_KEY)
  },

  saveLastLocalUpdateTimestamp(timestamp) {
    if (!timestamp) {
      localStorage.removeItem(LAST_LOCAL_UPDATE_STORAGE_KEY)
      return
    }

    localStorage.setItem(LAST_LOCAL_UPDATE_STORAGE_KEY, timestamp)
  },

  getIsLightweightView() {
    return localStorage.getItem(LIGHTWEIGHT_VIEW_STORAGE_KEY) === 'true'
  },

  saveIsLightweightView(isLightweightView) {
    localStorage.setItem(LIGHTWEIGHT_VIEW_STORAGE_KEY, String(isLightweightView))
  },
}
