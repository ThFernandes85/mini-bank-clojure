function AccountCard({ account, onDeposit, onTransfer, onStatement }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-lg border border-purple-100">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">Conta</p>

        <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
          $
        </div>
      </div>

      <h3 className="text-xl font-bold text-gray-900">{account.name}</h3>
      <p className="text-sm text-gray-500 mt-1">ID: {account.id}</p>

      <div className="mt-5">
        <p className="text-sm text-gray-500">Saldo atual</p>

        <p className="text-3xl font-bold text-purple-700 mt-1">
          R$ {Number(account.balance).toFixed(2)}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2 mt-6">
        <button
          onClick={() => onDeposit(account.id)}
          className="w-full bg-purple-600 text-white py-2 rounded-xl font-semibold hover:bg-purple-700"
        >
          Depositar
        </button>

        <button
          onClick={() => onTransfer(account.id)}
          className="w-full bg-gray-100 text-gray-700 py-2 rounded-xl font-semibold hover:bg-gray-200"
        >
          Transferir
        </button>

        <button
          onClick={() => onStatement(account.id)}
          className="w-full bg-gray-100 text-gray-700 py-2 rounded-xl font-semibold hover:bg-gray-200"
        >
          Extrato
        </button>
      </div>
    </div>
  )
}

export default AccountCard