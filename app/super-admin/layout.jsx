'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  Users,
  Settings,
  Menu,
  X,
  Moon,
  Sun,
  LogOut,
  Building2,
  DollarSign,
  CreditCard,
  Ticket,
  Bell,
  Shield,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useTheme } from '@/contexts/ThemeContext'
// TODO: Add super admin auth context

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/super-admin' },
  { icon: Building2, label: 'Empresas', href: '/super-admin/companies' },
  { icon: Users, label: 'Usuarios', href: '/super-admin/users' },
  { icon: CreditCard, label: 'Suscripciones', href: '/super-admin/subscriptions' },
  { icon: DollarSign, label: 'Pagos', href: '/super-admin/payments' },
  { icon: Ticket, label: 'Tickets', href: '/super-admin/tickets' },
  { icon: Bell, label: 'Notificaciones', href: '/super-admin/notifications' },
  { icon: Settings, label: 'Configuración', href: '/super-admin/settings' },
]

export default function SuperAdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const pathname = usePathname()
  const router = useRouter()

  // TODO: Replace with real super admin auth check
  const [isSuperAdmin, setIsSuperAdmin] = useState(true) // For demo purposes

  useEffect(() => {
    // TODO: Implement real check
    if (!isSuperAdmin) {
      router.replace('/login')
    }
  }, [isSuperAdmin, router])

  const handleSignOut = async () => {
    router.replace('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-gradient-to-b from-indigo-900 to-indigo-800 shadow-lg transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex h-16 items-center justify-between px-6 border-b border-indigo-700">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center">
              <Shield className="h-5 w-5 text-indigo-600" />
            </div>
            <span className="text-xl font-bold text-white">Super Admin</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-white hover:bg-indigo-700"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="p-4 space-y-1">
          {menuItems.map((item, idx) => (
            <Link
              key={idx}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                pathname === item.href
                  ? 'bg-indigo-700 text-white shadow-md'
                  : 'text-indigo-100 hover:bg-indigo-700/50'
              }`}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-indigo-700">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              className="text-indigo-100 hover:bg-indigo-700"
              onClick={toggleTheme}
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-indigo-100 hover:bg-indigo-700"
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 dark:border-gray-800 dark:bg-gray-900">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center dark:bg-indigo-900">
                <Shield className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Super Admin
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
