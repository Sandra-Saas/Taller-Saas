'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'

function normalizeListPayload(payload) {
  if (Array.isArray(payload)) {
    return payload
  }

  if (Array.isArray(payload?.data)) {
    return payload.data
  }

  return []
}

function getBadgeVariant(value) {
  const normalized = String(value || '').toLowerCase()

  if (['active', 'approved', 'completed', 'paid', 'scheduled', 'sent'].includes(normalized)) {
    return 'success'
  }

  if (['pending', 'draft', 'warning', 'in_progress'].includes(normalized)) {
    return 'warning'
  }

  if (['cancelled', 'rejected', 'expired', 'claimed'].includes(normalized)) {
    return 'destructive'
  }

  return 'secondary'
}

function getInitialValues(fields, item) {
  return fields.reduce((acc, field) => {
    if (typeof field.getInitialValue === 'function') {
      acc[field.name] = field.getInitialValue(item)
    } else if (item && Object.prototype.hasOwnProperty.call(item, field.name)) {
      acc[field.name] = item[field.name] ?? ''
    } else if (Object.prototype.hasOwnProperty.call(field, 'defaultValue')) {
      acc[field.name] = field.defaultValue
    } else {
      acc[field.name] = ''
    }

    return acc
  }, {})
}

function buildOptions(field, supportData) {
  return buildOptionsForValues(field, supportData, {})
}

function buildOptionsForValues(field, supportData, values) {
  if (Array.isArray(field.options)) {
    return field.options
  }

  if (!field.optionsKey) {
    return []
  }

  const source = supportData[field.optionsKey] || []
  const filteredSource =
    typeof field.filterOptions === 'function'
      ? source.filter((item) => field.filterOptions(item, values))
      : source
  return filteredSource.map((item) => {
    if (typeof field.mapOption === 'function') {
      return field.mapOption(item)
    }

    const clientLabel = [item.firstName, item.lastName].filter(Boolean).join(' ').trim()
    const vehicleLabel = [item.brand, item.model, item.plate].filter(Boolean).join(' · ').trim()

    return {
      value: item.id,
      label: item.name || item.title || clientLabel || vehicleLabel || item.number || item.id,
    }
  })
}

function FieldControl({ field, value, onChange, supportData, values, error }) {
  const commonProps = {
    id: field.name,
    value,
    onChange,
    placeholder: field.placeholder,
    required: field.required,
    disabled: field.disabled,
  }

  if (field.type === 'textarea') {
    return <Textarea {...commonProps} rows={field.rows || 4} />
  }

  if (field.type === 'select') {
    const options = buildOptionsForValues(field, supportData, values)

    return (
      <Select {...commonProps}>
        <option value="">{field.emptyLabel || 'Seleccionar'}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    )
  }

  return (
    <div className="space-y-2">
      <Input
        {...commonProps}
        type={field.type || 'text'}
        min={field.min}
        max={field.max}
        step={field.step}
      />
      {error ? <p className="text-xs text-red-500">{error}</p> : null}
    </div>
  )
}

function FormFields({ fields, values, setValues, supportData, fieldErrors }) {
  return (
    <div className="space-y-4">
      {fields.map((field) => (
        <div key={field.name} className="space-y-2">
          <Label htmlFor={field.name}>{field.label}</Label>
          <FieldControl
            field={field}
            value={values[field.name] ?? ''}
            supportData={supportData}
            values={values}
            error={fieldErrors[field.name]}
            onChange={(event) => {
              const nextValue = event.target.value

              setValues((prev) => {
                const nextValues = {
                  ...prev,
                  [field.name]: nextValue,
                }

                if (Array.isArray(field.resetFieldsOnChange)) {
                  for (const resetField of field.resetFieldsOnChange) {
                    nextValues[resetField] = ''
                  }
                }

                return nextValues
              })
            }}
          />
          {field.type !== 'text' && field.type !== 'number' && field.type !== 'date' && field.type !== 'datetime-local' ? (
            fieldErrors[field.name] ? <p className="text-xs text-red-500">{fieldErrors[field.name]}</p> : null
          ) : null}
          {field.helpText ? (
            <p className="text-xs text-gray-500 dark:text-gray-400">{field.helpText}</p>
          ) : null}
        </div>
      ))}
    </div>
  )
}

function validateFieldValue(field, value, values, supportData, item) {
  const normalizedValue = typeof value === 'string' ? value.trim() : value

  if (field.required && !normalizedValue) {
    return 'Este campo es obligatorio.'
  }

  if ((field.type === 'number' || field.type === 'range') && normalizedValue !== '' && normalizedValue !== null && normalizedValue !== undefined) {
    const numericValue = Number(normalizedValue)

    if (!Number.isFinite(numericValue)) {
      return 'Debe ser un numero valido.'
    }

    if (typeof field.min === 'number' && numericValue < field.min) {
      return `Debe ser mayor o igual a ${field.min}.`
    }

    if (typeof field.max === 'number' && numericValue > field.max) {
      return `Debe ser menor o igual a ${field.max}.`
    }
  }

  if (typeof field.validate === 'function') {
    return field.validate(normalizedValue, values, supportData, item) || ''
  }

  return ''
}

function validateValues(fields, values, supportData, item) {
  return fields.reduce((acc, field) => {
    const fieldError = validateFieldValue(field, values[field.name], values, supportData, item)
    if (fieldError) {
      acc[field.name] = fieldError
    }
    return acc
  }, {})
}

export function ResourceCrudPanel({
  title,
  description,
  listEndpoint,
  searchPlaceholder = 'Buscar...',
  statusOptions = [],
  createTitle = 'Nuevo registro',
  createLabel = 'Nuevo',
  createFields = [],
  editTitle = 'Editar registro',
  editFields = [],
  supportEndpoints = [],
  getItemTitle,
  getItemSubtitle,
  getItemMeta,
  getItemSecondaryMeta,
  getItemBadge,
  detailTitle = 'Detalle del registro',
  detailFields = [],
  itemActions = [],
  initialCreateValues = {},
  autoOpenCreate = false,
  serializeCreate,
  serializeEdit,
  emptyMessage = 'Todavia no hay registros cargados.',
}) {
  const [items, setItems] = useState([])
  const [supportData, setSupportData] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [detailItem, setDetailItem] = useState(null)
  const [createValues, setCreateValues] = useState(() => getInitialValues(createFields))
  const [editValues, setEditValues] = useState({})
  const [createFieldErrors, setCreateFieldErrors] = useState({})
  const [editFieldErrors, setEditFieldErrors] = useState({})
  const [deletingId, setDeletingId] = useState('')
  const writeEndpoint = useMemo(() => listEndpoint.split('?')[0], [listEndpoint])
  const shouldDebugAffectedCreate =
    writeEndpoint === '/api/public/v1/vehicles' ||
    writeEndpoint === '/api/public/v1/turns' ||
    writeEndpoint === '/api/public/v1/receptions'

  useEffect(() => {
    let cancelled = false

    const loadSupportData = async () => {
      if (supportEndpoints.length === 0) {
        return
      }

      try {
        const entries = await Promise.all(
          supportEndpoints.map(async (resource) => {
            const response = await fetch(resource.url, { cache: 'no-store' })
            const payload = await response.json()
            // #region debug-point E:support-load
            if (
              shouldDebugAffectedCreate &&
              (resource.key === 'clients' || resource.key === 'vehicles')
            ) {
              const list = normalizeListPayload(payload)
              const sample = list[0] || null
              fetch('http://127.0.0.1:7777/event', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  sessionId: 'resource-create-500',
                  runId: 'pre',
                  hypothesisId: 'E',
                  location: 'components/dashboard/ResourceCrudPanel.jsx:loadSupportData',
                  msg: '[DEBUG] support data loaded for affected create flow',
                  data: {
                    writeEndpoint,
                    resourceKey: resource.key,
                    responseOk: response.ok,
                    total: list.length,
                    sampleKeys: sample ? Object.keys(sample) : [],
                    sampleId: sample?.id || null,
                    sampleFirstName: sample?.firstName || null,
                    sampleLastName: sample?.lastName || null,
                    sampleName: sample?.name || null,
                    sampleTitle: sample?.title || null,
                    sampleNumber: sample?.number || null,
                  },
                  ts: Date.now(),
                }),
              }).catch(() => {})
            }
            // #endregion
            return [resource.key, normalizeListPayload(payload)]
          })
        )

        if (!cancelled) {
          setSupportData(Object.fromEntries(entries))
        }
      } catch (supportError) {
        console.error('Error loading support data:', supportError)
      }
    }

    loadSupportData()

    return () => {
      cancelled = true
    }
  }, [supportEndpoints])

  useEffect(() => {
    let cancelled = false

    const loadItems = async () => {
      setLoading(true)
      setError('')

      try {
        const url = new URL(listEndpoint, window.location.origin)
        if (query.trim()) {
          url.searchParams.set('q', query.trim())
        }
        if (status) {
          url.searchParams.set('status', status)
        }

        const response = await fetch(url.toString(), { cache: 'no-store' })
        const payload = await response.json()

        if (!response.ok) {
          throw new Error(payload?.message || 'No se pudieron cargar los registros.')
        }

        if (!cancelled) {
          setItems(normalizeListPayload(payload))
        }
      } catch (loadError) {
        console.error('Error loading records:', loadError)
        if (!cancelled) {
          setItems([])
          setError(loadError.message || 'No se pudieron cargar los registros.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadItems()

    return () => {
      cancelled = true
    }
  }, [listEndpoint, query, status])

  const hasCreate = createFields.length > 0
  const hasEdit = editFields.length > 0
  const canDelete = Boolean(title)
  const hasDetails = detailFields.length > 0

  useEffect(() => {
    if (!hasCreate) {
      return
    }

    const hasInitialValues = Object.keys(initialCreateValues || {}).length > 0
    if (!hasInitialValues) {
      return
    }

    setCreateValues((prev) => ({
      ...prev,
      ...initialCreateValues,
    }))

    if (autoOpenCreate) {
      setCreateOpen(true)
    }
  }, [autoOpenCreate, hasCreate, initialCreateValues])

  const resetCreateForm = () => {
    setCreateValues({
      ...getInitialValues(createFields),
      ...initialCreateValues,
    })
    setCreateFieldErrors({})
  }

  const openEditModal = (item) => {
    setEditItem(item)
    setEditValues(getInitialValues(editFields, item))
    setEditFieldErrors({})
  }

  const handleCreate = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    const nextErrors = validateValues(createFields, createValues, supportData)
    setCreateFieldErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      setSubmitting(false)
      return
    }

    try {
      const payload = typeof serializeCreate === 'function' ? serializeCreate(createValues) : createValues
      const debugTraceId = `resource-create-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      // #region debug-point C:create-submit
      if (shouldDebugAffectedCreate) {
        fetch('http://127.0.0.1:7777/event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: 'resource-create-500',
            runId: 'pre',
            hypothesisId: 'C',
            traceId: debugTraceId,
            location: 'components/dashboard/ResourceCrudPanel.jsx:handleCreate:beforeFetch',
            msg: '[DEBUG] affected resource create submit started',
            data: {
              writeEndpoint,
              payload,
              payloadKeys: Object.keys(payload || {}),
            },
            ts: Date.now(),
          }),
        }).catch(() => {})
      }
      // #endregion
      const response = await fetch(writeEndpoint, {
        method: 'POST',
        headers: shouldDebugAffectedCreate
          ? { 'Content-Type': 'application/json', 'X-Debug-Trace-Id': debugTraceId }
          : { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await response.json()
      // #region debug-point C:create-response
      if (shouldDebugAffectedCreate) {
        fetch('http://127.0.0.1:7777/event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: 'resource-create-500',
            runId: 'pre',
            hypothesisId: 'C',
            traceId: debugTraceId,
            location: 'components/dashboard/ResourceCrudPanel.jsx:handleCreate:afterFetch',
            msg: '[DEBUG] affected resource create response received',
            data: {
              writeEndpoint,
              ok: response.ok,
              status: response.status,
              error: data?.error || null,
              message: data?.message || null,
              returnedId: data?.id || null,
            },
            ts: Date.now(),
          }),
        }).catch(() => {})
      }
      // #endregion

      if (!response.ok) {
        throw new Error(data?.message || 'No se pudo crear el registro.')
      }

      setItems((prev) => [data, ...prev])
      setCreateOpen(false)
      resetCreateForm()
    } catch (submitError) {
      // #region debug-point C:create-catch
      if (shouldDebugAffectedCreate) {
        fetch('http://127.0.0.1:7777/event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: 'resource-create-500',
            runId: 'pre',
            hypothesisId: 'C',
            location: 'components/dashboard/ResourceCrudPanel.jsx:handleCreate:catch',
            msg: '[DEBUG] affected resource create submit failed in panel',
            data: {
              writeEndpoint,
              errorMessage: submitError?.message || null,
            },
            ts: Date.now(),
          }),
        }).catch(() => {})
      }
      // #endregion
      console.error('Error creating record:', submitError)
      setError(submitError.message || 'No se pudo crear el registro.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = async (event) => {
    event.preventDefault()
    if (!editItem) {
      return
    }

    setSubmitting(true)
    setError('')
    const nextErrors = validateValues(editFields, editValues, supportData, editItem)
    setEditFieldErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      setSubmitting(false)
      return
    }

    try {
      const payload = typeof serializeEdit === 'function' ? serializeEdit(editValues, editItem) : editValues
      const response = await fetch(`${writeEndpoint}/${editItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.message || 'No se pudo actualizar el registro.')
      }

      setItems((prev) => prev.map((item) => (item.id === data.id ? { ...item, ...data } : item)))
      setEditItem(null)
      setEditValues({})
    } catch (submitError) {
      console.error('Error updating record:', submitError)
      setError(submitError.message || 'No se pudo actualizar el registro.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (item) => {
    const itemLabel = typeof getItemTitle === 'function' ? getItemTitle(item) : 'este registro'
    const confirmed = window.confirm(`¿Eliminar ${itemLabel}? Esta acción no se puede deshacer.`)

    if (!confirmed) {
      return
    }

    setDeletingId(item.id)
    setError('')

    try {
      const response = await fetch(`${writeEndpoint}/${item.id}`, {
        method: 'DELETE',
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload?.message || 'No se pudo eliminar el registro.')
      }

      setItems((prev) => prev.filter((current) => current.id !== item.id))
    } catch (deleteError) {
      console.error('Error deleting record:', deleteError)
      setError(deleteError.message || 'No se pudo eliminar el registro.')
    } finally {
      setDeletingId('')
    }
  }

  const filteredStatusOptions = useMemo(() => statusOptions.filter(Boolean), [statusOptions])

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>

          {hasCreate ? (
            <Button
              onClick={() => {
                resetCreateForm()
                setCreateOpen(true)
              }}
            >
              {createLabel}
            </Button>
          ) : null}
        </div>

        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
          <Input
            placeholder={searchPlaceholder}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {filteredStatusOptions.length > 0 ? (
            <Select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="">Todos los estados</option>
              {filteredStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          ) : null}
        </div>
      </CardHeader>

      <CardContent>
        {error ? <p className="mb-4 text-sm text-red-500">{error}</p> : null}

        {loading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Cargando registros...</p>
        ) : items.length > 0 ? (
          <div className="space-y-3">
            {items.map((item) => {
              const badgeValue = typeof getItemBadge === 'function' ? getItemBadge(item) : ''

              return (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4 dark:border-gray-800 md:flex-row md:items-start md:justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {typeof getItemTitle === 'function' ? getItemTitle(item) : item.id}
                      </p>
                      {badgeValue ? (
                        <Badge variant={getBadgeVariant(badgeValue)}>{badgeValue}</Badge>
                      ) : null}
                    </div>
                    {typeof getItemSubtitle === 'function' ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">{getItemSubtitle(item)}</p>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-3 md:items-end">
                    <div className="text-sm text-gray-500 dark:text-gray-400 md:text-right">
                      {typeof getItemMeta === 'function' ? <div>{getItemMeta(item)}</div> : null}
                      {typeof getItemSecondaryMeta === 'function' ? (
                        <div>{getItemSecondaryMeta(item)}</div>
                      ) : null}
                    </div>
                    <div className="flex gap-2">
                      {hasDetails ? (
                        <Button variant="secondary" size="sm" onClick={() => setDetailItem(item)}>
                          Ver
                        </Button>
                      ) : null}
                      {itemActions.map((action) => {
                        if (typeof action.shouldShow === 'function' && !action.shouldShow(item)) {
                          return null
                        }

                        const href = typeof action.href === 'function' ? action.href(item) : action.href
                        const label = typeof action.label === 'function' ? action.label(item) : action.label

                        if (href) {
                          return (
                            <Link key={`${item.id}-${label}`} href={href}>
                              <Button variant={action.variant || 'ghost'} size="sm" type="button">
                                {label}
                              </Button>
                            </Link>
                          )
                        }

                        return (
                          <Button
                            key={`${item.id}-${label}`}
                            variant={action.variant || 'ghost'}
                            size="sm"
                            type="button"
                            onClick={() => action.onClick?.(item)}
                          >
                            {label}
                          </Button>
                        )
                      })}
                      {hasEdit ? (
                        <Button variant="outline" size="sm" onClick={() => openEditModal(item)}>
                          Editar
                        </Button>
                      ) : null}
                      {canDelete ? (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(item)}
                          disabled={deletingId === item.id}
                        >
                          {deletingId === item.id ? 'Eliminando...' : 'Eliminar'}
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-gray-200 p-6 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
            {emptyMessage}
          </div>
        )}
      </CardContent>

      {hasCreate ? (
        <Modal
          isOpen={createOpen}
          onClose={() => setCreateOpen(false)}
          title={createTitle}
          footer={
            <>
              <Button variant="outline" onClick={() => setCreateOpen(false)} type="button">
                Cancelar
              </Button>
              <Button type="submit" form="resource-create-form" disabled={submitting}>
                {submitting ? 'Guardando...' : 'Crear'}
              </Button>
            </>
          }
        >
          <form id="resource-create-form" onSubmit={handleCreate}>
            <FormFields
              fields={createFields}
              values={createValues}
              setValues={setCreateValues}
              supportData={supportData}
              fieldErrors={createFieldErrors}
            />
          </form>
        </Modal>
      ) : null}

      {hasEdit ? (
        <Modal
          isOpen={Boolean(editItem)}
          onClose={() => setEditItem(null)}
          title={editTitle}
          footer={
            <>
              <Button variant="outline" onClick={() => setEditItem(null)} type="button">
                Cancelar
              </Button>
              <Button type="submit" form="resource-edit-form" disabled={submitting}>
                {submitting ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </>
          }
        >
          <form id="resource-edit-form" onSubmit={handleEdit}>
            <FormFields
              fields={editFields}
              values={editValues}
              setValues={setEditValues}
              supportData={supportData}
              fieldErrors={editFieldErrors}
            />
          </form>
        </Modal>
      ) : null}

      {hasDetails ? (
        <Modal
          isOpen={Boolean(detailItem)}
          onClose={() => setDetailItem(null)}
          title={detailTitle}
          footer={
            <Button variant="outline" type="button" onClick={() => setDetailItem(null)}>
              Cerrar
            </Button>
          }
        >
          <div className="space-y-4">
            {detailFields.map((field) => (
              <div
                key={field.label}
                className="rounded-lg border border-gray-200 p-4 dark:border-gray-800"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  {field.label}
                </p>
                <div className="mt-1 text-sm text-gray-900 dark:text-white">
                  {detailItem ? field.render(detailItem) : ''}
                </div>
              </div>
            ))}
          </div>
        </Modal>
      ) : null}
    </Card>
  )
}
