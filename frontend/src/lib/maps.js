export function getAddressText(address) {
  if (typeof address === 'string') return address.trim()
  if (!address || typeof address !== 'object') return ''
  return String(
    address.fullText ||
    [address.line1, address.ward, address.district, address.city, address.province]
      .filter(Boolean)
      .join(', ')
  ).trim()
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
