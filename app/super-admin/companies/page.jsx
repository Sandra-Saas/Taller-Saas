'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Plus, Building2 } from 'lucide-react'

export default function CompaniesPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Empresas</h1>
          <p className="text-gray-500 dark:text-gray-400">Gestión global de empresas</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Empresa
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Empresas Registradas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">No hay empresas registradas aún.</p>
        </CardContent>
      </Card>
    </div>
  )
}
