'use client'

import { useEffect } from 'react'
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
  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-6">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative z-50 w-full max-w-lg rounded-xl bg-white shadow-xl dark:bg-gray-950',
          'flex max-h-[calc(100vh-2rem)] flex-col sm:max-h-[calc(100vh-3rem)]',
          className
        )}
      >
        <div className="flex items-center justify-between px-6 pb-4 pt-6">
          <h2 className="text-lg font-semibold">{title || ''}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 pb-6">{children}</div>
        {footer ? <div className="flex justify-end gap-2 px-6 pb-6">{footer}</div> : null}
      </div>
    </div>
  )
}
