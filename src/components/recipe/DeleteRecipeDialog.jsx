export function DeleteRecipeDialog({ recipeTitle, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 px-3">
      <div className="w-full max-w-md rounded-2xl border border-slate-700/70 bg-slate-900 p-5 shadow-2xl">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-100">Удалить рецепт?</h2>
          <p className="mt-2 text-sm text-slate-400">
            Вы уверены, что хотите удалить рецепт «{recipeTitle}»? Это действие можно отменить только через
            восстановление из архива данных.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-secondary border-rose-500/40 text-rose-200" onClick={onConfirm}>
            Удалить
          </button>
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Отмена
          </button>
        </div>
      </div>
    </div>
  )
}
