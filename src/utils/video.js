const YOUTUBE_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be', 'www.youtu.be'])
const VK_HOSTS = new Set(['vk.com', 'www.vk.com', 'vkvideo.ru', 'www.vkvideo.ru'])
const RUTUBE_HOSTS = new Set(['rutube.ru', 'www.rutube.ru', 'm.rutube.ru'])

function normalizeUrl(rawUrl) {
  try {
    return new URL(rawUrl)
  } catch {
    return null
  }
}

function parseYouTubeVideoId(url) {
  if (url.hostname.includes('youtu.be')) {
    return url.pathname.split('/').filter(Boolean)[0] ?? null
  }

  if (url.pathname === '/watch') {
    return url.searchParams.get('v')
  }

  if (url.pathname.startsWith('/shorts/')) {
    return url.pathname.split('/')[2] ?? null
  }

  if (url.pathname.startsWith('/embed/')) {
    return url.pathname.split('/')[2] ?? null
  }

  return null
}

function buildYouTubeWatchUrl(videoId) {
  return `https://www.youtube.com/watch?v=${videoId}`
}


function parseRutubeVideoId(url) {
  if (url.pathname.startsWith('/video/')) {
    return url.pathname.split('/')[2] ?? null
  }

  if (url.pathname.startsWith('/play/embed/')) {
    return url.pathname.split('/')[3] ?? null
  }

  return null
}

function parseVkVideoIds(url) {
  if (url.pathname.includes('video_ext.php')) {
    const oid = url.searchParams.get('oid')
    const id = url.searchParams.get('id')

    if (oid && id) {
      return { oid, id }
    }

    return null
  }

  const pathMatch = url.pathname.match(/\/video(-?\d+)_(\d+)/)

  if (pathMatch) {
    return { oid: pathMatch[1], id: pathMatch[2] }
  }

  return null
}

export function parseRecipeVideo(rawUrl) {
  const parsedUrl = normalizeUrl(rawUrl)

  if (!parsedUrl) {
    return { type: 'invalid' }
  }

  const host = parsedUrl.hostname.toLowerCase()

  if (YOUTUBE_HOSTS.has(host)) {
    const videoId = parseYouTubeVideoId(parsedUrl)

    if (!videoId) {
      return { type: 'invalid' }
    }

    return {
      type: 'youtube',
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`,
      autoplayEmbedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`,
      thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      watchUrl: buildYouTubeWatchUrl(videoId),
    }
  }

  if (VK_HOSTS.has(host)) {
    const vkVideoIds = parseVkVideoIds(parsedUrl)

    if (!vkVideoIds) {
      return { type: 'invalid' }
    }

    const base = `https://vkvideo.ru/video_ext.php?oid=${vkVideoIds.oid}&id=${vkVideoIds.id}&hd=2`

    return {
      type: 'vk',
      embedUrl: base,
      autoplayEmbedUrl: `${base}&autoplay=1`,
    }
  }

  if (RUTUBE_HOSTS.has(host)) {
    const videoId = parseRutubeVideoId(parsedUrl)

    if (!videoId) {
      return { type: 'invalid' }
    }

    return {
      type: 'rutube',
      embedUrl: `https://rutube.ru/play/embed/${videoId}`,
      autoplayEmbedUrl: `https://rutube.ru/play/embed/${videoId}?autoplay=1`,
    }
  }

  return {
    type: 'direct',
    sourceUrl: rawUrl,
  }
}
