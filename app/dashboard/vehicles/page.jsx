'use client'

import { useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { ModulePage } from '@/components/dashboard/ModulePage'
import { ResourceCrudPanel } from '@/components/dashboard/ResourceCrudPanel'

export default function VehiclesPage() {
  const searchParams = useSearchParams()
  const autoOpenCreate = searchParams.get('new') === '1'

  const initialCreateValues = useMemo(
    () => ({
      clientId: searchParams.get('clientId') || '',
      plate: searchParams.get('plate') || '',
    }),
    [searchParams]
  )

  return (
    <ModulePage
      title="Vehiculos"
      description="Gestiona unidades, vinculos con clientes y accesos rapidos al flujo operativo."
      workflowTitle="Circuito del vehiculo"
      workflow={[
        {
          title: 'Registrar la unidad',
          description: 'Carga marca, modelo, patente y datos tecnicos minimos.',
          badge: 'Base',
        },
        {
          title: 'Asociar al cliente',
          description: 'Cada vehiculo queda vinculado a su titular para acelerar los procesos siguientes.',
          badge: 'Relacion',
        },
        {
          title: 'Derivar a operacion',
          description: 'Desde la ficha se puede abrir recepcion u orden de trabajo con datos precargados.',
          badge: 'Accion',
        },
      ]}
      highlightsTitle="Puntos clave"
      highlights={[
        {
          title: 'Trazabilidad completa',
          description: 'Cada vehiculo puede conectar clientes, recepciones, ordenes y garantias.',
          badge: 'active',
        },
        {
          title: 'Datos tecnicos listos',
          description: 'Se incluyen campos para patente, VIN, motor, chasis y kilometraje.',
          badge: 'scheduled',
        },
        {
          title: 'Acciones rapidas',
          description: 'La vista ya permite saltar a recepcion o a una nueva orden.',
          badge: 'draft',
        },
      ]}
      recordsTitle="Gestion tecnica"
      recordsDescription="Panel operativo para alta, edicion, detalle y derivacion del vehiculo."
      recentItems={[]}
      emptyMessage="Todavia no hay registros recientes para vehiculos."
    >
      <ResourceCrudPanel
        title="Gestion de vehiculos"
        description="Alta, edicion, detalle y acceso directo al flujo de recepcion y ordenes."
        listEndpoint="/api/public/v1/vehicles?limit=20"
        searchPlaceholder="Buscar por marca, modelo o patente..."
        initialCreateValues={initialCreateValues}
        autoOpenCreate={autoOpenCreate}
        supportEndpoints={[{ key: 'clients', url: '/api/clients' }]}
        createTitle="Nuevo vehiculo"
        createLabel="Nuevo vehiculo"
        createFields={[
          { name: 'clientId', label: 'Cliente', type: 'select', required: true, optionsKey: 'clients' },
          { name: 'brand', label: 'Marca', required: true },
          { name: 'model', label: 'Modelo', required: true },
          { name: 'plate', label: 'Patente' },
          { name: 'year', label: 'Anio', type: 'number', min: 1900, max: 2100 },
          { name: 'vin', label: 'VIN' },
          { name: 'engine', label: 'Motor' },
          { name: 'chassis', label: 'Chasis' },
          { name: 'color', label: 'Color' },
          { name: 'mileage', label: 'Kilometraje', type: 'number', min: 0 },
          {
            name: 'fuel',
            label: 'Combustible',
            type: 'select',
            options: [
              { value: 'gasoline', label: 'Nafta' },
              { value: 'diesel', label: 'Diesel' },
              { value: 'electric', label: 'Electrico' },
              { value: 'hybrid', label: 'Hibrido' },
            ],
          },
          { name: 'notes', label: 'Notas', type: 'textarea' },
        ]}
        editTitle="Editar vehiculo"
        editFields={[
          { name: 'clientId', label: 'Cliente', type: 'select', required: true, optionsKey: 'clients' },
          { name: 'brand', label: 'Marca', required: true },
          { name: 'model', label: 'Modelo', required: true },
          { name: 'plate', label: 'Patente' },
          { name: 'year', label: 'Anio', type: 'number', min: 1900, max: 2100 },
          { name: 'vin', label: 'VIN' },
          { name: 'engine', label: 'Motor' },
          { name: 'chassis', label: 'Chasis' },
          { name: 'color', label: 'Color' },
          { name: 'mileage', label: 'Kilometraje', type: 'number', min: 0 },
          {
            name: 'fuel',
            label: 'Combustible',
            type: 'select',
            options: [
              { value: 'gasoline', label: 'Nafta' },
              { value: 'diesel', label: 'Diesel' },
              { value: 'electric', label: 'Electrico' },
              { value: 'hybrid', label: 'Hibrido' },
            ],
          },
          { name: 'notes', label: 'Notas', type: 'textarea' },
        ]}
        detailTitle="Detalle del vehiculo"
        detailFields={[
          {
            label: 'Unidad',
            render: (item) => [item.brand, item.model, item.plate].filter(Boolean).join(' · ') || 'Vehiculo sin identificar',
          },
          {
            label: 'Cliente',
            render: (item) =>
              item.client ? `${item.client.firstName || ''} ${item.client.lastName || ''}`.trim() : 'Sin cliente asociado',
          },
          {
            label: 'Tecnico',
            render: (item) =>
              [item.vin, item.engine, item.chassis].filter(Boolean).join(' · ') || 'Sin datos tecnicos cargados',
          },
          {
            label: 'Estado general',
            render: (item) =>
              [`Km ${item.mileage ?? 0}`, item.fuel || 'Sin combustible', item.color || 'Sin color'].join(' · '),
          },
          {
            label: 'Notas',
            render: (item) => item.notes || 'Sin observaciones internas',
          },
        ]}
        itemActions={[
          {
            label: 'Recepcion',
            href: (item) => `/dashboard/receptions?clientId=${item.clientId}&vehicleId=${item.id}&new=1`,
          },
          {
            label: 'Orden',
            href: (item) => `/dashboard/work-orders?clientId=${item.clientId}&vehicleId=${item.id}&new=1`,
          },
        ]}
        getItemTitle={(item) => [item.brand, item.model].filter(Boolean).join(' ')}
        getItemSubtitle={(item) => item.client ? `${item.client.firstName || ''} ${item.client.lastName || ''}`.trim() : 'Sin cliente'}
        getItemMeta={(item) => item.plate || 'Sin patente'}
        getItemSecondaryMeta={(item) => `${item.mileage ?? 0} km`}
        emptyMessage="Todavia no hay vehiculos registrados."
      />
    </ModulePage>
  )
}
