'use client'

import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Send, ShieldCheck, Sparkles } from 'lucide-react'

function createMessage(role, content, extra = {}) {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
    ...extra,
  }
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState([
    createMessage(
      'system',
      'Copilot operativo listo. Puedo responder consultas del taller y proponer acciones con confirmación obligatoria.'
    ),
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [pendingProposal, setPendingProposal] = useState(null)
  const [snapshot, setSnapshot] = useState(null)
  const [aiSettings, setAiSettings] = useState(null)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, pendingProposal])

  useEffect(() => {
    let active = true

    async function loadSettingsSummary() {
      try {
        const res = await fetch('/api/ai/settings', { cache: 'no-store' })
        const data = await res.json()

        if (!res.ok || !active) {
          return
        }

        setAiSettings(data.settings || null)
      } catch {
        if (active) {
          setAiSettings(null)
        }
      }
    }

    loadSettingsSummary()

    return () => {
      active = false
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const query = inputValue.trim()

    if (!query || isLoading) {
      return
    }

    const userMessage = createMessage('user', query)
    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setError('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'No se pudo obtener una respuesta del Copilot.')
      }

      if (data.snapshot) {
        setSnapshot(data.snapshot)
      }

      setMessages((prev) => [
        ...prev,
        createMessage('assistant', data.response, {
          messageType: data.type,
          proposal: data.proposal || null,
        }),
      ])

      if (data.type === 'proposal' && data.proposal && data.proposal.missingFields?.length === 0) {
        setPendingProposal({
          query,
          proposal: data.proposal,
        })
      } else {
        setPendingProposal(null)
      }
    } catch (requestError) {
      setError(requestError.message)
      setMessages((prev) => [
        ...prev,
        createMessage('system', 'No pude completar la solicitud. Revisá el mensaje de error e intentá de nuevo.'),
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirm = async () => {
    if (!pendingProposal || isLoading) {
      return
    }

    try {
      setIsLoading(true)
      setError('')

      const res = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: pendingProposal.query,
          confirm: true,
          proposal: pendingProposal.proposal,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'No se pudo ejecutar la acción solicitada.')
      }

      if (data.snapshot) {
        setSnapshot(data.snapshot)
      }

      setMessages((prev) => [
        ...prev,
        createMessage('assistant', data.response, {
          messageType: data.type,
        }),
      ])
      setPendingProposal(null)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelProposal = () => {
    if (!pendingProposal) {
      return
    }

    setMessages((prev) => [
      ...prev,
      createMessage('system', 'Acción cancelada. Podés ajustar la instrucción y volver a intentarlo.'),
    ])
    setPendingProposal(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-gray-900">Copilot IA</h1>
        <p className="text-sm text-gray-600">
          Consultá operación, pedí acciones y confirmá antes de ejecutar cambios reales.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="flex min-h-[calc(100vh-12rem)] flex-col overflow-hidden">
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : message.role === 'system'
                        ? 'border border-amber-200 bg-amber-50 text-amber-900'
                        : 'border border-gray-200 bg-white text-gray-900'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>

                  {message.messageType === 'proposal' && message.proposal ? (
                    <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-900">
                      <div className="font-semibold">{message.proposal.label}</div>
                      <div className="mt-1">{message.proposal.summary}</div>
                      {message.proposal.missingFields?.length ? (
                        <div className="mt-2">
                          Faltan datos: {message.proposal.missingFields.join(', ')}.
                        </div>
                      ) : (
                        <div className="mt-2 flex items-center gap-2 font-medium">
                          <ShieldCheck className="h-4 w-4" />
                          Confirmación obligatoria antes de ejecutar.
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}

            {isLoading ? (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500 shadow-sm">
                  Procesando solicitud...
                </div>
              </div>
            ) : null}

            <div ref={messagesEndRef} />
          </div>

          {pendingProposal ? (
            <div className="border-t border-blue-100 bg-blue-50 px-4 py-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-blue-900">
                    <Sparkles className="h-4 w-4" />
                    Acción pendiente de confirmación
                  </div>
                  <p className="mt-1 text-sm text-blue-800">
                    {pendingProposal.proposal.label}: {pendingProposal.proposal.summary}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={handleCancelProposal} disabled={isLoading}>
                    Cancelar
                  </Button>
                  <Button type="button" onClick={handleConfirm} disabled={isLoading}>
                    Confirmar y ejecutar
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          <div className="border-t border-gray-200 p-4">
            {error ? (
              <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder='Ejemplo: crear cliente "Juan Perez" o mostrar inventario crítico'
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading}>
                <Send className="mr-2 h-4 w-4" />
                Enviar
              </Button>
            </form>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Estado IA</CardTitle>
              <CardDescription>Configuración activa del tenant</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-700">
              <div>Proveedor: {aiSettings?.provider || 'No configurado'}</div>
              <div>Modelo: {aiSettings?.model || 'Sin definir'}</div>
              <div>Idioma: {aiSettings?.language || 'es'}</div>
              <div>Protección: confirmación obligatoria</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Snapshot operativo</CardTitle>
              <CardDescription>Resumen rápido del taller</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-gray-50 p-3">
                <div className="text-gray-500">Clientes</div>
                <div className="mt-1 text-xl font-semibold text-gray-900">{snapshot?.clients ?? '-'}</div>
              </div>
              <div className="rounded-xl bg-gray-50 p-3">
                <div className="text-gray-500">Vehículos</div>
                <div className="mt-1 text-xl font-semibold text-gray-900">{snapshot?.vehicles ?? '-'}</div>
              </div>
              <div className="rounded-xl bg-gray-50 p-3">
                <div className="text-gray-500">Turnos</div>
                <div className="mt-1 text-xl font-semibold text-gray-900">{snapshot?.scheduledTurns ?? '-'}</div>
              </div>
              <div className="rounded-xl bg-gray-50 p-3">
                <div className="text-gray-500">OT abiertas</div>
                <div className="mt-1 text-xl font-semibold text-gray-900">{snapshot?.openWorkOrders ?? '-'}</div>
              </div>
              <div className="rounded-xl bg-gray-50 p-3">
                <div className="text-gray-500">Stock sensible</div>
                <div className="mt-1 text-xl font-semibold text-gray-900">{snapshot?.lowStockItems ?? '-'}</div>
              </div>
              <div className="rounded-xl bg-gray-50 p-3">
                <div className="text-gray-500">Caja pendiente</div>
                <div className="mt-1 text-xl font-semibold text-gray-900">
                  {typeof snapshot?.pendingCash === 'number'
                    ? `ARS ${snapshot.pendingCash.toLocaleString('es-AR')}`
                    : '-'}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Acciones soportadas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-700">
              <div>Crear clientes</div>
              <div>Registrar vehículos</div>
              <div>Agendar turnos</div>
              <div>Crear órdenes de trabajo</div>
              <div>Generar presupuestos</div>
              <div>Actualizar estado de OT</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
