import { useEffect, useState } from 'react'
import api from './api'
import Navbar from './components/Navbar'
import AccountCard from './components/AccountCard'

import {
  getAccounts,
  depositIntoAccount,
  transferBetweenAccounts,
  getAccountStatement,
} from './services/accountService'

function App() {
  const [mode, setMode] = useState('login')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')

  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [loginSuccess, setLoginSuccess] = useState(false)

  const [accounts, setAccounts] = useState([])
  const [loadingAccounts, setLoadingAccounts] = useState(false)

  const [statementOpen, setStatementOpen] = useState(false)
  const [statementLoading, setStatementLoading] = useState(false)
  const [statementData, setStatementData] = useState(null)

  const [depositModalOpen, setDepositModalOpen] = useState(false)
  const [transferModalOpen, setTransferModalOpen] = useState(false)

  const [selectedAccount, setSelectedAccount] = useState(null)

  const [depositValue, setDepositValue] = useState('')
  const [transferValue, setTransferValue] = useState('')
  const [transferTarget, setTransferTarget] = useState('')

  const [users, setUsers] = useState([])

  const token = localStorage.getItem('token')
  const savedUser = localStorage.getItem('user')
  const user = savedUser ? JSON.parse(savedUser) : null

  const totalBalance = accounts.reduce(
    (total, acc) => total + Number(acc.balance || 0),
    0
  )

  const totalAccounts = accounts.length

  const highestBalance = accounts.reduce(
    (highest, acc) => Math.max(highest, Number(acc.balance || 0)),
    0
  )

  const formatCurrency = (value) => {
    return Number(value || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
  }

  const formatDate = (dateValue) => {
    if (!dateValue) return 'Data não informada'

    const date = new Date(dateValue)

    if (Number.isNaN(date.getTime())) {
      return dateValue
    }

    return date.toLocaleString('pt-BR')
  }

  const getTransactionStyle = (type) => {
    const normalizedType = String(type || '').toLowerCase()

    if (normalizedType.includes('deposit')) {
      return {
        badge: 'bg-green-100 text-green-700',
        value: 'text-green-600',
        label: 'Depósito',
      }
    }

    if (normalizedType.includes('transfer')) {
      return {
        badge: 'bg-purple-100 text-purple-700',
        value: 'text-purple-700',
        label: 'Transferência',
      }
    }

    if (normalizedType.includes('withdraw')) {
      return {
        badge: 'bg-red-100 text-red-700',
        value: 'text-red-600',
        label: 'Saque',
      }
    }

    if (normalizedType.includes('create-account')) {
      return {
        badge: 'bg-blue-100 text-blue-700',
        value: 'text-blue-700',
        label: 'Criação de conta',
      }
    }

    if (normalizedType.includes('delete-account')) {
      return {
        badge: 'bg-orange-100 text-orange-700',
        value: 'text-orange-700',
        label: 'Exclusão de conta',
      }
    }

    return {
      badge: 'bg-gray-100 text-gray-700',
      value: 'text-gray-800',
      label: type || 'Transação',
    }
  }

  const fetchAccounts = async () => {
    try {
      setLoadingAccounts(true)

      const data = await getAccounts()
      const accountList = data?.data || data || []

      setAccounts(accountList)
    } catch (error) {
      console.error('Erro ao buscar contas:', error)
      alert(
        error?.response?.data?.error ||
          error?.response?.data?.body?.error ||
          'Erro ao buscar contas'
      )
    } finally {
      setLoadingAccounts(false)
    }
  }

  const fetchUsers = async () => {
    if (user?.role !== 'admin') return

    try {
      const response = await api.get('/users')
      const userList = response?.data?.data || response?.data || []
      setUsers(userList)
    } catch (error) {
      console.error('Erro ao buscar usuários:', error)
    }
  }

  const handleDeposit = (accountId) => {
    setSelectedAccount(accountId)
    setDepositValue('')
    setDepositModalOpen(true)
  }

  const confirmDeposit = async () => {
    if (!depositValue) return

    try {
      await depositIntoAccount(selectedAccount, depositValue)

      alert('Depósito realizado com sucesso!')
      setDepositModalOpen(false)
      setDepositValue('')
      setSelectedAccount(null)

      await fetchAccounts()
    } catch (error) {
      console.error('Erro ao realizar depósito:', error)
      alert(
        error?.response?.data?.error ||
          error?.response?.data?.body?.error ||
          'Erro ao realizar depósito'
      )
    }
  }

  const handleTransfer = (accountId) => {
    setSelectedAccount(accountId)
    setTransferTarget('')
    setTransferValue('')
    setTransferModalOpen(true)
  }

  const confirmTransfer = async () => {
    if (!transferTarget || !transferValue) return

    try {
      await transferBetweenAccounts(
        selectedAccount,
        transferTarget,
        transferValue
      )

      alert('Transferência realizada com sucesso!')
      setTransferModalOpen(false)
      setTransferTarget('')
      setTransferValue('')
      setSelectedAccount(null)

      await fetchAccounts()
    } catch (error) {
      console.error('Erro ao realizar transferência:', error)
      alert(
        error?.response?.data?.error ||
          error?.response?.data?.body?.error ||
          'Erro ao realizar transferência'
      )
    }
  }

  const handleStatement = async (accountId) => {
    try {
      setStatementOpen(true)
      setStatementLoading(true)

      const data = await getAccountStatement(accountId)
      const statement = data?.data || data || null

      setStatementData(statement)
    } catch (error) {
      console.error('Erro ao buscar extrato:', error)
      alert(
        error?.response?.data?.error ||
          error?.response?.data?.body?.error ||
          'Erro ao buscar extrato'
      )
      setStatementOpen(false)
      setStatementData(null)
    } finally {
      setStatementLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      fetchAccounts()
      fetchUsers()
    }
  }, [token])

  const handleLogin = async (e) => {
    e.preventDefault()
    setMessage('')
    setLoginSuccess(false)

    if (!email || !password) {
      setMessage('Preencha e-mail e senha.')
      return
    }

    try {
      setLoading(true)

      const response = await api.post('/login', {
        email,
        password,
      })

      const payload = response?.data?.data || response?.data || {}
      const receivedToken = payload?.token
      const receivedUser = payload?.user

      if (receivedToken) {
        localStorage.setItem('token', receivedToken)

        if (receivedUser) {
          localStorage.setItem('user', JSON.stringify(receivedUser))
        }

        setLoginSuccess(true)
        setMessage('Login realizado com sucesso!')
        await fetchAccounts()

        if (receivedUser?.role === 'admin') {
          await fetchUsers()
        }
      } else {
        setMessage('Login realizado, mas token não foi encontrado.')
      }
    } catch (error) {
      console.error('Erro ao fazer login:', error)

      const apiError =
        error?.response?.data?.error ||
        error?.response?.data?.body?.error ||
        'Erro ao fazer login.'

      setMessage(apiError)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setMessage('')
    setLoginSuccess(false)

    if (!name || !email || !password) {
      setMessage('Preencha nome, e-mail e senha.')
      return
    }

    try {
      setLoading(true)

      const response = await api.post('/register', {
        name,
        email,
        password,
      })

      const payload = response?.data?.data || response?.data || {}

      setMessage(payload?.message || response?.data?.message || 'Conta criada com sucesso!')
      setMode('login')
      setName('')
      setEmail('')
      setPassword('')
    } catch (error) {
      console.error('Erro ao criar conta:', error)

      const apiError =
        error?.response?.data?.error ||
        error?.response?.data?.body?.error ||
        'Erro ao criar conta.'

      setMessage(apiError)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setAccounts([])
    setUsers([])
    setLoginSuccess(false)
    setMessage('')
    setStatementOpen(false)
    setStatementData(null)
    setDepositModalOpen(false)
    setTransferModalOpen(false)
    setDepositValue('')
    setTransferValue('')
    setTransferTarget('')
    setSelectedAccount(null)
    window.location.reload()
  }

  const closeStatement = () => {
    setStatementOpen(false)
    setStatementData(null)
  }

  const closeDepositModal = () => {
    setDepositModalOpen(false)
    setDepositValue('')
    setSelectedAccount(null)
  }

  const closeTransferModal = () => {
    setTransferModalOpen(false)
    setTransferTarget('')
    setTransferValue('')
    setSelectedAccount(null)
  }

  if (token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-white to-violet-200">
        <Navbar onLogout={handleLogout} />

        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="rounded-3xl bg-purple-600 text-white p-8 shadow-2xl mb-8">
            <p className="text-sm opacity-90">Bem-vindo ao</p>

            <h2 className="text-4xl font-bold mt-2">
              Mini Bank Dashboard
            </h2>

            <p className="mt-3 text-purple-100">
              Visualize suas contas e acompanhe seus saldos.
            </p>

            <div className="mt-4 space-y-1">
              <p className="text-sm text-purple-100">
                Usuário: <span className="font-semibold">{user?.name || 'Usuário'}</span>
              </p>
              <p className="text-sm text-purple-100">
                Perfil: <span className="font-semibold uppercase">{user?.role || 'user'}</span>
              </p>
              <p className="text-sm text-purple-100">
                E-mail: <span className="font-semibold">{user?.email || '-'}</span>
              </p>
            </div>

            <div className="mt-6 border-t border-purple-400 pt-6">
              <p className="text-sm text-purple-200">
                Saldo total em todas as contas
              </p>

              <p className="text-4xl font-bold mt-1">
                {formatCurrency(totalBalance)}
              </p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-2xl font-bold text-gray-900">Suas contas</h3>
            <p className="text-gray-500 mt-1">
              Contas cadastradas no sistema bancário simulado
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="rounded-3xl bg-white p-6 shadow-lg border border-purple-100">
              <p className="text-sm text-gray-500">Total de contas</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {totalAccounts}
              </p>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-lg border border-purple-100">
              <p className="text-sm text-gray-500">Saldo total</p>
              <p className="text-3xl font-bold text-purple-700 mt-2">
                {formatCurrency(totalBalance)}
              </p>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-lg border border-purple-100">
              <p className="text-sm text-gray-500">Maior saldo</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {formatCurrency(highestBalance)}
              </p>
            </div>
          </div>

          {user?.role === 'admin' && (
            <div className="rounded-3xl bg-white p-6 shadow-lg border border-purple-100 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-gray-900">
                  Usuários cadastrados
                </h3>
                <button
                  onClick={fetchUsers}
                  className="rounded-2xl bg-purple-600 text-white px-4 py-2 font-semibold hover:bg-purple-700 transition"
                >
                  Atualizar
                </button>
              </div>

              {users.length === 0 ? (
                <p className="text-gray-600">Nenhum usuário encontrado.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {users.map((bankUser) => (
                    <div
                      key={bankUser.id}
                      className="rounded-2xl border border-purple-100 bg-purple-50 p-4"
                    >
                      <p className="font-bold text-gray-900">{bankUser.name}</p>
                      <p className="text-sm text-gray-600 mt-1">{bankUser.email}</p>
                      <p className="text-xs mt-2 inline-flex rounded-full bg-white px-3 py-1 font-semibold text-purple-700 border border-purple-200">
                        {bankUser.role}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {loadingAccounts ? (
            <div className="rounded-3xl bg-white p-8 shadow-lg border border-purple-100">
              <p className="text-gray-600">Carregando contas...</p>
            </div>
          ) : accounts.length === 0 ? (
            <div className="rounded-3xl bg-white p-8 shadow-lg border border-purple-100">
              <p className="text-gray-600">Nenhuma conta encontrada.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {accounts.map((account) => (
                <AccountCard
                  key={account.id}
                  account={account}
                  onDeposit={handleDeposit}
                  onTransfer={handleTransfer}
                  onStatement={handleStatement}
                />
              ))}
            </div>
          )}
        </div>

        {statementOpen && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-purple-100 overflow-hidden">
              <div className="bg-purple-600 text-white p-6 flex items-start justify-between">
                <div>
                  <p className="text-sm opacity-90">Extrato bancário</p>
                  <h3 className="text-2xl font-bold mt-1">
                    {statementData?.account?.name || 'Conta'}
                  </h3>
                </div>

                <button
                  onClick={closeStatement}
                  className="bg-white/20 hover:bg-white/30 rounded-xl px-4 py-2 font-semibold"
                >
                  Fechar
                </button>
              </div>

              <div className="p-6">
                {statementLoading ? (
                  <p className="text-gray-600">Carregando extrato...</p>
                ) : !statementData ? (
                  <p className="text-gray-600">Extrato não encontrado.</p>
                ) : (
                  <>
                    <div className="rounded-2xl bg-purple-50 border border-purple-100 p-4 mb-6">
                      <p className="text-sm text-gray-500">Saldo atual</p>
                      <p className="text-3xl font-bold text-purple-700 mt-1">
                        {formatCurrency(statementData.account.balance)}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        ID da conta: {statementData.account.id}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-lg font-bold text-gray-900 mb-4">
                        Transações
                      </h4>

                      {statementData.transactions?.length === 0 ? (
                        <div className="rounded-2xl border border-gray-200 p-4">
                          <p className="text-gray-600">
                            Nenhuma transação encontrada.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                          {statementData.transactions?.map((transaction) => {
                            const transactionStyle = getTransactionStyle(
                              transaction.type
                            )

                            return (
                              <div
                                key={transaction.id}
                                className="rounded-2xl border border-gray-200 p-4 hover:shadow-md transition bg-white"
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div>
                                    <span
                                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${transactionStyle.badge}`}
                                    >
                                      {transactionStyle.label}
                                    </span>

                                    <p className="text-sm text-gray-500 mt-3">
                                      Transação #{transaction.id}
                                    </p>

                                    <p className="text-sm text-gray-500 mt-1">
                                      {formatDate(transaction.timestamp)}
                                    </p>

                                    {transaction.from_account_id && (
                                      <p className="text-sm text-gray-500 mt-1">
                                        Origem: {transaction.from_account_id}
                                      </p>
                                    )}

                                    {transaction.to_account_id && (
                                      <p className="text-sm text-gray-500 mt-1">
                                        Destino: {transaction.to_account_id}
                                      </p>
                                    )}
                                  </div>

                                  <div className="text-right">
                                    {transaction.amount !== undefined && (
                                      <p
                                        className={`text-xl font-bold ${transactionStyle.value}`}
                                      >
                                        {formatCurrency(transaction.amount)}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {depositModalOpen && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-purple-100">
              <h2 className="text-2xl font-bold mb-2 text-gray-900">
                Fazer depósito
              </h2>

              <p className="text-sm text-gray-500 mb-6">
                Conta selecionada: {selectedAccount}
              </p>

              <input
                type="number"
                placeholder="Valor do depósito"
                value={depositValue}
                onChange={(e) => setDepositValue(e.target.value)}
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 mb-4 outline-none focus:ring-2 focus:ring-green-400"
              />

              <div className="flex gap-3">
                <button
                  onClick={closeDepositModal}
                  className="flex-1 border border-gray-200 rounded-2xl py-3 font-semibold hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>

                <button
                  onClick={confirmDeposit}
                  className="flex-1 bg-green-500 text-white rounded-2xl py-3 font-semibold hover:bg-green-600 transition"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}

        {transferModalOpen && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-purple-100">
              <h2 className="text-2xl font-bold mb-2 text-gray-900">
                Transferir valor
              </h2>

              <p className="text-sm text-gray-500 mb-6">
                Conta de origem: {selectedAccount}
              </p>

              <input
                type="number"
                placeholder="Conta destino"
                value={transferTarget}
                onChange={(e) => setTransferTarget(e.target.value)}
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 mb-3 outline-none focus:ring-2 focus:ring-purple-400"
              />

              <input
                type="number"
                placeholder="Valor"
                value={transferValue}
                onChange={(e) => setTransferValue(e.target.value)}
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 mb-4 outline-none focus:ring-2 focus:ring-purple-400"
              />

              <div className="flex gap-3">
                <button
                  onClick={closeTransferModal}
                  className="flex-1 border border-gray-200 rounded-2xl py-3 font-semibold hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>

                <button
                  onClick={confirmTransfer}
                  className="flex-1 bg-purple-600 text-white rounded-2xl py-3 font-semibold hover:bg-purple-700 transition"
                >
                  Transferir
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-white to-violet-200 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl p-8 border border-purple-100">
        <div className="mb-8">
          <div className="w-14 h-14 rounded-2xl bg-purple-600 text-white flex items-center justify-center text-2xl font-bold shadow-lg">
            $
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mt-6">
            Mini Bank
          </h1>
          <p className="text-gray-500 mt-2">
            {mode === 'login'
              ? 'Entre para acessar seu banco digital simulado'
              : 'Crie sua conta para entrar no Mini Bank'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            type="button"
            onClick={() => {
              setMode('login')
              setMessage('')
            }}
            className={`rounded-2xl py-3 font-semibold transition ${
              mode === 'login'
                ? 'bg-purple-600 text-white'
                : 'bg-purple-50 text-purple-700 border border-purple-100'
            }`}
          >
            Entrar
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('register')
              setMessage('')
            }}
            className={`rounded-2xl py-3 font-semibold transition ${
              mode === 'register'
                ? 'bg-purple-600 text-white'
                : 'bg-purple-50 text-purple-700 border border-purple-100'
            }`}
          >
            Criar conta
          </button>
        </div>

        {mode === 'login' ? (
          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                E-mail
              </label>
              <input
                type="email"
                placeholder="thiago@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Senha
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-purple-600 text-white py-3 font-semibold hover:bg-purple-700 transition disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        ) : (
          <form className="space-y-4" onSubmit={handleRegister}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome
              </label>
              <input
                type="text"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                E-mail
              </label>
              <input
                type="email"
                placeholder="seuemail@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Senha
              </label>
              <input
                type="password"
                placeholder="Crie uma senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-purple-600 text-white py-3 font-semibold hover:bg-purple-700 transition disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>
        )}

        {message && (
          <div
            className={`mt-4 rounded-2xl p-4 text-sm border ${
              loginSuccess
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-red-50 text-red-700 border-red-200'
            }`}
          >
            {message}
          </div>
        )}

        <div className="mt-6 rounded-2xl bg-purple-50 p-4 border border-purple-100">
          <p className="text-sm text-purple-900 font-medium">
            Projeto Full Stack
          </p>
          <p className="text-sm text-purple-700 mt-1">
            Frontend React + Tailwind conectado à API em Clojure
          </p>
        </div>
      </div>
    </div>
  )
}

export default App