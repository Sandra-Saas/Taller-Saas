'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { useAuth } from '@/contexts/AuthContext'

const settingsModules = [
  {
    title: 'IA',
    description: 'Proveedor, costos, límites y prompt base del Copilot.',
    href: '/dashboard/settings/ai',
  },
  {
    title: 'White Label',
    description: 'Marca, colores, logo y dominio comercial del tenant.',
    href: '/dashboard/settings/white-label',
  },
  {
    title: 'API Keys',
    description: 'Credenciales para la API Premium por empresa.',
    href: '/dashboard/settings/api-keys',
  },
  {
    title: 'Feature Flags',
    description: 'Activación por empresa, usuario, plan y ambiente.',
    href: '/dashboard/settings/feature-flags',
  },
  {
    title: 'Sesiones',
    description: 'Sesiones activas, actividad reciente y cierre remoto.',
    href: '/dashboard/settings/sessions',
  },
]

export default function SettingsPage() {
  const { tenant } = useAuth()

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configuracion</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Resumen inicial de la cuenta y del tenant activo.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos del negocio</CardTitle>
          <CardDescription>
            Informacion derivada de la sesion actual para dejar lista la futura configuracion del taller.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
          <div>
            <span className="font-medium text-gray-900 dark:text-white">Nombre comercial:</span>{' '}
            {tenant?.commercialName || 'No disponible'}
          </div>
          <div>
            <span className="font-medium text-gray-900 dark:text-white">Razon social:</span>{' '}
            {tenant?.businessName || 'No disponible'}
          </div>
          <div>
            <span className="font-medium text-gray-900 dark:text-white">Plan:</span>{' '}
            {tenant?.plan || 'trial'}
          </div>
          <div>
            <span className="font-medium text-gray-900 dark:text-white">Email:</span>{' '}
            {tenant?.email || 'No disponible'}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {settingsModules.map((module) => (
          <Link key={module.href} href={module.href}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">{module.title}</CardTitle>
                <CardDescription>{module.description}</CardDescription>
              </CardHeader>
              <CardContent className="text-sm font-medium text-blue-600 dark:text-blue-400">
                Abrir módulo
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
