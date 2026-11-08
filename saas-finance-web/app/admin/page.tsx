'use client';

import { useState, useEffect } from 'react';

interface Transaction {
  id: string;
  type: 'CASH-IN' | 'CASH-OUT';
  operator: string;
  clientIdentifier?: string;
  recipientIdentifier?: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
}

interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: 'GUICHETIER' | 'COMPTABLE' | 'ADMIN';
  status: 'Actif' | 'Suspendu';
}

const OPERATORS = [
  'M-Pesa', 
  'Airtel Money', 
  'Orange Money', 
  'Illicocash', 
  'Equity Cash', 
  'Western Union', 
  'MoneyGram'
];

export default function AdminDashboardPage() {
  const [currentUserRole, setCurrentUserRole] = useState<'GUICHETIER' | 'COMPTABLE' | 'ADMIN'>('ADMIN');
  const [activeTab, setActiveTab] = useState<'history' | 'cash-in' | 'cash-out' | 'caisse' | 'comptabilite' | 'users'>('history');
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedOperatorFilter, setSelectedOperatorFilter] = useState<string>('ALL');

  const [operator, setOperator] = useState<string>('M-Pesa');
  const [identifier, setIdentifier] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [currency, setCurrency] = useState<string>('USD');
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Caisse
  const [fondInitialUSD, setFondInitialUSD] = useState<string>('1000');
  const [fondInitialCDF, setFondInitialCDF] = useState<string>('2500000');
  const [clotureSuccess, setClotureSuccess] = useState<string | null>(null);

  // Utilisateurs
  const [usersList, setUsersList] = useState<UserAccount[]>([
    { id: 'USR-001', name: 'Jean-Paul Kabeya', email: 'jp.kabeya@guichet-rdc.cd', role: 'GUICHETIER', status: 'Actif' },
    { id: 'USR-002', name: 'Chantal Tshisekedi', email: 'c.tshisekedi@guichet-rdc.cd', role: 'COMPTABLE', status: 'Actif' },
    { id: 'USR-003', name: 'Patrick Mukendi', email: 'admin@guichet-rdc.cd', role: 'ADMIN', status: 'Actif' },
  ]);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'GUICHETIER' | 'COMPTABLE' | 'ADMIN'>('GUICHETIER');

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:4000/api/transactions/history');
      const data = await res.json();
      if (data.success) {
        setTransactions(data.transactions);
      }
    } catch (err) {
      console.error("Erreur de connexion au backend", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Fonction avec Redirection vers la plateforme de l'opérateur / client
  const handleRedirectionTransaction = async (type: 'CASH-IN' | 'CASH-OUT') => {
    if (!amount || !identifier) {
      setFeedback({ success: false, message: 'Veuillez remplir tous les champs obligatoires.' });
      return;
    }

    try {
      setSubmitting(true);
      setFeedback(null);

      // 1. Enregistrement initial dans la base de données via le backend
      const endpoint = type === 'CASH-IN' 
        ? 'http://localhost:4000/api/transactions/cash-in' 
        : 'http://localhost:4000/api/transactions/cash-out';
      
      const bodyData = type === 'CASH-IN' 
        ? { operator, clientIdentifier: identifier, amount: Number(amount), currency }
        : { operator, recipientIdentifier: identifier, secretCode: code, amount: Number(amount), currency };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      });

      const data = await res.json();
      if (data.success) {
        // 2. Générer l'URL de redirection partenaire selon l'opérateur sélectionné
        let partnerUrl = 'https://dashboard.guichet-rdc.cd/gateway';
        switch (operator.toLowerCase()) {
          case 'm-pesa':
            partnerUrl = `https://mpesa.merchant.cd/pay?phone=${identifier}&amount=${amount}&currency=${currency}`;
            break;
          case 'airtel money':
            partnerUrl = `https://airtelmoney.airtel.cd/portal?msisdn=${identifier}&sum=${amount}&cur=${currency}`;
            break;
          case 'orange money':
            partnerUrl = `https://orangemoney.orange.cd/portal/pay?phone=${identifier}&amount=${amount}`;
            break;
          case 'illicocash':
            partnerUrl = `https://illicocash.rawbank.cd/checkout?account=${identifier}&value=${amount}`;
            break;
          case 'equity cash':
            partnerUrl = `https://equitybcdc.digital/pay?acc=${identifier}&amt=${amount}`;
            break;
          default:
            partnerUrl = `https://transfer-gateway.cd/portal?op=${operator}&ref=${identifier}&amount=${amount}`;
            break;
        }

        // 3. Ouvrir la plateforme partenaire dans un nouvel onglet pour la finalisation
        window.open(partnerUrl, '_blank');

        setFeedback({ 
          success: true, 
          message: `${type} enregistré (ID: ${data.transaction.id}). Redirection vers le portail ${operator} effectuée pour finalisation.` 
        });

        setIdentifier('');
        setCode('');
        setAmount('');
        fetchTransactions();
      } else {
        setFeedback({ success: false, message: data.message || 'Une erreur est survenue.' });
      }
    } catch (err) {
      setFeedback({ success: false, message: 'Erreur de communication avec le serveur backend.' });
    } finally {
      setSubmitting(false);
    }
  };

  const totalUSDIn = transactions.filter(t => t.type === 'CASH-IN' && t.currency === 'USD').reduce((acc, t) => acc + Number(t.amount), 0);
  const totalUSDOut = transactions.filter(t => t.type === 'CASH-OUT' && t.currency === 'USD').reduce((acc, t) => acc + Number(t.amount), 0);
  const totalCDFIn = transactions.filter(t => t.type === 'CASH-IN' && t.currency === 'CDF').reduce((acc, t) => acc + Number(t.amount), 0);
  const totalCDFOut = transactions.filter(t => t.type === 'CASH-OUT' && t.currency === 'CDF').reduce((acc, t) => acc + Number(t.amount), 0);

  const soldeActuelUSD = Number(fondInitialUSD) + totalUSDIn - totalUSDOut;
  const soldeActuelCDF = Number(fondInitialCDF) + totalCDFIn - totalCDFOut;

  const volumeGlobalUSD = totalUSDIn + totalUSDOut;
  const volumeGlobalCDF = totalCDFIn + totalCDFOut;
  const commissionEstimeeUSD = volumeGlobalUSD * 0.015;
  const commissionEstimeeCDF = volumeGlobalCDF * 0.015;

  const filteredTransactions = transactions.filter(t => {
    if (selectedOperatorFilter === 'ALL') return true;
    return t.operator?.toLowerCase() === selectedOperatorFilter.toLowerCase();
  });

  const exportToCSV = () => {
    const headers = "ID,Type,Operateur,Client/Compte,Montant,Devise,Statut,Date\n";
    const rows = transactions.map(t => 
      `"${t.id}","${t.type}","${t.operator}","${t.clientIdentifier || t.recipientIdentifier || ''}","${t.amount}","${t.currency}","${t.status}","${t.createdAt}"`
    ).join("\n");
    
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `rapport_caisse_rdc_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClotureCaisse = () => {
    const dateStr = new Date().toLocaleDateString();
    setClotureSuccess(`Clôture de caisse validée pour la journée du ${dateStr}. Solde arrêté : ${soldeActuelUSD.toLocaleString()} USD et ${soldeActuelCDF.toLocaleString()} CDF.`);
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail) return;
    const newUser: UserAccount = {
      id: `USR-00${usersList.length + 1}`,
      name: newUserName,
      email: newUserEmail,
      role: newUserRole,
      status: 'Actif'
    };
    setUsersList([...usersList, newUser]);
    setNewUserName('');
    setNewUserEmail('');
  };

  return (
    <div className="p-8 max-w-7xl mx-auto text-white min-h-screen bg-slate-950">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Guichet Financier RDC</h1>
          <p className="text-gray-400 text-sm mt-1">Plateforme unifiée d'opérations et de gestion de caisse en temps réel.</p>
        </div>
        <div className="flex items-center gap-4 bg-slate-900 p-3 rounded-2xl border border-slate-800">
          <div className="text-right">
            <p className="text-xs text-gray-400">Profil Actif (Simulateur)</p>
            <p className="text-sm font-bold text-blue-400">{currentUserRole}</p>
          </div>
          <select
            value={currentUserRole}
            onChange={(e) => {
              const role = e.target.value as 'GUICHETIER' | 'COMPTABLE' | 'ADMIN';
              setCurrentUserRole(role);
              if (role === 'GUICHETIER' && (activeTab !== 'cash-in' && activeTab !== 'cash-out')) {
                setActiveTab('cash-in');
              }
            }}
            className="bg-slate-800 border border-slate-700 text-xs rounded-xl px-3 py-2 text-white focus:outline-none"
          >
            <option value="ADMIN">Admin (Accès Total)</option>
            <option value="COMPTABLE">Comptable / Superviseur</option>
            <option value="GUICHETIER">Guichetier (Opérations)</option>
          </select>
        </div>
      </div>

      {/* --- ONGLET NAVIGATION --- */}
      <div className="flex border-b border-slate-800 mb-8 gap-6 overflow-x-auto">
        {(currentUserRole === 'ADMIN' || currentUserRole === 'COMPTABLE') && (
          <button
            onClick={() => { setActiveTab('history'); setFeedback(null); }}
            className={`pb-4 px-2 font-semibold text-sm transition border-b-2 whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'history' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            📊 Tableau de Bord & Historique
          </button>
        )}

        <button
          onClick={() => { setActiveTab('cash-in'); setFeedback(null); }}
          className={`pb-4 px-2 font-semibold text-sm transition border-b-2 whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'cash-in' ? 'border-green-500 text-green-400' : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          📥 Nouveau Cash-In (Dépôt)
        </button>

        <button
          onClick={() => { setActiveTab('cash-out'); setFeedback(null); }}
          className={`pb-4 px-2 font-semibold text-sm transition border-b-2 whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'cash-out' ? 'border-red-500 text-red-400' : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          📤 Nouveau Cash-Out (Retrait)
        </button>

        {(currentUserRole === 'ADMIN' || currentUserRole === 'COMPTABLE') && (
          <button
            onClick={() => { setActiveTab('caisse'); setFeedback(null); setClotureSuccess(null); }}
            className={`pb-4 px-2 font-semibold text-sm transition border-b-2 whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'caisse' ? 'border-amber-500 text-amber-400' : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            💰 Caisse & Clôture
          </button>
        )}

        {(currentUserRole === 'ADMIN' || currentUserRole === 'COMPTABLE') && (
          <button
            onClick={() => { setActiveTab('comptabilite'); setFeedback(null); }}
            className={`pb-4 px-2 font-semibold text-sm transition border-b-2 whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'comptabilite' ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            📈 Comptabilité & Commissions
          </button>
        )}

        {currentUserRole === 'ADMIN' && (
          <button
            onClick={() => { setActiveTab('users'); setFeedback(null); }}
            className={`pb-4 px-2 font-semibold text-sm transition border-b-2 whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'users' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            🛡️ Utilisateurs & Accréditations
          </button>
        )}
      </div>

      {/* --- HISTORIQUE --- */}
      {activeTab === 'history' && (currentUserRole === 'ADMIN' || currentUserRole === 'COMPTABLE') && (
        <div>
          <div className="flex justify-end gap-3 mb-6">
            <button onClick={exportToCSV} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition shadow flex items-center gap-2">
              📥 Exporter Rapport CSV
            </button>
            <button onClick={fetchTransactions} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition shadow flex items-center gap-2">
              🔄 Actualiser
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow">
              <p className="text-gray-400 text-xs font-semibold uppercase">Total Dépôts (USD)</p>
              <p className="text-2xl font-bold text-green-400 mt-2">{totalUSDIn.toLocaleString()} USD</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow">
              <p className="text-gray-400 text-xs font-semibold uppercase">Total Retraits (USD)</p>
              <p className="text-2xl font-bold text-red-400 mt-2">{totalUSDOut.toLocaleString()} USD</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow">
              <p className="text-gray-400 text-xs font-semibold uppercase">Total Dépôts (CDF)</p>
              <p className="text-2xl font-bold text-green-400 mt-2">{totalCDFIn.toLocaleString()} CDF</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow">
              <p className="text-gray-400 text-xs font-semibold uppercase">Total Retraits (CDF)</p>
              <p className="text-2xl font-bold text-red-400 mt-2">{totalCDFOut.toLocaleString()} CDF</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-6 bg-slate-900 p-4 rounded-2xl border border-slate-800">
            <span className="text-sm font-semibold text-gray-400 mr-2">Filtrer par canal :</span>
            <button
              onClick={() => setSelectedOperatorFilter('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition ${selectedOperatorFilter === 'ALL' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-gray-300 hover:bg-slate-700'}`}
            >
              Tous
            </button>
            {OPERATORS.map(op => (
              <button
                key={op}
                onClick={() => setSelectedOperatorFilter(op)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition ${selectedOperatorFilter.toLowerCase() === op.toLowerCase() ? 'bg-blue-600 text-white' : 'bg-slate-800 text-gray-300 hover:bg-slate-700'}`}
              >
                {op}
              </button>
            ))}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 font-semibold text-lg flex justify-between items-center">
              <span>Journal des Opérations</span>
              <span className="text-xs text-gray-400">{filteredTransactions.length} transaction(s)</span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-gray-400">Chargement des données...</div>
            ) : filteredTransactions.length === 0 ? (
              <div className="p-16 text-center text-gray-500">Aucune transaction trouvée pour ce filtre.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-800/60 text-gray-400 text-xs uppercase tracking-wider">
                      <th className="p-4">ID Transaction</th>
                      <th className="p-4">Type</th>
                      <th className="p-4">Opérateur / Réseau</th>
                      <th className="p-4">Compte / Client</th>
                      <th className="p-4">Montant</th>
                      <th className="p-4">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-sm">
                    {filteredTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-4 font-mono text-blue-400">{tx.id}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${tx.type === 'CASH-IN' ? 'bg-green-950 text-green-400 border border-green-800' : 'bg-red-950 text-red-400 border border-red-800'}`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className="p-4 font-medium">{tx.operator}</td>
                        <td className="p-4 text-gray-300">{tx.clientIdentifier || tx.recipientIdentifier || 'N/A'}</td>
                        <td className="p-4 font-bold">{Number(tx.amount).toLocaleString()} {tx.currency}</td>
                        <td className="p-4">
                          <span className="flex items-center gap-1.5 text-green-400 font-medium">
                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- CASH-IN AVEC REDIRECTION --- */}
      {activeTab === 'cash-in' && (
        <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl">
          <h2 className="text-xl font-bold mb-2 text-green-400">Effectuer un Dépôt (Cash-In)</h2>
          <p className="text-gray-400 text-xs mb-6">En validant, la transaction est enregistrée en caisse et une redirection vers le portail de l'opérateur est ouverte.</p>
          
          {feedback && (
            <div className={`p-4 mb-6 rounded-xl text-sm font-medium ${feedback.success ? 'bg-green-950 text-green-300 border border-green-800' : 'bg-red-950 text-red-300 border border-red-800'}`}>
              {feedback.message}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">Canal / Réseau de Paiement</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {OPERATORS.map(op => (
                  <button
                    key={op}
                    type="button"
                    onClick={() => setOperator(op)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-medium transition border ${operator === op ? 'bg-green-600 border-green-500 text-white' : 'bg-slate-800 border-slate-700 text-gray-300 hover:bg-slate-700'}`}
                  >
                    {op}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">Numéro de Téléphone / Compte du Client</label>
              <input
                type="text"
                placeholder="Ex: 0815566300"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500 transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">Montant du Dépôt</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">Devise</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500 transition"
                >
                  <option value="USD">USD ($)</option>
                  <option value="CDF">CDF (FC)</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => handleRedirectionTransaction('CASH-IN')}
              disabled={submitting}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl transition shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? 'Traitement en cours...' : `Valider & Rediriger vers ${operator} ↗`}
            </button>
          </div>
        </div>
      )}

      {/* --- CASH-OUT AVEC REDIRECTION --- */}
      {activeTab === 'cash-out' && (
        <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl">
          <h2 className="text-xl font-bold mb-2 text-red-400">Effectuer un Retrait (Cash-Out)</h2>
          <p className="text-gray-400 text-xs mb-6">En validant, l'opération est enregistrée en caisse et le portail de décaissement de l'opérateur est ouvert.</p>
          
          {feedback && (
            <div className={`p-4 mb-6 rounded-xl text-sm font-medium ${feedback.success ? 'bg-green-950 text-green-300 border border-green-800' : 'bg-red-950 text-red-300 border border-red-800'}`}>
              {feedback.message}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">Canal / Réseau de Paiement</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {OPERATORS.map(op => (
                  <button
                    key={op}
                    type="button"
                    onClick={() => setOperator(op)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-medium transition border ${operator === op ? 'bg-red-600 border-red-500 text-white' : 'bg-slate-800 border-slate-700 text-gray-300 hover:bg-slate-700'}`}
                  >
                    {op}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">Numéro de Téléphone / Compte du Client</label>
              <input
                type="text"
                placeholder="Ex: 099840616"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">Code de Retrait (Optionnel / Requis)</label>
              <input
                type="text"
                placeholder="Ex: 123456"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">Montant du Retrait</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">Devise</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition"
                >
                  <option value="USD">USD ($)</option>
                  <option value="CDF">CDF (FC)</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => handleRedirectionTransaction('CASH-OUT')}
              disabled={submitting}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl transition shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? 'Traitement en cours...' : `Valider & Rediriger vers ${operator} ↗`}
            </button>
          </div>
        </div>
      )}

      {/* --- CAISSE & CLÔTURE --- */}
      {activeTab === 'caisse' && (currentUserRole === 'ADMIN' || currentUserRole === 'COMPTABLE') && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl">
            <h2 className="text-xl font-bold mb-6 text-amber-400 flex items-center gap-2">
              💰 Gestion de Caisse & État des Fonds
            </h2>

            {clotureSuccess && (
              <div className="p-4 mb-6 bg-amber-950 text-amber-300 border border-amber-800 rounded-xl text-sm font-medium">
                {clotureSuccess}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-slate-800/50 p-5 rounded-xl border border-slate-700">
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">Fonds de Roulement Initial (USD)</label>
                <input
                  type="number"
                  value={fondInitialUSD}
                  onChange={(e) => setFondInitialUSD(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 transition font-bold"
                />
              </div>

              <div className="bg-slate-800/50 p-5 rounded-xl border border-slate-700">
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-2">Fonds de Roulement Initial (CDF)</label>
                <input
                  type="number"
                  value={fondInitialCDF}
                  onChange={(e) => setFondInitialCDF(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 transition font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-slate-950 p-6 rounded-xl border border-slate-800">
                <h3 className="text-sm font-bold text-gray-300 uppercase mb-4 tracking-wider">Devise USD ($)</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-400">Fond initial :</span> <span className="font-semibold">{Number(fondInitialUSD).toLocaleString()} USD</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Total Dépôts (In) :</span> <span className="font-semibold text-green-400">+{totalUSDIn.toLocaleString()} USD</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Total Retraits (Out) :</span> <span className="font-semibold text-red-400">-{totalUSDOut.toLocaleString()} USD</span></div>
                  <div className="border-t border-slate-800 pt-3 mt-3 flex justify-between text-base">
                    <span className="font-bold text-amber-400">Solde Actuel en Caisse :</span>
                    <span className="font-extrabold text-amber-400">{soldeActuelUSD.toLocaleString()} USD</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-950 p-6 rounded-xl border border-slate-800">
                <h3 className="text-sm font-bold text-gray-300 uppercase mb-4 tracking-wider">Devise CDF (FC)</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-400">Fond initial :</span> <span className="font-semibold">{Number(fondInitialCDF).toLocaleString()} CDF</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Total Dépôts (In) :</span> <span className="font-semibold text-green-400">+{totalCDFIn.toLocaleString()} CDF</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Total Retraits (Out) :</span> <span className="font-semibold text-red-400">-{totalCDFOut.toLocaleString()} CDF</span></div>
                  <div className="border-t border-slate-800 pt-3 mt-3 flex justify-between text-base">
                    <span className="font-bold text-amber-400">Solde Actuel en Caisse :</span>
                    <span className="font-extrabold text-amber-400">{soldeActuelCDF.toLocaleString()} CDF</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleClotureCaisse}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-4 rounded-xl transition shadow-lg flex items-center justify-center gap-2"
            >
              🔒 Valider et Clôturer la Journée de Caisse
            </button>
          </div>
        </div>
      )}

      {/* --- COMPTABILITÉ & COMMISSIONS --- */}
      {activeTab === 'comptabilite' && (currentUserRole === 'ADMIN' || currentUserRole === 'COMPTABLE') && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl">
            <h2 className="text-xl font-bold mb-6 text-purple-400 flex items-center gap-2">
              📈 Comptabilité Générale & Suivi des Commissions
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-slate-950 p-6 rounded-xl border border-slate-800">
                <p className="text-xs font-semibold text-gray-400 uppercase">Chiffre d'Affaires Brut (USD)</p>
                <p className="text-3xl font-extrabold text-purple-400 mt-2">{volumeGlobalUSD.toLocaleString()} USD</p>
                <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between text-sm">
                  <span className="text-gray-400">Commissions estimées (1.5%) :</span>
                  <span className="font-bold text-emerald-400">+{commissionEstimeeUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</span>
                </div>
              </div>

              <div className="bg-slate-950 p-6 rounded-xl border border-slate-800">
                <p className="text-xs font-semibold text-gray-400 uppercase">Chiffre d'Affaires Brut (CDF)</p>
                <p className="text-3xl font-extrabold text-purple-400 mt-2">{volumeGlobalCDF.toLocaleString()} CDF</p>
                <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between text-sm">
                  <span className="text-gray-400">Commissions estimées (1.5%) :</span>
                  <span className="font-bold text-emerald-400">+{commissionEstimeeCDF.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} CDF</span>
                </div>
              </div>
            </div>

            <h3 className="text-lg font-bold text-white mb-4">Ventilation Analytique par Opérateur</h3>
            <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-900 text-gray-400 text-xs uppercase">
                    <th className="p-4">Opérateur / Réseau</th>
                    <th className="p-4">Transactions Totales</th>
                    <th className="p-4">Volume USD</th>
                    <th className="p-4">Volume CDF</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {OPERATORS.map(op => {
                    const opsList = transactions.filter(t => t.operator?.toLowerCase() === op.toLowerCase());
                    const volUSD = opsList.filter(t => t.currency === 'USD').reduce((acc, t) => acc + Number(t.amount), 0);
                    const volCDF = opsList.filter(t => t.currency === 'CDF').reduce((acc, t) => acc + Number(t.amount), 0);
                    return (
                      <tr key={op} className="hover:bg-slate-900/50">
                        <td className="p-4 font-medium">{op}</td>
                        <td className="p-4 text-gray-300">{opsList.length} opération(s)</td>
                        <td className="p-4 font-bold text-blue-400">{volUSD.toLocaleString()} USD</td>
                        <td className="p-4 font-bold text-amber-400">{volCDF.toLocaleString()} CDF</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- UTILISATEURS & ACCRÉDITATIONS --- */}
      {activeTab === 'users' && currentUserRole === 'ADMIN' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl">
            <h2 className="text-xl font-bold mb-6 text-cyan-400 flex items-center gap-2">
              🛡️ Gestion des Utilisateurs & Accréditations
            </h2>

            <form onSubmit={handleAddUser} className="bg-slate-950 p-6 rounded-xl border border-slate-800 mb-8 space-y-4">
              <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Créer un nouvel accès guichet</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Nom complet"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
                <input
                  type="email"
                  placeholder="Email professionnel"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as any)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="GUICHETIER">Guichetier</option>
                  <option value="COMPTABLE">Comptable / Superviseur</option>
                  <option value="ADMIN">Administrateur</option>
                </select>
              </div>
              <button
                type="submit"
                className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition shadow"
              >
                + Ajouter l'utilisateur
              </button>
            </form>

            <h3 className="text-lg font-bold text-white mb-4">Comptes Actifs & Rôles Attribués</h3>
            <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-900 text-gray-400 text-xs uppercase">
                    <th className="p-4">ID</th>
                    <th className="p-4">Nom</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Rôle / Accréditation</th>
                    <th className="p-4">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-900/50">
                      <td className="p-4 font-mono text-cyan-400">{u.id}</td>
                      <td className="p-4 font-medium">{u.name}</td>
                      <td className="p-4 text-gray-300">{u.email}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                          u.role === 'ADMIN' ? 'bg-purple-950 text-purple-400 border border-purple-800' :
                          u.role === 'COMPTABLE' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                          'bg-green-950 text-green-400 border border-green-800'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4 text-emerald-400 font-medium">● {u.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}