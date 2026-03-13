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
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [loginSuccess, setLoginSuccess] = useState(false)

  const [authToken, setAuthToken] = useState(localStorage.getItem('token') || '')
  const [currentUser, setCurrentUser] = useState(() => {
    const storedUser = localStorage.getItem('user')
    try {
      return storedUser ? JSON.parse(storedUser) : null
    } catch {
      return null
    }
  })

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
        label: 'Remoção de conta',
      }
    }

    return {
      badge: 'bg-gray-100 text-gray-700',
      value: 'text-gray-800',
      label: type || 'Transação',
    }
  }

  const getApiPayload = (response) => {
    const root = response?.data || {}

    return (
      root?.data ||
      root?.body?.data ||
      root?.body ||
      root
    )
  }

  const getApiErrorMessage = (error, fallbackMessage) => {
    return (
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      error?.response?.data?.body?.error ||
      error?.response?.data?.body?.message ||
      error?.message ||
      fallbackMessage
    )
  }

  const extractTokenFromResponse = (response) => {
    const root = response?.data || {}
    const payload = getApiPayload(response)

    return (
      payload?.token ||
      payload?.data?.token ||
      root?.token ||
      root?.data?.token ||
      root?.body?.token ||
      root?.body?.data?.token ||
      null
    )
  }

  const extractUserFromResponse = (response) => {
    const root = response?.data || {}
    const payload = getApiPayload(response)

    return (
      payload?.user ||
      payload?.data?.user ||
      root?.user ||
      root?.data?.user ||
      root?.body?.user ||
      root?.body?.data?.user ||
      null
    )
  }

  const fetchAccounts = async () => {
    try {
      setLoadingAccounts(true)

      const data = await getAccounts()
      const payload = getApiPayload({ data })
      const accountList =
        payload?.accounts ||
        payload?.data ||
        payload ||
        []

      setAccounts(Array.isArray(accountList) ? accountList : [])
    } catch (error) {
      console.error('Erro ao buscar contas:', error)
      alert(getApiErrorMessage(error, 'Erro ao buscar contas'))
    } finally {
      setLoadingAccounts(false)
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
      alert(getApiErrorMessage(error, 'Erro ao realizar depósito'))
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
      alert(getApiErrorMessage(error, 'Erro ao realizar transferência'))
    }
  }

  const handleStatement = async (accountId) => {
    try {
      setStatementOpen(true)
      setStatementLoading(true)

      const data = await getAccountStatement(accountId)
      const payload = getApiPayload({ data })
      const statement = payload?.statement || payload?.data || payload || null

      setStatementData(statement)
    } catch (error) {
      console.error('Erro ao buscar extrato:', error)
      alert(getApiErrorMessage(error, 'Erro ao buscar extrato'))
      setStatementOpen(false)
      setStatementData(null)
    } finally {
      setStatementLoading(false)
    }
  }

  useEffect(() => {
    if (authToken) {
      fetchAccounts()
    }
  }, [authToken])

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

      const receivedToken = extractTokenFromResponse(response)
      const receivedUser = extractUserFromResponse(response)

      if (!receivedToken) {
        console.log('Resposta completa do login:', response?.data)
        setMessage('Login realizado, mas token não foi encontrado.')
        return
      }

      localStorage.setItem('token', receivedToken)
      setAuthToken(receivedToken)

      if (receivedUser) {
        localStorage.setItem('user', JSON.stringify(receivedUser))
        setCurrentUser(receivedUser)
      } else {
        localStorage.removeItem('user')
        setCurrentUser(null)
      }

      setLoginSuccess(true)
      setMessage('Login realizado com sucesso!')
      setEmail('')
      setPassword('')

      await fetchAccounts()
    } catch (error) {
      console.error('Erro ao fazer login:', error)
      setMessage(getApiErrorMessage(error, 'Erro ao fazer login.'))
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')

    setAuthToken('')
    setCurrentUser(null)
    setAccounts([])
    setLoginSuccess(false)
    setMessage('')
    setEmail('')
    setPassword('')
    setStatementOpen(false)
    setStatementData(null)
    setDepositModalOpen(false)
    setTransferModalOpen(false)
    setDepositValue('')
    setTransferValue('')
    setTransferTarget('')
    setSelectedAccount(null)
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

  if (authToken) {
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

            {currentUser && (
              <div className="mt-4 text-sm text-purple-100">
                <p>
                  Usuário: <span className="font-semibold">{currentUser.name}</span>
                </p>
                <p>
                  Perfil: <span className="font-semibold">{currentUser.role}</span>
                </p>
              </div>
            )}

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
                        {formatCurrency(statementData.account?.balance)}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        ID da conta: {statementData.account?.id}
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
            Entre para acessar seu banco digital simulado
          </p>
        </div>

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