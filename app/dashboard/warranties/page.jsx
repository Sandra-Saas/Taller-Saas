'use client'

import { useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { ModulePage } from '@/components/dashboard/ModulePage'
import { ResourceCrudPanel } from '@/components/dashboard/ResourceCrudPanel'

function toDateOnly(value) {
  if (!value) {
    return ''
  }

  return new Date(value).toISOString().slice(0, 10)
}

const warrantyGuide = [
  {
    title: 'Cobertura activa',
    subtitle: 'Organiza reparaciones entregadas que pueden derivar en reclamos o seguimiento postventa.',
    meta: 'Control recomendado',
    secondaryMeta: 'Asociado a factura u orden finalizada',
    badge: 'active',
  },
  {
    title: 'Gestion del reclamo',
    subtitle: 'Prepara el modulo para documentar notas, fechas y resultado de cada incidencia.',
    meta: 'Seguimiento',
    secondaryMeta: 'Favorece trazabilidad con el cliente',
    badge: 'claimed',
  },
  {
    title: 'Cierre con evidencia',
    subtitle: 'Vincula garantia, orden y comprobante para evitar ambiguedades en postventa.',
    meta: 'Buenas practicas',
    secondaryMeta: 'Mejora calidad de servicio',
    badge: 'completed',
  },
]

export default function WarrantiesPage() {
  const searchParams = useSearchParams()
  const autoOpenCreate = searchParams.get('new') === '1'
  const initialCreateValues = useMemo(
    () => ({
      clientId: searchParams.get('clientId') || '',
      vehicleId: searchParams.get('vehicleId') || '',
      workOrderId: searchParams.get('workOrderId') || '',
      invoiceId: searchParams.get('invoiceId') || '',
    }),
    [searchParams]
  )

  return (
    <ModulePage
      title="Garantias"
      description="Da seguimiento a coberturas postventa y mantiene trazabilidad sobre reclamos y vencimientos."
      badgeLabel="Modulo habilitado"
      metrics={[
        {
          label: 'Ordenes finalizadas',
          value: (data) => data?.general?.finishedWorkOrders ?? 0,
          helpText: 'Base potencial de trabajos que pueden generar una garantia.',
        },
        {
          label: 'Vehiculos entregados',
          value: (data) => data?.general?.vehiclesDelivered ?? 0,
          helpText: 'Servicios ya cerrados que entran en etapa postventa.',
        },
        {
          label: 'Cobros pendientes',
          value: (data) => data?.economic?.pendingCollections ?? 0,
          format: 'currency',
          helpText: 'Contexto financiero util al revisar reclamos y documentos relacionados.',
        },
      ]}
      workflow={[
        {
          title: 'Emitir la garantia',
          description: 'Relaciona el servicio entregado con cliente, vehiculo y fecha de cobertura.',
          badge: 'Alta',
        },
        {
          title: 'Registrar reclamo',
          description: 'Documenta notas, fecha, alcance y resolucion de la incidencia.',
          badge: 'Seguimiento',
        },
        {
          title: 'Cerrar el caso',
          description: 'Conserva evidencia del resultado para auditoria y experiencia del cliente.',
          badge: 'Cierre',
        },
      ]}
      highlights={[
        {
          title: 'Postventa centralizada',
          description: 'La pagina ya permite ubicar el proceso de garantias dentro del dashboard.',
          badge: 'active',
        },
        {
          title: 'Lista para integraciones',
          description: 'Puede crecer hacia vencimientos automaticos, alertas y adjuntos.',
          badge: 'pending',
        },
        {
          title: 'Relacion con facturacion',
          description: 'Mantiene el contexto economico y documental de cada servicio entregado.',
          badge: 'completed',
        },
      ]}
      recordsTitle="Guia de garantias"
      recordsDescription="Referencias operativas para administrar coberturas y reclamos postventa."
      recentItems={warrantyGuide}
      emptyMessage="Todavia no hay referencias operativas para garantias."
    >
      <ResourceCrudPanel
        title="Gestion de garantias"
        description="Registra coberturas postventa y actualiza reclamos o vencimientos."
        listEndpoint="/api/public/v1/warranties?limit=20"
        searchPlaceholder="Buscar garantias..."
        statusOptions={[
          { value: 'active', label: 'Activa' },
          { value: 'expired', label: 'Vencida' },
          { value: 'claimed', label: 'Reclamada' },
        ]}
        createTitle="Nueva garantia"
        createLabel="Nueva garantia"
        initialCreateValues={initialCreateValues}
        autoOpenCreate={autoOpenCreate}
        supportEndpoints={[
          { key: 'clients', url: '/api/clients' },
          { key: 'vehicles', url: '/api/vehicles' },
          { key: 'workOrders', url: '/api/public/v1/work-orders?limit=100' },
          { key: 'invoices', url: '/api/public/v1/invoices?limit=100' },
        ]}
        createFields={[
          {
            name: 'clientId',
            label: 'Cliente',
            type: 'select',
            required: true,
            optionsKey: 'clients',
            resetFieldsOnChange: ['vehicleId', 'workOrderId', 'invoiceId'],
          },
          {
            name: 'vehicleId',
            label: 'Vehiculo',
            type: 'select',
            required: true,
            optionsKey: 'vehicles',
            helpText: 'Se filtra por cliente.',
            filterOptions: (item, values) => !values.clientId || item.clientId === values.clientId,
            mapOption: (item) => ({
              value: item.id,
              label: [item.brand, item.model, item.plate].filter(Boolean).join(' · '),
            }),
          },
          {
            name: 'workOrderId',
            label: 'Orden asociada',
            type: 'select',
            optionsKey: 'workOrders',
            emptyLabel: 'Sin orden',
            filterOptions: (item, values) => !values.clientId || item.clientId === values.clientId,
            mapOption: (item) => ({ value: item.id, label: `Orden #${item.number}` }),
          },
          {
            name: 'invoiceId',
            label: 'Factura asociada',
            type: 'select',
            optionsKey: 'invoices',
            emptyLabel: 'Sin factura',
            filterOptions: (item, values) => !values.clientId || item.clientId === values.clientId,
            mapOption: (item) => ({ value: item.id, label: `Comprobante #${item.number}` }),
          },
          {
            name: 'endDate',
            label: 'Vencimiento',
            type: 'date',
            required: true,
            validate: (value) =>
              value && new Date(value) < new Date(new Date().toISOString().slice(0, 10))
                ? 'La fecha de vencimiento no puede estar en el pasado.'
                : '',
          },
          { name: 'description', label: 'Descripcion', type: 'textarea' },
        ]}
        editTitle="Actualizar garantia"
        editFields={[
          {
            name: 'status',
            label: 'Estado',
            type: 'select',
            required: true,
            options: [
              { value: 'active', label: 'Activa' },
              { value: 'expired', label: 'Vencida' },
              { value: 'claimed', label: 'Reclamada' },
            ],
          },
          {
            name: 'endDate',
            label: 'Vencimiento',
            type: 'date',
            getInitialValue: (item) => toDateOnly(item.endDate),
          },
          { name: 'description', label: 'Descripcion', type: 'textarea' },
          { name: 'claimNotes', label: 'Notas del reclamo', type: 'textarea' },
        ]}
        getItemTitle={(item) => `Garantia ${item.vehicle?.plate ? `· ${item.vehicle.plate}` : ''}`.trim()}
        getItemSubtitle={(item) =>
          `${item.client?.firstName || ''} ${item.client?.lastName || ''}`.trim() || 'Cliente sin asignar'
        }
        getItemMeta={(item) => `Vence ${new Date(item.endDate).toLocaleDateString('es-AR')}`}
        getItemSecondaryMeta={(item) => item.invoice ? `Comprobante #${item.invoice.number}` : 'Sin factura asociada'}
        getItemBadge={(item) => item.status}
        emptyMessage="Todavia no hay garantias registradas."
      />
    </ModulePage>
  )
}
