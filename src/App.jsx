import { useEffect, useMemo, useState } from 'react'
import { AppHeader } from './components/recipe/AppHeader'
import { RecipeCard } from './components/recipe/RecipeCard'
import { SortControls } from './components/recipe/SortControls'
import { recipeSorters } from './utils/recipeSorters.js'

const STORAGE_KEY = 'recipes'

const defaultRecipes = [
  {
    id: 'r1',
    title: 'Томатная паста с базиликом',
    description: 'Быстрый ужин: паста, томаты в собственном соку и немного пармезана.',
    createdAt: '2026-02-15',
    lastCookedAt: '2026-02-23',
    cookCount: 3,
    isQueued: true,
    isArchived: false,
    isDeleted: false,
    ingredients:
      '- 400 г спагетти\n- 1 банка томатов в собственном соку\n- 2 зубчика чеснока\n- Пучок базилика\n- 50 г пармезана',
    instructions:
      '1. Отварить пасту\n2. Обжарить чеснок\n3. Добавить томаты\n4. Подавать с базиликом',
  },
  {
    id: 'r2',
    title: 'Овсяные панкейки',
    description: 'Завтрак из банана, яйца и овсяных хлопьев, подаётся с йогуртом.',
    createdAt: '2026-01-20',
    lastCookedAt: '2026-02-25',
    cookCount: 5,
    isQueued: false,
    isArchived: false,
    isDeleted: false,
    ingredients: '- 1 спелый банан\n- 1 яйцо\n- 4 ст.л. овсяных хлопьев\n- Йогурт для подачи',
    instructions: '1. Размять банан\n2. Смешать с яйцом и хлопьями\n3. Жарить на сковороде',
  },
  {
    id: 'r3',
    title: 'Курица терияки в духовке',
    description: 'Маринад из соевого соуса, имбиря и мёда, запекание 35 минут.',
    createdAt: '2025-12-30',
    lastCookedAt: null,
    cookCount: 0,
    isQueued: false,
    isArchived: false,
    isDeleted: false,
    ingredients: '- 4 куриных бедра\n- 4 ст.л. соевого соуса\n- 1 ч.л. натёртого имбиря\n- 1 ст.л. мёда',
    instructions: '1. Сделать маринад\n2. Замариновать курицу\n3. Запекать 35 минут',
  },
]

const emptyForm = {
  title: '',
  description: '',
  ingredients: '',
  instructions: '',
  videoUrl: '',
  isQueued: false,
}

function getInitialRecipes() {
  const raw = localStorage.getItem(STORAGE_KEY)

  if (!raw) {
    return defaultRecipes
  }

  try {
    return JSON.parse(raw)
  } catch {
    return defaultRecipes
  }
}

export default function App() {
  const [recipes, setRecipes] = useState(getInitialRecipes)
  const [sortField, setSortField] = useState('createdAt')
  const [sortDirection, setSortDirection] = useState('desc')
  const [editingId, setEditingId] = useState(null)
  const [formValues, setFormValues] = useState(emptyForm)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes))
  }, [recipes])

  const visibleRecipes = useMemo(() => {
    const sorted = [...recipes].sort((a, b) => {
      if (a.isQueued !== b.isQueued) return a.isQueued ? -1 : 1
      const baseResult = recipeSorters[sortField](a, b)
      return sortDirection === 'asc' ? baseResult : -baseResult
    })

    return sorted.filter((recipe) => !recipe.isArchived && !recipe.isDeleted)
  }, [recipes, sortDirection, sortField])

  const resetForm = () => {
    setEditingId(null)
    setFormValues(emptyForm)
  }

  const submitForm = (event) => {
    event.preventDefault()

    const now = new Date().toISOString().slice(0, 10)

    if (editingId) {
      setRecipes((prev) =>
        prev.map((recipe) =>
          recipe.id === editingId
            ? {
                ...recipe,
                ...formValues,
              }
            : recipe,
        ),
      )
      resetForm()
      return
    }

    setRecipes((prev) => [
      {
        id: crypto.randomUUID(),
        createdAt: now,
        lastCookedAt: null,
        cookCount: 0,
        isArchived: false,
        isDeleted: false,
        ...formValues,
      },
      ...prev,
    ])

    resetForm()
  }

  return (
    <div className="mx-auto max-w-5xl px-4 pb-14 pt-9 text-slate-100">
      <AppHeader />

      <section className="mt-5 rounded-2xl border border-slate-700/60 bg-slate-900/40 p-4">
        <h2 className="text-base font-semibold text-slate-100">
          {editingId ? 'Редактирование рецепта' : 'Новый рецепт'}
        </h2>
        <form className="mt-3 grid gap-2" onSubmit={submitForm}>
          <input
            className="input-base"
            placeholder="Название"
            required
            value={formValues.title}
            onChange={(event) => setFormValues((prev) => ({ ...prev, title: event.target.value }))}
          />
          <textarea
            className="input-base min-h-20"
            placeholder="Краткое описание"
            required
            value={formValues.description}
            onChange={(event) =>
              setFormValues((prev) => ({ ...prev, description: event.target.value }))
            }
          />
          <textarea
            className="input-base min-h-24"
            placeholder="Ингредиенты"
            required
            value={formValues.ingredients}
            onChange={(event) =>
              setFormValues((prev) => ({ ...prev, ingredients: event.target.value }))
            }
          />
          <textarea
            className="input-base min-h-24"
            placeholder="Инструкции"
            required
            value={formValues.instructions}
            onChange={(event) =>
              setFormValues((prev) => ({ ...prev, instructions: event.target.value }))
            }
          />
          <input
            className="input-base"
            placeholder="Ссылка на видео (опционально)"
            value={formValues.videoUrl}
            onChange={(event) => setFormValues((prev) => ({ ...prev, videoUrl: event.target.value }))}
          />
          <label className="inline-flex items-center gap-2 text-sm text-slate-200">
            <input
              type="checkbox"
              checked={formValues.isQueued}
              onChange={(event) =>
                setFormValues((prev) => ({ ...prev, isQueued: event.target.checked }))
              }
            />
            Добавить в очередь
          </label>

          <div className="flex flex-wrap gap-2">
            <button type="submit" className="btn-primary">
              {editingId ? 'Сохранить' : 'Добавить'}
            </button>
            {editingId ? (
              <button type="button" className="btn-secondary" onClick={resetForm}>
                Отменить
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <SortControls
        sortField={sortField}
        sortDirection={sortDirection}
        onSortChange={(nextSortField) => {
          if (nextSortField === sortField) {
            setSortDirection((prevDirection) => (prevDirection === 'asc' ? 'desc' : 'asc'))
            return
          }

          setSortField(nextSortField)
        }}
      />

      <main className="mt-4 grid gap-4">
        {visibleRecipes.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            onCooked={() => {
              const today = new Date().toISOString().slice(0, 10)
              setRecipes((prev) =>
                prev.map((item) =>
                  item.id === recipe.id
                    ? {
                        ...item,
                        cookCount: item.cookCount + 1,
                        lastCookedAt: today,
                        isQueued: false,
                      }
                    : item,
                ),
              )
            }}
            onArchive={() => {
              setRecipes((prev) =>
                prev.map((item) =>
                  item.id === recipe.id ? { ...item, isArchived: true } : item,
                ),
              )
            }}
            onEdit={() => {
              setEditingId(recipe.id)
              setFormValues({
                title: recipe.title,
                description: recipe.description,
                ingredients: recipe.ingredients,
                instructions: recipe.instructions,
                videoUrl: recipe.videoUrl ?? '',
                isQueued: recipe.isQueued,
              })
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            onDelete={() => {
              setRecipes((prev) =>
                prev.map((item) =>
                  item.id === recipe.id ? { ...item, isDeleted: true } : item,
                ),
              )
              if (editingId === recipe.id) {
                resetForm()
              }
            }}
          />
        ))}
      </main>
    </div>
  )
}
