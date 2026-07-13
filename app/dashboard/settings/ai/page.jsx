'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Label } from '@/components/ui/Label';

export default function AISettingsPage() {
  const [settings, setSettings] = useState({
    provider: 'openai',
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 1000,
    language: 'es',
    apiKey: '',
    personality: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // TODO: Fetch existing AI settings
    setLoading(false);
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    // TODO: Save settings to API
    setTimeout(() => {
      setSaving(false);
      alert('Configuración guardada correctamente');
    }, 1000);
  };

  const providers = [
    { value: 'openai', label: 'OpenAI' },
    { value: 'anthropic', label: 'Anthropic' },
    { value: 'google', label: 'Google Gemini' },
    { value: 'groq', label: 'Groq' },
    { value: 'ollama', label: 'Ollama (Local)' },
    { value: 'deepseek', label: 'DeepSeek' },
    { value: 'openrouter', label: 'OpenRouter' },
  ];

  const models = {
    openai: ['gpt-4o', 'gpt-4', 'gpt-3.5-turbo'],
    anthropic: ['claude-3-5-sonnet', 'claude-3-opus', 'claude-3-haiku'],
    google: ['gemini-1.5-pro', 'gemini-1.5-flash'],
    groq: ['llama-3.1-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
    ollama: ['llama3', 'mistral', 'gemma'],
    deepseek: ['deepseek-chat', 'deepseek-coder'],
    openrouter: ['openai/gpt-4o', 'anthropic/claude-3-5-sonnet', 'google/gemini-1.5-pro-latest'],
  };

  if (loading) {
    return <div className="text-gray-500">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Configuración de IA</h1>

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Proveedor de IA</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Proveedor</Label>
                <Select
                  value={settings.provider}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      provider: e.target.value,
                      model: models[e.target.value][0],
                    }))
                  }
                >
                  {providers.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Modelo</Label>
                <Select
                  value={settings.model}
                  onChange={(e) => setSettings((prev) => ({ ...prev, model: e.target.value }))}
                >
                  {models[settings.provider].map((m) => (
                    <option key={m} value={m}>{m}</option>
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
                placeholder="Ingresa tu API Key"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Parámetros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Temperatura</Label>
                <Input
                  type="number"
                  min="0"
                  max="2"
                  step="0.1"
                  value={settings.temperature}
                  onChange={(e) => setSettings((prev) => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Tokens máximos</Label>
                <Input
                  type="number"
                  value={settings.maxTokens}
                  onChange={(e) => setSettings((prev) => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
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
              <Label>Personalidad (opcional)</Label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-4 py-2 min-h-[100px]"
                value={settings.personality}
                onChange={(e) => setSettings((prev) => ({ ...prev, personality: e.target.value }))}
                placeholder="Describe cómo debe ser la personalidad del asistente"
              />
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
  );
}
