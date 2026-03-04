import { LIGHTWEIGHT_VIEW_STORAGE_KEY, STORAGE_KEY } from '../constants/recipes'
import { defaultRecipes } from '../data/defaultRecipes'

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

export const recipeRepository = {
  getRecipes() {
    return readJson(STORAGE_KEY, defaultRecipes)
  },

  saveRecipes(recipes) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes))
  },

  getIsLightweightView() {
    return localStorage.getItem(LIGHTWEIGHT_VIEW_STORAGE_KEY) === 'true'
  },

  saveIsLightweightView(isLightweightView) {
    localStorage.setItem(LIGHTWEIGHT_VIEW_STORAGE_KEY, String(isLightweightView))
  },
}
