'use client'

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

function formatTurnRecord(turn) {
  const clientName = turn.client
    ? `${turn.client.firstName || ''} ${turn.client.lastName || ''}`.trim()
    : 'Cliente sin asignar'
  const vehicleName = turn.vehicle
    ? [turn.vehicle.brand, turn.vehicle.model, turn.vehicle.plate].filter(Boolean).join(' · ')
    : 'Vehiculo sin asignar'

  return {
    title: turn.title || 'Turno sin titulo',
    subtitle: `${clientName} · ${vehicleName}`,
    meta: new Date(turn.startDate).toLocaleString('es-AR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }),
    secondaryMeta: turn.service?.name || 'Servicio general',
    badge: turn.status || 'scheduled',
  }
}

export default function CalendarPage() {
  return (
    <ModulePage
      title="Agenda"
      description="Organiza turnos, bloques horarios y recordatorios desde un espacio centralizado."
      metrics={[
        {
          label: 'Turnos de hoy',
          value: (data) => data?.general?.appointmentsToday ?? 0,
          helpText: 'Cantidad de eventos agendados para la jornada actual.',
        },
        {
          label: 'Turnos de la semana',
          value: (data) => data?.general?.appointmentsWeek ?? 0,
          helpText: 'Visibilidad de la carga operativa semanal.',
        },
        {
          label: 'Vehiculos en espera',
          value: (data) => data?.general?.vehiclesPending ?? 0,
          helpText: 'Unidades pendientes de recepcion o definicion inicial.',
        },
      ]}
      workflow={[
        {
          title: 'Registrar el turno',
          description: 'Reserva fecha, servicio, vehiculo y cliente para cada ingreso.',
          badge: 'Agenda',
        },
        {
          title: 'Confirmar disponibilidad',
          description: 'Valida mecanico, bahia y franja horaria antes de recibir el vehiculo.',
          badge: 'Control',
        },
        {
          title: 'Convertir en recepcion',
          description: 'Usa el turno confirmado como punto de partida para la admision.',
          badge: 'Operacion',
        },
      ]}
      highlights={[
        {
          title: 'Seguimiento diario',
          description: 'Controla rapidamente cuellos de botella entre agenda, recepcion y ordenes.',
          badge: 'active',
        },
        {
          title: 'Cobertura semanal',
          description: 'El contador semanal ayuda a estimar capacidad sin salir del dashboard.',
          badge: 'scheduled',
        },
        {
          title: 'Base para automatizaciones',
          description: 'Este modulo queda listo para conectar recordatorios por email o WhatsApp.',
          badge: 'draft',
        },
      ]}
      recordsTitle="Proximos turnos"
      recordsDescription="Ultimos eventos obtenidos desde la API publica interna del taller."
      resourceEndpoint="/api/public/v1/turns?limit=5"
      mapRecord={formatTurnRecord}
      emptyMessage="Todavia no hay turnos cargados para mostrar en la agenda."
    >
      <ResourceCrudPanel
        title="Gestion de turnos"
        description="Crea nuevos turnos y actualiza rapidamente el estado de los ya registrados."
        listEndpoint="/api/public/v1/turns?limit=20"
        searchPlaceholder="Buscar por motivo..."
        statusOptions={[
          { value: 'scheduled', label: 'Programado' },
          { value: 'completed', label: 'Completado' },
          { value: 'cancelled', label: 'Cancelado' },
          { value: 'rescheduled', label: 'Reprogramado' },
        ]}
        createTitle="Nuevo turno"
        createLabel="Nuevo turno"
        supportEndpoints={[
          { key: 'clients', url: '/api/clients' },
          { key: 'vehicles', url: '/api/vehicles' },
          { key: 'services', url: '/api/services' },
        ]}
        createFields={[
          { name: 'title', label: 'Motivo', required: true, placeholder: 'Cambio de aceite' },
          { name: 'startDate', label: 'Inicio', type: 'datetime-local', required: true },
          {
            name: 'endDate',
            label: 'Fin',
            type: 'datetime-local',
            required: true,
            validate: (value, values) =>
              value && values.startDate && new Date(value) <= new Date(values.startDate)
                ? 'La fecha de fin debe ser posterior al inicio.'
                : '',
          },
          {
            name: 'clientId',
            label: 'Cliente',
            type: 'select',
            optionsKey: 'clients',
            emptyLabel: 'Sin cliente',
            resetFieldsOnChange: ['vehicleId'],
          },
          {
            name: 'vehicleId',
            label: 'Vehiculo',
            type: 'select',
            optionsKey: 'vehicles',
            emptyLabel: 'Sin vehiculo',
            helpText: 'Si elegis un cliente, solo se muestran sus vehiculos.',
            filterOptions: (item, values) => !values.clientId || item.clientId === values.clientId,
            mapOption: (item) => ({
              value: item.id,
              label: [item.brand, item.model, item.plate].filter(Boolean).join(' · '),
            }),
          },
          {
            name: 'serviceId',
            label: 'Servicio',
            type: 'select',
            optionsKey: 'services',
            emptyLabel: 'Sin servicio',
            mapOption: (item) => ({ value: item.id, label: item.name }),
          },
          { name: 'description', label: 'Descripcion', type: 'textarea', placeholder: 'Notas del turno' },
        ]}
        editTitle="Editar turno"
        editFields={[
          { name: 'title', label: 'Motivo', required: true },
          {
            name: 'startDate',
            label: 'Inicio',
            type: 'datetime-local',
            required: true,
            getInitialValue: (item) => toDateTimeLocal(item.startDate),
          },
          {
            name: 'endDate',
            label: 'Fin',
            type: 'datetime-local',
            required: true,
            getInitialValue: (item) => toDateTimeLocal(item.endDate),
            validate: (value, values) =>
              value && values.startDate && new Date(value) <= new Date(values.startDate)
                ? 'La fecha de fin debe ser posterior al inicio.'
                : '',
          },
          {
            name: 'status',
            label: 'Estado',
            type: 'select',
            required: true,
            options: [
              { value: 'scheduled', label: 'Programado' },
              { value: 'completed', label: 'Completado' },
              { value: 'cancelled', label: 'Cancelado' },
              { value: 'rescheduled', label: 'Reprogramado' },
            ],
          },
        ]}
        getItemTitle={(item) => item.title}
        getItemSubtitle={(item) => {
          const clientName = item.client
            ? `${item.client.firstName || ''} ${item.client.lastName || ''}`.trim()
            : 'Cliente sin asignar'
          const vehicleName = item.vehicle
            ? [item.vehicle.brand, item.vehicle.model, item.vehicle.plate].filter(Boolean).join(' · ')
            : 'Vehiculo sin asignar'
          return `${clientName} · ${vehicleName}`
        }}
        getItemMeta={(item) =>
          new Date(item.startDate).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })
        }
        getItemSecondaryMeta={(item) => item.service?.name || 'Servicio general'}
        getItemBadge={(item) => item.status}
        emptyMessage="Todavia no hay turnos creados en este modulo."
      />
    </ModulePage>
  )
}
