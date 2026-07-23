'use client'

import { useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { ModulePage } from '@/components/dashboard/ModulePage'
import { ResourceCrudPanel } from '@/components/dashboard/ResourceCrudPanel'

function formatInvoiceRecord(invoice) {
  const clientName = invoice.client
    ? `${invoice.client.firstName || ''} ${invoice.client.lastName || ''}`.trim()
    : 'Cliente sin asignar'

  return {
    title: `Comprobante #${invoice.number}`,
    subtitle: `${clientName} · ${invoice.type || 'invoice'}`,
    meta: Number(invoice.total || 0).toLocaleString('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }),
    secondaryMeta: new Date(invoice.date).toLocaleDateString('es-AR'),
    badge: invoice.status || 'pending',
  }
}

export default function InvoicesPage() {
  const searchParams = useSearchParams()
  const autoOpenCreate = searchParams.get('new') === '1'
  const initialCreateValues = useMemo(
    () => ({
      clientId: searchParams.get('clientId') || '',
      workOrderId: searchParams.get('workOrderId') || '',
    }),
    [searchParams]
  )

  return (
    <ModulePage
      title="Facturacion"
      description="Controla comprobantes, cobros pendientes y rendimiento economico del taller."
      metrics={[
        {
          label: 'Facturacion de hoy',
          value: (data) => data?.economic?.dailyBilling ?? 0,
          format: 'currency',
          helpText: 'Ingresos cobrados en la jornada actual.',
        },
        {
          label: 'Facturacion mensual',
          value: (data) => data?.economic?.monthlyBilling ?? 0,
          format: 'currency',
          helpText: 'Seguimiento del rendimiento economico del mes.',
        },
        {
          label: 'Cobros pendientes',
          value: (data) => data?.economic?.pendingCollections ?? 0,
          format: 'currency',
          helpText: 'Monto total aun no percibido de comprobantes pendientes.',
        },
      ]}
      workflow={[
        {
          title: 'Emitir comprobante',
          description: 'Genera factura o recibo a partir del trabajo realizado.',
          badge: 'Venta',
        },
        {
          title: 'Registrar estado',
          description: 'Marca cada documento como pendiente, cobrado o cancelado.',
          badge: 'Control',
        },
        {
          title: 'Seguir cobranzas',
          description: 'Prioriza los saldos pendientes para mejorar flujo de caja.',
          badge: 'Caja',
        },
      ]}
      highlights={[
        {
          title: 'Caja diaria visible',
          description: 'La vista toma datos del dashboard para mostrar facturacion y cobranzas clave.',
          badge: 'paid',
        },
        {
          title: 'Conexiones futuras',
          description: 'Queda preparada para sumar detalle fiscal, medios de pago y exportacion.',
          badge: 'active',
        },
        {
          title: 'Contexto por cliente',
          description: 'Los comprobantes recientes mantienen referencia directa del cliente asociado.',
          badge: 'pending',
        },
      ]}
      recordsTitle="Comprobantes recientes"
      recordsDescription="Ultimos documentos emitidos o pendientes en el sistema."
      resourceEndpoint="/api/public/v1/invoices?limit=5"
      mapRecord={formatInvoiceRecord}
      emptyMessage="Todavia no hay comprobantes registrados para este taller."
    >
      <ResourceCrudPanel
        title="Gestion de comprobantes"
        description="Emite comprobantes simples y registra pagos o cambios de estado."
        listEndpoint="/api/public/v1/invoices?limit=20"
        searchPlaceholder="Buscar por numero..."
        statusOptions={[
          { value: 'pending', label: 'Pendiente' },
          { value: 'paid', label: 'Pagada' },
          { value: 'cancelled', label: 'Cancelada' },
        ]}
        createTitle="Nuevo comprobante"
        createLabel="Nuevo comprobante"
        initialCreateValues={initialCreateValues}
        autoOpenCreate={autoOpenCreate}
        supportEndpoints={[
          { key: 'clients', url: '/api/clients' },
          { key: 'workOrders', url: '/api/public/v1/work-orders?limit=100' },
        ]}
        createFields={[
          {
            name: 'clientId',
            label: 'Cliente',
            type: 'select',
            required: true,
            optionsKey: 'clients',
            resetFieldsOnChange: ['workOrderId'],
          },
          {
            name: 'workOrderId',
            label: 'Orden asociada',
            type: 'select',
            optionsKey: 'workOrders',
            emptyLabel: 'Sin orden',
            helpText: 'Se filtra por cliente cuando hay uno seleccionado.',
            filterOptions: (item, values) => !values.clientId || item.clientId === values.clientId,
            mapOption: (item) => ({ value: item.id, label: `Orden #${item.number}` }),
          },
          {
            name: 'type',
            label: 'Tipo',
            type: 'select',
            required: true,
            defaultValue: 'invoice',
            options: [
              { value: 'invoice', label: 'Factura' },
              { value: 'receipt', label: 'Recibo' },
              { value: 'delivery_note', label: 'Remito' },
              { value: 'credit_note', label: 'Nota de credito' },
            ],
          },
          {
            name: 'total',
            label: 'Total',
            type: 'number',
            min: 0,
            step: '0.01',
            defaultValue: 0,
            validate: (value) => Number(value || 0) <= 0 ? 'El total debe ser mayor a 0.' : '',
          },
          { name: 'notes', label: 'Notas', type: 'textarea' },
        ]}
        editTitle="Actualizar comprobante"
        editFields={[
          {
            name: 'status',
            label: 'Estado',
            type: 'select',
            required: true,
            options: [
              { value: 'pending', label: 'Pendiente' },
              { value: 'paid', label: 'Pagada' },
              { value: 'cancelled', label: 'Cancelada' },
            ],
          },
          { name: 'paymentReference', label: 'Referencia de pago' },
          { name: 'notes', label: 'Notas', type: 'textarea' },
        ]}
        serializeCreate={(values) => ({
          ...values,
          subtotal: Number(values.total || 0),
          total: Number(values.total || 0),
          tax: 0,
          discount: 0,
        })}
        detailTitle="Detalle del comprobante"
        detailFields={[
          {
            label: 'Cliente',
            render: (item) =>
              item.client ? `${item.client.firstName || ''} ${item.client.lastName || ''}`.trim() : 'Sin cliente',
          },
          {
            label: 'Tipo',
            render: (item) => item.type || 'invoice',
          },
          {
            label: 'Total',
            render: (item) =>
              Number(item.total || 0).toLocaleString('es-AR', {
                style: 'currency',
                currency: 'ARS',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }),
          },
          {
            label: 'Orden asociada',
            render: (item) => item.workOrder ? `Orden #${item.workOrder.number}` : 'Sin orden asociada',
          },
          {
            label: 'Notas',
            render: (item) => item.notes || 'Sin notas de cobro',
          },
        ]}
        itemActions={[
          {
            label: 'Garantia',
            href: (item) =>
              `/dashboard/warranties?clientId=${item.clientId}&vehicleId=${item.workOrder?.vehicleId || ''}&workOrderId=${item.workOrderId || ''}&invoiceId=${item.id}&new=1`,
            shouldShow: (item) => Boolean(item.clientId),
          },
        ]}
        getItemTitle={(item) => `Comprobante #${item.number}`}
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
        getItemSecondaryMeta={(item) => item.type || 'invoice'}
        getItemBadge={(item) => item.status}
        emptyMessage="Todavia no hay comprobantes registrados."
      />
    </ModulePage>
  )
}
