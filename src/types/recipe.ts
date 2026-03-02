export type Recipe = {
  id: string
  title: string
  description: string
  createdAt: string
  lastCookedAt: string | null
  cookCount: number
  isQueued: boolean
  isArchived: boolean
  isDeleted: boolean
  videoUrl?: string
  ingredients: string
  instructions: string
}
