import { verifyAccessToken } from '../utils/auth.js'
import { User } from '../models/index.js'
import { httpError } from '../utils/httpError.js'

function getBearerToken(req) {
  const authHeader = req.headers.authorization || ''
  const [type, token] = authHeader.split(' ')
  if (type !== 'Bearer' || !token) return null
  return token
}

export async function requireAuth(req, _res, next) {
  const token = getBearerToken(req)
  if (!token) return next(httpError(401, 'Thiếu Bearer token'))

  try {
    const payload = verifyAccessToken(token)
    const user = await User.findById(payload.sub).lean()
    if (!user) return next(httpError(401, 'Token không hợp lệ'))

    req.auth = {
      userId: String(user._id),
      role: user.role,
      shopId: user.shopId ? String(user.shopId) : null,
      customerId: user.customerId ? String(user.customerId) : null
    }
    next()
  } catch {
    next(httpError(401, 'Token hết hạn hoặc không hợp lệ'))
  }
}

export function requireRole(roles = []) {
  return (req, _res, next) => {
    if (!req.auth) return next(httpError(401, 'Chưa đăng nhập'))
    if (!roles.includes(req.auth.role)) {
      return next(httpError(403, 'Không có quyền truy cập'))
    }
    return next()
  }
}

