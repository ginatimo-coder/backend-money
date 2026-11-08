const express = require('express');
const cors = require('cors');

// 1. Initialisation de l'application Express (Évite l'erreur 'app is not defined')
const app = express();
const PORT = 4000;

// 2. Middlewares indispensables
app.use(express.json());
app.use(cors());

// 3. Base de données en mémoire (temporaire pour les tests)
let transactionsDB = [];

// 4. Route POST : Cash-In (Dépôt)
app.post('/api/transactions/cash-in', (req, res) => {
  const { agentId, operator, recipientIdentifier, amount, currency, externalReference } = req.body;
  
  const newTx = {
    id: externalReference || `TX-IN-${Math.floor(10000 + Math.random() * 90000)}`,
    type: 'CASH-IN',
    operator,
    recipientIdentifier,
    amount,
    currency,
    status: 'SUCCESS',
    createdAt: new Date().toISOString()
  };

  transactionsDB.unshift(newTx); // Ajoute la transaction au début de la liste

  return res.status(200).json({
    success: true,
    transactionId: newTx.id,
    message: 'Dépôt effectué avec succès'
  });
});

// 5. Route POST : Cash-Out (Retrait)
app.post('/api/transactions/cash-out', (req, res) => {
  const { agentId, operator, clientIdentifier, withdrawalCode, amount, currency, externalReference } = req.body;
  
  const newTx = {
    id: externalReference || `TX-OUT-${Math.floor(10000 + Math.random() * 90000)}`,
    type: 'CASH-OUT',
    operator,
    clientIdentifier: clientIdentifier || withdrawalCode,
    amount,
    currency,
    status: 'SUCCESS',
    createdAt: new Date().toISOString()
  };

  transactionsDB.unshift(newTx);

  return res.status(200).json({
    success: true,
    transactionId: newTx.id,
    message: 'Décaissement effectué avec succès'
  });
});

// 6. Route GET : Historique des Transactions
app.get('/api/transactions/history', (req, res) => {
  return res.status(200).json({
    success: true,
    transactions: transactionsDB
  });
});

// 7. Démarrage du serveur sur le port 4000
app.listen(PORT, () => {
  console.log(`🚀 Serveur backend démarré et à l'écoute sur le port ${PORT}`);
});