'use client'

import { useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { ModulePage } from '@/components/dashboard/ModulePage'
import { ResourceCrudPanel } from '@/components/dashboard/ResourceCrudPanel'

function formatWorkOrderRecord(workOrder) {
  const clientName = workOrder.client
    ? `${workOrder.client.firstName || ''} ${workOrder.client.lastName || ''}`.trim()
    : 'Cliente sin asignar'
  const vehicleName = workOrder.vehicle
    ? [workOrder.vehicle.brand, workOrder.vehicle.model, workOrder.vehicle.plate].filter(Boolean).join(' · ')
    : 'Vehiculo sin asignar'

  return {
    title: `Orden #${workOrder.number}`,
    subtitle: `${clientName} · ${vehicleName}`,
    meta: `${workOrder.tasks?.length || 0} tareas · ${workOrder.materials?.length || 0} materiales`,
    secondaryMeta: `Prioridad ${workOrder.priority || 'normal'}`,
    badge: workOrder.status || 'pending',
  }
}

export default function WorkOrdersPage() {
  const searchParams = useSearchParams()
  const autoOpenCreate = searchParams.get('new') === '1'
  const initialCreateValues = useMemo(
    () => ({
      clientId: searchParams.get('clientId') || '',
      vehicleId: searchParams.get('vehicleId') || '',
    }),
    [searchParams]
  )

  return (
    <ModulePage
      title="Ordenes de Trabajo"
      description="Coordina reparaciones, asignaciones y control de avance desde una sola vista."
      badgeLabel="Modulo habilitado"
      metrics={[
        {
          label: 'Ordenes activas',
          value: (data) => data?.general?.activeWorkOrders ?? 0,
          helpText: 'Ordenes pendientes o en curso para el equipo tecnico.',
        },
        {
          label: 'Ordenes finalizadas',
          value: (data) => data?.general?.finishedWorkOrders ?? 0,
          helpText: 'Trabajos cerrados y listos para entrega o garantia.',
        },
        {
          label: 'Vehiculos en reparacion',
          value: (data) => data?.general?.vehiclesInRepair ?? 0,
          helpText: 'Carga viva del taller vinculada a ejecucion operativa.',
        },
      ]}
      workflow={[
        {
          title: 'Abrir la orden',
          description: 'Relaciona cliente, vehiculo, recepcion y presupuesto aprobado.',
          badge: 'Inicio',
        },
        {
          title: 'Asignar tareas',
          description: 'Distribuye trabajo, prioridades y materiales para cada etapa.',
          badge: 'Ejecucion',
        },
        {
          title: 'Cerrar y derivar',
          description: 'Finaliza el servicio y deja trazabilidad para facturacion o garantia.',
          badge: 'Cierre',
        },
      ]}
      highlights={[
        {
          title: 'Visibilidad del piso',
          description: 'Las metricas separan lo activo de lo cerrado para medir productividad.',
          badge: 'in_progress',
        },
        {
          title: 'Trazabilidad completa',
          description: 'Cada orden queda lista para vincular tareas, materiales, facturas y garantias.',
          badge: 'active',
        },
        {
          title: 'Preparado para crecimiento',
          description: 'La estructura soporta multiples mecanicos, prioridades y mas etapas de control.',
          badge: 'pending',
        },
      ]}
      recordsTitle="Ordenes recientes"
      recordsDescription="Ultimas ordenes devueltas por la API publica interna."
      resourceEndpoint="/api/public/v1/work-orders?limit=5"
      mapRecord={formatWorkOrderRecord}
      emptyMessage="Todavia no hay ordenes de trabajo registradas."
    >
      <ResourceCrudPanel
        title="Gestion de ordenes"
        description="Crea nuevas ordenes y actualiza prioridad, notas y estado operativo."
        listEndpoint="/api/public/v1/work-orders?limit=20"
        searchPlaceholder="Buscar por numero..."
        statusOptions={[
          { value: 'pending', label: 'Pendiente' },
          { value: 'in_progress', label: 'En progreso' },
          { value: 'completed', label: 'Completada' },
          { value: 'cancelled', label: 'Cancelada' },
        ]}
        createTitle="Nueva orden de trabajo"
        createLabel="Nueva orden"
        initialCreateValues={initialCreateValues}
        autoOpenCreate={autoOpenCreate}
        supportEndpoints={[
          { key: 'clients', url: '/api/clients' },
          { key: 'vehicles', url: '/api/vehicles' },
        ]}
        createFields={[
          {
            name: 'clientId',
            label: 'Cliente',
            type: 'select',
            required: true,
            optionsKey: 'clients',
            resetFieldsOnChange: ['vehicleId'],
          },
          {
            name: 'vehicleId',
            label: 'Vehiculo',
            type: 'select',
            required: true,
            optionsKey: 'vehicles',
            helpText: 'Se filtra por el cliente elegido.',
            filterOptions: (item, values) => !values.clientId || item.clientId === values.clientId,
            mapOption: (item) => ({
              value: item.id,
              label: [item.brand, item.model, item.plate].filter(Boolean).join(' · '),
            }),
          },
          {
            name: 'priority',
            label: 'Prioridad',
            type: 'select',
            required: true,
            defaultValue: 'normal',
            options: [
              { value: 'low', label: 'Baja' },
              { value: 'normal', label: 'Normal' },
              { value: 'high', label: 'Alta' },
              { value: 'urgent', label: 'Urgente' },
            ],
          },
          { name: 'notes', label: 'Notas', type: 'textarea' },
        ]}
        editTitle="Editar orden"
        editFields={[
          {
            name: 'status',
            label: 'Estado',
            type: 'select',
            required: true,
            options: [
              { value: 'pending', label: 'Pendiente' },
              { value: 'in_progress', label: 'En progreso' },
              { value: 'completed', label: 'Completada' },
              { value: 'cancelled', label: 'Cancelada' },
            ],
          },
          {
            name: 'priority',
            label: 'Prioridad',
            type: 'select',
            required: true,
            options: [
              { value: 'low', label: 'Baja' },
              { value: 'normal', label: 'Normal' },
              { value: 'high', label: 'Alta' },
              { value: 'urgent', label: 'Urgente' },
            ],
          },
          { name: 'notes', label: 'Notas', type: 'textarea' },
        ]}
        detailTitle="Detalle de la orden"
        detailFields={[
          {
            label: 'Cliente',
            render: (item) =>
              item.client ? `${item.client.firstName || ''} ${item.client.lastName || ''}`.trim() : 'Sin cliente',
          },
          {
            label: 'Vehiculo',
            render: (item) =>
              item.vehicle
                ? [item.vehicle.brand, item.vehicle.model, item.vehicle.plate].filter(Boolean).join(' · ')
                : 'Sin vehiculo',
          },
          {
            label: 'Operacion',
            render: (item) => `Prioridad ${item.priority || 'normal'} · Estado ${item.status || 'pending'}`,
          },
          {
            label: 'Ejecucion',
            render: (item) => `${item.tasks?.length || 0} tareas · ${item.materials?.length || 0} materiales`,
          },
          {
            label: 'Notas',
            render: (item) => item.notes || 'Sin notas operativas',
          },
        ]}
        itemActions={[
          {
            label: 'Facturar',
            href: (item) => `/dashboard/invoices?clientId=${item.clientId}&workOrderId=${item.id}&new=1`,
          },
        ]}
        getItemTitle={(item) => `Orden #${item.number}`}
        getItemSubtitle={(item) =>
          `${item.client?.firstName || ''} ${item.client?.lastName || ''}`.trim() || 'Cliente sin asignar'
        }
        getItemMeta={(item) => `Prioridad ${item.priority || 'normal'}`}
        getItemSecondaryMeta={(item) => `${item.tasks?.length || 0} tareas`}
        getItemBadge={(item) => item.status}
        emptyMessage="Todavia no hay ordenes de trabajo cargadas."
      />
    </ModulePage>
  )
}
