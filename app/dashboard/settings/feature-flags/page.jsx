'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Select } from '@/components/ui/Select'
import { Switch } from '@/components/ui/Switch'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/contexts/AuthContext'

const environmentOptions = [
  { value: '', label: 'Todos' },
  { value: 'development', label: 'Development' },
  { value: 'preview', label: 'Preview' },
  { value: 'production', label: 'Production' },
]

function createEmptyOverride(type, userId = '') {
  return {
    userId,
    isActive: true,
    value: type === 'boolean' ? true : type === 'number' ? 0 : '',
    conditions: {
      plan: '',
      environment: '',
    },
    note: '',
  }
}

function normalizeValue(type, value) {
  if (type === 'number') {
    return Number(value || 0)
  }

  if (type === 'boolean') {
    return Boolean(value)
  }

  return String(value ?? '')
}

function ValueField({ type, value, onChange }) {
  if (type === 'boolean') {
    return (
      <div className="flex items-center gap-3">
        <Switch checked={Boolean(value)} onCheckedChange={onChange} />
        <span className="text-sm text-gray-600">{Boolean(value) ? 'Activo' : 'Inactivo'}</span>
      </div>
    )
  }

  return (
    <Input
      type={type === 'number' ? 'number' : 'text'}
      value={value}
      onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
    />
  )
}

export default function FeatureFlagsPage() {
  const { tenant } = useAuth()
  const [flags, setFlags] = useState([])
  const [users, setUsers] = useState([])
  const [environment, setEnvironment] = useState('development')
  const [loading, setLoading] = useState(true)
  const [savingFlagId, setSavingFlagId] = useState('')
  const [creating, setCreating] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [newFlag, setNewFlag] = useState({
    key: '',
    name: '',
    description: '',
    type: 'boolean',
    defaultValue: true,
  })

  const activeFlagsCount = useMemo(
    () => flags.filter((flag) => Boolean(flag.effectiveValue)).length,
    [flags]
  )

  const overridesCount = useMemo(
    () =>
      flags.reduce((sum, flag) => {
        return sum + (flag.tenantOverride ? 1 : 0) + (flag.userOverrides?.length || 0)
      }, 0),
    [flags]
  )

  useEffect(() => {
    let active = true

    async function loadFlags() {
      try {
        setLoading(true)
        setError('')

        const response = await fetch('/api/v1/feature-flags', { cache: 'no-store' })
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'No se pudieron cargar los feature flags.')
        }

        if (!active) {
          return
        }

        setFlags(data.flags || [])
        setUsers(data.users || [])
        setEnvironment(data.environment || 'development')
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

    loadFlags()

    return () => {
      active = false
    }
  }, [])

  const updateFlag = (flagId, updater) => {
    setFlags((currentFlags) =>
      currentFlags.map((flag) => (flag.id === flagId ? updater(flag) : flag))
    )
  }

  const handleCreateFlag = async (e) => {
    e.preventDefault()

    try {
      setCreating(true)
      setError('')
      setMessage('')

      const response = await fetch('/api/v1/feature-flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newFlag,
          defaultValue: normalizeValue(newFlag.type, newFlag.defaultValue),
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'No se pudo crear el feature flag.')
      }

      setFlags(data.flags || [])
      setUsers(data.users || [])
      setEnvironment(data.environment || environment)
      setMessage(data.message || 'Feature flag creado correctamente.')
      setNewFlag({
        key: '',
        name: '',
        description: '',
        type: 'boolean',
        defaultValue: true,
      })
    } catch (createError) {
      setError(createError.message)
    } finally {
      setCreating(false)
    }
  }

  const handleSaveFlag = async (flag) => {
    try {
      setSavingFlagId(flag.id)
      setError('')
      setMessage('')

      const response = await fetch('/api/v1/feature-flags', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flagId: flag.id,
          name: flag.name,
          description: flag.description,
          isPublic: flag.isPublic,
          defaultValue: normalizeValue(flag.type, flag.defaultValue),
          tenantOverride: flag.tenantOverride
            ? {
                ...flag.tenantOverride,
                value: normalizeValue(flag.type, flag.tenantOverride.value),
              }
            : null,
          userOverrides: (flag.userOverrides || []).map((entry) => ({
            ...entry,
            value: normalizeValue(flag.type, entry.value),
          })),
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'No se pudo actualizar el feature flag.')
      }

      setFlags(data.flags || [])
      setUsers(data.users || [])
      setEnvironment(data.environment || environment)
      setMessage(data.message || 'Feature flag actualizado correctamente.')
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSavingFlagId('')
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">Feature Flags</h1>
        <p className="text-sm text-gray-600">
          Activá funcionalidades por empresa, usuario, plan y ambiente sin tocar código.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Flags activos</CardDescription>
            <CardTitle className="text-3xl">{activeFlagsCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Overrides configurados</CardDescription>
            <CardTitle className="text-3xl">{overridesCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Plan actual</CardDescription>
            <CardTitle className="text-2xl">{tenant?.plan || 'trial'}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Ambiente</CardDescription>
            <CardTitle className="text-2xl">{environment}</CardTitle>
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

      <Card>
        <CardHeader>
          <CardTitle>Nuevo feature flag</CardTitle>
          <CardDescription>
            Creá flags reutilizables para activar o reservar bloques del producto.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateFlag} className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div className="space-y-2">
              <Label>Key</Label>
              <Input
                value={newFlag.key}
                onChange={(e) => setNewFlag((prev) => ({ ...prev, key: e.target.value }))}
                placeholder="mi_flag_enterprise"
              />
            </div>
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input
                value={newFlag.name}
                onChange={(e) => setNewFlag((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Nombre visible"
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={newFlag.type}
                onChange={(e) =>
                  setNewFlag((prev) => ({
                    ...prev,
                    type: e.target.value,
                    defaultValue: e.target.value === 'boolean' ? true : e.target.value === 'number' ? 0 : '',
                  }))
                }
              >
                <option value="boolean">Boolean</option>
                <option value="number">Number</option>
                <option value="string">String</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Valor por defecto</Label>
              <ValueField
                type={newFlag.type}
                value={newFlag.defaultValue}
                onChange={(value) => setNewFlag((prev) => ({ ...prev, defaultValue: value }))}
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={creating} className="w-full">
                {creating ? 'Creando...' : 'Crear flag'}
              </Button>
            </div>
            <div className="space-y-2 md:col-span-2 xl:col-span-5">
              <Label>Descripción</Label>
              <Input
                value={newFlag.description}
                onChange={(e) => setNewFlag((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Qué habilita este flag y dónde impacta"
              />
            </div>
          </form>
        </CardContent>
      </Card>

      {loading ? <div className="text-sm text-gray-500">Cargando feature flags...</div> : null}

      <div className="space-y-4">
        {flags.map((flag) => (
          <Card key={flag.id}>
            <CardHeader>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-lg">{flag.name}</CardTitle>
                    <Badge variant={flag.effectiveValue ? 'success' : 'secondary'}>
                      {flag.effectiveValue ? 'Activo' : 'Inactivo'}
                    </Badge>
                    <Badge variant="secondary">{flag.key}</Badge>
                    <Badge variant="secondary">Fuente: {flag.effectiveSource}</Badge>
                  </div>
                  <CardDescription>{flag.description || 'Sin descripción'}</CardDescription>
                </div>

                <Button
                  type="button"
                  onClick={() => handleSaveFlag(flag)}
                  disabled={savingFlagId === flag.id}
                >
                  {savingFlagId === flag.id ? 'Guardando...' : 'Guardar cambios'}
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="space-y-2">
                  <Label>Nombre</Label>
                  <Input
                    value={flag.name}
                    onChange={(e) =>
                      updateFlag(flag.id, (currentFlag) => ({
                        ...currentFlag,
                        name: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Valor por defecto</Label>
                  <ValueField
                    type={flag.type}
                    value={flag.defaultValue}
                    onChange={(value) =>
                      updateFlag(flag.id, (currentFlag) => ({
                        ...currentFlag,
                        defaultValue: value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Input
                    value={flag.description || ''}
                    onChange={(e) =>
                      updateFlag(flag.id, (currentFlag) => ({
                        ...currentFlag,
                        description: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Público</Label>
                  <div className="flex h-10 items-center">
                    <Switch
                      checked={flag.isPublic}
                      onCheckedChange={(checked) =>
                        updateFlag(flag.id, (currentFlag) => ({
                          ...currentFlag,
                          isPublic: checked,
                        }))
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">Override del tenant</h3>
                    <p className="text-sm text-gray-500">
                      Aplica a toda la empresa actual, con filtros opcionales por plan y ambiente.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      updateFlag(flag.id, (currentFlag) => ({
                        ...currentFlag,
                        tenantOverride: currentFlag.tenantOverride ? null : createEmptyOverride(currentFlag.type),
                      }))
                    }
                  >
                    {flag.tenantOverride ? 'Quitar override' : 'Agregar override'}
                  </Button>
                </div>

                {flag.tenantOverride ? (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                    <div className="space-y-2">
                      <Label>Activo</Label>
                      <div className="flex h-10 items-center">
                        <Switch
                          checked={flag.tenantOverride.isActive}
                          onCheckedChange={(checked) =>
                            updateFlag(flag.id, (currentFlag) => ({
                              ...currentFlag,
                              tenantOverride: {
                                ...currentFlag.tenantOverride,
                                isActive: checked,
                              },
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Valor</Label>
                      <ValueField
                        type={flag.type}
                        value={flag.tenantOverride.value}
                        onChange={(value) =>
                          updateFlag(flag.id, (currentFlag) => ({
                            ...currentFlag,
                            tenantOverride: {
                              ...currentFlag.tenantOverride,
                              value,
                            },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Plan</Label>
                      <Input
                        value={flag.tenantOverride.conditions?.plan || ''}
                        onChange={(e) =>
                          updateFlag(flag.id, (currentFlag) => ({
                            ...currentFlag,
                            tenantOverride: {
                              ...currentFlag.tenantOverride,
                              conditions: {
                                ...currentFlag.tenantOverride.conditions,
                                plan: e.target.value,
                              },
                            },
                          }))
                        }
                        placeholder="trial, premium, enterprise"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Ambiente</Label>
                      <Select
                        value={flag.tenantOverride.conditions?.environment || ''}
                        onChange={(e) =>
                          updateFlag(flag.id, (currentFlag) => ({
                            ...currentFlag,
                            tenantOverride: {
                              ...currentFlag.tenantOverride,
                              conditions: {
                                ...currentFlag.tenantOverride.conditions,
                                environment: e.target.value,
                              },
                            },
                          }))
                        }
                      >
                        {environmentOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Nota</Label>
                      <Input
                        value={flag.tenantOverride.note || ''}
                        onChange={(e) =>
                          updateFlag(flag.id, (currentFlag) => ({
                            ...currentFlag,
                            tenantOverride: {
                              ...currentFlag.tenantOverride,
                              note: e.target.value,
                            },
                          }))
                        }
                        placeholder="Contexto operativo"
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Sin override específico para esta empresa.</p>
                )}
              </div>

              <div className="rounded-2xl border border-gray-200 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">Overrides por usuario</h3>
                    <p className="text-sm text-gray-500">
                      Ajustes finos por usuario dentro del tenant actual.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      updateFlag(flag.id, (currentFlag) => {
                        const alreadyAssigned = new Set((currentFlag.userOverrides || []).map((entry) => entry.userId))
                        const nextUser = users.find((user) => !alreadyAssigned.has(user.id))
                        if (!nextUser) {
                          return currentFlag
                        }

                        return {
                          ...currentFlag,
                          userOverrides: [
                            ...(currentFlag.userOverrides || []),
                            createEmptyOverride(currentFlag.type, nextUser.id),
                          ],
                        }
                      })
                    }
                  >
                    Agregar usuario
                  </Button>
                </div>

                <div className="space-y-4">
                  {(flag.userOverrides || []).length === 0 ? (
                    <p className="text-sm text-gray-500">No hay overrides por usuario.</p>
                  ) : null}

                  {(flag.userOverrides || []).map((override, index) => (
                    <div key={`${override.userId || 'user'}-${index}`} className="grid gap-4 rounded-xl border border-gray-200 p-4 md:grid-cols-2 xl:grid-cols-6">
                      <div className="space-y-2">
                        <Label>Usuario</Label>
                        <Select
                          value={override.userId || ''}
                          onChange={(e) =>
                            updateFlag(flag.id, (currentFlag) => ({
                              ...currentFlag,
                              userOverrides: currentFlag.userOverrides.map((entry, entryIndex) =>
                                entryIndex === index ? { ...entry, userId: e.target.value } : entry
                              ),
                            }))
                          }
                        >
                          <option value="">Seleccionar usuario</option>
                          {users.map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.firstName} {user.lastName} · {user.email}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Activo</Label>
                        <div className="flex h-10 items-center">
                          <Switch
                            checked={override.isActive}
                            onCheckedChange={(checked) =>
                              updateFlag(flag.id, (currentFlag) => ({
                                ...currentFlag,
                                userOverrides: currentFlag.userOverrides.map((entry, entryIndex) =>
                                  entryIndex === index ? { ...entry, isActive: checked } : entry
                                ),
                              }))
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Valor</Label>
                        <ValueField
                          type={flag.type}
                          value={override.value}
                          onChange={(value) =>
                            updateFlag(flag.id, (currentFlag) => ({
                              ...currentFlag,
                              userOverrides: currentFlag.userOverrides.map((entry, entryIndex) =>
                                entryIndex === index ? { ...entry, value } : entry
                              ),
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Plan</Label>
                        <Input
                          value={override.conditions?.plan || ''}
                          onChange={(e) =>
                            updateFlag(flag.id, (currentFlag) => ({
                              ...currentFlag,
                              userOverrides: currentFlag.userOverrides.map((entry, entryIndex) =>
                                entryIndex === index
                                  ? {
                                      ...entry,
                                      conditions: {
                                        ...entry.conditions,
                                        plan: e.target.value,
                                      },
                                    }
                                  : entry
                              ),
                            }))
                          }
                          placeholder="Opcional"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Ambiente</Label>
                        <Select
                          value={override.conditions?.environment || ''}
                          onChange={(e) =>
                            updateFlag(flag.id, (currentFlag) => ({
                              ...currentFlag,
                              userOverrides: currentFlag.userOverrides.map((entry, entryIndex) =>
                                entryIndex === index
                                  ? {
                                      ...entry,
                                      conditions: {
                                        ...entry.conditions,
                                        environment: e.target.value,
                                      },
                                    }
                                  : entry
                              ),
                            }))
                          }
                        >
                          {environmentOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Acción</Label>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={() =>
                            updateFlag(flag.id, (currentFlag) => ({
                              ...currentFlag,
                              userOverrides: currentFlag.userOverrides.filter((_, entryIndex) => entryIndex !== index),
                            }))
                          }
                        >
                          Quitar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
