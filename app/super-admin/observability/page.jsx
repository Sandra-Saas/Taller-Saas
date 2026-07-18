'use client'

import { useEffect, useMemo, useState } from 'react'
import { Activity, AlertTriangle, Brain, Database, Globe, HardDrive, Mail, Search, Server, ShieldCheck, Smartphone, Webhook } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'

function statusClasses(status) {
  switch (status) {
    case 'healthy':
      return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
    case 'warning':
      return 'bg-amber-500/10 text-amber-300 border-amber-500/20'
    case 'critical':
      return 'bg-red-500/10 text-red-300 border-red-500/20'
    default:
      return 'bg-slate-500/10 text-slate-300 border-slate-500/20'
  }
}

function sourceClasses(source) {
  switch (source) {
    case 'audit':
      return 'bg-blue-500/10 text-blue-300'
    case 'webhooks':
      return 'bg-violet-500/10 text-violet-300'
    case 'ai':
      return 'bg-fuchsia-500/10 text-fuchsia-300'
    case 'payments':
      return 'bg-emerald-500/10 text-emerald-300'
    case 'notifications':
      return 'bg-amber-500/10 text-amber-300'
    case 'sessions':
      return 'bg-sky-500/10 text-sky-300'
    default:
      return 'bg-slate-500/10 text-slate-300'
  }
}

const serviceIcons = {
  server: Server,
  database: Database,
  supabase: Globe,
  storage: HardDrive,
  ai: Brain,
  whatsapp: Smartphone,
  mercadopago: ShieldCheck,
  email: Mail,
}

export default function ObservabilityPage() {
  const [snapshot, setSnapshot] = useState(null)
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [source, setSource] = useState('all')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [snapshotRes, logsRes] = await Promise.all([
          fetch('/api/super-admin/observability'),
          fetch(`/api/super-admin/logs?source=${encodeURIComponent(source)}&search=${encodeURIComponent(search)}&limit=40`),
        ])

        const snapshotData = await snapshotRes.json()
        const logsData = await logsRes.json()

        setSnapshot(snapshotData)
        setLogs(Array.isArray(logsData) ? logsData : [])
      } catch (error) {
        console.error('Error fetching observability:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [search, source])

  const serviceEntries = useMemo(() => Object.entries(snapshot?.services || {}), [snapshot])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Observabilidad</h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          Estado del sistema, integraciones, métricas operativas y logs centralizados.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Tiempo de respuesta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{snapshot?.system?.responseTimeMs ?? 0} ms</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Latencia DB</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{snapshot?.system?.database?.latencyMs ?? 0} ms</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Heap usado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {snapshot?.system?.process?.memory?.heapUsed
                ? `${(snapshot.system.process.memory.heapUsed / 1024 / 1024).toFixed(1)} MB`
                : '0 MB'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Ingresos del mes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              ARS {snapshot?.metrics?.subscriptions?.monthlyRevenue?.toLocaleString?.('es-AR') || '0'}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Estado de servicios</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {serviceEntries.map(([key, service]) => {
              const Icon = serviceIcons[key] || Activity
              return (
                <div key={key} className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-slate-100 p-2 dark:bg-slate-900">
                        <Icon className="h-4 w-4 text-slate-700 dark:text-slate-300" />
                      </div>
                      <div>
                        <p className="font-medium capitalize text-gray-900 dark:text-white">{key}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{service.detail}</p>
                      </div>
                    </div>
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusClasses(service.status)}`}>
                      {service.status}
                    </span>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Métricas globales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Empresas activas</span>
              <span className="font-semibold text-gray-900 dark:text-white">{snapshot?.metrics?.tenants?.active ?? 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Empresas suspendidas</span>
              <span className="font-semibold text-gray-900 dark:text-white">{snapshot?.metrics?.tenants?.suspended ?? 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Suscripciones activas</span>
              <span className="font-semibold text-gray-900 dark:text-white">{snapshot?.metrics?.subscriptions?.active ?? 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Consultas IA 24h</span>
              <span className="font-semibold text-gray-900 dark:text-white">{snapshot?.metrics?.usage?.aiQueries24h ?? 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Sesiones activas 24h</span>
              <span className="font-semibold text-gray-900 dark:text-white">{snapshot?.metrics?.usage?.sessions24h ?? 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">API Keys activas</span>
              <span className="font-semibold text-gray-900 dark:text-white">{snapshot?.metrics?.usage?.apiKeysActive ?? 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">White Labels activos</span>
              <span className="font-semibold text-gray-900 dark:text-white">{snapshot?.metrics?.usage?.whiteLabelsActive ?? 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Webhooks pendientes</span>
              <span className="font-semibold text-gray-900 dark:text-white">{snapshot?.metrics?.reliability?.pendingWebhookLogs ?? 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Webhooks fallidos</span>
              <span className="font-semibold text-gray-900 dark:text-white">{snapshot?.metrics?.reliability?.failedWebhookLogs ?? 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Logs centralizados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr,220px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por acción, evento, mensaje o referencia" className="pl-9" />
            </div>
            <Select value={source} onChange={(e) => setSource(e.target.value)}>
              <option value="all">Todos los orígenes</option>
              <option value="audit">Auditoría</option>
              <option value="webhooks">Webhooks</option>
              <option value="ai">IA</option>
              <option value="payments">Pagos</option>
              <option value="notifications">Notificaciones</option>
              <option value="sessions">Sesiones</option>
            </Select>
          </div>

          {loading ? (
            <p className="text-sm text-gray-500">Cargando observabilidad...</p>
          ) : logs.length === 0 ? (
            <div className="flex items-center gap-2 rounded-xl border border-dashed border-gray-300 px-4 py-5 text-sm text-gray-500 dark:border-gray-700">
              <AlertTriangle className="h-4 w-4" />
              No se encontraron logs para los filtros actuales.
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${sourceClasses(log.source)}`}>{log.source}</span>
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusClasses(log.severity)}`}>{log.severity}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="mt-3 font-medium text-gray-900 dark:text-white">{log.title}</p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{log.message}</p>
                  {log.tenantId && (
                    <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">Tenant: {log.tenantId}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
