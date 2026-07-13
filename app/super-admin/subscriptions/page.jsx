'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CreditCard, Calendar, Building2 } from 'lucide-react'

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        const res = await fetch('/api/super-admin/subscriptions')
        const data = await res.json()
        setSubscriptions(data)
      } catch (error) {
        console.error('Error fetching subscriptions:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchSubscriptions()
  }, [])

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      case 'trial': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'suspended': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      case 'cancelled': return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Activa'
      case 'trial': return 'Prueba'
      case 'suspended': return 'Suspendida'
      case 'cancelled': return 'Cancelada'
      default: return status
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Suscripciones</h1>
          <p className="text-gray-500 dark:text-gray-400">Gestión de suscripciones</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Suscripciones</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-gray-500">Cargando...</p>
          ) : subscriptions.length === 0 ? (
            <p className="text-sm text-gray-500">No hay suscripciones registradas aún.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    <th className="pb-3 pr-4 font-medium">Empresa</th>
                    <th className="pb-3 pr-4 font-medium">Plan</th>
                    <th className="pb-3 pr-4 font-medium">Estado</th>
                    <th className="pb-3 pr-4 font-medium">Inicio</th>
                    <th className="pb-3 pr-4 font-medium">Próximo Pago</th>
                    <th className="pb-3 pr-4 font-medium">Auto-Renovación</th>
                    <th className="pb-3 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {subscriptions.map((sub) => (
                    <tr key={sub.id} className="border-b border-gray-100 dark:border-gray-800 py-3">
                      <td className="pr-4">{sub.tenant?.commercialName || '-'}</td>
                      <td className="pr-4">{sub.plan?.name || '-'}</td>
                      <td className="pr-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(sub.status)}`}>
                          {getStatusText(sub.status)}
                        </span>
                      </td>
                      <td className="pr-4">{new Date(sub.startDate).toLocaleDateString()}</td>
                      <td className="pr-4">{sub.nextPaymentDate ? new Date(sub.nextPaymentDate).toLocaleDateString() : '-'}</td>
                      <td className="pr-4">{sub.autoRenew ? 'Sí' : 'No'}</td>
                      <td>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">Ver</Button>
                          <Button variant="ghost" size="sm">Editar</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
