// services/api.ts

const API_BASE_URL = 'http://localhost:4000/api';

/**
 * Envoie une transaction de dépôt (Cash-In) au backend Express
 */
export async function submitTransaction(payload: any) {
  const response = await fetch(`${API_BASE_URL}/transactions/cash-in`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Erreur lors de la communication avec le serveur backend (Cash-In).');
  }

  return response.json();
}

/**
 * Envoie une transaction de décaissement (Cash-Out) au backend Express
 */
export async function submitCashOut(payload: any) {
  const response = await fetch(`${API_BASE_URL}/transactions/cash-out`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Erreur lors du décaissement (Cash-Out).');
  }

  return response.json();
}

/**
 * Récupère l'historique des transactions pour un agent donné
 */
export async function getTransactionsHistory(agentId: string = 'AGENT-RDC-001') {
  const response = await fetch(`${API_BASE_URL}/transactions/history?agentId=${agentId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error('Impossible de récupérer l\'historique des transactions.');
  }

  return response.json();
}