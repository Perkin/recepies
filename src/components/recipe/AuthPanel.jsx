import { useState } from 'react'

export function AuthPanel({ userEmail, onSignIn, onSignUp, onSignOut, isBusy }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (event, action) => {
    event.preventDefault()
    await action(email.trim(), password)
  }

  if (userEmail) {
    return (
      <div className="mt-4 rounded-2xl border border-emerald-400/30 bg-emerald-950/30 p-4">
        <p className="text-sm text-emerald-100">Выполнен вход: {userEmail}</p>
        <button
          type="button"
          className="btn-secondary mt-3"
          onClick={onSignOut}
          disabled={isBusy}
        >
          Выйти
        </button>
      </div>
    )
  }

  return (
    <form className="mt-4 rounded-2xl border border-slate-700/60 bg-slate-900/40 p-4" onSubmit={(event) => handleSubmit(event, onSignIn)}>
      <p className="mb-3 text-sm text-slate-300">Для синхронизации войдите в Supabase</p>
      <div className="grid gap-2 sm:grid-cols-2">
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
          autoComplete="current-password"
          minLength={6}
          required
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="submit" className="btn-secondary" disabled={isBusy}>
          Войти
        </button>
        <button type="button" className="btn-secondary" onClick={(event) => handleSubmit(event, onSignUp)} disabled={isBusy}>
          Регистрация
        </button>
      </div>
    </form>
  )
}
