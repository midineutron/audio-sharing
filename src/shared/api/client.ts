export interface ApiClientOptions {
  baseUrl: string
  defaultHeaders?: Record<string, string>
}

export interface RequestOptions extends RequestInit {
  query?: Record<string, string | number | boolean | undefined>
}

const buildUrl = (baseUrl: string, path: string, query: RequestOptions['query']) => {
  const url = new URL(path, baseUrl)
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, String(value))
      }
    })
  }
  return url
}

export const createApiClient = ({ baseUrl, defaultHeaders = {} }: ApiClientOptions) => {
  const request = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
    const { query, headers, ...rest } = options
    const response = await fetch(buildUrl(baseUrl, path, query), {
      ...rest,
      headers: {
        'content-type': 'application/json',
        ...defaultHeaders,
        ...headers,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`API request failed: ${response.status} ${error}`)
    }

    if (response.status === 204) {
      return undefined as T
    }

    return (await response.json()) as T
  }

  return {
    get: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'GET' }),
    post: <T>(path: string, body: unknown, options?: RequestOptions) =>
      request<T>(path, {
        ...options,
        method: 'POST',
        body: JSON.stringify(body),
      }),
  }
}
