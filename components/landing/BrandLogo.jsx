import Image from 'next/image'
import { cn } from '@/lib/utils'

const DEFAULT_LOGO_SRC = '/logo%20cirfinal.png'

export function BrandLogo({ className, compact = false, mono = false, src = DEFAULT_LOGO_SRC }) {
  const titleClass = mono ? 'text-white' : 'text-slate-50'
  const subtitleClass = mono ? 'text-slate-200' : 'text-slate-300'

  return (
    <div className={cn('inline-flex shrink-0 items-center', compact ? 'gap-4' : 'gap-5', mono && 'opacity-95', className)}>
      <Image
        src={src}
        alt="J&S Gestion Mecanica"
        width={768}
        height={768}
        priority
        sizes={compact ? '160px' : '240px'}
        className={cn(
          'h-auto w-auto select-none object-contain',
          compact ? 'max-h-[56px] sm:max-h-[64px]' : 'max-h-[96px] sm:max-h-[112px]'
        )}
      />

      <div className="flex min-w-0 flex-col leading-none">
        <span
          className={cn(
            'font-semibold uppercase tracking-[0.2em]',
            compact ? 'text-[11px] sm:text-[13px]' : 'text-[12px] sm:text-[14px]',
            titleClass
          )}
        >
          Gestion Mecanica
        </span>
        <span
          className={cn(
            'mt-1 uppercase tracking-[0.24em]',
            compact ? 'text-[9px] sm:text-[10px]' : 'text-[9px] sm:text-[11px]',
            subtitleClass
          )}
        >
          Sistema Saas Integrado
        </span>
      </div>
    </div>
  )
}
