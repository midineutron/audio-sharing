import { readable } from 'svelte/store'

type RouteQueryValue = string | number | boolean | null | undefined

export interface RouteState {
  /** Full path portion of the hash, always starting with a forward slash. */
  path: string
  /** Individual segments of the path for convenient pattern checks. */
  segments: string[]
  /** Parsed query parameters from the hash. */
  query: Record<string, string>
  /** Original hash value without the leading `#`. */
  hash: string
}

const isBrowser = typeof window !== 'undefined'

const initialState: RouteState = parseHash(isBrowser ? window.location.hash : '')

export const route = readable<RouteState>(initialState, (set) => {
  if (!isBrowser) {
    return () => {}
  }

  const handleHashChange = () => {
    set(parseHash(window.location.hash))
  }

  window.addEventListener('hashchange', handleHashChange)

  // Ensure the initial subscription receives the current hash value.
  handleHashChange()

  return () => {
    window.removeEventListener('hashchange', handleHashChange)
  }
})

export interface NavigateOptions {
  /** Replace the current history entry instead of pushing a new one. */
  replace?: boolean
}

export function navigate(
  path: string,
  query?: Record<string, RouteQueryValue>,
  options: NavigateOptions = {},
) {
  if (!isBrowser) return

  const normalizedPath = normalizePath(path)
  const search = buildQueryString(query)
  const hash = `${normalizedPath}${search}`

  if (options.replace) {
    history.replaceState(history.state, '', `#${hash}`)
    // Manually dispatch the update so subscribers stay in sync.
    dispatchSyntheticHashChange(hash)
  } else {
    window.location.hash = hash
  }
}

export function parseHash(rawHash: string): RouteState {
  const withoutHash = rawHash.startsWith('#') ? rawHash.slice(1) : rawHash
  const [rawPath, rawQuery = ''] = withoutHash.split('?')
  const path = normalizePath(rawPath)
  const segments = path.split('/').filter(Boolean)
  const query = parseQuery(rawQuery)

  return {
    path,
    segments,
    query,
    hash: withoutHash,
  }
}

function normalizePath(path: string) {
  if (!path || path === '#') return '/'
  const trimmed = path.trim()
  if (!trimmed) return '/'
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
}

function parseQuery(input: string) {
  const params = new URLSearchParams(input)
  const query: Record<string, string> = {}
  params.forEach((value, key) => {
    query[key] = value
  })
  return query
}

function buildQueryString(query?: Record<string, RouteQueryValue>) {
  if (!query) return ''
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue
    params.set(key, String(value))
  }
  const output = params.toString()
  return output ? `?${output}` : ''
}

function dispatchSyntheticHashChange(nextHash: string) {
  const event = new HashChangeEvent('hashchange', {
    oldURL: `${window.location.origin}${window.location.pathname}${window.location.search}#${routeSnapshot.hash}`,
    newURL: `${window.location.origin}${window.location.pathname}${window.location.search}#${nextHash}`,
  })
  window.dispatchEvent(event)
}

let routeSnapshot = initialState
route.subscribe((value) => {
  routeSnapshot = value
})
