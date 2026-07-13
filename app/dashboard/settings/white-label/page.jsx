'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';

export default function WhiteLabelPage() {
  const [config, setConfig] = useState({
    brandName: 'Taller SaaS',
    primaryColor: '#6366f1',
    secondaryColor: '#8b5cf6',
    logoUrl: '',
    faviconUrl: '',
    customDomain: '',
    customLoginText: '',
    customEmailFrom: '',
    isActive: true
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    // TODO: Save config
    alert('Configuración guardada correctamente!');
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
              <Label>Logo (URL)</Label>
              <Input
                value={config.logoUrl}
                onChange={(e) => setConfig({ ...config, logoUrl: e.target.value })}
                placeholder="https://ejemplo.com/logo.png"
              />
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
