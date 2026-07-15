'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, Copy, Edit, Trash2 } from 'lucide-react';

export default function APIKeysPage() {
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKeys = async () => {
      fetch('/api/v1/api-keys')
        .then(r => r.json())
        .then(d => setApiKeys(d || []))
        .catch(console.error)
        .finally(() => setLoading(false));
    };
    fetchKeys();
  }, []);

  const handleCreate = async () => {
    const name = prompt('Nombre de la API Key');
    if (!name) return;
    try {
      const res = await fetch('/api/v1/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      const newKey = await res.json();
      if (newKey) {
        alert('API Key creada! Asegúrate de guardarla porque no la podrás ver de nuevo!\n\n' + newKey.key);
        setApiKeys([newKey, ...apiKeys]);
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">API Keys</h1>
          <p className="text-gray-500">Gestiona tus credenciales de API Premium</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva API Key
        </Button>
      </div>

      {loading ? (
        <div className="text-gray-500">Cargando...</div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>API Keys</CardTitle>
          </CardHeader>
          <CardContent>
            {apiKeys.length === 0 ? (
              <p className="text-gray-500">No hay API Keys creadas</p>
            ) : (
              <div className="space-y-3">
                {apiKeys.map((key) => (
                  <div key={key.id} className="flex justify-between items-center border border-gray-200 dark:border-gray-800 p-3 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div>
                        <h4 className="font-medium">{key.name}</h4>
                        <p className="text-gray-500 text-sm">{key.key}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(key.key)}>
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
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
