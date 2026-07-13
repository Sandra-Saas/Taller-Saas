'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, Copy, Edit, Trash2 } from 'lucide-react';

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWebhooks = async () => {
      try {
        const res = await fetch('/api/v1/webhooks');
        const data = await res.json();
        setWebhooks(data || []);
      } catch (err) {
        console.error('Error fetching webhooks:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchWebhooks();
  }, []);

  const handleCreate = async () => {
    const name = prompt('Nombre del Webhook');
    if (!name) return;
    const url = prompt('URL del Webhook (HTTPS obligatorio)');
    if (!url) return;
    const eventsString = prompt('Eventos separados por comas (ej: client.created,vehicle.created)');
    const events = eventsString ? eventsString.split(',').map(e => e.trim()) : [];

    try {
      const res = await fetch('/api/v1/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, url, events })
      });
      const newWebhook = await res.json();
      if (newWebhook) {
        alert('Webhook creado! Asegúrate de guardar el secret!');
        setWebhooks([newWebhook, ...webhooks]);
      }
    } catch (err) {
      console.error('Error creating webhook:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Webhooks</h1>
          <p className="text-gray-500">Configura tus endpoints para recibir eventos en tiempo real</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Webhook
        </Button>
      </div>

      {loading ? (
        <div className="text-gray-500">Cargando...</div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Webhooks</CardTitle>
          </CardHeader>
          <CardContent>
            {webhooks.length === 0 ? (
              <p className="text-gray-500">No hay webhooks creados</p>
            ) : (
              <div className="space-y-3">
                {webhooks.map((wh) => (
                  <div key={wh.id} className="border border-gray-200 dark:border-gray-800 p-4 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{wh.name}</h4>
                        <p className="text-gray-500 text-sm">{wh.url}</p>
                        <div className="flex gap-2 flex-wrap mt-2">
                          {wh.events.map((ev, idx) => (
                            <span key={idx} className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-xs rounded-full">
                              {ev}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(wh.secret)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-2 items-center mt-2 text-xs text-gray-500">
                      <span>Último envío: {new Date(wh.updatedAt).toLocaleString()}</span>
                      <span>Estado: {wh.isActive ? 'Activo' : 'Inactivo'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
