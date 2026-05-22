export const adminPartners = [
  {
    id: 'pt-001',
    shopName: 'Mộc Spa Quận 1',
    owner: 'Nguyễn Thanh Mai',
    phone: '0909 888 111',
    district: 'Quận 1, TP.HCM',
    plan: 'Nâng cao',
    joinedAt: '2026-05-01',
    status: 'active',
    rating: 4.9,
    monthlyBookings: 162,
    wallet: 1250000
  },
  {
    id: 'pt-002',
    shopName: 'Luna Nail Studio',
    owner: 'Trần Hải Yến',
    phone: '0912 222 454',
    district: 'Quận 3, TP.HCM',
    plan: 'Cơ bản',
    joinedAt: '2026-04-18',
    status: 'active',
    rating: 4.7,
    monthlyBookings: 96,
    wallet: 620000
  },
  {
    id: 'pt-003',
    shopName: 'An Nhiên Beauty House',
    owner: 'Lê Minh Tâm',
    phone: '0986 731 920',
    district: 'Thủ Đức, TP.HCM',
    plan: 'Nâng cao',
    joinedAt: '2026-05-15',
    status: 'pending',
    rating: 0,
    monthlyBookings: 0,
    wallet: 0
  },
  {
    id: 'pt-004',
    shopName: 'Sora Wellness',
    owner: 'Phạm Ngọc Anh',
    phone: '0977 321 009',
    district: 'Quận 7, TP.HCM',
    plan: 'Cơ bản',
    joinedAt: '2026-03-05',
    status: 'inactive',
    rating: 4.3,
    monthlyBookings: 41,
    wallet: 180000
  },
  {
    id: 'pt-005',
    shopName: 'Miyu Beauty Lab',
    owner: 'Đỗ Thanh Vy',
    phone: '0938 102 576',
    district: 'Bình Thạnh, TP.HCM',
    plan: 'Nâng cao',
    joinedAt: '2026-05-20',
    status: 'pending',
    rating: 0,
    monthlyBookings: 0,
    wallet: 0
  }
]

export const adminOnboardingRequests = [
  {
    id: 'rq-1001',
    shopName: 'Miyu Beauty Lab',
    owner: 'Đỗ Thanh Vy',
    phone: '0938 102 576',
    district: 'Bình Thạnh, TP.HCM',
    submittedAt: '2026-05-20T09:15:00',
    kycStatus: 'verified',
    servicesCount: 8,
    staffCount: 5
  },
  {
    id: 'rq-1002',
    shopName: 'An Nhiên Beauty House',
    owner: 'Lê Minh Tâm',
    phone: '0986 731 920',
    district: 'Thủ Đức, TP.HCM',
    submittedAt: '2026-05-19T16:40:00',
    kycStatus: 'pending',
    servicesCount: 4,
    staffCount: 2
  },
  {
    id: 'rq-1003',
    shopName: 'Selene Hair Spa',
    owner: 'Võ Minh Khôi',
    phone: '0902 444 112',
    district: 'Tân Bình, TP.HCM',
    submittedAt: '2026-05-18T13:10:00',
    kycStatus: 'verified',
    servicesCount: 11,
    staffCount: 7
  }
]

export const adminTransactions = [
  {
    id: 'txn-a100',
    time: '2026-05-20T10:15:00',
    shopName: 'Mộc Spa Quận 1',
    type: 'topup',
    amount: 500000,
    status: 'success'
  },
  {
    id: 'txn-a101',
    time: '2026-05-20T11:05:00',
    shopName: 'Luna Nail Studio',
    type: 'fee',
    amount: -10000,
    status: 'success'
  },
  {
    id: 'txn-a102',
    time: '2026-05-20T13:25:00',
    shopName: 'Sora Wellness',
    type: 'refund',
    amount: -120000,
    status: 'success'
  },
  {
    id: 'txn-a103',
    time: '2026-05-20T15:50:00',
    shopName: 'Miyu Beauty Lab',
    type: 'topup',
    amount: 300000,
    status: 'pending'
  }
]

export const adminIncidents = [
  {
    id: 'inc-01',
    shopName: 'Sora Wellness',
    type: 'high_cancel_rate',
    level: 'high',
    metric: 'Tỉ lệ hủy 28%',
    createdAt: '2026-05-20T09:30:00'
  },
  {
    id: 'inc-02',
    shopName: 'Luna Nail Studio',
    type: 'wallet_low',
    level: 'medium',
    metric: 'Ví dưới ngưỡng 100.000đ',
    createdAt: '2026-05-20T12:00:00'
  },
  {
    id: 'inc-03',
    shopName: 'Mộc Spa Quận 1',
    type: 'no_show_spike',
    level: 'low',
    metric: 'No-show tăng +4 ca/tuần',
    createdAt: '2026-05-19T18:20:00'
  }
]

export const adminTickets = [
  {
    id: 'tk-9001',
    shopName: 'An Nhiên Beauty House',
    title: 'Không nhận OTP đăng nhập',
    channel: 'Email',
    priority: 'high',
    status: 'open',
    createdAt: '2026-05-20T08:50:00'
  },
  {
    id: 'tk-9002',
    shopName: 'Mộc Spa Quận 1',
    title: 'Đối soát ví không khớp 1 giao dịch',
    channel: 'Email',
    priority: 'medium',
    status: 'in_progress',
    createdAt: '2026-05-19T14:12:00'
  },
  {
    id: 'tk-9003',
    shopName: 'Luna Nail Studio',
    title: 'Yêu cầu đổi tên chi nhánh hiển thị',
    channel: 'In-app',
    priority: 'low',
    status: 'resolved',
    createdAt: '2026-05-18T11:03:00'
  }
]
