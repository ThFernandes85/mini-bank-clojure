function Navbar({ onLogout }) {
  return (
    <div className="w-full bg-white border-b border-purple-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        
        <div>
          <h1 className="text-2xl font-bold text-purple-700">Mini Bank</h1>
          <p className="text-sm text-gray-500">Banco digital simulado</p>
        </div>

        <div className="flex flex-col items-end">
          <p className="text-xs text-gray-400 mb-1">
            Banco digital simulado • Criado por Thiago Fernandes
          </p>

          <button
            onClick={onLogout}
            className="rounded-2xl bg-purple-600 text-white px-5 py-2.5 font-semibold hover:bg-purple-700 transition"
          >
            Sair
          </button>
        </div>

      </div>
    </div>
  )
}

export default Navbar