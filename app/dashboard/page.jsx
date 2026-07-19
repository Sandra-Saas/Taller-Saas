'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { useAuth } from '@/contexts/AuthContext'

const currencyFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

function formatCurrency(value) {
  return currencyFormatter.format(Number(value || 0))
}

const pipelineCards = [
  {
    key: 'waiting_reception',
    title: 'En espera de recepción',
    description: 'Vehículos cargados pero todavía no ingresados formalmente.',
  },
  {
    key: 'received_pending_definition',
    title: 'Recibidos',
    description: 'Ingresos realizados que aún esperan definición operativa.',
  },
  {
    key: 'diagnosis',
    title: 'En diagnóstico',
    description: 'Unidades en evaluación técnica o preparación de presupuesto.',
  },
  {
    key: 'waiting_approval',
    title: 'Esperando aprobación',
    description: 'Casos con presupuesto pendiente de validación del cliente.',
  },
  {
    key: 'waiting_parts',
    title: 'Esperando repuestos',
    description: 'Trabajos detenidos hasta recibir materiales o piezas.',
  },
  {
    key: 'ready_delivery',
    title: 'Listos para entrega',
    description: 'Vehículos terminados, pendientes de retiro por el cliente.',
  },
]

export default function DashboardPage() {
  const { tenant, user } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/dashboard', { cache: 'no-store' })
        const data = await res.json()
        setStats(data)
      } catch (err) {
        console.error('Failed to fetch stats:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const general = stats?.general || {}
  const operations = stats?.operations || {}
  const economic = stats?.economic || {}
  const chartData = useMemo(() => economic.weeklySeries || [], [economic.weeklySeries])
  const maxChartValue = Math.max(...chartData.map((item) => item.value), 1)
  const vehiclePipeline = operations.vehiclePipeline || {}

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {tenant?.commercialName || 'Dashboard'}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Sesión activa como {user?.email || 'usuario autenticado'}
        </p>
      </div>

      {/* General Stats */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Resumen General</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Vehículos Hoy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : general.vehiclesToday || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">En Reparación</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : general.vehiclesInRepair || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Terminados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : general.vehiclesFinished || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Entregados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : general.vehiclesDelivered || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Turnos Hoy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : general.appointmentsToday || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Cotizaciones Pendientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : general.pendingQuotations || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Órdenes Activas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : general.activeWorkOrders || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Órdenes Terminadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : general.finishedWorkOrders || 0}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Economic Stats */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Resumen Económico</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Facturación Hoy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : formatCurrency(economic.dailyBilling)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Facturación Semanal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : formatCurrency(economic.weeklyBilling)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Facturación Mensual</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : formatCurrency(economic.monthlyBilling)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Cobros Pendientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : formatCurrency(economic.pendingCollections)}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-gray-200">Pipeline Operativo</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {pipelineCards.map((item) => (
            <Card key={item.key}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {item.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? '...' : vehiclePipeline[item.key] || 0}</div>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Chart Section */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Facturación Semanal</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Cargando facturación semanal...</p>
            ) : chartData.length > 0 ? (
              <div className="space-y-4">
                {chartData.map((item) => (
                  <div key={item.key} className="space-y-1">
                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
                      <span className="capitalize">{item.label}</span>
                      <span>{formatCurrency(item.value)}</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                      <div
                        className="h-full rounded-full bg-indigo-500"
                        style={{ width: `${(item.value / maxChartValue) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-gray-200 p-6 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
                Todavía no hay facturas pagadas esta semana para mostrar en el gráfico.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
