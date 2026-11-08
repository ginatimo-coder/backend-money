'use client';

import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownLeft, RefreshCw, Wallet, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react';

export default function GuichetAgentPage() {
  const [txType, setTxType] = useState<'CASH_IN' | 'CASH_OUT'>('CASH_IN');
  // Ajout d'EQUITY_CASH dans les options de la grille
  const [operator, setOperator] = useState<'MPESA' | 'AIRTEL' | 'ORANGE_MONEY' | 'ILLICOCASH' | 'EQUITY_CASH' | 'WESTERN_UNION' | 'MONEYGRAM'>('MPESA');
  const [currency, setCurrency] = useState<'USD' | 'CDF'>('USD');
  const [phoneOrCode, setPhoneOrCode] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [agentBalances] = useState({
    usd: 1250.00,
    cdf: 3500000.00
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('http://localhost:3000/admin/api/cash-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentCashAccountId: 'agent-cash-01',
          clientWalletAccountId: `client-${phoneOrCode}`,
          amount: parseFloat(amount),
          currency: currency,
          externalRef: `TX-${operator}-${Date.now()}`
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: `Opération ${operator} réussie ! Réf: ${data.transactionId || 'OK'}` });
        setPhoneOrCode('');
        setAmount('');
      } else {
        setMessage({ type: 'error', text: data.error || 'Erreur lors du traitement.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Impossible de contacter le serveur backend.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8">
      <header className="max-w-4xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">GUICHET MULTI-RÉSEAU — RDC</h1>
          <p className="text-sm text-slate-400">Station Kinshasa / Lemba • ID: AGENT-9901</p>
        </div>
        
        <div className="flex items-center gap-4 flex-wrap">
          <a
            href="/admin"
            className="bg-slate-800 hover:bg-slate-700 text-emerald-400 px-4 py-2.5 rounded-xl border border-emerald-500/30 text-xs font-bold transition flex items-center gap-2 shadow-lg"
          >
            <ShieldAlert className="w-4 h-4" />
            Espace Admin / Trésorerie ➔
          </a>

          <div className="flex gap-3">
            <div className="bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
              <span className="text-[10px] text-slate-400 block">USD</span>
              <span className="text-sm font-extrabold text-emerald-400">$ {agentBalances.usd.toLocaleString()}</span>
            </div>
            <div className="bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
              <span className="text-[10px] text-slate-400 block">CDF</span>
              <span className="text-sm font-extrabold text-amber-400">{agentBalances.cdf.toLocaleString()} FC</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl">
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            type="button"
            onClick={() => setTxType('CASH_IN')}
            className={`py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition ${
              txType === 'CASH_IN' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50' : 'bg-slate-700 text-slate-300'
            }`}
          >
            <ArrowUpRight className="w-5 h-5" />
            ENCAISSEMENT (Dépôt)
          </button>
          
          <button
            type="button"
            onClick={() => setTxType('CASH_OUT')}
            className={`py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition ${
              txType === 'CASH_OUT' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'bg-slate-700 text-slate-300'
            }`}
          >
            <ArrowDownLeft className="w-5 h-5" />
            DECAISSEMENT (Retrait)
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Sélection complète des réseaux congolais & internationaux */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">CANAL / RÉSEAU DE PAIEMENT</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setOperator('MPESA')}
                className={`py-2 rounded-lg text-xs font-bold border transition ${
                  operator === 'MPESA' ? 'bg-red-600/30 border-red-500 text-red-300' : 'border-slate-700 text-slate-400'
                }`}
              >
                M-Pesa
              </button>
              <button
                type="button"
                onClick={() => setOperator('AIRTEL')}
                className={`py-2 rounded-lg text-xs font-bold border transition ${
                  operator === 'AIRTEL' ? 'bg-red-500/30 border-red-400 text-red-200' : 'border-slate-700 text-slate-400'
                }`}
              >
                Airtel Money
              </button>
              <button
                type="button"
                onClick={() => setOperator('ORANGE_MONEY')}
                className={`py-2 rounded-lg text-xs font-bold border transition ${
                  operator === 'ORANGE_MONEY' ? 'bg-orange-600/30 border-orange-500 text-orange-200' : 'border-slate-700 text-slate-400'
                }`}
              >
                Orange Money
              </button>
              <button
                type="button"
                onClick={() => setOperator('ILLICOCASH')}
                className={`py-2 rounded-lg text-xs font-bold border transition ${
                  operator === 'ILLICOCASH' ? 'bg-blue-600/30 border-blue-400 text-blue-200' : 'border-slate-700 text-slate-400'
                }`}
              >
                Illicocash
              </button>
              <button
                type="button"
                onClick={() => setOperator('EQUITY_CASH')}
                className={`py-2 rounded-lg text-xs font-bold border transition ${
                  operator === 'EQUITY_CASH' ? 'bg-red-800/40 border-red-600 text-red-200' : 'border-slate-700 text-slate-400'
                }`}
              >
                Equity Cash
              </button>
              <button
                type="button"
                onClick={() => setOperator('WESTERN_UNION')}
                className={`py-2 rounded-lg text-xs font-bold border transition ${
                  operator === 'WESTERN_UNION' ? 'bg-yellow-600/30 border-yellow-400 text-yellow-200' : 'border-slate-700 text-slate-400'
                }`}
              >
                Western Union
              </button>
              <button
                type="button"
                onClick={() => setOperator('MONEYGRAM')}
                className={`py-2 rounded-lg text-xs font-bold border transition col-span-1.5 ${
                  operator === 'MONEYGRAM' ? 'bg-red-700/30 border-red-500 text-red-200' : 'border-slate-700 text-slate-400'
                }`}
              >
                MoneyGram
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              {operator === 'WESTERN_UNION' || operator === 'MONEYGRAM' ? 'CODE DE TRANSFERT (MTCN / REF)' : 'NUMÉRO DE COMPTE / TÉLÉPHONE'}
            </label>
            <input
              type="text"
              placeholder={operator === 'WESTERN_UNION' || operator === 'MONEYGRAM' ? 'Ex: 1234567890' : 'Numéro de compte ou de téléphone'}
              value={phoneOrCode}
              onChange={(e) => setPhoneOrCode(e.target.value)}
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 font-mono text-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">MONTANT & DEVISE</label>
            <div className="flex gap-2">
              <input
                type="number"
                step="any"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 font-mono text-xl font-bold"
              />
              <select
                value={currency}
                onChange={(e: any) => setCurrency(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-white font-bold px-4 rounded-xl focus:outline-none focus:border-emerald-500"
              >
                <option value="USD">USD ($)</option>
                <option value="CDF">CDF (FC)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-4 rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-lg disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Wallet className="w-5 h-5" />}
            {loading ? 'TRAITEMENT EN COURS...' : `VALIDER L'OPÉRATION (${operator})`}
          </button>
        </form>

        {message && (
          <div className={`mt-5 p-4 rounded-xl flex items-center gap-3 text-sm font-semibold ${
            message.type === 'success' ? 'bg-emerald-950/80 border border-emerald-500 text-emerald-300' : 'bg-red-950/80 border border-red-500 text-red-300'
          }`}>
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
            <span>{message.text}</span>
          </div>
        )}
      </main>
    </div>
  );
}