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
  Activity,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/super-admin' },
  { icon: Building2, label: 'Empresas', href: '/super-admin/companies' },
  { icon: Users, label: 'Usuarios', href: '/super-admin/users' },
  { icon: CreditCard, label: 'Suscripciones', href: '/super-admin/subscriptions' },
  { icon: DollarSign, label: 'Pagos', href: '/super-admin/payments' },
  { icon: Ticket, label: 'Tickets', href: '/super-admin/tickets' },
  { icon: Bell, label: 'Notificaciones', href: '/super-admin/notifications' },
  { icon: Activity, label: 'Observabilidad', href: '/super-admin/observability' },
  { icon: Settings, label: 'Configuración', href: '/super-admin/settings' },
]

export default function SuperAdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [accessState, setAccessState] = useState('checking')
  const [superAdmin, setSuperAdmin] = useState(null)
  const { theme, toggleTheme } = useTheme()
  const { loading: authLoading, user, signOut } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    let active = true

    const checkAccess = async () => {
      if (authLoading) {
        return
      }

      if (!user) {
        setAccessState('unauthorized')
        router.replace('/login')
        return
      }

      try {
        const response = await fetch('/api/super-admin/me', {
          cache: 'no-store',
        })
        const data = await response.json()

        if (!active) {
          return
        }

        if (!response.ok) {
          setAccessState('forbidden')
          setSuperAdmin(null)
          router.replace('/dashboard')
          return
        }

        setSuperAdmin(data.superAdmin || null)
        setAccessState('granted')
      } catch (error) {
        console.error('No se pudo validar el acceso de super admin', error)
        if (!active) {
          return
        }
        setAccessState('error')
      }
    }

    checkAccess()

    return () => {
      active = false
    }
  }, [authLoading, router, user])

  const handleSignOut = async () => {
    await signOut()
    router.replace('/login')
  }

  if (authLoading || accessState === 'checking') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-5 text-sm text-gray-600 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
          Validando acceso de super administrador...
        </div>
      </div>
    )
  }

  if (accessState === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
        <div className="max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm dark:border-red-900/50 dark:bg-gray-900">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">No se pudo validar el acceso</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Hubo un problema al verificar los permisos del panel global.
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <Button variant="outline" onClick={() => window.location.reload()}>
              Reintentar
            </Button>
            <Button onClick={() => router.replace('/dashboard')}>
              Volver al dashboard
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (accessState !== 'granted') {
    return null
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
            <div>
              <span className="block text-xl font-bold text-white">Super Admin</span>
              <span className="block text-xs text-indigo-200">
                {superAdmin?.email || 'Acceso global'}
              </span>
            </div>
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
              <div>
                <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {superAdmin ? `${superAdmin.firstName} ${superAdmin.lastName}` : 'Super Admin'}
                </span>
                <span className="block text-xs text-gray-500 dark:text-gray-400">
                  {superAdmin?.email || 'Acceso global'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
