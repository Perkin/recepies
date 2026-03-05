import { RecipeCard } from './RecipeCard'

export function RecipeList({
  recipes,
  isArchiveView,
  isLightweightView,
  onCooked,
  onQueue,
  onArchive,
  onRestore,
  onEdit,
  onDelete,
  listRef,
  newRecipeIds = [],
}) {
  return (
    <main ref={listRef} className="mt-4 grid gap-4">
      {recipes.map((recipe) => (
        <RecipeCard
          key={recipe.id}
          recipe={recipe}
          recipeId={recipe.id}
          isArchiveView={isArchiveView}
          isNew={newRecipeIds.includes(recipe.id)}
          isLightweightView={isLightweightView}
          onCooked={() => onCooked(recipe)}
          onQueue={() => onQueue(recipe)}
          onArchive={() => onArchive(recipe)}
          onRestore={() => onRestore(recipe)}
          onEdit={() => onEdit(recipe)}
          onDelete={() => onDelete(recipe)}
        />
      ))}
    </main>
  )
}
