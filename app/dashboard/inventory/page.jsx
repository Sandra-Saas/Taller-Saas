'use client'

import { ModulePage } from '@/components/dashboard/ModulePage'
import { ResourceCrudPanel } from '@/components/dashboard/ResourceCrudPanel'

function formatInventoryRecord(item) {
  return {
    title: item.name || 'Item sin nombre',
    subtitle: [item.type, item.category?.name, item.supplier?.name].filter(Boolean).join(' · '),
    meta: `Stock ${item.stock ?? 0} / Minimo ${item.minStock ?? 0}`,
    secondaryMeta: item.sku ? `SKU ${item.sku}` : 'Sin SKU',
    badge: item.stock <= item.minStock ? 'warning' : 'active',
  }
}

export default function InventoryPage() {
  return (
    <ModulePage
      title="Inventario"
      description="Supervisa stock, reposicion y consumo operativo de repuestos e insumos."
      metrics={[
        {
          label: 'Stock critico',
          value: (data) => data?.inventory?.lowStockItems ?? 0,
          helpText: 'Items que ya alcanzaron o perforaron el minimo configurado.',
        },
        {
          label: 'Ordenes activas',
          value: (data) => data?.general?.activeWorkOrders ?? 0,
          helpText: 'Demanda operativa que puede impactar el consumo de repuestos.',
        },
        {
          label: 'Facturacion mensual',
          value: (data) => data?.economic?.monthlyBilling ?? 0,
          format: 'currency',
          helpText: 'Referencia economica para planificar compras y reposicion.',
        },
      ]}
      workflow={[
        {
          title: 'Auditar existencias',
          description: 'Revisa cantidades actuales, minimos y ubicaciones fisicas.',
          badge: 'Control',
        },
        {
          title: 'Abastecer a tiempo',
          description: 'Prioriza compras de los items con consumo mas sensible.',
          badge: 'Compras',
        },
        {
          title: 'Relacionar con ordenes',
          description: 'Conecta materiales usados con trabajo ejecutado y margen.',
          badge: 'Operacion',
        },
      ]}
      highlights={[
        {
          title: 'Alerta temprana',
          description: 'El conteo de stock critico permite actuar antes de afectar entregas.',
          badge: 'warning',
        },
        {
          title: 'Compatible con proveedores',
          description: 'La vista queda lista para sumar categorias, proveedores y movimientos.',
          badge: 'active',
        },
        {
          title: 'Base para costos',
          description: 'Ayuda a enlazar repuestos, compras y rentabilidad del taller.',
          badge: 'pending',
        },
      ]}
      recordsTitle="Items recientes"
      recordsDescription="Ultimos productos o insumos registrados en inventario."
      resourceEndpoint="/api/public/v1/inventory?limit=5"
      mapRecord={formatInventoryRecord}
      emptyMessage="Todavia no hay items de inventario cargados."
    >
      <ResourceCrudPanel
        title="Gestion de stock"
        description="Carga repuestos e insumos y actualiza cantidades o precios desde el dashboard."
        listEndpoint="/api/public/v1/inventory?limit=20"
        searchPlaceholder="Buscar por nombre o SKU..."
        createTitle="Nuevo item de inventario"
        createLabel="Nuevo item"
        createFields={[
          { name: 'name', label: 'Nombre', required: true },
          {
            name: 'type',
            label: 'Tipo',
            type: 'select',
            required: true,
            options: [
              { value: 'part', label: 'Repuesto' },
              { value: 'lubricant', label: 'Lubricante' },
              { value: 'tire', label: 'Neumatico' },
              { value: 'tool', label: 'Herramienta' },
              { value: 'supply', label: 'Insumo' },
            ],
          },
          { name: 'sku', label: 'SKU' },
          {
            name: 'stock',
            label: 'Stock actual',
            type: 'number',
            defaultValue: 0,
            min: 0,
          },
          {
            name: 'minStock',
            label: 'Stock minimo',
            type: 'number',
            defaultValue: 0,
            min: 0,
          },
          { name: 'purchasePrice', label: 'Costo', type: 'number', defaultValue: 0, min: 0, step: '0.01' },
          {
            name: 'salePrice',
            label: 'Precio de venta',
            type: 'number',
            defaultValue: 0,
            min: 0,
            step: '0.01',
            validate: (value, values) =>
              Number(value || 0) < Number(values.purchasePrice || 0)
                ? 'El precio de venta no deberia ser menor al costo.'
                : '',
          },
          { name: 'location', label: 'Ubicacion' },
          { name: 'notes', label: 'Notas', type: 'textarea' },
        ]}
        editTitle="Editar item"
        editFields={[
          { name: 'name', label: 'Nombre', required: true },
          {
            name: 'type',
            label: 'Tipo',
            type: 'select',
            required: true,
            options: [
              { value: 'part', label: 'Repuesto' },
              { value: 'lubricant', label: 'Lubricante' },
              { value: 'tire', label: 'Neumatico' },
              { value: 'tool', label: 'Herramienta' },
              { value: 'supply', label: 'Insumo' },
            ],
          },
          { name: 'sku', label: 'SKU' },
          { name: 'stock', label: 'Stock actual', type: 'number', min: 0 },
          { name: 'minStock', label: 'Stock minimo', type: 'number', min: 0 },
          { name: 'purchasePrice', label: 'Costo', type: 'number', min: 0, step: '0.01' },
          {
            name: 'salePrice',
            label: 'Precio de venta',
            type: 'number',
            min: 0,
            step: '0.01',
            validate: (value, values) =>
              Number(value || 0) < Number(values.purchasePrice || 0)
                ? 'El precio de venta no deberia ser menor al costo.'
                : '',
          },
          { name: 'location', label: 'Ubicacion' },
          { name: 'notes', label: 'Notas', type: 'textarea' },
        ]}
        getItemTitle={(item) => item.name}
        getItemSubtitle={(item) => [item.type, item.sku].filter(Boolean).join(' · ')}
        getItemMeta={(item) => `Stock ${item.stock ?? 0} / Min ${item.minStock ?? 0}`}
        getItemSecondaryMeta={(item) =>
          Number(item.salePrice || 0).toLocaleString('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })
        }
        getItemBadge={(item) => (item.stock <= item.minStock ? 'warning' : 'active')}
        emptyMessage="Todavia no hay items registrados en inventario."
      />
    </ModulePage>
  )
}
