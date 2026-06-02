import { Router } from 'express'

export const addressRouter = Router()

const ADDRESS_API = String(
  process.env.CASSO_ADDRESS_API_BASE_URL || process.env.ADDRESS_API_BASE_URL || 'https://production.cas.so/latest',
).replace(/\/+$/, '')
const ADDRESS_API_TIMEOUT_MS = 10000
const FALLBACK_ADDRESS_API = 'https://provinces.open-api.vn/api/v2'

function normalizeItems(data) {
  return Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
}

async function fetchAddressKit(path) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), ADDRESS_API_TIMEOUT_MS)

  try {
    const response = await fetch(`${ADDRESS_API}${path}`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })
    const responseText = await response.text()
    let data = null

    try {
      data = responseText ? JSON.parse(responseText) : null
    } catch {
      data = null
    }

    if (!response.ok) {
      const error = new Error(`Casso AddressKit HTTP ${response.status}`)
      error.status = response.status
      error.body = responseText.slice(0, 300)
      throw error
    }

    return data
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`Casso AddressKit timeout sau ${ADDRESS_API_TIMEOUT_MS / 1000}s`)
    }

    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

async function fetchFallbackJson(path) {
  const response = await fetch(`${FALLBACK_ADDRESS_API}${path}`, {
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    const error = new Error(`Fallback Address API HTTP ${response.status}`)
    error.status = response.status
    error.body = (await response.text()).slice(0, 300)
    throw error
  }

  return response.json()
}

function normalizeFallbackProvinces(data) {
  return Array.isArray(data)
    ? data.map((province) => ({
        id: String(province.code),
        name: province.name,
      }))
    : []
}

function normalizeFallbackCommunes(data) {
  const wards = Array.isArray(data?.wards) ? data.wards : []

  return wards.map((ward) => ({
    id: String(ward.code),
    name: ward.name,
  }))
}

function sendAddressError(res, message, error) {
  console.error('[address] AddressKit proxy failed', {
    baseUrl: ADDRESS_API,
    message,
    error: error.message,
    status: error.status,
    body: error.body,
  })

  res.status(500).json({
    message,
    error: error.message,
    provider: 'casso-addresskit',
    baseUrl: ADDRESS_API,
    status: error.status,
    body: error.body,
  })
}

addressRouter.get('/provinces', async (req, res) => {
  try {
    try {
      const data = await fetchAddressKit('/provinces')
      return res.json({ items: normalizeItems(data), raw: data, provider: 'casso-addresskit' })
    } catch (primaryError) {
      console.error('[address] Primary provider failed, switching to fallback', {
        baseUrl: ADDRESS_API,
        error: primaryError.message,
        status: primaryError.status,
      })

      const fallbackData = await fetchFallbackJson('/p/')
      return res.json({
        items: normalizeFallbackProvinces(fallbackData),
        raw: fallbackData,
        provider: 'open-api-vn-fallback',
      })
    }
  } catch (error) {
    sendAddressError(res, 'Không lấy được danh sách tỉnh/thành', error)
  }
})

addressRouter.get('/provinces/:provinceId/communes', async (req, res) => {
  try {
    const provinceId = String(req.params.provinceId || '').trim()
    if (!provinceId) return res.status(400).json({ message: 'Thiếu provinceId' })

    try {
      const data = await fetchAddressKit(`/provinces/${encodeURIComponent(provinceId)}/communes`)
      return res.json({ items: normalizeItems(data), raw: data, provider: 'casso-addresskit' })
    } catch (primaryError) {
      console.error('[address] Primary provider failed, switching to fallback', {
        baseUrl: ADDRESS_API,
        provinceId,
        error: primaryError.message,
        status: primaryError.status,
      })

      const fallbackData = await fetchFallbackJson(`/p/${encodeURIComponent(provinceId)}?depth=2`)
      return res.json({
        items: normalizeFallbackCommunes(fallbackData),
        raw: fallbackData,
        provider: 'open-api-vn-fallback',
      })
    }
  } catch (error) {
    sendAddressError(res, 'Không lấy được danh sách xã/phường', error)
  }
})
