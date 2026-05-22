import bcrypt from 'bcryptjs'
import { Shop, User } from '../models/index.js'
import { signAccessToken } from '../utils/auth.js'
import { httpError } from '../utils/httpError.js'
import { writeAuditLog } from '../utils/audit.js'

function normalizeRole(role) {
  return String(role || '').toLowerCase()
}

async function loginByRole(req, role) {
  const { phone, email, password } = req.body || {}
  if ((!phone && !email) || !password) throw httpError(400, 'Thiếu thông tin đăng nhập')

  const query = phone ? { phone } : { email: String(email).toLowerCase() }
  const user = await User.findOne(query)
  if (!user) throw httpError(401, 'Sai tài khoản hoặc mật khẩu')

  const userRole = normalizeRole(user.role)
  const acceptedRoles = role === 'admin' ? ['admin', 'super_admin'] : ['shop', 'owner', 'shop_owner']
  if (!acceptedRoles.includes(userRole)) throw httpError(403, 'Không đúng vai trò đăng nhập')

  const hash = user.passwordHash || user.password || ''
  const matched = hash.startsWith('$2') ? await bcrypt.compare(password, hash) : password === hash
  if (!matched) throw httpError(401, 'Sai tài khoản hoặc mật khẩu')

  user.lastLoginAt = new Date()
  await user.save()

  const token = signAccessToken({
    sub: String(user._id),
    role: user.role,
    shopId: user.shopId ? String(user.shopId) : null
  })

  return { token, user }
}

export async function shopRegister(req, res) {
  const { fullName, phone, email, password, shopName, slug } = req.body || {}
  if (!phone || !password || !shopName || !slug) throw httpError(400, 'Thiếu thông tin đăng ký')

  const existed = await User.findOne({ $or: [{ phone }, { email }] })
  if (existed) throw httpError(409, 'Số điện thoại hoặc email đã tồn tại')

  const passwordHash = await bcrypt.hash(password, 10)
  const user = await User.create({
    fullName: fullName || shopName,
    phone,
    email: email ? String(email).toLowerCase() : undefined,
    passwordHash,
    role: 'shop',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date()
  })

  const shop = await Shop.create({
    ownerId: String(user._id),
    name: shopName,
    slug,
    phone,
    email: email ? String(email).toLowerCase() : undefined,
    status: 'active',
    onlineBookingEnabled: true,
    createdAt: new Date(),
    updatedAt: new Date()
  })

  user.shopId = String(shop._id)
  await user.save()

  await writeAuditLog({
    actorUserId: String(user._id),
    action: 'auth.shop_register',
    entity: 'shop',
    entityId: String(shop._id),
    meta: { slug: shop.slug, phone: user.phone }
  })

  res.status(201).json({ userId: String(user._id), shopId: String(shop._id), slug: shop.slug })
}

export async function shopLogin(req, res) {
  const result = await loginByRole(req, 'shop')
  await writeAuditLog({
    actorUserId: String(result.user._id),
    action: 'auth.shop_login',
    entity: 'user',
    entityId: String(result.user._id),
    meta: { phone: result.user.phone, shopId: result.user.shopId }
  })
  res.json({ token: result.token, user: result.user })
}

export async function adminLogin(req, res) {
  const result = await loginByRole(req, 'admin')
  await writeAuditLog({
    actorUserId: String(result.user._id),
    action: 'auth.admin_login',
    entity: 'user',
    entityId: String(result.user._id),
    meta: { phone: result.user.phone, role: result.user.role }
  })
  res.json({ token: result.token, user: result.user })
}

export async function me(req, res) {
  const user = await User.findById(req.auth.userId).lean()
  if (!user) throw httpError(404, 'Không tìm thấy người dùng')
  res.json({ user })
}

export async function changePassword(req, res) {
  const { oldPassword, newPassword } = req.body || {}
  if (!oldPassword || !newPassword) throw httpError(400, 'Thiếu mật khẩu')

  const user = await User.findById(req.auth.userId)
  if (!user) throw httpError(404, 'Không tìm thấy người dùng')

  const hash = user.passwordHash || user.password || ''
  const matched = hash.startsWith('$2') ? await bcrypt.compare(oldPassword, hash) : oldPassword === hash
  if (!matched) throw httpError(401, 'Mật khẩu cũ không đúng')

  user.passwordHash = await bcrypt.hash(newPassword, 10)
  user.updatedAt = new Date()
  await user.save()
  await writeAuditLog({
    actorUserId: String(user._id),
    action: 'auth.change_password',
    entity: 'user',
    entityId: String(user._id),
    meta: {}
  })
  res.json({ success: true })
}
