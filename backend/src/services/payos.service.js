import crypto from 'crypto'

function requireEnv(name) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing env: ${name}`)
  return value
}

function randomOrderCode() {
  // PayOS orderCode thường là số; dùng timestamp + random, vẫn < 2^53
  const suffix = Math.floor(Math.random() * 900 + 100) // 100..999
  return Number(`${Date.now()}${suffix}`.slice(0, 15))
}

async function loadPayOSSdk() {
  // Lazy-load để tránh crash nếu người dùng chưa npm install
  const mod = await import('@payos/node')
  return mod.default || mod.PayOS || mod
}

export class PayOSService {
  constructor() {
    this.clientId = process.env.PAYOS_CLIENT_ID || ''
    this.apiKey = process.env.PAYOS_API_KEY || ''
    this.checksumKey = process.env.PAYOS_CHECKSUM_KEY || ''
    this.returnUrl = process.env.PAYOS_RETURN_URL || ''
    this.cancelUrl = process.env.PAYOS_CANCEL_URL || ''
  }

  async createPaymentLink({ orderCode, amount, description, returnUrl, cancelUrl, items = [] }) {
    const PayOS = await loadPayOSSdk()
    const payOS = new PayOS(
      requireEnv('PAYOS_CLIENT_ID'),
      requireEnv('PAYOS_API_KEY'),
      requireEnv('PAYOS_CHECKSUM_KEY')
    )

    const body = {
      orderCode: Number(orderCode || randomOrderCode()),
      amount: Number(amount),
      description: String(description || '').slice(0, 25),
      returnUrl: returnUrl || this.returnUrl,
      cancelUrl: cancelUrl || this.cancelUrl,
      items: items.length
        ? items.map((i) => ({
            name: String(i.name || 'Item').slice(0, 25),
            quantity: Number(i.quantity || 1),
            price: Number(i.price || 0)
          }))
        : [{ name: 'Payment', quantity: 1, price: Number(amount) }]
    }

    try {
      const resp = await payOS.createPaymentLink(body)
      return resp
    } catch (err) {
      console.error('[PayOS createPaymentLink] error', err && err.message)
      throw err
    }
  }

  normalizePaymentResponse(resp) {
    const data = resp?.data && typeof resp.data === 'object' ? resp.data : resp
    return {
      orderCode: data?.orderCode ?? resp?.orderCode,
      amount: data?.amount ?? resp?.amount,
      description: data?.description ?? resp?.description,
      qrCode: data?.qrCode ?? data?.qrCodeUrl ?? resp?.qrCode ?? resp?.qrCodeUrl,
      checkoutUrl: data?.checkoutUrl ?? resp?.checkoutUrl,
      status: data?.status ?? resp?.status ?? 'pending',
      raw: resp
    }
  }

  async createTopupPayment({ amount, description }) {
    const resp = await this.createPaymentLink({
      amount,
      description: description || 'TOPUP',
      items: [{ name: 'Topup', quantity: 1, price: Number(amount) }]
    })

    const payment = this.normalizePaymentResponse(resp)

    return {
      topupId: String(payment.orderCode),
      amount: payment.amount,
      description: payment.description,
      qrCodeUrl: payment.qrCode,
      checkoutUrl: payment.checkoutUrl,
      status: payment.status,
      raw: payment.raw
    }
  }

  async createDepositPayment({ bookingCode, amount, description }) {
    // Ensure an explicit numeric orderCode is generated to avoid SDK/order collisions
    const orderCode = randomOrderCode()
    const resp = await this.createPaymentLink({
      orderCode,
      amount,
      description: description || `DEPOSIT_${bookingCode}`,
      items: [{ name: `Cọc ${bookingCode}`, quantity: 1, price: Number(amount) }]
    })

    const payment = this.normalizePaymentResponse(resp)

    return {
      bookingCode,
      amount: payment.amount,
      description: payment.description,
      qrCodeUrl: payment.qrCode,
      checkoutUrl: payment.checkoutUrl,
      payosOrderId: String(payment.orderCode),
      status: payment.status,
      raw: payment.raw
    }
  }

  /**
   * Verify webhook theo SDK PayOS (chuẩn hơn việc tự HMAC JSON).
   * Nếu SDK thay đổi method name, mình fallback sang verify nhẹ để không block dev.
   */
  async verifyWebhook(payload) {
    if (!this.clientId || !this.apiKey || !this.checksumKey) return false
    try {
      const PayOS = await loadPayOSSdk()
      const payOS = new PayOS(this.clientId, this.apiKey, this.checksumKey)

      // Tuỳ phiên bản SDK: verifyPaymentWebhookData / verifyWebhook / verifyWebhookData
      if (typeof payOS.verifyPaymentWebhookData === 'function') {
        payOS.verifyPaymentWebhookData(payload)
        return true
      }
      if (typeof payOS.verifyWebhook === 'function') {
        payOS.verifyWebhook(payload)
        return true
      }
      if (typeof payOS.verifyWebhookData === 'function') {
        payOS.verifyWebhookData(payload)
        return true
      }

      // Fallback: kiểm tra chữ ký dạng HMAC trên chuỗi JSON (dev only)
      // Nếu payload chứa trường chữ ký (signature/checksum), so sánh HMAC an toàn.
      // Compute HMAC over payload WITHOUT the signature field
      const incoming = String(payload?.signature || payload?.checksum || payload?.sig || payload?.hmac || '')
      if (!incoming) return false
      try {
        const copy = { ...payload }
        delete copy.signature
        delete copy.checksum
        delete copy.sig
        delete copy.hmac
        const raw = JSON.stringify(copy ?? {})
        const expected = crypto.createHmac('sha256', this.checksumKey).update(raw).digest('hex')
        // Also accept signature computed over `data` payload alone (some integrations sign only inner data)
        let expectedData = null
        try {
          if (copy && copy.data) {
            expectedData = crypto.createHmac('sha256', this.checksumKey).update(JSON.stringify(copy.data)).digest('hex')
          }
        } catch (e) {
          expectedData = null
        }
        const a = Buffer.from(expected)
        const b = Buffer.from(incoming)
        if (a.length !== b.length) return false
        if (crypto.timingSafeEqual(a, b)) return true
        if (expectedData) {
          const c = Buffer.from(expectedData)
          if (c.length === b.length && crypto.timingSafeEqual(c, b)) return true
        }
        return false
        return false
      } catch (e) {
        return false
      }
    } catch {
      return false
    }
  }
}



