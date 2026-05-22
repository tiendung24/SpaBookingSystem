const TOKEN_KEY = 'lumix_token'
const ROLE_KEY = 'lumix_role'
export const AUTH_EXPIRED_EVENT = 'lumix:auth-expired'

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY) || ''
}

export function setStoredAuth(token, role = '') {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(ROLE_KEY, role)
}

export function clearStoredAuth() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(ROLE_KEY)
}

export function getStoredRole() {
  return localStorage.getItem(ROLE_KEY) || ''
}

export function emitAuthExpired(detail = {}) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT, { detail }))
  }
}
