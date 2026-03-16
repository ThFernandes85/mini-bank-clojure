const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

async function parseResponse(response) {
  const data = await response.json();
  return data;
}

export async function getPublicBankSummary() {
  const response = await fetch(`${API_URL}/public/bank-summary`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  return await parseResponse(response);
}

export async function login(email, password) {
  const response = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  return await parseResponse(response);
}

export async function getDashboard(token) {
  const response = await fetch(`${API_URL}/dashboard`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  return await parseResponse(response);
}

export async function getBankSummary(token) {
  const response = await fetch(`${API_URL}/admin/bank-summary`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  return await parseResponse(response);
}

export async function deposit(accountId, amount, token) {
  const response = await fetch(`${API_URL}/deposit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      account_id: Number(accountId),
      amount: Number(amount),
    }),
  });

  return await parseResponse(response);
}

export async function transfer(fromAccountId, toAccountId, amount, token) {
  const response = await fetch(`${API_URL}/transfer`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      from_account_id: Number(fromAccountId),
      to_account_id: Number(toAccountId),
      amount: Number(amount),
    }),
  });

  return await parseResponse(response);
}

export async function getExtract(accountId, token) {
  const response = await fetch(`${API_URL}/extract/${accountId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  return await parseResponse(response);
}

export async function registerAccount(payload, token) {
  const response = await fetch(`${API_URL}/admin/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  return await parseResponse(response);
}

export async function closeAccount(accountId, token) {
  const response = await fetch(`${API_URL}/admin/account/${accountId}/close`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  return await parseResponse(response);
}

export async function deleteClientByAccount(accountId, token) {
  const response = await fetch(`${API_URL}/admin/client/by-account/${accountId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  return await parseResponse(response);
}

export async function deleteUserByEmail(email, token) {
  const response = await fetch(`${API_URL}/admin/delete-user-by-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ email }),
  });

  return await parseResponse(response);
}