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

function isActivePath(pathname, href) {
  if (pathname === href) {
    return true
  }

  if (href === '/super-admin') {
    return pathname === href
  }

  return pathname?.startsWith(`${href}/`)
}

export default function SuperAdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [accessState, setAccessState] = useState('checking')
  const [superAdmin, setSuperAdmin] = useState(null)
  const { theme, toggleTheme } = useTheme()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    // Si estamos en la página de login, no hacer validación
    if (pathname === '/super-admin/login') {
      setAccessState('skip')
      return
    }

    let active = true

    const checkAccess = async () => {
      try {
        const response = await fetch('/api/super-admin/me', {
          cache: 'no-store',
        })
        const data = await response.json()

        if (!active) {
          return
        }

        if (!response.ok) {
          setAccessState('unauthorized')
          router.replace('/super-admin/login')
          return
        }

        setSuperAdmin(data.superAdmin || null)
        setAccessState('granted')
      } catch (error) {
        console.error('No se pudo validar el acceso de super admin', error)
        if (!active) {
          return
        }
        setAccessState('unauthorized')
        router.replace('/super-admin/login')
      }
    }

    checkAccess()

    return () => {
      active = false
    }
  }, [router, pathname])

  const handleSignOut = async () => {
    try {
      await fetch('/api/super-admin/logout', {
        method: 'POST',
      })
    } catch (error) {
      console.error('Error al cerrar sesión', error)
    }
    router.replace('/super-admin/login')
  }

  if (accessState === 'checking') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-5 text-sm text-gray-600 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
          Validando acceso de super administrador...
        </div>
      </div>
    )
  }

  if (accessState === 'skip') {
    return <>{children}</>
  }

  if (accessState === 'error' || accessState === 'unauthorized') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
        <div className="max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm dark:border-red-900/50 dark:bg-gray-900">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">No se pudo validar el acceso</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {accessState === 'unauthorized' 
              ? 'Tu sesión no es válida o ha expirado. Por favor, inicia sesión nuevamente.'
              : 'Hubo un problema al verificar los permisos del panel global.'}
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <Button onClick={() => router.replace('/super-admin/login')}>
              Ir a login
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
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between border-b border-indigo-700 px-6">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white">
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
              className="text-white hover:bg-indigo-700 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto p-4">
            {menuItems.map((item, idx) => (
              <Link
                key={idx}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                  isActivePath(pathname, item.href)
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

          <div className="border-t border-indigo-700 p-4">
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
