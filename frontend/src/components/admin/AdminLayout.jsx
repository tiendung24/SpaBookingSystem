import AdminSidebar from './AdminSidebar'

export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50 text-main">
      <AdminSidebar />
      <main className="ml-72 p-6 md:p-10 space-y-8">{children}</main>
    </div>
  )
}

