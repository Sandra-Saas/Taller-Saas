'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Save } from 'lucide-react'

export default function SettingsPage() {
  const [settings, setSettings] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/super-admin/settings')
        const data = await res.json()
        setSettings(data)
      } catch (error) {
        console.error('Error fetching settings:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [])

  const handleSave = async () => {
    // Handle save
  }

  const defaultSettings = [
    { key: 'default_iva', value: '21', type: 'number', description: 'IVA por defecto' },
    { key: 'trial_days', value: '14', type: 'number', description: 'Días de prueba' },
    { key: 'currency', value: 'ARS', type: 'string', description: 'Moneda por defecto' },
    { key: 'mercadopago_access_token', value: '', type: 'string', description: 'Token de acceso Mercado Pago' },
  ]

  const displaySettings = settings.length > 0 ? settings : defaultSettings

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Configuración Global</h1>
          <p className="text-gray-500 dark:text-gray-400">Configuración del SaaS</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Configuración General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <p className="text-sm text-gray-500">Cargando...</p>
            ) : (
              displaySettings.map((setting) => (
                <div key={setting.key} className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {setting.description}
                  </label>
                  <Input
                    type={setting.type === 'number' ? 'number' : 'text'}
                    value={setting.value}
                    onChange={(e) => {
                      setSettings((prev) =>
                        prev.map((s) =>
                          s.key === setting.key ? { ...s, value: e.target.value } : s
                        )
                      )
                    }}
                  />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Planes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">Espacio listo para administrar planes, limites y precios comerciales.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notificaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">Base preparada para centralizar email transaccional y mensajeria operativa.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
