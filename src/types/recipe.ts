export type Recipe = {
  id: string
  title: string
  description: string
  createdAt: string
  updatedAt: string
  lastCookedAt: string | null
  cookCount: number
  isQueued: boolean
  isArchived: boolean
  deletedAt: string | null
  videoUrl?: string
  ingredients: string
  instructions: string
}
