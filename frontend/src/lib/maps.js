export function getAddressText(address) {
  if (typeof address === 'string') return address.trim()
  if (!address || typeof address !== 'object') return ''

  const full = address.fullAddress || address.fullText
  if (full) return String(full).trim()

  return String(
    [
      address.detail,
      address.line1,
      address.street,
      address.communeName,
      address.ward,
      address.district,
      address.provinceName,
      address.city,
      address.province
    ]
      .filter(Boolean)
      .join(', ')
  ).trim()
}

export function buildFullAddress({ detail = '', communeName = '', provinceName = '' } = {}) {
  return [detail, communeName, provinceName]
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .join(', ')
}

export function normalizeAddressForForm(address) {
  if (typeof address === 'string') {
    return {
      provinceId: '',
      provinceName: '',
      communeId: '',
      communeName: '',
      detail: address.trim(),
      fullAddress: address.trim()
    }
  }

  const obj = address && typeof address === 'object' ? address : {}
  const normalized = {
    provinceId: String(obj.provinceId || ''),
    provinceName: String(obj.provinceName || obj.province || obj.city || ''),
    communeId: String(obj.communeId || ''),
    communeName: String(obj.communeName || obj.ward || obj.district || ''),
    detail: String(obj.detail || obj.line1 || obj.street || ''),
    fullAddress: String(obj.fullAddress || obj.fullText || '')
  }

  if (!normalized.fullAddress) normalized.fullAddress = buildFullAddress(normalized)
  return normalized
}

export function getShopAddressText(shop) {
  return getAddressText(shop?.address)
}

export function buildGoogleMapsDirectionsUrl(address) {
  const text = getAddressText(address)
  if (!text) return ''
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(text)}`
}

export function buildShopGoogleMapsUrl(shop) {
  return buildGoogleMapsDirectionsUrl(shop?.address)
}
