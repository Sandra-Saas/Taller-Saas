'use client'

import { useEffect, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'

const numberFormatter = new Intl.NumberFormat('es-AR')
const currencyFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

function formatMetricValue(value, format = 'number') {
  if (value === null || value === undefined) {
    return '--'
  }

  if (format === 'currency') {
    return currencyFormatter.format(Number(value || 0))
  }

  if (format === 'date') {
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) {
      return '--'
    }

    return parsed.toLocaleString('es-AR', {
      dateStyle: 'short',
      timeStyle: 'short',
    })
  }

  if (format === 'text') {
    return String(value)
  }

  return numberFormatter.format(Number(value || 0))
}

function getStatusVariant(status) {
  const normalized = String(status || '').toLowerCase()

  if (['paid', 'approved', 'active', 'completed', 'scheduled', 'sent'].includes(normalized)) {
    return 'success'
  }

  if (['pending', 'draft', 'in_progress', 'warning'].includes(normalized)) {
    return 'warning'
  }

  if (['cancelled', 'rejected', 'expired', 'claimed'].includes(normalized)) {
    return 'destructive'
  }

  return 'secondary'
}

function normalizeRecords(payload) {
  if (Array.isArray(payload)) {
    return payload
  }

  if (Array.isArray(payload?.records)) {
    return payload.records
  }

  return []
}

export function ModulePage({
  title,
  description,
  badgeLabel,
  metrics = [],
  workflowTitle = 'Circuito operativo',
  workflow = [],
  highlightsTitle = 'Puntos clave',
  highlights = [],
  recordsTitle = 'Actividad reciente',
  recordsDescription = 'Resumen de los elementos mas recientes del modulo.',
  recentItems = [],
  resourceEndpoint,
  mapRecord,
  emptyMessage = 'Todavia no hay informacion para mostrar en este modulo.',
  children,
}) {
  const [dashboardData, setDashboardData] = useState(null)
  const [records, setRecords] = useState(Array.isArray(recentItems) ? recentItems : [])
  const [loadingDashboard, setLoadingDashboard] = useState(true)
  const [loadingRecords, setLoadingRecords] = useState(Boolean(resourceEndpoint))
  const [recordsError, setRecordsError] = useState('')

  useEffect(() => {
    let cancelled = false

    const loadData = async () => {
      setLoadingDashboard(true)
      setLoadingRecords(Boolean(resourceEndpoint))
      setRecordsError('')

      try {
        const dashboardRequest = fetch('/api/dashboard', { cache: 'no-store' })
        const recordsRequest = resourceEndpoint
          ? fetch(resourceEndpoint, { cache: 'no-store' })
          : Promise.resolve(null)

        const [dashboardResponse, recordsResponse] = await Promise.all([dashboardRequest, recordsRequest])

        if (!cancelled) {
          if (dashboardResponse.ok) {
            const dashboardPayload = await dashboardResponse.json()
            setDashboardData(dashboardPayload)
          } else {
            setDashboardData(null)
          }

          if (resourceEndpoint && recordsResponse) {
            if (recordsResponse.ok) {
              const recordsPayload = await recordsResponse.json()
              setRecords(normalizeRecords(recordsPayload))
            } else {
              setRecords([])
              setRecordsError('No se pudieron cargar los registros recientes.')
            }
          } else {
            setRecords(Array.isArray(recentItems) ? recentItems : [])
          }
        }
      } catch (error) {
        console.error(`Error loading module ${title}:`, error)

        if (!cancelled) {
          setDashboardData(null)
          if (resourceEndpoint) {
            setRecords([])
            setRecordsError('No se pudieron cargar los registros recientes.')
          } else {
            setRecords(Array.isArray(recentItems) ? recentItems : [])
          }
        }
      } finally {
        if (!cancelled) {
          setLoadingDashboard(false)
          setLoadingRecords(false)
        }
      }
    }

    loadData()

    return () => {
      cancelled = true
    }
  }, [recentItems, resourceEndpoint, title])

  const resolvedMetrics = useMemo(
    () =>
      metrics.map((metric) => ({
        ...metric,
        resolvedValue:
          typeof metric.value === 'function' ? metric.value(dashboardData) : metric.value,
      })),
    [dashboardData, metrics]
  )

  const resolvedRecords = useMemo(() => {
    if (typeof mapRecord !== 'function') {
      return records
    }

    return records
      .map((record) => mapRecord(record))
      .filter(Boolean)
  }, [mapRecord, records])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{title}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
        </div>

        {badgeLabel ? <Badge variant="secondary">{badgeLabel}</Badge> : null}
      </div>

      {resolvedMetrics.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {resolvedMetrics.map((metric) => (
            <Card key={metric.label}>
              <CardHeader className="pb-2">
                <CardDescription>{metric.label}</CardDescription>
                <CardTitle className="text-3xl">
                  {loadingDashboard ? '...' : formatMetricValue(metric.resolvedValue, metric.format)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 dark:text-gray-400">{metric.helpText}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{workflowTitle}</CardTitle>
            <CardDescription>Secuencia recomendada para operar este modulo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {workflow.map((step, index) => (
              <div
                key={`${step.title}-${index}`}
                className="rounded-lg border border-gray-200 p-4 dark:border-gray-800"
              >
                <div className="mb-1 flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                    Paso {index + 1}
                  </span>
                  {step.badge ? <Badge variant="secondary">{step.badge}</Badge> : null}
                </div>
                <p className="font-medium text-gray-900 dark:text-white">{step.title}</p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{step.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{highlightsTitle}</CardTitle>
            <CardDescription>Referencias utiles para trabajar con este espacio.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {highlights.map((item) => (
              <div
                key={item.title}
                className="rounded-lg border border-dashed border-gray-200 p-4 dark:border-gray-800"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-gray-900 dark:text-white">{item.title}</p>
                  {item.badge ? <Badge variant={getStatusVariant(item.badge)}>{item.badge}</Badge> : null}
                </div>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{recordsTitle}</CardTitle>
          <CardDescription>{recordsDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingRecords ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Cargando actividad...</p>
          ) : recordsError ? (
            <p className="text-sm text-red-500">{recordsError}</p>
          ) : resolvedRecords.length > 0 ? (
            <div className="space-y-3">
              {resolvedRecords.map((item, index) => (
                <div
                  key={`${item.title}-${index}`}
                  className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4 dark:border-gray-800 md:flex-row md:items-start md:justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 dark:text-white">{item.title}</p>
                      {item.badge ? (
                        <Badge variant={getStatusVariant(item.badge)}>{item.badge}</Badge>
                      ) : null}
                    </div>
                    {item.subtitle ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">{item.subtitle}</p>
                    ) : null}
                  </div>

                  <div className="text-sm text-gray-500 dark:text-gray-400 md:text-right">
                    {item.meta ? <div>{item.meta}</div> : null}
                    {item.secondaryMeta ? <div>{item.secondaryMeta}</div> : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-200 p-6 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
              {emptyMessage}
            </div>
          )}
        </CardContent>
      </Card>

      {children}
    </div>
  )
}
