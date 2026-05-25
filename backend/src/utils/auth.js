import jwt from 'jsonwebtoken'

const DEFAULT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h'

export function signAccessToken(payload) {
  const secret = process.env.JWT_SECRET || 'change_me'
  return jwt.sign(payload, secret, { expiresIn: DEFAULT_EXPIRES_IN })
}

export function verifyAccessToken(token) {
  const secret = process.env.JWT_SECRET || 'change_me'
  return jwt.verify(token, secret)
}

