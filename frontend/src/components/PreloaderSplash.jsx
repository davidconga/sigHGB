export default function PreloaderSplash({ message = 'A carregar…' }) {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-br from-hgb-900 via-hgb-700 to-hgb-600">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-white opacity-20 animate-ping" />
        <div className="relative bg-white rounded-full p-4 shadow-2xl animate-pulse">
          <img src="/logo.png" alt="HGB" className="w-24 h-24 object-contain" />
        </div>
      </div>
      <div className="mt-8 text-center text-white">
        <h1 className="text-xl font-bold tracking-wider">HOSPITAL GERAL DE BENGUELA</h1>
        <p className="text-sm text-hgb-100 mt-1">Sistema Integrado de Gestão</p>
      </div>
      <div className="mt-6 flex items-center gap-2 text-hgb-100 text-sm">
        <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        <span className="ml-2">{message}</span>
      </div>
    </div>
  )
}
