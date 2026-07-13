'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, Edit, Trash2, Zap } from 'lucide-react';

export default function AutomationsPage() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRules = async () => {
      try {
        const res = await fetch('/api/automations/rules');
        const data = await res.json();
        setRules(data || []);
      } catch (error) {
        console.error('Error fetching rules:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRules();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Automatizaciones</h1>
          <p className="text-gray-500">Crea reglas para automatizar procesos del taller</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Regla
        </Button>
      </div>

      {loading ? (
        <div className="text-gray-500">Cargando...</div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {rules.map((rule) => (
            <Card key={rule.id}>
              <CardHeader className="pb-2 flex flex-row justify-between items-start">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-indigo-600" />
                  <CardTitle className="text-lg">{rule.name}</CardTitle>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500 text-sm">
                  Trigger: {rule.trigger}
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  Estado: {rule.isActive ? 'Activa' : 'Inactiva'}
                </p>
              </CardContent>
            </Card>
          ))}
          {rules.length === 0 && (
            <Card className="md:col-span-2 lg:col-span-3">
              <CardContent className="p-8 text-center">
                <Zap className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">No hay reglas de automatización creadas</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
