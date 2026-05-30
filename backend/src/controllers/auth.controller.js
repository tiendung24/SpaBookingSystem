import bcrypt from 'bcryptjs'
import { Booking, Customer, Shop, User } from '../models/index.js'
import { signAccessToken } from '../utils/auth.js'
import { httpError } from '../utils/httpError.js'
import { writeAuditLog } from '../utils/audit.js'

function normalizeRole(role) {
  return String(role || '').toLowerCase()
}

function normalizePhone(phone) {
  return String(phone || '')
    .trim()
    .replace(/[\s.-]/g, '')
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

function normalizeSlug(slug) {
  return String(slug || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u0111/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
}

function isValidPhone(phone) {
  return /^(?:\+84|0)\d{9,10}$/.test(phone)
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function isValidSlug(slug) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length >= 3 && slug.length <= 80
}

async function loginByRole(req, role) {
  const { phone, email, password } = req.body || {}
  const normalizedPhone = normalizePhone(phone)
  const normalizedEmail = normalizeEmail(email)
  const passwordText = String(password || '')

  if ((!normalizedPhone && !normalizedEmail) || !passwordText) {
    throw httpError(400, 'Thiếu thông tin đăng nhập')
  }
  if (normalizedPhone && !isValidPhone(normalizedPhone)) {
    throw httpError(400, 'Số điện thoại không hợp lệ')
  }
  if (!normalizedPhone && normalizedEmail && !isValidEmail(normalizedEmail)) {
    throw httpError(400, 'Email không hợp lệ')
  }

  const query = normalizedPhone ? { phone: normalizedPhone } : { email: normalizedEmail }
  const user = await User.findOne(query)
  if (!user) throw httpError(401, 'Sai tài khoản hoặc mật khẩu')

  const userRole = normalizeRole(user.role)
  const acceptedRoles = role === 'admin' ? ['admin', 'super_admin'] : role === 'customer' ? ['customer'] : ['shop', 'owner', 'shop_owner']
  if (!acceptedRoles.includes(userRole)) throw httpError(403, 'Không đúng vai trò đăng nhập')

  const hash = user.passwordHash || user.password || ''
  const matched = hash.startsWith('$2') ? await bcrypt.compare(passwordText, hash) : passwordText === hash
  if (!matched) throw httpError(401, 'Sai tài khoản hoặc mật khẩu')

  user.lastLoginAt = new Date()
  await user.save()

  const token = signAccessToken({
    sub: String(user._id),
    role: user.role,
    shopId: user.shopId ? String(user.shopId) : null,
    customerId: user.customerId ? String(user.customerId) : null
  })

  return { token, user }
}

export async function shopRegister(req, res) {
  const { fullName, phone, email, password, shopName, slug } = req.body || {}

  const normalizedPhone = normalizePhone(phone)
  const normalizedEmail = email ? normalizeEmail(email) : ''
  const normalizedSlug = normalizeSlug(slug)
  const shopNameText = String(shopName || '').trim()
  const fullNameText = String(fullName || '').trim()
  const passwordText = String(password || '')

  if (!normalizedPhone || !passwordText || !shopNameText || !normalizedSlug) {
    throw httpError(400, 'Thiếu thông tin đăng ký')
  }
  if (!isValidPhone(normalizedPhone)) {
    throw httpError(400, 'Số điện thoại không hợp lệ')
  }
  if (normalizedEmail && !isValidEmail(normalizedEmail)) {
    throw httpError(400, 'Email không hợp lệ')
  }
  if (passwordText.length < 6) {
    throw httpError(400, 'Mật khẩu phải từ 6 ký tự trở lên')
  }
  if (!isValidSlug(normalizedSlug)) {
    throw httpError(400, 'Slug không hợp lệ (3-80 ký tự, chỉ gồm a-z, 0-9 và dấu -)')
  }

  const existedQuery = [{ phone: normalizedPhone }]
  if (normalizedEmail) existedQuery.push({ email: normalizedEmail })
  const existed = await User.findOne({ $or: existedQuery })
  if (existed) throw httpError(409, 'Số điện thoại hoặc email đã tồn tại')

  const existedSlug = await Shop.findOne({ slug: normalizedSlug })
  if (existedSlug) throw httpError(409, 'Slug đã tồn tại')

  const passwordHash = await bcrypt.hash(passwordText, 10)
  const user = await User.create({
    fullName: fullNameText || shopNameText,
    phone: normalizedPhone,
    email: normalizedEmail || undefined,
    passwordHash,
    role: 'shop',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date()
  })

  const shop = await Shop.create({
    ownerId: String(user._id),
    name: shopNameText,
    slug: normalizedSlug,
    phone: normalizedPhone,
    email: normalizedEmail || undefined,
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

export async function customerRegister(req, res) {
  const { fullName, phone, email, password } = req.body || {}
  const normalizedPhone = normalizePhone(phone)
  const normalizedEmail = normalizeEmail(email)
  const passwordText = String(password || '')
  const fullNameText = String(fullName || '').trim()

  if (!normalizedEmail || !passwordText) throw httpError(400, 'Thiếu thông tin đăng ký')
  if (!isValidEmail(normalizedEmail)) throw httpError(400, 'Email không hợp lệ')
  if (passwordText.length < 6) throw httpError(400, 'Mật khẩu phải từ 6 ký tự trở lên')
  if (normalizedPhone && !isValidPhone(normalizedPhone)) throw httpError(400, 'Số điện thoại không hợp lệ')

  const existed = await User.findOne({ email: normalizedEmail }).lean()
  if (existed) throw httpError(409, 'Email đã tồn tại')

  let customer = await Customer.findOne({ email: normalizedEmail })
  if (!customer) {
    customer = await Customer.create({
      fullName: fullNameText || normalizedEmail,
      phone: normalizedPhone || '',
      email: normalizedEmail,
      createdAt: new Date(),
      updatedAt: new Date()
    })
  }

  const passwordHash = await bcrypt.hash(passwordText, 10)
  const user = await User.create({
    fullName: fullNameText || customer.fullName || normalizedEmail,
    phone: normalizedPhone || customer.phone || '',
    email: normalizedEmail,
    passwordHash,
    role: 'customer',
    status: 'active',
    customerId: String(customer._id),
    createdAt: new Date(),
    updatedAt: new Date()
  })

  await Booking.updateMany(
    {
      $or: [
        { customerEmail: normalizedEmail },
        { customerEmail: String(normalizedEmail).toLowerCase() }
      ]
    },
    { $set: { customerId: String(customer._id), updatedAt: new Date() } }
  )

  await writeAuditLog({ actorUserId: String(user._id), action: 'auth.customer_register', entity: 'customer', entityId: String(customer._id), meta: { email: normalizedEmail } })
  res.status(201).json({ userId: String(user._id), customerId: String(customer._id) })
}

export async function customerLogin(req, res) {
  const result = await loginByRole(req, 'customer')
  const email = normalizeEmail(result.user.email || req.body?.email || '')
  if (email) {
    const customer = await Customer.findOneAndUpdate(
      { email },
      {
        $set: {
          fullName: result.user.fullName || '',
          phone: result.user.phone || '',
          updatedAt: new Date()
        },
        $setOnInsert: { createdAt: new Date() }
      },
      { upsert: true, new: true }
    )
    if (customer) {
      await User.updateOne({ _id: result.user._id }, { $set: { customerId: String(customer._id), updatedAt: new Date() } })
      await Booking.updateMany({ customerEmail: email }, { $set: { customerId: String(customer._id), updatedAt: new Date() } })
    }
  }
  await writeAuditLog({ actorUserId: String(result.user._id), action: 'auth.customer_login', entity: 'user', entityId: String(result.user._id), meta: { email: result.user.email || '' } })
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