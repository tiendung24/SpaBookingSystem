import { Router } from 'express'

export const addressRouter = Router()

const ADDRESS_API = 'https://production.cas.so/latest'

function normalizeItems(data) {
  return Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
}

addressRouter.get('/provinces', async (req, res) => {
  try {
    const response = await fetch(`${ADDRESS_API}/provinces`)
    if (!response.ok) throw new Error(`Casso AddressKit HTTP ${response.status}`)
    const data = await response.json()
    res.json({ items: normalizeItems(data), raw: data })
  } catch (error) {
    res.status(500).json({ message: 'Không lấy được danh sách tỉnh/thành', error: error.message })
  }
})

addressRouter.get('/provinces/:provinceId/communes', async (req, res) => {
  try {
    const provinceId = String(req.params.provinceId || '').trim()
    if (!provinceId) return res.status(400).json({ message: 'Thiếu provinceId' })
    const response = await fetch(`${ADDRESS_API}/provinces/${encodeURIComponent(provinceId)}/communes`)
    if (!response.ok) throw new Error(`Casso AddressKit HTTP ${response.status}`)
    const data = await response.json()
    res.json({ items: normalizeItems(data), raw: data })
  } catch (error) {
    res.status(500).json({ message: 'Không lấy được danh sách xã/phường', error: error.message })
  }
})
