'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/contexts/AuthContext'

export default function UsersPage() {
  const { tenant } = useAuth()

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Usuarios</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Gestiona los accesos del equipo de {tenant?.commercialName || 'tu taller'}.
          </p>
        </div>

        <Button disabled>Invitar usuario</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Equipo</CardTitle>
          <CardDescription>
            Esta pantalla ya queda conectada al dashboard y lista para enlazarla con Prisma o Supabase.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed border-gray-300 p-6 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
            Todavia no hay usuarios cargados en este entorno.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
