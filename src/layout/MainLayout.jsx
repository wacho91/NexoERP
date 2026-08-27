import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
        <footer className="px-6 py-4 text-center text-xs text-gray-500 border-t">
          © {new Date().getFullYear()} NexoERP
        </footer>
      </div>
    </div>
  )
}
