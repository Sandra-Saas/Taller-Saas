'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';

const defaultConfig = {
  brandName: 'Taller SaaS',
  primaryColor: '#6366f1',
  secondaryColor: '#8b5cf6',
  logoUrl: '',
  faviconUrl: '',
  customDomain: '',
  customLoginText: '',
  customEmailFrom: '',
  isActive: true
};

export default function WhiteLabelPage() {
  const [config, setConfig] = useState(defaultConfig);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const storedConfig = window.localStorage.getItem('white-label-config');
      if (storedConfig) {
        const parsedConfig = JSON.parse(storedConfig);
        setConfig((prev) => ({ ...prev, ...parsedConfig }));
      }
    } catch (error) {
      console.error('No se pudo leer la configuración guardada', error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('white-label-config', JSON.stringify(config));
  }, [config]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('white-label-config', JSON.stringify(config));
      window.dispatchEvent(new Event('white-label-config-updated'));
    }
    alert('Configuración guardada correctamente!');
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const nextValue = typeof dataUrl === 'string' ? dataUrl : '';

      setConfig((prev) => ({ ...prev, logoUrl: nextValue }));

      if (typeof window !== 'undefined') {
        window.localStorage.setItem('white-label-logo', nextValue);
        window.localStorage.setItem('white-label-logo-url', nextValue);
        window.dispatchEvent(new Event('white-label-config-updated'));
      }
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">White Label</h1>
      <p className="text-gray-500">Personaliza la apariencia y marca del sistema</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Marca</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label>Nombre de Marca</Label>
              <Input
                value={config.brandName}
                onChange={(e) => setConfig({ ...config, brandName: e.target.value })}
                placeholder="Nombre de tu empresa"
              />
            </div>
            <div>
              <Label>Color Primario</Label>
              <Input
                type="color"
                value={config.primaryColor}
                onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
              />
            </div>
            <div>
              <Label>Color Secundario</Label>
              <Input
                type="color"
                value={config.secondaryColor}
                onChange={(e) => setConfig({ ...config, secondaryColor: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Archivos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Logo</Label>
              <Input
                value={config.logoUrl}
                onChange={(e) => {
                  const nextValue = e.target.value;
                  setConfig((prev) => ({ ...prev, logoUrl: nextValue }));

                  if (typeof window !== 'undefined') {
                    window.localStorage.setItem('white-label-logo-url', nextValue);
                    window.localStorage.setItem('white-label-logo', nextValue);
                    window.dispatchEvent(new Event('white-label-config-updated'));
                  }
                }}
                placeholder="https://ejemplo.com/logo.png"
              />
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="mt-3 block w-full text-sm text-slate-300 file:mr-4 file:rounded-full file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-500"
              />
              <p className="mt-2 text-xs text-slate-400">Puedes subir un archivo o pegar una URL.</p>
              {config.logoUrl && (
                <div className="mt-4 rounded-lg border border-slate-700 bg-slate-900/60 p-3">
                  <p className="mb-2 text-sm text-slate-300">Vista previa</p>
                  <img src={config.logoUrl} alt="Vista previa del logo" className="max-h-24 w-auto object-contain" />
                </div>
              )}
            </div>
            <div>
              <Label>Favicon (URL)</Label>
              <Input
                value={config.faviconUrl}
                onChange={(e) => setConfig({ ...config, faviconUrl: e.target.value })}
                placeholder="https://ejemplo.com/favicon.ico"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dominios y Correos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Dominio Personalizado</Label>
              <Input
                value={config.customDomain}
                onChange={(e) => setConfig({ ...config, customDomain: e.target.value })}
                placeholder="app.miempresa.com"
              />
            </div>
            <div>
              <Label>Texto Personalizado de Login</Label>
              <Input
                value={config.customLoginText}
                onChange={(e) => setConfig({ ...config, customLoginText: e.target.value })}
                placeholder="Bienvenido a Mi Empresa"
              />
            </div>
            <div>
              <Label>Remitente de Correos</Label>
              <Input
                value={config.customEmailFrom}
                onChange={(e) => setConfig({ ...config, customEmailFrom: e.target.value })}
                placeholder="hola@miempresa.com"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit">Guardar Configuración</Button>
        </div>
      </form>
    </div>
  );
}
