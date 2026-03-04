import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://xeeyjdjghehiiliwdqbs.supabase.co',
  'sb_publishable_ppTsBeIOu_kqag4_W6wM3A_2G7-suh5'
)

export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  })

  if (error) throw error
  return data
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) throw error
  return data
}

export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser()
  return data.user
}

export async function fetchRecipies() {
  const { data, error } = await supabase
    .from('recipies')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function addRecipe(recipe) {
  const { data: userData } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('recipies')
    .insert([{
      ...recipe,
      user_id: userData.user.id
    }])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateRecipe(id, updates) {
  const { data, error } = await supabase
    .from('recipies')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteRecipe(id) {
  const { error } = await supabase
    .from('recipies')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}