'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Plus, Bell, Clock } from 'lucide-react'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/super-admin/notifications')
        const data = await res.json()
        setNotifications(data)
      } catch (error) {
        console.error('Error fetching notifications:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchNotifications()
  }, [])

  const getTypeColor = (type) => {
    switch (type) {
      case 'info': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      case 'success': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      case 'warning': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'error': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Notificaciones</h1>
          <p className="text-gray-500 dark:text-gray-400">Envío de notificaciones globales</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Notificación
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notificaciones Enviadas</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-gray-500">Cargando...</p>
          ) : notifications.length === 0 ? (
            <p className="text-sm text-gray-500">No hay notificaciones enviadas aún.</p>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div key={notification.id} className="flex items-start gap-4 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-full">
                    <Bell className="h-4 w-4 text-indigo-700 dark:text-indigo-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900 dark:text-white">{notification.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs ${getTypeColor(notification.type)}`}>
                        {notification.type.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{notification.message}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      {new Date(notification.createdAt).toLocaleString()}
                      {notification.sentAt && (
                        <span> • Enviado</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
