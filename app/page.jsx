import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Taller SaaS</h1>
        <p className="text-gray-500 dark:text-gray-400">Plataforma para gestión de talleres mecánicos</p>
        <Link 
          href="/login" 
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 transition-colors"
        >
          Comenzar
        </Link>
      </div>
    </div>
  )
}
