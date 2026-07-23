'use client'

import { ModulePage } from '@/components/dashboard/ModulePage'
import { ResourceCrudPanel } from '@/components/dashboard/ResourceCrudPanel'

const posGuide = [
  {
    title: 'Ventas rapidas',
    subtitle: 'Usa el modulo para centralizar cobros de mostrador, servicios y repuestos.',
    meta: 'Escenario recomendado',
    secondaryMeta: 'Ideal para ventas sin orden completa',
    badge: 'active',
  },
  {
    title: 'Control de caja',
    subtitle: 'Apoya el seguimiento diario de ingresos y metodos de pago.',
    meta: 'Operacion diaria',
    secondaryMeta: 'Complementa facturacion y arqueo',
    badge: 'paid',
  },
  {
    title: 'Salida de stock',
    subtitle: 'Queda listo para descontar inventario al confirmar una transaccion.',
    meta: 'Integracion esperada',
    secondaryMeta: 'Reduce diferencias de inventario',
    badge: 'pending',
  },
]

export default function POSPage() {
  return (
    <ModulePage
      title="POS"
      description="Centraliza ventas rapidas de mostrador y deja el modulo listo para caja e inventario."
      metrics={[
        {
          label: 'Caja del dia',
          value: (data) => data?.economic?.dailyCash ?? 0,
          format: 'currency',
          helpText: 'Referencia rapida del dinero generado durante la jornada.',
        },
        {
          label: 'Facturacion diaria',
          value: (data) => data?.economic?.dailyBilling ?? 0,
          format: 'currency',
          helpText: 'Monto cobrado hoy, util como señal para operaciones de mostrador.',
        },
        {
          label: 'Facturacion mensual',
          value: (data) => data?.economic?.monthlyBilling ?? 0,
          format: 'currency',
          helpText: 'Contexto de rendimiento para proyectar ventas y reposicion.',
        },
      ]}
      workflow={[
        {
          title: 'Registrar la venta',
          description: 'Carga items o servicios vendidos en mostrador con total y observaciones.',
          badge: 'Venta',
        },
        {
          title: 'Confirmar cobro',
          description: 'Define el medio de pago y actualiza la caja operativa del dia.',
          badge: 'Caja',
        },
        {
          title: 'Impactar stock',
          description: 'Relaciona la venta con inventario para mantener existencias consistentes.',
          badge: 'Stock',
        },
      ]}
      highlights={[
        {
          title: 'Modulo comercial activo',
          description: 'La vista deja de ser placeholder y ya ofrece un marco claro para ventas de mostrador.',
          badge: 'active',
        },
        {
          title: 'Preparado para medios de pago',
          description: 'Queda listo para integrar efectivo, tarjeta, transferencia y devoluciones.',
          badge: 'paid',
        },
        {
          title: 'Integrable con inventario',
          description: 'Pensado para enlazar salidas de stock y rentabilidad por transaccion.',
          badge: 'pending',
        },
      ]}
      recordsTitle="Guia operativa POS"
      recordsDescription="Resumen de usos principales para ventas rapidas mientras se amplian flujos transaccionales."
      recentItems={posGuide}
      emptyMessage="Todavia no hay una guia operativa cargada para POS."
    >
      <ResourceCrudPanel
        title="Gestion de ventas POS"
        description="Registra ventas rapidas, medio de pago y observaciones de cada operacion."
        listEndpoint="/api/public/v1/pos?limit=20"
        searchPlaceholder="Buscar por numero..."
        createTitle="Nueva venta POS"
        createLabel="Nueva venta"
        supportEndpoints={[{ key: 'clients', url: '/api/clients' }]}
        createFields={[
          {
            name: 'clientId',
            label: 'Cliente',
            type: 'select',
            optionsKey: 'clients',
            emptyLabel: 'Consumidor final',
          },
          {
            name: 'type',
            label: 'Tipo',
            type: 'select',
            required: true,
            defaultValue: 'sale',
            options: [
              { value: 'sale', label: 'Venta' },
              { value: 'return', label: 'Devolucion' },
            ],
          },
          {
            name: 'paymentMethod',
            label: 'Medio de pago',
            type: 'select',
            required: true,
            defaultValue: 'cash',
            options: [
              { value: 'cash', label: 'Efectivo' },
              { value: 'card', label: 'Tarjeta' },
              { value: 'transfer', label: 'Transferencia' },
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
        editTitle="Actualizar venta POS"
        editFields={[
          {
            name: 'type',
            label: 'Tipo',
            type: 'select',
            required: true,
            options: [
              { value: 'sale', label: 'Venta' },
              { value: 'return', label: 'Devolucion' },
            ],
          },
          {
            name: 'paymentMethod',
            label: 'Medio de pago',
            type: 'select',
            required: true,
            options: [
              { value: 'cash', label: 'Efectivo' },
              { value: 'card', label: 'Tarjeta' },
              { value: 'transfer', label: 'Transferencia' },
            ],
          },
          {
            name: 'total',
            label: 'Total',
            type: 'number',
            min: 0,
            step: '0.01',
            validate: (value) => Number(value || 0) <= 0 ? 'El total debe ser mayor a 0.' : '',
          },
          { name: 'notes', label: 'Notas', type: 'textarea' },
        ]}
        serializeCreate={(values) => ({
          ...values,
          subtotal: Number(values.total || 0),
          total: Number(values.total || 0),
          tax: 0,
          discount: 0,
        })}
        getItemTitle={(item) => `Venta #${item.number}`}
        getItemSubtitle={(item) =>
          `${item.client?.firstName || ''} ${item.client?.lastName || ''}`.trim() || 'Consumidor final'
        }
        getItemMeta={(item) =>
          Number(item.total || 0).toLocaleString('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })
        }
        getItemSecondaryMeta={(item) => item.paymentMethod || 'cash'}
        getItemBadge={(item) => item.type}
        emptyMessage="Todavia no hay ventas POS registradas."
      />
    </ModulePage>
  )
}
