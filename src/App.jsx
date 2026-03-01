import { useMemo, useState } from 'react'

const mockRecipes = [
  {
    id: 'r1',
    title: 'Томатная паста с базиликом',
    description: 'Быстрый ужин: паста, томаты в собственном соку и немного пармезана.',
    createdAt: '2026-02-15',
    lastCookedAt: '2026-02-23',
    cookCount: 3,
    isQueued: true,
    isArchived: false,
    isHidden: false,
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
    isHidden: false,
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
    isHidden: false,
  },
]

const sorters = {
  createdAt: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
  lastCookedAt: (a, b) => new Date(a.lastCookedAt ?? 0) - new Date(b.lastCookedAt ?? 0),
  cookCount: (a, b) => a.cookCount - b.cookCount,
}

function formatDate(value) {
  if (!value) {
    return 'ещё не готовили'
  }

  return new Date(value).toLocaleDateString('ru-RU')
}

export default function App() {
  const [sortField, setSortField] = useState('createdAt')
  const [sortDirection, setSortDirection] = useState('desc')

  const visibleRecipes = useMemo(() => {
    const sorted = [...mockRecipes].sort((a, b) => {
      if (a.isQueued !== b.isQueued) {
        return a.isQueued ? -1 : 1
      }

      const baseResult = sorters[sortField](a, b)
      return sortDirection === 'asc' ? baseResult : -baseResult
    })

    return sorted.filter((recipe) => !recipe.isArchived && !recipe.isHidden)
  }, [sortDirection, sortField])

  return (
    <div className="app">
      <header className="app__header">
        <p className="app__eyebrow">Черновик MVP</p>
        <h1>Книга рецептов</h1>
        <p>
          Каркас интерфейса с локальными заглушками: очередь, базовые метаданные рецепта и сортировки.
        </p>
      </header>

      <section className="controls" aria-label="Сортировка списка рецептов">
        <label>
          Сортировка:
          <select value={sortField} onChange={(event) => setSortField(event.target.value)}>
            <option value="createdAt">дата добавления</option>
            <option value="lastCookedAt">дата последней готовки</option>
            <option value="cookCount">число приготовлений</option>
          </select>
        </label>

        <button
          type="button"
          onClick={() =>
            setSortDirection((prevDirection) => (prevDirection === 'asc' ? 'desc' : 'asc'))
          }
        >
          Порядок: {sortDirection === 'asc' ? 'по возрастанию' : 'по убыванию'}
        </button>
      </section>

      <main className="recipe-list">
        {visibleRecipes.map((recipe) => (
          <article key={recipe.id} className="recipe-card">
            <div className="recipe-card__title-row">
              <h2>{recipe.title}</h2>
              {recipe.isQueued ? <span className="badge">В очереди</span> : null}
            </div>

            <p>{recipe.description}</p>

            <dl>
              <div>
                <dt>Добавлен:</dt>
                <dd>{formatDate(recipe.createdAt)}</dd>
              </div>
              <div>
                <dt>Последняя готовка:</dt>
                <dd>{formatDate(recipe.lastCookedAt)}</dd>
              </div>
              <div>
                <dt>Готовили раз:</dt>
                <dd>{recipe.cookCount}</dd>
              </div>
            </dl>

            <div className="recipe-card__actions">
              <button type="button">Отметить как приготовленное</button>
              <button type="button">В архив</button>
              <button type="button">Скрыть</button>
            </div>
          </article>
        ))}
      </main>
    </div>
  )
}
