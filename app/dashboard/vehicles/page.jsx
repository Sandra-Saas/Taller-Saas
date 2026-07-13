'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';

export default function VehiclesPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Vehículos</h1>
          <p className="text-gray-500 dark:text-gray-400">Gestión de vehículos</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Vehículo
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vehículos Registrados</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">No hay vehículos registrados aún.</p>
        </CardContent>
      </Card>
    </div>
  );
}
