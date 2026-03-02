export const recipeSorters = {
  createdAt: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
  lastCookedAt: (a, b) => new Date(a.lastCookedAt ?? 0) - new Date(b.lastCookedAt ?? 0),
  cookCount: (a, b) => a.cookCount - b.cookCount,
}