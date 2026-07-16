import Link from 'next/link'
import { ArrowLeft, ArrowRight, CalendarClock, CheckCircle2, LayoutDashboard, MessageCircleMore, Wrench } from 'lucide-react'
import { BrandLogo } from '@/components/landing/BrandLogo'

const previewBlocks = [
  {
    title: 'Recepción y agenda',
    description: 'Turnos, confirmaciones y asignación operativa para mantener el día bajo control.',
    icon: CalendarClock,
  },
  {
    title: 'Seguimiento del trabajo',
    description: 'Estados, responsables y avances visibles para el equipo y para el cliente.',
    icon: Wrench,
  },
  {
    title: 'Tablero ejecutivo',
    description: 'Facturación, productividad y caja con indicadores simples y accionables.',
    icon: LayoutDashboard,
  },
]

export default function DemoPage() {
  return (
    <main className="landing-shell min-h-screen pt-28">
      <div className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[linear-gradient(90deg,rgba(4,34,86,0.98)_0%,rgba(6,40,94,0.97)_55%,rgba(24,74,138,0.95)_100%)] shadow-[0_18px_50px_rgba(2,6,23,0.35)] backdrop-blur-xl">
        <div className="section-wrap py-4">
          <div className="flex items-center justify-between gap-4">
            <BrandLogo compact />
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-full border border-blue-400/50 bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-400"
              >
                Contratar
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <section className="section-wrap py-10 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[0.95fr,1.05fr] lg:items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.3em] text-slate-300">
              Demo comercial
            </div>
            <h1 className="title-balance text-5xl font-semibold tracking-tight text-white sm:text-6xl">
              Así se ve una operación más ordenada, más rápida y más rentable.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-300">
              Esta demo resume cómo J&amp;S Gestión Mecánica centraliza agenda, seguimiento, comunicación y métricas del taller
              en una experiencia profesional y simple de adoptar.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-blue-400/50 bg-blue-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-400"
              >
                Empezar ahora
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
              >
                Ya soy cliente
              </Link>
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/[0.05] p-5 shadow-[0_24px_80px_rgba(15,17,21,0.45)] backdrop-blur-xl">
            <div className="rounded-[28px] border border-white/10 bg-[#10161f]">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </div>
                <div className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-slate-400">
                  Demo en vivo
                </div>
              </div>

              <div className="grid gap-4 p-5 sm:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                  <p className="text-sm text-slate-400">Órdenes activas</p>
                  <p className="mt-3 text-3xl font-semibold text-white">24</p>
                  <p className="mt-2 text-sm text-emerald-300">+12% esta semana</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                  <p className="text-sm text-slate-400">Facturación estimada</p>
                  <p className="mt-3 text-3xl font-semibold text-white">ARS 8.6M</p>
                  <p className="mt-2 text-sm text-blue-300">Cierre mensual proyectado</p>
                </div>
                <div className="sm:col-span-2 rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-slate-400">Comunicación con clientes</p>
                      <h2 className="mt-2 text-xl font-semibold text-white">Recordatorios, estados y confirmaciones</h2>
                    </div>
                    <MessageCircleMore className="h-6 w-6 text-emerald-300" />
                  </div>
                  <div className="mt-5 grid gap-3">
                    {[
                      'Toyota Hilux lista para entrega',
                      'Presupuesto de Peugeot 208 enviado por WhatsApp',
                      'Recordatorio automático de turno para mañana 08:30',
                    ].map((item) => (
                      <div key={item} className="flex items-center gap-3 rounded-2xl bg-[#0d131b] px-4 py-3">
                        <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                        <span className="text-sm text-slate-200">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-wrap pb-20 pt-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {previewBlocks.map((block) => {
            const Icon = block.icon
            return (
              <article key={block.title} className="rounded-[28px] border border-white/10 bg-white/[0.05] p-6 backdrop-blur-xl">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-500/10 text-blue-200">
                  <Icon className="h-6 w-6" />
                </div>
                <h2 className="mt-6 text-2xl font-semibold text-white">{block.title}</h2>
                <p className="mt-3 text-base leading-7 text-slate-300">{block.description}</p>
              </article>
            )
          })}
        </div>
      </section>
    </main>
  )
}
