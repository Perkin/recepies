import { RecipeCard } from './RecipeCard'

export function RecipeList({
  recipes,
  isArchiveView,
  isLightweightView,
  onCooked,
  onArchive,
  onRestore,
  onEdit,
  onDelete,
  listRef,
}) {
  return (
    <main ref={listRef} className="mt-4 grid gap-4">
      {recipes.map((recipe) => (
        <RecipeCard
          key={recipe.id}
          recipe={recipe}
          recipeId={recipe.id}
          isArchiveView={isArchiveView}
          isLightweightView={isLightweightView}
          onCooked={() => onCooked(recipe)}
          onArchive={() => onArchive(recipe)}
          onRestore={() => onRestore(recipe)}
          onEdit={() => onEdit(recipe)}
          onDelete={() => onDelete(recipe)}
        />
      ))}
    </main>
  )
}
