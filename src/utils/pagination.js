export function getInitialPageFromUrl() {
  const params = new URLSearchParams(window.location.search)
  const rawPage = Number.parseInt(params.get('page') ?? '1', 10)

  return Number.isNaN(rawPage) || rawPage < 1 ? 1 : rawPage
}

export function setPageInUrl(page, { replace = false } = {}) {
  const params = new URLSearchParams(window.location.search)

  if (page <= 1) {
    params.delete('page')
  } else {
    params.set('page', String(page))
  }

  const query = params.toString()
  const nextUrl = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`

  if (replace) {
    window.history.replaceState(null, '', nextUrl)
    return
  }

  window.history.pushState(null, '', nextUrl)
}
