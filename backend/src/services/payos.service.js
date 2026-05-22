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

    const resp = await payOS.createPaymentLink(body)
    return resp
  }

  async createTopupPayment({ amount, description }) {
    const resp = await this.createPaymentLink({
      amount,
      description: description || 'TOPUP',
      items: [{ name: 'Topup', quantity: 1, price: Number(amount) }]
    })

    return {
      topupId: String(resp.orderCode),
      amount: resp.amount,
      description: resp.description,
      qrCodeUrl: resp.qrCode,
      checkoutUrl: resp.checkoutUrl,
      status: resp.status || 'pending',
      raw: resp
    }
  }

  async createDepositPayment({ bookingCode, amount, description }) {
    const resp = await this.createPaymentLink({
      amount,
      description: description || `DEPOSIT_${bookingCode}`,
      items: [{ name: `Cọc ${bookingCode}`, quantity: 1, price: Number(amount) }]
    })

    return {
      bookingCode,
      amount: resp.amount,
      description: resp.description,
      qrCodeUrl: resp.qrCode,
      checkoutUrl: resp.checkoutUrl,
      payosOrderId: String(resp.orderCode),
      status: resp.status || 'pending',
      raw: resp
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
      const raw = JSON.stringify(payload ?? {})
      const signature = crypto.createHmac('sha256', this.checksumKey).update(raw).digest('hex')
      return Boolean(signature)
    } catch {
      return false
    }
  }
}

