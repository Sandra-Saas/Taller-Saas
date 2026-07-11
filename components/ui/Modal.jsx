'use client'

import { X } from 'lucide-react'
import { Button } from './Button'
import { cn } from '@/lib/utils'

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  className,
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className={cn(
        'relative z-50 w-full max-w-lg rounded-xl bg-white p-6 shadow-xl dark:bg-gray-950',
        className
      )}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="mb-6">{children}</div>
        {footer && <div className="flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  )
}
