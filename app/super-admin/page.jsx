'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import {
  Building2,
  Users,
  CreditCard,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
} from 'lucide-react'

export default function SuperAdminDashboard() {
  const [snapshot, setSnapshot] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchSnapshot = async () => {
      try {
        const response = await fetch('/api/super-admin/observability?includeLogs=true&limit=8', {
          cache: 'no-store',
        })
        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.error || 'No se pudo cargar el panel global.')
        }
        setSnapshot(data)
      } catch (error) {
        console.error('Error fetching super admin snapshot:', error)
        setError(error.message || 'No se pudo cargar el panel global.')
      } finally {
        setLoading(false)
      }
    }

    fetchSnapshot()
  }, [])

  const metrics = snapshot?.metrics
  const logs = snapshot?.logs || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard Global
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Resumen general del SaaS
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Empresas Registradas
            </CardTitle>
            <Building2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : metrics?.tenants?.total ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Usuarios Activos
            </CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : metrics?.usage?.sessions24h ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Suscripciones Activas
            </CardTitle>
            <CreditCard className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : metrics?.subscriptions?.active ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Ingresos Mensuales
            </CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : `ARS ${(metrics?.subscriptions?.monthlyRevenue || 0).toLocaleString('es-AR')}`}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Estado de Empresas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Activas</span>
                  <span className="text-sm font-semibold">{loading ? '...' : metrics?.tenants?.active ?? 0}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-yellow-600" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">En Prueba</span>
                  <span className="text-sm font-semibold">{loading ? '...' : Math.max((metrics?.tenants?.total || 0) - (metrics?.tenants?.active || 0) - (metrics?.tenants?.suspended || 0), 0)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Suspendidas</span>
                  <span className="text-sm font-semibold">{loading ? '...' : metrics?.tenants?.suspended ?? 0}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Actividad Reciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-gray-500">Cargando actividad...</p>
            ) : logs.length === 0 ? (
              <p className="text-sm text-gray-500">No hay actividad reciente para mostrar.</p>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-start justify-between gap-4 rounded-lg border border-gray-200 p-3 dark:border-gray-800">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{log.title}</p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{log.message}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs uppercase text-gray-400">{log.source}</span>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {new Date(log.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
