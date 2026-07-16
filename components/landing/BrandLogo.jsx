import Image from 'next/image'
import { cn } from '@/lib/utils'

export function BrandLogo({ className, compact = false, mono = false }) {
  const titleClass = mono ? 'text-white' : 'text-slate-50'
  const subtitleClass = mono ? 'text-slate-200' : 'text-slate-300'

  return (
    <div className={cn('inline-flex items-center shrink-0', compact ? 'gap-4' : 'gap-3', mono && 'opacity-95', className)}>
      <Image
        src="/logo-js.png"
        alt="J&S"
        width={1024}
        height={1024}
        priority
        className={cn(
          'h-auto w-auto object-contain select-none',
          compact ? 'max-h-14 max-w-14 sm:max-h-16 sm:max-w-16' : 'max-h-16 max-w-16 sm:max-h-20 sm:max-w-20'
        )}
      />

      <div className="flex min-w-0 flex-col leading-none">
        <span
          className={cn(
            'font-semibold uppercase tracking-[0.2em]',
            compact ? 'text-[11px] sm:text-[13px]' : 'text-[12px] sm:text-[13px]',
            titleClass
          )}
        >
          Gestion Mecanica
        </span>
        <span
          className={cn(
            'mt-1 uppercase tracking-[0.24em]',
            compact ? 'text-[9px] sm:text-[10px]' : 'text-[9px] sm:text-[10px]',
            subtitleClass
          )}
        >
          Sistema Saas Integrado
        </span>
      </div>
    </div>
  )
}
