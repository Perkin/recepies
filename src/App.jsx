import { useMemo, useState } from 'react'
import { AppHeader } from './components/recipe/AppHeader'
import { RecipeCard } from './components/recipe/RecipeCard'
import { SortControls } from './components/recipe/SortControls'
import { mockRecipes, recipeSorters } from './data/recipes'

export default function App() {
  const [sortField, setSortField] = useState('createdAt')
  const [sortDirection, setSortDirection] = useState('desc')

  const visibleRecipes = useMemo(() => {
    const sorted = [...mockRecipes].sort((a, b) => {
      if (a.isQueued !== b.isQueued) return a.isQueued ? -1 : 1
      const baseResult = recipeSorters[sortField](a, b)
      return sortDirection === 'asc' ? baseResult : -baseResult
    })

    return sorted.filter((recipe) => !recipe.isArchived)
  }, [sortDirection, sortField])

  return (
    <div className="mx-auto max-w-5xl px-4 pb-14 pt-9 text-slate-100">
      <AppHeader />

      <SortControls
        sortField={sortField}
        sortDirection={sortDirection}
        onSortFieldChange={setSortField}
        onSortDirectionToggle={() =>
          setSortDirection((prevDirection) => (prevDirection === 'asc' ? 'desc' : 'asc'))
        }
      />

      <main className="mt-4 grid gap-4">
        {visibleRecipes.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}
      </main>
    </div>
  )
}
