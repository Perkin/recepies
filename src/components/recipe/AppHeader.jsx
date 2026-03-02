import { BowlIcon } from '../icons'

export function AppHeader({ onAddRecipe, isFormVisible }) {
  return (
    <header className="glass-panel rounded-3xl border border-slate-700/60 p-6 shadow-2xl shadow-black/20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-2xl border border-indigo-300/25 bg-gradient-to-br from-indigo-200/20 to-slate-700/20">
            <BowlIcon className="h-7 w-7 text-amber-200" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-300">Recipe Flow</p>
            <h1 className="font-display text-2xl font-bold leading-tight text-slate-50 sm:text-3xl">
              Книга рецептов
            </h1>
          </div>
        </div>
        <button
          type="button"
          className="btn-secondary btn-emphasis w-full justify-center sm:w-auto"
          onClick={onAddRecipe}
          disabled={isFormVisible}
        >
          Добавить
        </button>
      </div>
    </header>
  )
}
