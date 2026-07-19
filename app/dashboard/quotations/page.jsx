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

function formatQuotationRecord(quotation) {
  const clientName = quotation.client
    ? `${quotation.client.firstName || ''} ${quotation.client.lastName || ''}`.trim()
    : 'Cliente sin asignar'
  const vehicleName = quotation.vehicle
    ? [quotation.vehicle.brand, quotation.vehicle.model, quotation.vehicle.plate].filter(Boolean).join(' · ')
    : 'Vehiculo sin asignar'

  return {
    title: `Presupuesto #${quotation.number}`,
    subtitle: `${clientName} · ${vehicleName}`,
    meta: Number(quotation.total || 0).toLocaleString('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }),
    secondaryMeta: quotation.validUntil
      ? `Vence ${new Date(quotation.validUntil).toLocaleDateString('es-AR')}`
      : 'Sin vencimiento definido',
    badge: quotation.status || 'draft',
  }
}

export default function QuotationsPage() {
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
      title="Presupuestos"
      description="Prepara propuestas, controla aprobaciones y prioriza las cotizaciones pendientes."
      badgeLabel="Modulo habilitado"
      metrics={[
        {
          label: 'Borradores pendientes',
          value: (data) => data?.general?.pendingQuotations ?? 0,
          helpText: 'Presupuestos a revisar o enviar al cliente.',
        },
        {
          label: 'Aprobados',
          value: (data) => data?.general?.approvedQuotations ?? 0,
          helpText: 'Listos para pasar a orden de trabajo o facturacion.',
        },
        {
          label: 'Rechazados',
          value: (data) => data?.general?.rejectedQuotations ?? 0,
          helpText: 'Seguimiento comercial de oportunidades perdidas.',
        },
      ]}
      workflow={[
        {
          title: 'Armar el alcance',
          description: 'Define mano de obra, repuestos, impuestos y notas comerciales.',
          badge: 'Analisis',
        },
        {
          title: 'Enviar y negociar',
          description: 'Comparte el presupuesto, ajusta valores y registra aprobacion o rechazo.',
          badge: 'Venta',
        },
        {
          title: 'Transformar en orden',
          description: 'Cuando se aprueba, se usa como base para ejecutar el trabajo.',
          badge: 'Produccion',
        },
      ]}
      highlights={[
        {
          title: 'Visibilidad comercial',
          description: 'El tablero separa borradores, aprobados y rechazados para acelerar decisiones.',
          badge: 'approved',
        },
        {
          title: 'Compatibilidad con inventario',
          description: 'Las cotizaciones quedan listas para sumar items y servicios reales del taller.',
          badge: 'active',
        },
        {
          title: 'Seguimiento por cliente y vehiculo',
          description: 'Cada registro reciente conserva contexto para avanzar sin volver a buscar datos.',
          badge: 'draft',
        },
      ]}
      recordsTitle="Cotizaciones recientes"
      recordsDescription="Ultimos presupuestos registrados en el entorno actual."
      resourceEndpoint="/api/public/v1/quotations?limit=5"
      mapRecord={formatQuotationRecord}
      emptyMessage="Todavia no hay presupuestos registrados para este taller."
    >
      <ResourceCrudPanel
        title="Gestion de presupuestos"
        description="Crea borradores y actualiza el estado comercial de cada propuesta."
        listEndpoint="/api/public/v1/quotations?limit=20"
        searchPlaceholder="Buscar por numero..."
        statusOptions={[
          { value: 'draft', label: 'Borrador' },
          { value: 'sent', label: 'Enviado' },
          { value: 'approved', label: 'Aprobado' },
          { value: 'rejected', label: 'Rechazado' },
          { value: 'expired', label: 'Vencido' },
        ]}
        createTitle="Nuevo presupuesto"
        createLabel="Nuevo presupuesto"
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
            helpText: 'Se filtra por el cliente seleccionado.',
            filterOptions: (item, values) => !values.clientId || item.clientId === values.clientId,
            mapOption: (item) => ({
              value: item.id,
              label: [item.brand, item.model, item.plate].filter(Boolean).join(' · '),
            }),
          },
          {
            name: 'total',
            label: 'Total estimado',
            type: 'number',
            min: 0,
            step: '0.01',
            defaultValue: 0,
            validate: (value) => Number(value || 0) <= 0 ? 'El total debe ser mayor a 0.' : '',
          },
          { name: 'validUntil', label: 'Vigencia', type: 'date' },
          { name: 'notes', label: 'Notas', type: 'textarea' },
        ]}
        editTitle="Editar presupuesto"
        editFields={[
          {
            name: 'status',
            label: 'Estado',
            type: 'select',
            required: true,
            options: [
              { value: 'draft', label: 'Borrador' },
              { value: 'sent', label: 'Enviado' },
              { value: 'approved', label: 'Aprobado' },
              { value: 'rejected', label: 'Rechazado' },
              { value: 'expired', label: 'Vencido' },
            ],
          },
          { name: 'notes', label: 'Notas', type: 'textarea' },
          {
            name: 'validUntil',
            label: 'Vigencia',
            type: 'date',
            getInitialValue: (item) => toDateOnly(item.validUntil),
          },
        ]}
        serializeCreate={(values) => ({
          ...values,
          subtotal: Number(values.total || 0),
          total: Number(values.total || 0),
          tax: 0,
          discount: 0,
        })}
        detailTitle="Detalle del presupuesto"
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
            label: 'Importe',
            render: (item) =>
              Number(item.total || 0).toLocaleString('es-AR', {
                style: 'currency',
                currency: 'ARS',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }),
          },
          {
            label: 'Vigencia',
            render: (item) =>
              item.validUntil ? new Date(item.validUntil).toLocaleDateString('es-AR') : 'Sin vencimiento',
          },
          {
            label: 'Notas',
            render: (item) => item.notes || 'Sin notas comerciales',
          },
        ]}
        itemActions={[
          {
            label: 'Nueva orden',
            href: (item) => `/dashboard/work-orders?clientId=${item.clientId}&vehicleId=${item.vehicleId}&new=1`,
          },
        ]}
        getItemTitle={(item) => `Presupuesto #${item.number}`}
        getItemSubtitle={(item) =>
          `${item.client?.firstName || ''} ${item.client?.lastName || ''}`.trim() || 'Cliente sin asignar'
        }
        getItemMeta={(item) =>
          Number(item.total || 0).toLocaleString('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })
        }
        getItemSecondaryMeta={(item) =>
          item.validUntil ? `Vence ${new Date(item.validUntil).toLocaleDateString('es-AR')}` : 'Sin vencimiento'
        }
        getItemBadge={(item) => item.status}
        emptyMessage="Todavia no hay presupuestos cargados."
      />
    </ModulePage>
  )
}
