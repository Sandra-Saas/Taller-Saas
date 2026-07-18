'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Textarea'

const providers = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'google', label: 'Google Gemini' },
  { value: 'groq', label: 'Groq' },
  { value: 'ollama', label: 'Ollama (Local)' },
  { value: 'deepseek', label: 'DeepSeek' },
  { value: 'openrouter', label: 'OpenRouter' },
]

const modelsByProvider = {
  openai: ['gpt-4o', 'gpt-4.1-mini', 'gpt-3.5-turbo'],
  anthropic: ['claude-3-5-sonnet', 'claude-3-opus', 'claude-3-haiku'],
  google: ['gemini-1.5-pro', 'gemini-1.5-flash'],
  groq: ['llama-3.1-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
  ollama: ['llama3', 'mistral', 'gemma'],
  deepseek: ['deepseek-chat', 'deepseek-coder'],
  openrouter: ['openai/gpt-4o', 'anthropic/claude-3-5-sonnet', 'google/gemini-1.5-pro-latest'],
}

const initialSettings = {
  provider: 'openai',
  model: 'gpt-4o',
  temperature: 0.7,
  maxTokens: 1000,
  language: 'es',
  apiKey: '',
  personality: '',
  systemPrompt: '',
  dailyLimit: 0,
  monthlyLimit: 0,
  costPer1kInput: 0,
  costPer1kOutput: 0,
  isActive: true,
}

export default function AISettingsPage() {
  const [settings, setSettings] = useState(initialSettings)
  const [usage, setUsage] = useState(null)
  const [hasApiKey, setHasApiKey] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const currentModels = useMemo(
    () => modelsByProvider[settings.provider] || modelsByProvider.openai,
    [settings.provider]
  )

  useEffect(() => {
    let active = true

    async function loadSettings() {
      try {
        setLoading(true)
        setError('')

        const res = await fetch('/api/ai/settings', { cache: 'no-store' })
        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.error || 'No se pudo cargar la configuración de IA.')
        }

        if (!active) {
          return
        }

        setSettings({
          ...initialSettings,
          ...data.settings,
          apiKey: '',
        })
        setHasApiKey(Boolean(data.settings?.hasApiKey))
        setUsage(data.usage || null)
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

    loadSettings()

    return () => {
      active = false
    }
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()

    try {
      setSaving(true)
      setMessage('')
      setError('')

      const res = await fetch('/api/ai/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'No se pudo guardar la configuración de IA.')
      }

      setSettings((prev) => ({
        ...prev,
        ...data.settings,
        apiKey: '',
      }))
      setHasApiKey(Boolean(data.settings?.hasApiKey))
      setUsage(data.usage || null)
      setMessage(data.message || 'Configuración guardada correctamente.')
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-sm text-gray-500">Cargando configuración de IA...</div>
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">Configuración de IA</h1>
        <p className="text-sm text-gray-600">
          Definí proveedor, límites, costos y comportamiento del Copilot por empresa.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Consultas hoy</CardDescription>
            <CardTitle className="text-3xl">{usage?.todayQueries || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Tokens hoy</CardDescription>
            <CardTitle className="text-3xl">{(usage?.todayTokens || 0).toLocaleString('es-AR')}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Consultas mes</CardDescription>
            <CardTitle className="text-3xl">{usage?.monthQueries || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Costo estimado mes</CardDescription>
            <CardTitle className="text-3xl">
              USD {(usage?.estimatedMonthlyCost || 0).toLocaleString('es-AR')}
            </CardTitle>
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

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Proveedor y acceso</CardTitle>
            <CardDescription>
              Configurá el motor principal del asistente y sus credenciales.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Proveedor</Label>
                <Select
                  value={settings.provider}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      provider: e.target.value,
                      model: modelsByProvider[e.target.value]?.[0] || '',
                    }))
                  }
                >
                  {providers.map((provider) => (
                    <option key={provider.value} value={provider.value}>
                      {provider.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Modelo</Label>
                <Select
                  value={settings.model}
                  onChange={(e) => setSettings((prev) => ({ ...prev, model: e.target.value }))}
                >
                  {currentModels.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>API Key</Label>
              <Input
                type="password"
                value={settings.apiKey}
                onChange={(e) => setSettings((prev) => ({ ...prev, apiKey: e.target.value }))}
                placeholder={hasApiKey ? 'Dejá vacío para conservar la API Key actual' : 'Ingresá tu API Key'}
              />
              <p className="text-xs text-gray-500">
                {hasApiKey
                  ? 'Ya existe una API Key guardada. Solo escribí una nueva si querés reemplazarla.'
                  : 'Se guarda por tenant y habilita el uso del proveedor configurado.'}
              </p>
            </div>

            <label className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={settings.isActive}
                onChange={(e) => setSettings((prev) => ({ ...prev, isActive: e.target.checked }))}
              />
              IA activa para este tenant
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Comportamiento</CardTitle>
            <CardDescription>
              Ajustá el tono del asistente y el prompt base operativo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Temperatura</Label>
                <Input
                  type="number"
                  min="0"
                  max="2"
                  step="0.1"
                  value={settings.temperature}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, temperature: Number(e.target.value) }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Tokens máximos</Label>
                <Input
                  type="number"
                  min="128"
                  step="1"
                  value={settings.maxTokens}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, maxTokens: Number(e.target.value) }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Idioma</Label>
                <Select
                  value={settings.language}
                  onChange={(e) => setSettings((prev) => ({ ...prev, language: e.target.value }))}
                >
                  <option value="es">Español</option>
                  <option value="en">Inglés</option>
                  <option value="pt">Portugués</option>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Personalidad</Label>
              <Textarea
                value={settings.personality}
                onChange={(e) => setSettings((prev) => ({ ...prev, personality: e.target.value }))}
                placeholder="Ejemplo: asesor ejecutivo, preciso, comercial, orientado a operación de taller."
              />
            </div>

            <div className="space-y-2">
              <Label>Prompt del sistema</Label>
              <Textarea
                className="min-h-[140px]"
                value={settings.systemPrompt}
                onChange={(e) => setSettings((prev) => ({ ...prev, systemPrompt: e.target.value }))}
                placeholder="Indicaciones base para el Copilot: políticas internas, tono, prioridades, restricciones, etc."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Límites y costos</CardTitle>
            <CardDescription>
              Controlá presupuesto y consumo estimado por cada mil tokens.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="space-y-2">
                <Label>Límite diario</Label>
                <Input
                  type="number"
                  min="0"
                  value={settings.dailyLimit}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, dailyLimit: Number(e.target.value) }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Límite mensual</Label>
                <Input
                  type="number"
                  min="0"
                  value={settings.monthlyLimit}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, monthlyLimit: Number(e.target.value) }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Costo input / 1K</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.0001"
                  value={settings.costPer1kInput}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, costPer1kInput: Number(e.target.value) }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Costo output / 1K</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.0001"
                  value={settings.costPer1kOutput}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, costPer1kOutput: Number(e.target.value) }))
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar configuración'}
          </Button>
        </div>
      </form>
    </div>
  )
}
