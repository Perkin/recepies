import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://xeeyjdjghehiiliwdqbs.supabase.co',
  'sb_publishable_ppTsBeIOu_kqag4_W6wM3A_2G7-suh5',
)

const RECIPES_TABLE = 'recipies'
const INITIAL_SYNC_TIMESTAMP = '1970-01-01T00:00:00.000Z'

export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) throw error

  const userIdentities = data.user?.identities ?? []

  return {
    ...data,
    isExistingAccount: userIdentities.length === 0,
  }
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  return data
}

export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    if (error.name === 'AuthSessionMissingError') {
      return null
    }

    throw error
  }

  return user
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()

  if (error) throw error
}

function toDbRecipe(recipe, userId) {
  return {
    id: recipe.id,
    user_id: userId,
    title: recipe.title,
    ingredients: recipe.ingredients,
    instructions: recipe.instructions,
    video_url: recipe.videoUrl ?? null,
    cook_count: recipe.cookCount,
    is_archived: recipe.isArchived,
    is_queued: recipe.isQueued,
    created_at: recipe.createdAt,
    updated_at: recipe.updatedAt,
    last_cooked_at: recipe.lastCookedAt,
    deleted_at: recipe.deletedAt,
  }
}

function fromDbRecipe(recipe) {
  return {
    id: recipe.id,
    title: recipe.title,
    ingredients: recipe.ingredients ?? '',
    instructions: recipe.instructions ?? '',
    videoUrl: recipe.video_url ?? '',
    cookCount: recipe.cook_count ?? 0,
    isArchived: Boolean(recipe.is_archived),
    isQueued: Boolean(recipe.is_queued),
    createdAt: recipe.created_at,
    updatedAt: recipe.updated_at,
    lastCookedAt: recipe.last_cooked_at,
    deletedAt: recipe.deleted_at,
  }
}

export async function fetchRecipesSnapshot(userId) {
  const { data, error } = await supabase
    .from(RECIPES_TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) throw error

  return (data ?? []).map(fromDbRecipe)
}

function normalizeTimestamp(timestamp) {
  return timestamp ?? INITIAL_SYNC_TIMESTAMP
}

function getNewestTimestamp(recipes, fallbackTimestamp) {
  return recipes.reduce((maxTimestamp, recipe) => {
    if (!recipe.updatedAt) {
      return maxTimestamp
    }

    return recipe.updatedAt > maxTimestamp ? recipe.updatedAt : maxTimestamp
  }, fallbackTimestamp)
}

function mergeRecipes(localRecipes, remoteRecipes) {
  const byId = new Map(localRecipes.map((recipe) => [recipe.id, recipe]))

  for (const remoteRecipe of remoteRecipes) {
    const localRecipe = byId.get(remoteRecipe.id)

    if (!localRecipe || localRecipe.updatedAt <= remoteRecipe.updatedAt) {
      byId.set(remoteRecipe.id, remoteRecipe)
    }
  }

  return [...byId.values()]
}

export async function fetchUpdates(userId, lastSyncTimestamp) {
  const since = normalizeTimestamp(lastSyncTimestamp)

  const { data, error } = await supabase
    .from(RECIPES_TABLE)
    .select('*')
    .eq('user_id', userId)
    .gt('updated_at', since)
    .order('updated_at', { ascending: true })

  if (error) throw error

  return (data ?? []).map(fromDbRecipe)
}

export async function pushPendingChanges(localRecipes, lastSyncTimestamp, userId, remoteUpdates = []) {
  const since = normalizeTimestamp(lastSyncTimestamp)
  const remoteUpdatesById = new Map(remoteUpdates.map((recipe) => [recipe.id, recipe]))
  const pendingRecipes = localRecipes.filter((recipe) => {
    if (recipe.updatedAt <= since) {
      return false
    }

    const remoteRecipe = remoteUpdatesById.get(recipe.id)
    return !remoteRecipe || recipe.updatedAt > remoteRecipe.updatedAt
  })

  if (pendingRecipes.length === 0) {
    return {
      pushedCount: 0,
      pushedRecipes: [],
    }
  }

  const payload = pendingRecipes.map((recipe) => toDbRecipe(recipe, userId))

  const { data, error } = await supabase.from(RECIPES_TABLE).upsert(payload, { onConflict: 'id' }).select('*')

  if (error) throw error

  const pushedRecipes = (data ?? []).map(fromDbRecipe)

  return {
    pushedCount: pushedRecipes.length,
    pushedRecipes,
  }
}

export async function syncRecipes(localRecipes, lastSyncTimestamp, options = {}) {
  const { pullRemote = true } = options
  const normalizedLocalRecipes = localRecipes.map((recipe) => ({
    ...recipe,
    deletedAt: recipe.deletedAt ?? null,
    updatedAt: recipe.updatedAt ?? recipe.createdAt ?? new Date().toISOString(),
  }))

  const currentUser = await getCurrentUser()
  const initialTimestamp = normalizeTimestamp(lastSyncTimestamp)

  if (!currentUser) {
    return {
      recipes: normalizedLocalRecipes,
      lastSyncTimestamp: initialTimestamp,
      stats: {
        pushedCount: 0,
        pulledCount: 0,
      },
      authStatus: 'signed_out',
    }
  }

  const updates = pullRemote ? await fetchUpdates(currentUser.id, initialTimestamp) : []
  const mergedRecipes = mergeRecipes(normalizedLocalRecipes, updates)
  const { pushedCount, pushedRecipes } = await pushPendingChanges(mergedRecipes, initialTimestamp, currentUser.id, updates)
  const syncedRecipes = mergeRecipes(mergedRecipes, pushedRecipes)
  const nextTimestamp = getNewestTimestamp([...updates, ...pushedRecipes], initialTimestamp)

  return {
    recipes: syncedRecipes,
    lastSyncTimestamp: nextTimestamp,
    stats: {
      pushedCount,
      pulledCount: updates.length,
    },
    authStatus: 'signed_in',
  }
}
