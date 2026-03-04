import { useEffect, useMemo, useState } from 'react'

export function AuthPanel({ mode, isBusy, onClose, onSignIn, onSignUp }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [formError, setFormError] = useState('')

  const isSignUp = mode === 'signup'

  const title = useMemo(() => (isSignUp ? 'Регистрация' : 'Вход'), [isSignUp])

  useEffect(() => {
    setEmail('')
    setPassword('')
    setPasswordConfirm('')
    setFormError('')
  }, [mode])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFormError('')

    const normalizedEmail = email.trim()

    if (isSignUp) {
      if (password !== passwordConfirm) {
        setFormError('Пароли не совпадают')
        return
      }

      await onSignUp(normalizedEmail, password)
      return
    }

    await onSignIn(normalizedEmail, password)
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 px-3">
      <div className="w-full max-w-md rounded-2xl border border-slate-700/70 bg-slate-900 p-5 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
            <p className="mt-1 text-sm text-slate-400">Для синхронизации используйте аккаунт Supabase.</p>
          </div>
          <button
            type="button"
            className="text-slate-400 transition hover:text-slate-200"
            onClick={onClose}
            disabled={isBusy}
            aria-label="Закрыть"
          >
            ✕
          </button>
        </div>

        <form className="space-y-3" onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="input-base"
            placeholder="Email"
            autoComplete="email"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="input-base"
            placeholder="Пароль"
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            minLength={6}
            required
          />
          {isSignUp ? (
            <input
              type="password"
              value={passwordConfirm}
              onChange={(event) => setPasswordConfirm(event.target.value)}
              className="input-base"
              placeholder="Подтверждение пароля"
              autoComplete="new-password"
              minLength={6}
              required
            />
          ) : null}

          {formError ? <p className="text-sm text-rose-300">{formError}</p> : null}

          <div className="flex gap-2 pt-1">
            <button type="submit" className="btn-secondary" disabled={isBusy}>
              {isSignUp ? 'Зарегистрироваться' : 'Войти'}
            </button>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isBusy}>
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
