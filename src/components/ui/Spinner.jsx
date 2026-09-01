export default function Spinner({ size = 'md', fullContent = false }) {
  // Modo para el área de contenido (no tapa el menú lateral)
  if (fullContent) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] w-full">
        <div className="flex flex-col items-center gap-6">
          {/* Logo Animado */}
          <div className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 to-cyan-500 bg-clip-text text-transparent animate-pulse">
            NexoERP
          </div>
          
          {/* Barra de Progreso */}
          <div className="w-56 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-600 to-cyan-500 rounded-full animate-[loading_1.5s_ease-in-out_infinite]"></div>
          </div>
          
          <p className="text-gray-400 text-sm font-medium animate-pulse">Cargando módulo...</p>
        </div>
        
        {/* Animación CSS inyectada */}
        <style>{`
          @keyframes loading {
            0% { width: 0% }
            50% { width: 70% }
            100% { width: 100% }
          }
        `}</style>
      </div>
    )
  }

  // Spinner normal para tablas o botones
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  }
  return (
    <div className={`${sizes[size]} border-gray-200 border-t-indigo-600 rounded-full animate-spin`} />
  )
}