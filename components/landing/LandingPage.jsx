import Link from 'next/link'
import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  CalendarClock,
  CarFront,
  Check,
  ChevronRight,
  ClipboardList,
  Cloud,
  CreditCard,
  FileText,
  Gauge,
  Layers3,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Users,
  Wrench,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { BrandLogo } from '@/components/landing/BrandLogo'

const navItems = [
  { label: 'Producto', href: '#producto' },
  { label: 'Módulos', href: '#modulos' },
  { label: 'Planes', href: '#planes' },
  { label: 'FAQ', href: '#faq' },
]

const heroHighlights = [
  'Implementación remota',
  '100% en la nube',
  'Soporte y acompañamiento',
]

const operationalMetrics = [
  { label: 'Recepciones del día', value: '18', detail: 'con estado actualizado' },
  { label: 'Presupuestos aprobados', value: '68%', detail: 'seguimiento comercial visible' },
  { label: 'Cobranza registrada', value: '91%', detail: 'sin planillas paralelas' },
]

const featurePillars = [
  {
    title: 'Operación centralizada',
    description: 'Clientes, vehículos, turnos, órdenes, inventario y cobros en una sola plataforma.',
    icon: Layers3,
  },
  {
    title: 'Seguimiento profesional',
    description: 'Cada trabajo queda registrado con estado, responsable, historial y contexto comercial.',
    icon: ClipboardList,
  },
  {
    title: 'Control del negocio',
    description: 'Métricas claras para ver productividad, facturación, conversiones y carga operativa.',
    icon: Gauge,
  },
  {
    title: 'Experiencia moderna',
    description: 'Una interfaz pensada para transmitir orden, rapidez y confianza en cada contacto.',
    icon: Sparkles,
  },
]

const pricingPlans = [
  {
    name: 'Plan Básico',
    price: 'ARS $242.000',
    description: 'Ideal para comenzar.',
    priceNote: 'Pago único.',
    cta: 'Comenzar',
    href: '/register',
    featured: false,
    features: [
      'Gestión de clientes',
      'Gestión de vehículos',
      'Agenda de turnos',
      'Presupuestos',
      'Órdenes de trabajo',
    ],
  },
  {
    name: 'Plan Profesional',
    price: 'ARS $363.000',
    description: 'Pensado para talleres en crecimiento.',
    priceNote: 'Pago único.',
    cta: 'Elegir Profesional',
    href: '/register',
    featured: true,
    features: [
      'Todo lo del Plan Básico',
      'Inventario',
      'Facturación',
      'Integración con WhatsApp',
      'Dashboard ejecutivo',
    ],
  },
  {
    name: 'Plan Premium',
    price: 'ARS $605.000',
    description: 'La solución completa para talleres con mayor operación.',
    priceNote: 'Pago único.',
    cta: 'Contactar Ventas',
    href: '/demo',
    featured: false,
    features: [
      'Todo lo del Plan Profesional',
      'Múltiples sucursales',
      'API REST',
      'Branding personalizado',
      'Dominio propio',
    ],
  },
]

const workflowSteps = [
  {
    title: 'Recepción y agenda',
    description: 'Registrá el ingreso, programá turnos y asigná trabajo sin perder trazabilidad.',
    icon: CalendarClock,
  },
  {
    title: 'Diagnóstico y presupuesto',
    description: 'Armá cotizaciones claras y pasá de aprobación a ejecución con menos fricción.',
    icon: FileText,
  },
  {
    title: 'Orden de trabajo',
    description: 'Controlá responsables, tiempos, repuestos y avances desde un tablero ordenado.',
    icon: Wrench,
  },
  {
    title: 'Cobro y análisis',
    description: 'Registrá la operación y entendé qué áreas del taller están siendo más rentables.',
    icon: CreditCard,
  },
]

const modules = [
  { title: 'Clientes y CRM', description: 'Historial comercial y técnico por cliente.', icon: Users },
  { title: 'Vehículos', description: 'Seguimiento por unidad, patente y kilometraje.', icon: CarFront },
  { title: 'Presupuestos', description: 'Cotizaciones prolijas listas para compartir.', icon: FileText },
  { title: 'Órdenes de trabajo', description: 'Tareas, responsables y estado en tiempo real.', icon: ClipboardList },
  { title: 'Panel ejecutivo', description: 'Indicadores para decidir con datos.', icon: BarChart3 },
  { title: 'Comunicación y soporte', description: 'Más claridad para el equipo y para el cliente.', icon: MessageSquareText },
]

const testimonials = [
  {
    name: 'Matías Roldán',
    workshop: 'Roldán Performance',
    city: 'Córdoba',
    quote: 'Antes teníamos el taller repartido entre WhatsApp, planillas y memoria. Hoy todo está ordenado y el equipo sabe exactamente qué sigue.',
  },
  {
    name: 'Carla Benítez',
    workshop: 'CB Motor Studio',
    city: 'Rosario',
    quote: 'La mejora más grande fue la imagen que damos al cliente. Los presupuestos y el seguimiento se sienten mucho más serios.',
  },
  {
    name: 'Julián Pereyra',
    workshop: 'JP Suspensión y Frenos',
    city: 'Buenos Aires',
    quote: 'Empezamos buscando orden interno y terminamos ganando control comercial. Ahora vemos el taller con números, no con intuición.',
  },
]

const faqs = [
  { question: '¿Necesito instalar algo?', answer: 'No. El sistema funciona en la nube y se usa desde el navegador, sin instalación local.' },
  { question: '¿Sirve para celular y tablet?', answer: 'Sí. Está preparado para trabajar desde escritorio, tablet y celular según el rol de cada usuario.' },
  { question: '¿Cómo es la implementación?', answer: 'La puesta en marcha es remota. Se acompaña la configuración inicial y la adopción del equipo.' },
  { question: '¿Incluye soporte?', answer: 'Sí. Todos los planes incluyen soporte, con mayor prioridad en los niveles superiores.' },
]

const proofPoints = [
  'Especializado en talleres, concesionarias y lubricentros',
  'Diseñado para operación diaria y crecimiento comercial',
  'Interfaz enfocada en claridad y control',
]

const primaryLink =
  'inline-flex items-center justify-center gap-2 rounded-full border border-blue-400/50 bg-blue-500 px-5 py-3 text-sm font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:bg-blue-400 hover:shadow-[0_16px_40px_rgba(59,130,246,0.35)]'

const secondaryLink =
  'inline-flex items-center justify-center gap-2 rounded-full border border-white/12 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-100 transition duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/10'

const ghostLink =
  'inline-flex items-center justify-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/10'

function SectionHeader({ eyebrow, title, description, align = 'left' }) {
  return (
    <div className={cn('max-w-3xl space-y-4', align === 'center' && 'mx-auto text-center')}>
      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.28em] text-slate-300">
        <Sparkles className="h-3.5 w-3.5 text-blue-400" />
        {eyebrow}
      </div>
      <h2 className="title-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">{title}</h2>
      <p className="text-balance text-base leading-7 text-slate-300 sm:text-lg">{description}</p>
    </div>
  )
}

function HighlightPill({ children }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200">
      <Check className="h-4 w-4 text-emerald-400" />
      {children}
    </div>
  )
}

function DashboardPreview() {
  return (
    <div className="glass-panel soft-outline overflow-hidden rounded-[32px]">
      <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.04] px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        </div>
        <div className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-slate-400">Vista ejecutiva</div>
      </div>
      <div className="space-y-5 bg-gradient-to-br from-white/[0.04] via-transparent to-white/[0.02] p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-slate-500">J&amp;S Gestión Mecánica</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Control operativo del taller</h3>
          </div>
          <div className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200">
            Operación al día
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {operationalMetrics.map((item) => (
            <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-slate-400">{item.label}</p>
              <p className="mt-3 text-2xl font-semibold text-white">{item.value}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">{item.detail}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.15fr,0.85fr]">
          <div className="rounded-3xl border border-white/10 bg-[#111720] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Flujo del día</p>
                <h4 className="mt-1 text-lg font-medium text-white">Recepción, diagnóstico y entrega</h4>
              </div>
              <CalendarClock className="h-5 w-5 text-blue-300" />
            </div>

            <div className="mt-5 space-y-3">
              {[
                ['08:30', 'Ingreso Toyota Hilux', 'Orden creada y mecánico asignado'],
                ['10:10', 'Presupuesto Peugeot 208', 'Pendiente de aprobación del cliente'],
                ['13:20', 'Entrega Ford Ranger', 'Cobro registrado y cierre operativo'],
              ].map(([hour, title, detail]) => (
                <div key={title} className="flex gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                  <div className="rounded-2xl bg-blue-500/10 px-3 py-2 text-sm font-semibold text-blue-200">{hour}</div>
                  <div>
                    <p className="font-medium text-white">{title}</p>
                    <p className="text-sm text-slate-400">{detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 rounded-3xl border border-white/10 bg-[#111720] p-5">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-medium text-white">Indicadores</h4>
              <BarChart3 className="h-5 w-5 text-emerald-300" />
            </div>

            {[
              ['Conversión de presupuestos', '68%', 'bg-blue-500'],
              ['Ocupación del equipo', '83%', 'bg-emerald-500'],
              ['Facturación objetivo', '91%', 'bg-orange-500'],
            ].map(([label, value, color]) => (
              <div key={label} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">{label}</span>
                  <span className="text-white">{value}</span>
                </div>
                <div className="h-2 rounded-full bg-white/8">
                  <div className={cn('h-2 rounded-full', color)} style={{ width: value }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function FeatureCard({ item }) {
  const Icon = item.icon

  return (
    <article className="glass-panel soft-outline rounded-[28px] p-6 transition duration-300 hover:-translate-y-1 hover:border-white/20">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-500/10 text-blue-200">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-6 text-2xl font-semibold text-white">{item.title}</h3>
      <p className="mt-3 text-base leading-7 text-slate-300">{item.description}</p>
    </article>
  )
}

function WorkflowCard({ step, index }) {
  const Icon = step.icon

  return (
    <article className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-[0.28em] text-slate-500">Paso {index + 1}</span>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-blue-200">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <h3 className="mt-6 text-xl font-semibold text-white">{step.title}</h3>
      <p className="mt-3 text-base leading-7 text-slate-300">{step.description}</p>
    </article>
  )
}

function ModuleCard({ module }) {
  const Icon = module.icon

  return (
    <article className="rounded-[26px] border border-white/10 bg-white/[0.04] p-6 transition duration-300 hover:border-white/20 hover:bg-white/[0.06]">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-blue-200">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-5 text-xl font-semibold text-white">{module.title}</h3>
      <p className="mt-3 text-base leading-7 text-slate-300">{module.description}</p>
    </article>
  )
}

function PlanCard({ plan }) {
  return (
    <article
      className={cn(
        'relative flex h-full flex-col rounded-[32px] border px-7 py-8 backdrop-blur-xl transition duration-300 hover:-translate-y-1.5',
        plan.featured
          ? 'border-blue-400/70 bg-[linear-gradient(180deg,rgba(59,130,246,0.16),rgba(255,255,255,0.04))] shadow-[0_30px_90px_rgba(59,130,246,0.2)] lg:-mt-5'
          : 'border-white/10 bg-white/[0.04] shadow-[0_18px_50px_rgba(15,17,21,0.25)]'
      )}
    >
      {plan.featured && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full border border-blue-300/40 bg-blue-500 px-4 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white">
          ⭐ Más Elegido
        </div>
      )}
      <div className="space-y-5">
        <div>
          <p className="text-sm uppercase tracking-[0.26em] text-slate-400">{plan.name}</p>
          <h3 className="mt-4 text-4xl font-semibold tracking-tight text-white">{plan.price}</h3>
          <p className="mt-2 text-sm text-slate-400">{plan.priceNote}</p>
        </div>
        <p className="max-w-xs text-base leading-7 text-slate-300">{plan.description}</p>
      </div>

      <div className="mt-8 flex-1 space-y-3">
        {plan.features.map((feature) => (
          <div key={feature} className="flex items-start gap-3 text-sm text-slate-200">
            <div className="mt-0.5 rounded-full border border-emerald-400/20 bg-emerald-500/10 p-1">
              <Check className="h-3.5 w-3.5 text-emerald-300" />
            </div>
            <span>{feature}</span>
          </div>
        ))}
      </div>

      <Link
        href={plan.href}
        className={cn(
          'mt-8 w-full',
          plan.featured
            ? primaryLink
            : 'inline-flex items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-5 py-3 text-sm font-semibold text-slate-100 transition duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/10'
        )}
      >
        {plan.cta}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </article>
  )
}

function TestimonialCard({ testimonial }) {
  return (
    <article className="glass-panel soft-outline rounded-[28px] p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{testimonial.name}</h3>
          <p className="text-sm text-slate-400">{testimonial.workshop}</p>
          <p className="text-sm text-slate-500">{testimonial.city}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-200">
          {testimonial.name
            .split(' ')
            .map((part) => part[0])
            .join('')
            .slice(0, 2)}
        </div>
      </div>

      <div className="mt-5 flex text-amber-300">
        {'★★★★★'.split('').map((star, index) => (
          <span key={`${testimonial.name}-${index}`}>{star}</span>
        ))}
      </div>

      <p className="mt-4 text-base leading-7 text-slate-300">{testimonial.quote}</p>
    </article>
  )
}

function FooterColumn({ title, items }) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-300">{title}</h3>
      <ul className="space-y-3 text-sm text-slate-400">
        {items.map((item) => (
          <li key={item.label}>
            <a href={item.href} className="transition hover:text-white">
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function LandingPage() {
  return (
    <main className="landing-shell">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute right-0 top-[18%] h-[360px] w-[360px] rounded-full bg-sky-500/8 blur-3xl" />
      </div>

      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[linear-gradient(90deg,rgba(4,34,86,0.98)_0%,rgba(6,40,94,0.97)_55%,rgba(24,74,138,0.95)_100%)] shadow-[0_18px_50px_rgba(2,6,23,0.35)] backdrop-blur-xl">
        <div className="section-wrap flex items-center justify-between gap-6 py-4">
          <a href="#inicio" className="shrink-0">
            <BrandLogo compact />
          </a>

          <nav className="hidden items-center gap-6 text-sm text-slate-300 lg:flex">
            {navItems.map((item) => (
              <a key={item.label} href={item.href} className="transition hover:text-white">
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login" className={ghostLink}>
              Iniciar Sesión
            </Link>
            <a href="#planes" className={primaryLink}>
              Comenzar Ahora
            </a>
          </div>
        </div>
      </header>

      <section id="inicio" className="relative overflow-hidden pb-24 pt-32 lg:pb-28 lg:pt-36">
        <div className="section-wrap grid gap-14 lg:grid-cols-[0.92fr,1.08fr] lg:items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
              <Cloud className="h-4 w-4 text-blue-300" />
              SaaS especializado para talleres mecánicos, concesionarias y lubricentros
            </div>

            <div className="space-y-6">
              <h1 className="title-balance max-w-4xl text-5xl font-semibold leading-[1.02] tracking-tight text-white sm:text-6xl lg:text-7xl">
                La forma más profesional de operar, controlar y hacer crecer tu taller.
              </h1>
              <p className="text-balance max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
                Centralizá la operación diaria en una plataforma clara, moderna y pensada para talleres que necesitan más orden,
                mejor seguimiento y una imagen de mayor nivel frente a sus clientes.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Link href="/demo" className={primaryLink}>
                Probar Demo
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/register" className={secondaryLink}>
                Crear Cuenta
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="flex flex-wrap gap-3">
              {heroHighlights.map((badge) => (
                <HighlightPill key={badge}>{badge}</HighlightPill>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {proofPoints.map((point) => (
                <div key={point} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-sm text-slate-300">
                  {point}
                </div>
              ))}
            </div>
          </div>

          <DashboardPreview />
        </div>
      </section>

      <section id="producto" className="relative py-24">
        <div className="section-wrap space-y-14">
          <SectionHeader
            eyebrow="Producto"
            title="Una landing más seria empieza con un producto mejor contado."
            description="Reordenamos el mensaje alrededor de lo que realmente compra un taller: control operativo, seguimiento comercial y una experiencia más profesional para el cliente."
          />

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {featurePillars.map((item) => (
              <FeatureCard key={item.title} item={item} />
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-24">
        <div className="section-wrap grid gap-10 lg:grid-cols-[0.78fr,1.22fr] lg:items-start">
          <SectionHeader
            eyebrow="Flujo de trabajo"
            title="Desde la recepción hasta el cobro, todo sigue un recorrido claro."
            description="En vez de mostrar bloques sueltos, la landing ahora explica el flujo real del taller. Eso la hace más creíble y mucho más comercial."
          />

          <div className="grid gap-5 sm:grid-cols-2">
            {workflowSteps.map((step, index) => (
              <WorkflowCard key={step.title} step={step} index={index} />
            ))}
          </div>
        </div>
      </section>

      <section id="modulos" className="relative py-24">
        <div className="section-wrap space-y-14">
          <SectionHeader
            eyebrow="Módulos"
            title="Los módulos clave están presentados con más foco y mejor jerarquía."
            description="Menos ruido visual, menos bloques repetidos y más claridad sobre qué resuelve la plataforma para el negocio."
          />

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {modules.map((module) => (
              <ModuleCard key={module.title} module={module} />
            ))}
          </div>
        </div>
      </section>

      <section id="planes" className="relative py-24">
        <div className="section-wrap space-y-14">
          <SectionHeader
            eyebrow="Planes"
            title="Planes presentados con una narrativa más limpia y más premium."
            description="Priorizamos legibilidad, comparación simple y un CTA claro para cada momento del cliente."
            align="center"
          />

          <div className="grid items-stretch gap-6 xl:grid-cols-3">
            {pricingPlans.map((plan) => (
              <PlanCard key={plan.name} plan={plan} />
            ))}
          </div>

          <div className="glass-panel soft-outline rounded-[30px] px-6 py-6">
            <div className="grid gap-4 md:grid-cols-3">
              {[
                'Acceso seguro y centralizado',
                'Actualizaciones incluidas',
                'Soporte para adopción y operación',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-slate-200">
                  <ShieldCheck className="h-4 w-4 text-blue-300" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="testimonios" className="relative py-24">
        <div className="section-wrap space-y-14">
          <SectionHeader
            eyebrow="Testimonios"
            title="Prueba social más sobria y más creíble."
            description="Sacamos el tono artificial y dejamos testimonios con foco en resultados concretos: orden, seguimiento y percepción profesional."
          />

          <div className="grid gap-6 xl:grid-cols-3">
            {testimonials.map((testimonial) => (
              <TestimonialCard key={testimonial.name} testimonial={testimonial} />
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="relative py-24">
        <div className="section-wrap grid gap-12 lg:grid-cols-[0.85fr,1.15fr]">
          <SectionHeader
            eyebrow="Preguntas frecuentes"
            title="Respuestas rápidas para cerrar objeciones sin recargar la página."
            description="El cierre de venta mejora cuando la información clave es fácil de encontrar y suena confiable."
          />

          <div className="space-y-4">
            {faqs.map((faq) => (
              <details key={faq.question} className="group glass-panel soft-outline rounded-[24px] p-6">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-medium text-white">
                  {faq.question}
                  <ChevronRight className="h-5 w-5 shrink-0 text-slate-400 transition group-open:rotate-90" />
                </summary>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section id="contacto" className="relative py-24">
        <div className="section-wrap space-y-12">
          <div className="glass-panel soft-outline relative overflow-hidden rounded-[34px] px-8 py-10 sm:px-12 sm:py-14">
            <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.18),transparent_65%)] lg:block" />
            <div className="relative max-w-3xl space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.28em] text-slate-300">
                <Wrench className="h-3.5 w-3.5 text-emerald-300" />
                Decisión comercial
              </div>
              <h2 className="title-balance text-4xl font-semibold text-white sm:text-5xl">
                Mostrá un taller más ordenado por dentro y mucho más serio por fuera.
              </h2>
              <p className="max-w-2xl text-lg leading-8 text-slate-300">
                La plataforma está pensada para talleres que necesitan control operativo, mejor seguimiento y una presencia más profesional frente a cada cliente.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Link href="/register" className={primaryLink}>
                  Crear Cuenta
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/demo" className={secondaryLink}>
                  Solicitar Demo
                </Link>
              </div>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {[
              {
                title: 'Demo comercial',
                text: 'Un recorrido guiado para ver cómo se adaptaría a tu operación actual.',
                action: 'Ver demo',
                href: '/demo',
                icon: Sparkles,
              },
              {
                title: 'Alta rápida',
                text: 'Creá tu cuenta y empezá con el plan que mejor se ajuste a tu taller.',
                action: 'Ir a registro',
                href: '/register',
                icon: BriefcaseBusiness,
              },
              {
                title: 'Ingreso de clientes',
                text: 'Si ya usás la plataforma, entrá directo al panel operativo.',
                action: 'Iniciar sesión',
                href: '/login',
                icon: ShieldCheck,
              },
            ].map((card) => {
              const Icon = card.icon
              return (
                <Link key={card.title} href={card.href} className="glass-panel soft-outline rounded-[28px] p-6 transition duration-300 hover:-translate-y-1 hover:border-white/20">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-blue-200">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-6 text-2xl font-semibold text-white">{card.title}</h3>
                  <p className="mt-3 text-base leading-7 text-slate-300">{card.text}</p>
                  <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-200">
                    {card.action}
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      <footer className="border-t border-white/8 py-14">
        <div className="section-wrap grid gap-10 lg:grid-cols-[1.2fr,1fr]">
          <div className="max-w-md space-y-5">
            <BrandLogo />
            <p className="text-base leading-7 text-slate-400">
              Plataforma SaaS para talleres mecánicos que buscan más control operativo, mejor seguimiento comercial y una imagen profesional consistente.
            </p>
            <div className="flex items-center gap-3 text-slate-400">
              <a href="#inicio" className={ghostLink}>Inicio</a>
              <Link href="/login" className={ghostLink}>Login</Link>
              <Link href="/register" className={ghostLink}>Contratar</Link>
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            <FooterColumn
              title="Funcionalidades"
              items={[
                { label: 'Producto', href: '#producto' },
                { label: 'Módulos', href: '#modulos' },
                { label: 'Flujo de trabajo', href: '#producto' },
                { label: 'Dashboard', href: '#inicio' },
              ]}
            />
            <FooterColumn
              title="Planes"
              items={[
                { label: 'Básico', href: '#planes' },
                { label: 'Profesional', href: '#planes' },
                { label: 'Premium', href: '#planes' },
                { label: 'Preguntas frecuentes', href: '#faq' },
              ]}
            />
            <FooterColumn
              title="Contacto"
              items={[
                { label: 'Solicitar demo', href: '/demo' },
                { label: 'Política de privacidad', href: '#contacto' },
                { label: 'Términos y condiciones', href: '#contacto' },
                { label: 'Instagram / LinkedIn', href: '#contacto' },
              ]}
            />
          </div>
        </div>

        <div className="section-wrap mt-10 flex flex-col gap-3 border-t border-white/8 pt-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} J&amp;S Gestión Mecánica. Todos los derechos reservados.</p>
          <p>Sistema SaaS integrado para talleres mecánicos, lubricentros y concesionarias.</p>
        </div>
      </footer>
    </main>
  )
}
