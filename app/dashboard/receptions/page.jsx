'use client'

import { useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { ModulePage } from '@/components/dashboard/ModulePage'
import { ResourceCrudPanel } from '@/components/dashboard/ResourceCrudPanel'

function toDateTimeLocal(value) {
  if (!value) {
    return ''
  }

  const parsed = new Date(value)
  parsed.setMinutes(parsed.getMinutes() - parsed.getTimezoneOffset())
  return parsed.toISOString().slice(0, 16)
}

const recentReceptionChecklist = [
  {
    title: 'Checklist de ingreso',
    subtitle: 'Registra kilometraje, combustible, accesorios y observaciones visibles.',
    meta: 'Base para trazabilidad inicial',
    secondaryMeta: 'Evita reclamos por estado del vehiculo',
    badge: 'pending',
  },
  {
    title: 'Firma y evidencia',
    subtitle: 'Prepara el espacio para adjuntar conformidad, fotos y notas del cliente.',
    meta: 'Documentacion digital',
    secondaryMeta: 'Facilita auditoria y seguimiento',
    badge: 'active',
  },
  {
    title: 'Derivacion operativa',
    subtitle: 'Conecta la admision con presupuestos y ordenes de trabajo.',
    meta: 'Paso siguiente recomendado',
    secondaryMeta: 'Mantiene continuidad entre areas',
    badge: 'scheduled',
  },
]

export default function ReceptionsPage() {
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
      title="Recepcion"
      description="Estandariza el ingreso de vehiculos y deja respaldo digital desde el primer contacto."
      badgeLabel="Modulo habilitado"
      metrics={[
        {
          label: 'Vehiculos pendientes',
          value: (data) => data?.general?.vehiclesPending ?? 0,
          helpText: 'Unidades a recibir o a encaminar dentro del circuito operativo.',
        },
        {
          label: 'Turnos de hoy',
          value: (data) => data?.general?.appointmentsToday ?? 0,
          helpText: 'Demanda diaria que puede transformarse en recepciones.',
        },
        {
          label: 'Ordenes activas',
          value: (data) => data?.general?.activeWorkOrders ?? 0,
          helpText: 'Carga posterior que surge luego de una buena admision.',
        },
      ]}
      workflow={[
        {
          title: 'Recibir el vehiculo',
          description: 'Identifica cliente, unidad, fecha y motivo de ingreso.',
          badge: 'Ingreso',
        },
        {
          title: 'Documentar el estado',
          description: 'Registra observaciones, accesorios, combustible y firma.',
          badge: 'Evidencia',
        },
        {
          title: 'Derivar al proceso correcto',
          description: 'Continua con presupuesto, diagnostico u orden de trabajo segun el caso.',
          badge: 'Derivacion',
        },
      ]}
      highlights={[
        {
          title: 'Recepcion sin papel',
          description: 'La pagina ya funciona como base operativa para un flujo digital de admision.',
          badge: 'active',
        },
        {
          title: 'Menos reprocesos',
          description: 'Centralizar datos del ingreso reduce omisiones antes de presupuestar o reparar.',
          badge: 'scheduled',
        },
        {
          title: 'Escalable',
          description: 'Queda preparada para sumar fotos, checklists dinamicos y firmas del cliente.',
          badge: 'pending',
        },
      ]}
      recordsTitle="Guia de recepcion"
      recordsDescription="Bloques operativos listos para transformar este modulo en una admision completa."
      recentItems={recentReceptionChecklist}
      emptyMessage="Todavia no hay una guia de recepcion disponible."
    >
      <ResourceCrudPanel
        title="Gestion de recepciones"
        description="Registra admisiones de vehiculos y actualiza la evidencia basica del ingreso."
        listEndpoint="/api/public/v1/receptions?limit=20"
        searchPlaceholder="Buscar por numero..."
        createTitle="Nueva recepcion"
        createLabel="Nueva recepcion"
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
            helpText: 'Se muestran los vehiculos vinculados al cliente seleccionado.',
            filterOptions: (item, values) => !values.clientId || item.clientId === values.clientId,
            mapOption: (item) => ({
              value: item.id,
              label: [item.brand, item.model, item.plate].filter(Boolean).join(' · '),
            }),
          },
          { name: 'date', label: 'Fecha de ingreso', type: 'datetime-local' },
          { name: 'mileage', label: 'Kilometraje', type: 'number', min: 0 },
          {
            name: 'fuelLevel',
            label: 'Combustible',
            type: 'select',
            options: [
              { value: 'empty', label: 'Vacio' },
              { value: 'low', label: 'Bajo' },
              { value: 'half', label: 'Medio' },
              { value: 'three_quarters', label: 'Tres cuartos' },
              { value: 'full', label: 'Lleno' },
            ],
          },
          { name: 'visibleDamages', label: 'Danios visibles', type: 'textarea' },
          { name: 'notes', label: 'Notas', type: 'textarea' },
        ]}
        editTitle="Actualizar recepcion"
        editFields={[
          {
            name: 'date',
            label: 'Fecha de ingreso',
            type: 'datetime-local',
            getInitialValue: (item) => toDateTimeLocal(item.date),
          },
          { name: 'mileage', label: 'Kilometraje', type: 'number', min: 0 },
          {
            name: 'fuelLevel',
            label: 'Combustible',
            type: 'select',
            options: [
              { value: 'empty', label: 'Vacio' },
              { value: 'low', label: 'Bajo' },
              { value: 'half', label: 'Medio' },
              { value: 'three_quarters', label: 'Tres cuartos' },
              { value: 'full', label: 'Lleno' },
            ],
          },
          { name: 'visibleDamages', label: 'Danios visibles', type: 'textarea' },
          { name: 'notes', label: 'Notas', type: 'textarea' },
        ]}
        detailTitle="Detalle de la recepcion"
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
            label: 'Ingreso',
            render: (item) => new Date(item.date).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }),
          },
          {
            label: 'Estado observado',
            render: (item) =>
              [`Km ${item.mileage ?? 0}`, item.fuelLevel || 'Sin combustible declarado'].join(' · '),
          },
          {
            label: 'Observaciones',
            render: (item) => item.visibleDamages || item.notes || 'Sin observaciones',
          },
        ]}
        itemActions={[
          {
            label: 'Presupuesto',
            href: (item) => `/dashboard/quotations?clientId=${item.clientId}&vehicleId=${item.vehicleId}&new=1`,
          },
          {
            label: 'Orden',
            href: (item) => `/dashboard/work-orders?clientId=${item.clientId}&vehicleId=${item.vehicleId}&new=1`,
          },
        ]}
        getItemTitle={(item) => `Recepcion #${item.number}`}
        getItemSubtitle={(item) =>
          `${item.client?.firstName || ''} ${item.client?.lastName || ''}`.trim() || 'Cliente sin asignar'
        }
        getItemMeta={(item) => new Date(item.date).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}
        getItemSecondaryMeta={(item) => [item.vehicle?.brand, item.vehicle?.model, item.vehicle?.plate].filter(Boolean).join(' · ')}
        emptyMessage="Todavia no hay recepciones registradas."
      />
    </ModulePage>
  )
}
