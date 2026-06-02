import { useEffect, useMemo, useState } from 'react'
import ShopSidebar from '../components/shop/ShopSidebar'
import SystemConfigTabs from '../components/shop/SystemConfigTabs'
import { useShop } from '../context/ShopContext'
import { apiRequest } from '../lib/api'
import { buildFullAddress, normalizeAddressForForm } from '../lib/maps'

function slugifyVietnamese(input) {
  return String(input || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u0111/g, 'd')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
}

function normalizePhone(input) {
  return String(input || '')
    .trim()
    .replace(/[\s.-]/g, '')
}

function isValidPhone(input) {
  if (!input) return true
  return /^(?:\+84|0)\d{9,10}$/.test(input)
}

function isValidSlug(input) {
  if (!input) return true
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input)
}

function itemId(item) {
  return String(item?.id ?? item?.code ?? item?._id ?? item?.provinceId ?? item?.communeId ?? '')
}

function itemName(item) {
  return String(item?.name ?? item?.fullName ?? item?.title ?? '')
}

function normalizeAddressItems(payload) {
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload)) return payload
  return []
}

export default function ShopConfigPage() {
  const { shop, setShop, token, uploadImage } = useShop()
  const [saving, setSaving] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  const [provinces, setProvinces] = useState([])
  const [communes, setCommunes] = useState([])
  const [addressForm, setAddressForm] = useState(() => normalizeAddressForForm(shop.address))
  const [addressLoading, setAddressLoading] = useState(false)
  const [communesLoading, setCommunesLoading] = useState(false)
  const [addressError, setAddressError] = useState('')

  const update = (patch) => setShop((prev) => ({ ...prev, ...patch }))

  const slug = shop.slug || ''
  const phone = shop.phone || ''
  const slugValid = isValidSlug(slug)
  const phoneValid = isValidPhone(phone)

  const fullAddress = useMemo(
    () => buildFullAddress(addressForm),
    [addressForm.detail, addressForm.communeName, addressForm.provinceName]
  )

  useEffect(() => {
    setAddressForm(normalizeAddressForForm(shop.address))
  }, [shop.address])

  useEffect(() => {
    let mounted = true
    async function loadProvinces() {
      setAddressLoading(true)
      setAddressError('')
      try {
        const res = await apiRequest('/api/address/provinces')
        if (mounted) setProvinces(normalizeAddressItems(res))
      } catch (err) {
        if (mounted) setAddressError(err?.message || 'Không tải được danh sách tỉnh/thành.')
      } finally {
        if (mounted) setAddressLoading(false)
      }
    }
    void loadProvinces()
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    let mounted = true
    async function loadCommunes() {
      const provinceId = String(addressForm.provinceId || '').trim()
      if (!provinceId) {
        setCommunes([])
        return
      }
      setCommunesLoading(true)
      setAddressError('')
      try {
        const res = await apiRequest(`/api/address/provinces/${encodeURIComponent(provinceId)}/communes`)
        if (mounted) setCommunes(normalizeAddressItems(res))
      } catch (err) {
        if (mounted) setAddressError(err?.message || 'Không tải được danh sách xã/phường.')
      } finally {
        if (mounted) setCommunesLoading(false)
      }
    }
    void loadCommunes()
    return () => { mounted = false }
  }, [addressForm.provinceId])

  const handleProvinceChange = (provinceId) => {
    const province = provinces.find((item) => itemId(item) === String(provinceId))
    setAddressForm((prev) => ({
      ...prev,
      provinceId: String(provinceId || ''),
      provinceName: province ? itemName(province) : '',
      communeId: '',
      communeName: ''
    }))
  }

  const handleCommuneChange = (communeId) => {
    const commune = communes.find((item) => itemId(item) === String(communeId))
    setAddressForm((prev) => ({
      ...prev,
      communeId: String(communeId || ''),
      communeName: commune ? itemName(commune) : ''
    }))
  }

  const handleDetailChange = (detail) => {
    setAddressForm((prev) => ({ ...prev, detail }))
  }

  const buildAddressPayload = () => ({
    provinceId: String(addressForm.provinceId || ''),
    provinceName: String(addressForm.provinceName || ''),
    communeId: String(addressForm.communeId || ''),
    communeName: String(addressForm.communeName || ''),
    detail: String(addressForm.detail || '').trim(),
    fullAddress
  })

  const handleCoverUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setUploadingCover(true)
    setError('')
    setNotice('')
    try {
      const uploadedUrl = await uploadImage(file)
      update({ coverUrl: uploadedUrl })
      setNotice('Đã tải ảnh bìa lên. Nhớ bấm “Lưu thông tin shop” để cập nhật.')
    } catch (err) {
      setError(err?.message || 'Không thể tải ảnh bìa lên.')
    } finally {
      setUploadingCover(false)
      event.target.value = ''
    }
  }

  const handleSave = async () => {
    if (!token) return
    if (!slugValid || !phoneValid) {
      setError('Vui lòng kiểm tra lại slug và số điện thoại trước khi lưu.')
      setNotice('')
      return
    }

    setSaving(true)
    setError('')
    setNotice('')
    try {
      const payload = {
        name: shop.name || '',
        phone: phone || '',
        coverUrl: shop.coverUrl || '',
        address: buildAddressPayload()
      }
      const res = await apiRequest('/api/shop/me', { method: 'PUT', token, body: payload })
      if (res?.shop) setShop((prev) => ({ ...prev, ...res.shop }))
      setNotice('Đã lưu thông tin shop thành công.')
    } catch (err) {
      setError(err?.message || 'Không thể lưu thông tin shop.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-main">
      <ShopSidebar onNewBooking={() => {}} />
      <main className="ml-64 p-6 md:p-10">
        <header className="mb-10">
          <h1 className="font-h2 text-h2 text-primary">Cấu hình hệ thống</h1>
          <p className="text-main/70">Thông tin shop, thông báo và các thiết lập vận hành.</p>
        </header>

        <SystemConfigTabs />

        <section className="glass-card bg-white/70 rounded-3xl p-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="font-h3 text-h3 text-primary">Thông tin shop</h2>
            <button
              type="button"
              className="px-5 py-3 rounded-2xl bg-primary text-white font-bold hover:brightness-110 disabled:opacity-60"
              onClick={handleSave}
              disabled={saving || uploadingCover}
            >
              {saving ? 'Đang lưu...' : 'Lưu thông tin shop'}
            </button>
          </div>

          {notice ? <div className="mb-4 rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-emerald-700">{notice}</div> : null}
          {error ? <div className="mb-4 rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-red-600">{error}</div> : null}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-bold text-main/70">Tên shop</label>
              <input
                className="w-full mt-1 p-3 rounded-xl border border-slate-300"
                value={shop.name || ''}
                onChange={(event) => update({ name: event.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-bold text-main/70">Slug</label>
              <input
                className={`w-full mt-1 p-3 rounded-xl border ${slugValid ? 'border-slate-300' : 'border-red-300'}`}
                value={slug}
                onChange={(event) => update({ slug: slugifyVietnamese(event.target.value) })}
                placeholder="vd: spa-quan-1"
              />
              <p className={`mt-1 text-xs ${slugValid ? 'text-main/60' : 'text-red-600'}`}>
                {slugValid ? 'Slug chỉ gồm a-z, 0-9 và dấu -.' : 'Slug không hợp lệ. Vui lòng chỉ dùng a-z, 0-9 và dấu -.'}
              </p>
            </div>

            <div>
              <label className="text-sm font-bold text-main/70">Số điện thoại</label>
              <input
                className={`w-full mt-1 p-3 rounded-xl border ${phoneValid ? 'border-slate-300' : 'border-red-300'}`}
                value={phone}
                onChange={(event) => update({ phone: normalizePhone(event.target.value) })}
                placeholder="0xxxxxxxxx hoặc +84xxxxxxxxx"
              />
              <p className={`mt-1 text-xs ${phoneValid ? 'text-main/60' : 'text-red-600'}`}>
                {phoneValid ? 'Định dạng hợp lệ: 0 hoặc +84, 10-11 số.' : 'Số điện thoại không hợp lệ.'}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-h3 text-h3 text-primary">Địa chỉ shop</h3>
                <p className="text-sm text-main/60">Chọn tỉnh/thành, xã/phường và nhập địa chỉ chi tiết. Hệ thống sẽ tự ghép địa chỉ đầy đủ.</p>
              </div>
              {addressLoading ? <span className="text-sm text-main/50">Đang tải tỉnh/thành...</span> : null}
            </div>

            {addressError ? <div className="mb-4 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-amber-700">{addressError}</div> : null}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-bold text-main/70">Tỉnh/Thành</label>
                <select
                  className="w-full mt-1 p-3 rounded-xl border border-slate-300 bg-white"
                  value={addressForm.provinceId}
                  onChange={(event) => handleProvinceChange(event.target.value)}
                  disabled={addressLoading}
                >
                  <option value="">Chọn tỉnh/thành</option>
                  {provinces.map((province) => (
                    <option key={itemId(province)} value={itemId(province)}>{itemName(province)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-bold text-main/70">Xã/Phường</label>
                <select
                  className="w-full mt-1 p-3 rounded-xl border border-slate-300 bg-white"
                  value={addressForm.communeId}
                  onChange={(event) => handleCommuneChange(event.target.value)}
                  disabled={!addressForm.provinceId || communesLoading}
                >
                  <option value="">{communesLoading ? 'Đang tải xã/phường...' : 'Chọn xã/phường'}</option>
                  {communes.map((commune) => (
                    <option key={itemId(commune)} value={itemId(commune)}>{itemName(commune)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-bold text-main/70">Địa chỉ chi tiết</label>
                <input
                  className="w-full mt-1 p-3 rounded-xl border border-slate-300"
                  value={addressForm.detail}
                  onChange={(event) => handleDetailChange(event.target.value)}
                  placeholder="Số nhà, tên đường, ngõ, thôn/xóm..."
                />
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-white border border-slate-200 p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-main/50">Full địa chỉ</p>
              <p className="mt-1 font-semibold text-main">{fullAddress || 'Chưa đủ thông tin địa chỉ'}</p>
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
            <div className="flex flex-col lg:flex-row gap-5 items-start">
              <div className="w-full lg:w-[360px]">
                <p className="text-sm font-bold text-main/70 mb-2">Ảnh bìa shop</p>
                <div className="aspect-[16/9] overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  {shop.coverUrl ? (
                    <img src={shop.coverUrl} alt="Ảnh bìa shop" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm text-main/50 px-6 text-center">
                      Chưa có ảnh bìa. Tải lên để landing page và danh sách đối tác hiển thị đẹp hơn.
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1">
                <p className="text-sm font-bold text-main/70">Tải ảnh bìa</p>
                <p className="mt-1 text-sm text-main/60">Khuyến nghị ảnh ngang tỷ lệ 16:9 để hiển thị tốt ở landing page và trang cửa hàng đối tác.</p>
                <label className="inline-flex mt-4 px-5 py-3 rounded-2xl border border-primary text-primary font-bold hover:bg-primary/5 cursor-pointer">
                  {uploadingCover ? 'Đang tải ảnh...' : 'Chọn ảnh bìa'}
                  <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} disabled={uploadingCover || saving} />
                </label>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
