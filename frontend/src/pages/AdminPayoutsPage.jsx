import { useEffect, useState } from 'react'
import AdminHeaderNav from '../components/admin/AdminHeaderNav'
import AdminLayout from '../components/admin/AdminLayout'
import { useToast } from '../components/ui/ToastProvider'
import { useShop } from '../context/ShopContext'
import { apiRequest } from '../lib/api'

export default function AdminPayoutsPage() {
  const { token } = useShop()
  const { pushToast } = useToast()
  const [payouts, setPayouts] = useState([])
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState('pending')
  const [actionLoading, setActionLoading] = useState(null)
  const [rejectId, setRejectId] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  const fetchPayouts = async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await apiRequest(`/api/admin/payouts?status=${statusFilter}&limit=100`, { token })
      setPayouts(res?.items || [])
    } catch (error) {
      pushToast({ type: 'error', title: 'Lỗi', message: 'Không thể tải danh sách yêu cầu rút tiền' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayouts()
  }, [token, statusFilter])

  const handleApprove = async (payoutId) => {
    if (!window.confirm('Bạn đã chuyển khoản thành công cho Shop? Nếu xác nhận, giao dịch sẽ được ghi nhận hoàn tất.')) return
    setActionLoading(payoutId)
    try {
      await apiRequest(`/api/admin/payouts/${payoutId}/approve`, {
        method: 'POST',
        token
      })
      pushToast({ type: 'success', title: 'Thành công', message: 'Đã duyệt yêu cầu rút tiền' })
      fetchPayouts()
    } catch (err) {
      pushToast({ type: 'error', title: 'Lỗi', message: err.message || 'Không thể duyệt yêu cầu' })
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async () => {
    if (!rejectReason) {
      return pushToast({ type: 'error', title: 'Lỗi', message: 'Vui lòng nhập lý do từ chối' })
    }
    setActionLoading(rejectId)
    try {
      await apiRequest(`/api/admin/payouts/${rejectId}/reject`, {
        method: 'POST',
        token,
        body: { reason: rejectReason }
      })
      pushToast({ type: 'success', title: 'Thành công', message: 'Đã từ chối và hoàn tiền cho Shop' })
      setRejectId(null)
      setRejectReason('')
      fetchPayouts()
    } catch (err) {
      pushToast({ type: 'error', title: 'Lỗi', message: err.message || 'Không thể từ chối yêu cầu' })
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <AdminLayout>
      <header>
        <h2 className="font-h2 text-h2 text-primary">Yêu cầu rút tiền (Payouts)</h2>
        <p className="text-main/70">Quản lý và duyệt các yêu cầu rút tiền từ ví của Shop về ngân hàng.</p>
        <AdminHeaderNav />
      </header>

      <section className="mt-8">
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-4 py-2 rounded-full font-label-bold text-sm ${statusFilter === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            Chờ duyệt
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-4 py-2 rounded-full font-label-bold text-sm ${statusFilter === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            Đã duyệt
          </button>
          <button
            onClick={() => setStatusFilter('rejected')}
            className={`px-4 py-2 rounded-full font-label-bold text-sm ${statusFilter === 'rejected' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            Từ chối
          </button>
        </div>

        <div className="glass-card bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-4 font-label-bold text-sm text-main/60 uppercase">Thời gian</th>
                  <th className="p-4 font-label-bold text-sm text-main/60 uppercase">Shop</th>
                  <th className="p-4 font-label-bold text-sm text-main/60 uppercase">Số tiền</th>
                  <th className="p-4 font-label-bold text-sm text-main/60 uppercase">Thông tin ngân hàng</th>
                  <th className="p-4 font-label-bold text-sm text-main/60 uppercase text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-main/60">Đang tải...</td>
                  </tr>
                ) : payouts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-main/60">Không có yêu cầu nào.</td>
                  </tr>
                ) : (
                  payouts.map((payout) => (
                    <tr key={payout._id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 text-sm text-main/80">
                        {new Date(payout.createdAt).toLocaleString('vi-VN')}
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-primary">{payout.shop?.name || 'Shop đã xóa'}</p>
                        <p className="text-xs text-main/60">{payout.shop?.phone || ''}</p>
                      </td>
                      <td className="p-4">
                        <p className="font-h3 text-h3 text-emerald-600 font-bold">{Number(payout.amount).toLocaleString('vi-VN')}đ</p>
                      </td>
                      <td className="p-4">
                        <div className="bg-slate-100 p-3 rounded-xl border border-slate-200">
                          <p className="text-sm"><strong>NH:</strong> {payout.bankInfo?.bankName}</p>
                          <p className="text-sm"><strong>STK:</strong> {payout.bankInfo?.accountNumber}</p>
                          <p className="text-sm"><strong>Tên:</strong> {payout.bankInfo?.accountName}</p>
                        </div>
                        {payout.status === 'rejected' && (
                          <p className="text-xs text-rose-600 mt-2 mt-1 font-bold">Lý do từ chối: {payout.rejectReason}</p>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        {payout.status === 'pending' ? (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setRejectId(payout._id)}
                              disabled={actionLoading === payout._id}
                              className="px-3 py-2 rounded-lg bg-rose-50 text-rose-600 font-bold hover:bg-rose-100 text-sm disabled:opacity-50"
                            >
                              Từ chối
                            </button>
                            <button
                              onClick={() => handleApprove(payout._id)}
                              disabled={actionLoading === payout._id}
                              className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-sm text-sm disabled:opacity-50"
                            >
                              Duyệt & Đã CK
                            </button>
                          </div>
                        ) : (
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${payout.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            {payout.status === 'completed' ? 'Đã duyệt' : 'Đã từ chối'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Modal Reject */}
      {rejectId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md">
            <h3 className="font-h3 text-h3 text-rose-600 mb-2">Từ chối yêu cầu rút tiền</h3>
            <p className="text-sm text-main/70 mb-4">Vui lòng nhập lý do từ chối. Số tiền rút sẽ được hoàn lại vào ví của Shop.</p>
            <input
              type="text"
              className="w-full p-3 rounded-xl border border-slate-300 mb-4"
              placeholder="Ví dụ: Sai thông tin ngân hàng"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="flex gap-3 justify-end">
              <button
                className="px-4 py-2 rounded-xl border border-slate-300 font-bold hover:bg-slate-50"
                onClick={() => { setRejectId(null); setRejectReason(''); }}
              >
                Hủy
              </button>
              <button
                className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 disabled:opacity-50"
                disabled={actionLoading === rejectId}
                onClick={handleReject}
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
