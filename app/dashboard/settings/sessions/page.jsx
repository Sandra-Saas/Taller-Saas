'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/contexts/AuthContext'

function formatDate(value) {
  if (!value) {
    return 'No disponible'
  }

  return new Date(value).toLocaleString('es-AR')
}

export default function SessionsPage() {
  const { signOut } = useAuth()
  const [sessions, setSessions] = useState([])
  const [summary, setSummary] = useState({ total: 0, active: 0, currentSessionId: null })
  const [loading, setLoading] = useState(true)
  const [closingSessionId, setClosingSessionId] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const devicesCount = useMemo(() => {
    return new Set(
      sessions.map((session) => `${session.deviceInfo?.browser || 'Desconocido'}-${session.deviceInfo?.os || 'Desconocido'}`)
    ).size
  }, [sessions])

  useEffect(() => {
    let active = true

    async function loadSessions() {
      try {
        setLoading(true)
        setError('')

        const response = await fetch('/api/v1/sessions', { cache: 'no-store' })
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'No se pudieron cargar las sesiones.')
        }

        if (!active) {
          return
        }

        setSessions(data.sessions || [])
        setSummary(data.summary || { total: 0, active: 0, currentSessionId: null })
      } catch (loadError) {
        if (active) {
          setError(loadError.message)
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadSessions()

    return () => {
      active = false
    }
  }, [])

  const handleCloseSession = async (session) => {
    try {
      setClosingSessionId(session.id)
      setError('')
      setMessage('')

      const response = await fetch(`/api/v1/sessions/${session.id}`, {
        method: 'DELETE',
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'No se pudo cerrar la sesión seleccionada.')
      }

      if (session.isCurrent) {
        await signOut({ skipServerCleanup: true })
        return
      }

      setSessions((currentSessions) => currentSessions.filter((entry) => entry.id !== session.id))
      setSummary((currentSummary) => ({
        ...currentSummary,
        total: Math.max((currentSummary.total || 0) - 1, 0),
        active: Math.max((currentSummary.active || 0) - 1, 0),
      }))
      setMessage('Sesión cerrada correctamente.')
    } catch (closeError) {
      setError(closeError.message)
    } finally {
      setClosingSessionId('')
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">Sesiones activas</h1>
        <p className="text-sm text-gray-600">
          Administrá accesos vigentes, actividad reciente y cierre remoto por dispositivo.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total</CardDescription>
            <CardTitle className="text-3xl">{summary.total || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Activas</CardDescription>
            <CardTitle className="text-3xl">{summary.active || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Dispositivos</CardDescription>
            <CardTitle className="text-3xl">{devicesCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Sesión actual</CardDescription>
            <CardTitle className="text-2xl">{summary.currentSessionId ? 'Detectada' : 'Sin sincronizar'}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {message ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? <div className="text-sm text-gray-500">Cargando sesiones...</div> : null}

      <div className="space-y-4">
        {sessions.map((session) => (
          <Card key={session.id}>
            <CardHeader>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-lg">
                      {session.user
                        ? `${session.user.firstName} ${session.user.lastName}`
                        : 'Usuario no identificado'}
                    </CardTitle>
                    {session.isCurrent ? <Badge variant="success">Actual</Badge> : null}
                    <Badge variant="secondary">{session.deviceInfo?.browser || 'Browser'}</Badge>
                    <Badge variant="secondary">{session.deviceInfo?.os || 'OS'}</Badge>
                  </div>
                  <CardDescription>{session.user?.email || 'Sin email'}</CardDescription>
                </div>

                <Button
                  type="button"
                  variant={session.isCurrent ? 'destructive' : 'outline'}
                  disabled={closingSessionId === session.id}
                  onClick={() => handleCloseSession(session)}
                >
                  {closingSessionId === session.id
                    ? 'Cerrando...'
                    : session.isCurrent
                      ? 'Cerrar mi sesión'
                      : 'Cerrar remotamente'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div>
                <div className="text-xs uppercase tracking-wide text-gray-500">IP</div>
                <div className="mt-1 text-sm text-gray-900">{session.ipAddress || 'No disponible'}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-gray-500">Última actividad</div>
                <div className="mt-1 text-sm text-gray-900">{formatDate(session.lastActivityAt)}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-gray-500">Expira</div>
                <div className="mt-1 text-sm text-gray-900">{formatDate(session.expiresAt)}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-gray-500">Registrada</div>
                <div className="mt-1 text-sm text-gray-900">{formatDate(session.createdAt)}</div>
              </div>
            </CardContent>
          </Card>
        ))}

        {!loading && sessions.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-sm text-gray-500">
              No hay sesiones sincronizadas todavía. Se crearán automáticamente cuando exista actividad autenticada.
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  )
}
