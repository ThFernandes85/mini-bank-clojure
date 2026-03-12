import api from '../api'

export const getAccounts = async () => {
  const response = await api.get('/accounts')
  return response.data
}

export const depositIntoAccount = async (accountId, amount) => {
  const response = await api.post('/deposit', {
    id: Number(accountId),
    amount: Number(amount),
  })

  return response.data
}

export const transferBetweenAccounts = async (fromAccountId, toAccountId, amount) => {
  const response = await api.post('/transfer', {
    'from-id': Number(fromAccountId),
    'to-id': Number(toAccountId),
    amount: Number(amount),
  })

  return response.data
}

export const getAccountStatement = async (accountId) => {
  const response = await api.get(`/accounts/${accountId}/statement`)
  return response.data
}