const BASE = '/api'

function getToken(): string {
  return localStorage.getItem('qg_auth_token') || ''
}

function headers(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'X-QG-Token': getToken(),
  }
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { ...headers(), ...(options?.headers || {}) },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

interface StreamOptions {
  method?: 'GET' | 'POST'
  onEvent?: (event: Record<string, unknown>) => void
}

export function apiStream(
  path: string,
  body: Record<string, unknown> | null,
  onChunk: (chunk: string) => void,
  onDone: () => void,
  onError: (err: string) => void,
  options?: StreamOptions
): () => void {
  const controller = new AbortController()
  const method = options?.method || (body ? 'POST' : 'GET')

  const requestInit: RequestInit = {
    method,
    headers: headers(),
    signal: controller.signal,
  }
  if (method !== 'GET' && body) {
    requestInit.body = JSON.stringify(body)
  }

  fetch(`${BASE}${path}`, {
    ...requestInit,
  }).then(async (res) => {
    if (!res.ok || !res.body) {
      onError(`HTTP ${res.status}`)
      return
    }
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        try {
          const data = JSON.parse(line.slice(6))
          if (data.chunk) onChunk(String(data.chunk))
          else if (data.done) onDone()
          else if (data.error) onError(String(data.error))
          else if (typeof data === 'object' && data) {
            options?.onEvent?.(data as Record<string, unknown>)
          }
        } catch { /* ignore malformed */ }
      }
    }
    onDone()
  }).catch((err) => {
    if (err.name !== 'AbortError') onError(err.message)
  })

  return () => controller.abort()
}
