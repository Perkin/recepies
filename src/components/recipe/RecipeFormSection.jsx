import { useLayoutEffect, useRef } from 'react'

function AutoResizeTextarea({ value, onChange, ...props }) {
  const textareaRef = useRef(null)

  useLayoutEffect(() => {
    const textarea = textareaRef.current

    if (!textarea) {
      return
    }

    textarea.style.height = 'auto'
    textarea.style.height = `${textarea.scrollHeight}px`
  }, [value])

  return (
    <textarea
      {...props}
      ref={textareaRef}
      value={value}
      onChange={onChange}
    />
  )
}

export function RecipeFormSection({
  isEditing,
  values,
  onChange,
  onSubmit,
  onCancel,
}) {
  const updateField = (field) => (event) => {
    const value = field === 'isQueued' ? event.target.checked : event.target.value
    onChange((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <section className="mt-5 rounded-2xl border border-slate-700/60 bg-slate-900/40 p-3 sm:p-4">
      <h2 className="text-base font-semibold text-slate-100">
        {isEditing ? 'Редактирование рецепта' : 'Новый рецепт'}
      </h2>
      <form className="mt-3 grid gap-2" onSubmit={onSubmit}>
        <label className="text-sm text-slate-200">
          Название <span className="text-rose-400">*</span>
          <input
            className="input-base mt-1"
            placeholder="Название"
            required
            value={values.title}
            onChange={updateField('title')}
          />
        </label>
        <label className="text-sm text-slate-200">
          Ингредиенты
          <AutoResizeTextarea
            className="input-base mt-1 min-h-24 resize-none overflow-hidden"
            placeholder="Ингредиенты"
            value={values.ingredients}
            onChange={updateField('ingredients')}
          />
        </label>
        <label className="text-sm text-slate-200">
          Инструкции
          <AutoResizeTextarea
            className="input-base mt-1 min-h-24 resize-none overflow-hidden"
            placeholder="Инструкции"
            value={values.instructions}
            onChange={updateField('instructions')}
          />
        </label>
        <label className="text-sm text-slate-200">
          Ссылка на видео
          <input
            className="input-base mt-1"
            placeholder="Ссылка на видео"
            value={values.videoUrl}
            onChange={updateField('videoUrl')}
          />
        </label>
        <label className="inline-flex items-center gap-2 text-sm text-slate-200">
          <input
            type="checkbox"
            className="checkbox-base"
            checked={values.isQueued}
            onChange={updateField('isQueued')}
          />
          Добавить в очередь
        </label>

        <div className="flex flex-wrap gap-2">
          <button type="submit" className="btn-primary btn-emphasis">
            {isEditing ? 'Сохранить' : 'Добавить'}
          </button>
          <button type="button" className="btn-secondary" onClick={onCancel}>
            {isEditing ? 'Отменить' : 'Скрыть форму'}
          </button>
        </div>
      </form>
    </section>
  )
}
