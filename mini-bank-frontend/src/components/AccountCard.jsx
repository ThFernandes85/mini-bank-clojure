function AccountCard({ account, onDeposit, onTransfer, onStatement }) {
  const formatCurrency = (value) => {
    return Number(value || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
  }

  return (
    <div className="rounded-3xl bg-white border border-purple-100 shadow-lg p-6 hover:shadow-2xl transition">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">Conta bancária</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-1">
            {account.name || 'Conta sem nome'}
          </h3>
          <p className="text-sm text-gray-500 mt-2">
            ID da conta: {account.id}
          </p>
        </div>

        <div className="rounded-2xl bg-purple-100 text-purple-700 px-3 py-2 text-sm font-semibold">
          Ativa
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-purple-50 border border-purple-100 p-4">
        <p className="text-sm text-gray-500">Saldo disponível</p>
        <p className="text-3xl font-bold text-purple-700 mt-1">
          {formatCurrency(account.balance)}
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3">
        <button
          onClick={() => onDeposit(account.id)}
          className="w-full rounded-2xl bg-green-500 text-white py-3 font-semibold hover:opacity-90 transition"
        >
          Depositar
        </button>

        <button
          onClick={() => onTransfer(account.id)}
          className="w-full rounded-2xl bg-purple-600 text-white py-3 font-semibold hover:bg-purple-700 transition"
        >
          Transferir
        </button>

        <button
          onClick={() => onStatement(account.id)}
          className="w-full rounded-2xl border border-gray-200 bg-white text-gray-800 py-3 font-semibold hover:bg-gray-50 transition"
        >
          Ver extrato
        </button>
      </div>
    </div>
  )
}

export default AccountCard