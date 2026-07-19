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

export default function ClientsPage() {
  const searchParams = useSearchParams()
  const autoOpenCreate = searchParams.get('new') === '1'

  const initialCreateValues = useMemo(
    () => ({
      firstName: searchParams.get('firstName') || '',
      lastName: searchParams.get('lastName') || '',
    }),
    [searchParams]
  )

  return (
    <ModulePage
      title="Clientes"
      description="Gestiona la base de clientes, su estado comercial y el acceso rapido a sus siguientes pasos."
      badgeLabel="Modulo habilitado"
      workflowTitle="Circuito comercial"
      workflow={[
        {
          title: 'Registrar el cliente',
          description: 'Da de alta la ficha basica con estado, fecha y notas internas.',
          badge: 'Base',
        },
        {
          title: 'Asociar vehiculos',
          description: 'Conecta cada cliente con sus unidades para operar mejor el taller.',
          badge: 'Relacion',
        },
        {
          title: 'Derivar al servicio',
          description: 'Desde la ficha se puede saltar a vehiculos, recepciones u ordenes.',
          badge: 'Accion',
        },
      ]}
      highlightsTitle="Puntos clave"
      highlights={[
        {
          title: 'Ficha centralizada',
          description: 'Cada cliente concentra datos basicos, vehiculos y contexto operativo.',
          badge: 'active',
        },
        {
          title: 'Base para el flujo',
          description: 'El modulo sirve como punto de partida para los siguientes procesos del taller.',
          badge: 'scheduled',
        },
        {
          title: 'Preparado para detalle',
          description: 'Cada registro ya ofrece vista de detalle y accion rapida hacia vehiculos.',
          badge: 'draft',
        },
      ]}
      recordsTitle="Gestion comercial"
      recordsDescription="Panel operativo para alta, edicion, detalle y derivacion de clientes."
      recentItems={[]}
      emptyMessage="Todavia no hay registros recientes para clientes."
    >
      <ResourceCrudPanel
        title="Gestion de clientes"
        description="Alta, edicion, detalle y acceso rapido a los vehiculos de cada cliente."
        listEndpoint="/api/public/v1/clients?limit=20"
        searchPlaceholder="Buscar por nombre o apellido..."
        statusOptions={[
          { value: 'active', label: 'Activo' },
          { value: 'inactive', label: 'Inactivo' },
        ]}
        createTitle="Nuevo cliente"
        createLabel="Nuevo cliente"
        initialCreateValues={initialCreateValues}
        autoOpenCreate={autoOpenCreate}
        createFields={[
          { name: 'firstName', label: 'Nombre', required: true },
          { name: 'lastName', label: 'Apellido', required: true },
          {
            name: 'status',
            label: 'Estado',
            type: 'select',
            required: true,
            defaultValue: 'active',
            options: [
              { value: 'active', label: 'Activo' },
              { value: 'inactive', label: 'Inactivo' },
            ],
          },
          { name: 'birthday', label: 'Cumpleaños', type: 'date' },
          { name: 'notes', label: 'Notas', type: 'textarea' },
        ]}
        editTitle="Editar cliente"
        editFields={[
          { name: 'firstName', label: 'Nombre', required: true },
          { name: 'lastName', label: 'Apellido', required: true },
          {
            name: 'status',
            label: 'Estado',
            type: 'select',
            required: true,
            options: [
              { value: 'active', label: 'Activo' },
              { value: 'inactive', label: 'Inactivo' },
            ],
          },
          {
            name: 'birthday',
            label: 'Cumpleaños',
            type: 'date',
            getInitialValue: (item) => toDateOnly(item.birthday),
          },
          { name: 'notes', label: 'Notas', type: 'textarea' },
        ]}
        detailTitle="Detalle del cliente"
        detailFields={[
          {
            label: 'Datos principales',
            render: (item) =>
              `${item.firstName} ${item.lastName}`.trim() || 'Cliente sin nombre',
          },
          {
            label: 'Contacto',
            render: (item) => {
              const phone = item.phones?.find((entry) => entry.isPrimary)?.number || item.phones?.[0]?.number
              const email = item.emails?.find((entry) => entry.isPrimary)?.address || item.emails?.[0]?.address
              return [phone, email].filter(Boolean).join(' · ') || 'Sin datos de contacto'
            },
          },
          {
            label: 'Direccion',
            render: (item) =>
              item.addresses?.find((entry) => entry.isPrimary)?.street || item.addresses?.[0]?.street || 'Sin direccion cargada',
          },
          {
            label: 'Actividad',
            render: (item) => `${item.vehicles?.length || 0} vehiculos · ${item.workOrders?.length || 0} ordenes`,
          },
          {
            label: 'Notas',
            render: (item) => item.notes || 'Sin observaciones internas',
          },
        ]}
        itemActions={[
          {
            label: 'Nuevo vehiculo',
            variant: 'ghost',
            href: (item) => `/dashboard/vehicles?clientId=${item.id}&new=1`,
          },
        ]}
        getItemTitle={(item) => `${item.firstName} ${item.lastName}`.trim()}
        getItemSubtitle={(item) => item.company?.name || 'Cliente particular'}
        getItemMeta={(item) => {
          const phone = item.phones?.find((entry) => entry.isPrimary)?.number || item.phones?.[0]?.number
          return phone || 'Sin telefono'
        }}
        getItemSecondaryMeta={(item) => `${item.vehicles?.length || 0} vehiculos`}
        getItemBadge={(item) => item.status}
        emptyMessage="Todavia no hay clientes registrados."
      />
    </ModulePage>
  )
}
