export const mockRecipes = [
  {
    id: 'r1',
    title: 'Томатная паста с базиликом',
    description: 'Быстрый ужин: паста, томаты в собственном соку и немного пармезана.',
    createdAt: '2026-02-15',
    lastCookedAt: '2026-02-23',
    cookCount: 3,
    isQueued: true,
    isArchived: false,
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
  },
]

export const recipeSorters = {
  createdAt: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
  lastCookedAt: (a, b) => new Date(a.lastCookedAt ?? 0) - new Date(b.lastCookedAt ?? 0),
  cookCount: (a, b) => a.cookCount - b.cookCount,
}
