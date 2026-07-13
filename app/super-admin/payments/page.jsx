'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

export default function PaymentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Pagos</h1>
        <p className="text-gray-500 dark:text-gray-400">Historial de pagos</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pagos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">No hay pagos registrados aún.</p>
        </CardContent>
      </Card>
    </div>
  )
}
