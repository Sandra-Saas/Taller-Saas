'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { useAuth } from '@/contexts/AuthContext'

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
    </div>
  )
}
