# Taller SaaS

Plataforma SaaS Multi-Tenant para talleres mecánicos, concesionarias, gomerías, lubricentros y servicios automotrices.

## Stack Tecnológico

- **Next.js 15** - Framework React
- **React** - Librería UI
- **Tailwind CSS** - Estilos
- **Supabase** - Auth y Storage
- **PostgreSQL** - Base de datos
- **Prisma ORM** - ORM para base de datos
- **PWA** - Progressive Web App

## Estructura del Proyecto

```
├── app/                    # Next.js App Router
├── components/            # Componentes React
│   └── ui/               # Componentes base reutilizables
├── contexts/             # Context API para estado global
├── layouts/              # Layouts de la app
├── lib/                  # Utilidades y clientes (Prisma, Supabase)
├── prisma/               # Schema y migraciones de Prisma
├── providers/            # Providers de contexto
├── public/               # Archivos públicos
├── styles/               # Estilos globales
├── constants/            # Constantes del proyecto
└── validations/          # Validaciones de formularios
```

## Configuración Inicial

1. Copiar el archivo `.env.example` a `.env` y configurar las variables de entorno:
   ```bash
   cp .env.example .env
   ```

2. Instalar dependencias:
   ```bash
   npm install
   ```

3. Configurar Prisma y ejecutar migraciones:
   ```bash
   npx prisma migrate dev
   ```

4. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```

## Características Implementadas

✅ Arquitectura profesional escalable  
✅ Base de datos Multi-Tenant con Prisma  
✅ Autenticación con Supabase  
✅ Roles y permisos (estructura lista)  
✅ Sistema de suscripciones (estructura lista)  
✅ Dashboard base con sidebar y navbar  
✅ Componentes base reutilizables (Button, Input, Card, etc.)  
✅ Dark/Light Mode  
✅ PWA configurada  
✅ Middleware de seguridad

## Próximos Pasos

- Implementar módulos funcionales (clientes, vehículos, presupuestos, etc.)
- Configurar storage en Supabase
- Implementar auditoría y logs
- Agregar más componentes UI
- Implementar API REST
