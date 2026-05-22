import { emitAuthExpired } from './auth'

function getBaseUrl() {
  return import.meta.env.VITE_API_BASE_URL || ''
}

function buildUrl(path) {
  const base = getBaseUrl()
  if (!base) return path
  return `${base}${path}`
}

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message || `HTTP ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

export async function apiRequest(path, { method = 'GET', token, body, headers } = {}) {
  const res = await fetch(buildUrl(path), {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {})
    },
    body: body ? JSON.stringify(body) : undefined
  })

  const isJson = (res.headers.get('content-type') || '').includes('application/json')
  const data = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null)

  if (!res.ok) {
    const message = data?.message || data?.error || res.statusText
    if (res.status === 401) {
      emitAuthExpired({ path, method, message })
    }
    throw new ApiError(res.status, message, data?.details ?? data)
  }

  return data
}
