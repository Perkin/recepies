export function formatDate(value) {
  if (!value) return 'ещё не готовили'
  return new Date(value).toLocaleDateString('ru-RU')
}
