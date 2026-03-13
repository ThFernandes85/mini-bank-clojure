import api from '../api'

export const getAccounts = async () => {
  const response = await api.get('/accounts')
  return response.data
}

export const createNewAccount = async (name, balance) => {
  const response = await api.post('/accounts', {
    name,
    balance: Number(balance),
  })
  return response.data
}

export const depositIntoAccount = async (id, amount) => {
  const response = await api.post('/deposit', {
    id: Number(id),
    amount: Number(amount),
  })
  return response.data
}

export const transferBetweenAccounts = async (fromId, toId, amount) => {
  const response = await api.post('/transfer', {
    'from-id': Number(fromId),
    'to-id': Number(toId),
    amount: Number(amount),
  })
  return response.data
}

export const getAccountStatement = async (id) => {
  const response = await api.get(`/accounts/${id}/statement`)
  return response.data
}