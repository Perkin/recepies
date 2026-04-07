import { useCallback, useState } from 'react'
import { emptyRecipeForm } from '../constants/recipes'

export function useRecipeFormControls({ recipes, applyLocalRecipesChange, animateWindowScrollTo }) {
  const [editingId, setEditingId] = useState(null)
  const [formValues, setFormValues] = useState(emptyRecipeForm)
  const [isFormVisible, setIsFormVisible] = useState(false)
  const [returnScrollRecipeId, setReturnScrollRecipeId] = useState(null)
  const [recipePendingDeletion, setRecipePendingDeletion] = useState(null)

  const openCreateForm = useCallback(() => {
    setEditingId(null)
    setFormValues(emptyRecipeForm)
    setIsFormVisible(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const closeForm = useCallback(({ shouldReturnToCard = false } = {}) => {
    if (shouldReturnToCard && editingId) {
      setReturnScrollRecipeId(editingId)
    }

    setEditingId(null)
    setFormValues(emptyRecipeForm)
    setIsFormVisible(false)
  }, [editingId])

  const submitForm = useCallback((event) => {
    event.preventDefault()

    const now = new Date().toISOString()

    if (editingId) {
      const recipeBeforeEdit = recipes.find((recipe) => recipe.id === editingId)

      if (
        recipeBeforeEdit &&
        recipeBeforeEdit.title === formValues.title &&
        recipeBeforeEdit.ingredients === formValues.ingredients &&
        recipeBeforeEdit.instructions === formValues.instructions &&
        (recipeBeforeEdit.videoUrl ?? '') === formValues.videoUrl &&
        recipeBeforeEdit.isQueued === formValues.isQueued
      ) {
        closeForm({ shouldReturnToCard: true })
        return
      }

      applyLocalRecipesChange((prev) =>
        prev.map((recipe) =>
          recipe.id === editingId
            ? {
                ...recipe,
                ...formValues,
                updatedAt: now,
              }
            : recipe,
        ),
      )
      closeForm({ shouldReturnToCard: true })
      return
    }

    applyLocalRecipesChange((prev) => [
      {
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
        lastCookedAt: null,
        cookCount: 0,
        isArchived: false,
        deletedAt: null,
        ...formValues,
      },
      ...prev,
    ])

    closeForm()
  }, [applyLocalRecipesChange, closeForm, editingId, formValues, recipes])

  const handleEdit = useCallback((recipe) => {
    setEditingId(recipe.id)
    setIsFormVisible(true)
    setFormValues({
      title: recipe.title,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      videoUrl: recipe.videoUrl ?? '',
      isQueued: recipe.isQueued,
    })
    animateWindowScrollTo(0)
  }, [animateWindowScrollTo])

  const handleDelete = useCallback((recipe) => {
    setRecipePendingDeletion(recipe)
  }, [])

  const handleDeleteConfirmed = useCallback(() => {
    if (!recipePendingDeletion) {
      return
    }

    const now = new Date().toISOString()
    applyLocalRecipesChange((prev) =>
      prev.map((item) =>
        item.id === recipePendingDeletion.id ? { ...item, deletedAt: now, updatedAt: now } : item,
      ),
    )

    if (editingId === recipePendingDeletion.id) {
      closeForm()
    }

    setRecipePendingDeletion(null)
  }, [applyLocalRecipesChange, closeForm, editingId, recipePendingDeletion])

  return {
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
  }
}
