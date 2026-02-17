import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  ArrowRight,
  Zap,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Info,
  ShieldQuestion
} from 'lucide-react';
import { ethers } from 'ethers';
import { api } from '../services/api';
import type { RiskResult } from '../types';

const DEFAULT_WALLET = import.meta.env.VITE_DEFAULT_WALLET || '0x000000000000000000000000000000000000dEaD';

export default function SendPage() {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [scanning, setScanning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<RiskResult | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validationError = useMemo(() => {
    if (!recipient || !amount) return null;
    if (!ethers.isAddress(recipient)) return 'Please enter a valid recipient address.';
    if (Number(amount) <= 0) return 'Amount must be greater than 0.';
    return null;
  }, [recipient, amount]);

  const handleScan = async () => {
    if (validationError) return;

    setScanning(true);
    setError(null);
    setResult(null);
    setConfirmed(false);

    try {
      const scan = await api.analyze(DEFAULT_WALLET, recipient, ethers.parseEther(amount).toString());
      setResult(scan);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to run risk analysis right now.');
    } finally {
      setScanning(false);
    }
  };

  const handleExecute = async () => {
    if (!result) return;

    setSubmitting(true);
    setError(null);
    try {
      await api.submitIntent({
        wallet: DEFAULT_WALLET,
        to: recipient,
        value: ethers.parseEther(amount).toString(),
        data: '0x',
        riskScore: result.riskScore,
        classification: result.decision,
        signature: result.signature,
        intentHash: result.intentHash
      });
      setConfirmed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit intent.');
    } finally {
      setSubmitting(false);
    }
  };

  const blockStyle = result?.decision === 'BLOCK';
  const reviewStyle = result?.decision === 'REVIEW';

  return (
    <div className="p-6 lg:p-12 max-w-4xl mx-auto">
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">Send & Scan</h1>
        <p className="text-slate-400 text-lg">Live agent analysis + relayer submission. No mocked scoring.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-6 glass p-8 rounded-3xl border-slate-800">
          <div>
            <label className="block text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Recipient</label>
            <div className="relative">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value.trim())}
                placeholder="0x..."
                className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Amount (tBNB)</label>
            <div className="relative">
              <Zap className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="number"
                min="0"
                step="0.0001"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white"
              />
            </div>
          </div>

          {validationError && <p className="text-sm text-amber-400">{validationError}</p>}
          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            onClick={handleScan}
            disabled={!recipient || !amount || !!validationError || scanning}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3"
          >
            {scanning ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
            {scanning ? 'Running Scan...' : 'Analyze with Agent'}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {!result && !scanning && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-3xl p-8 border-slate-800 text-center">
              <Info className="mx-auto w-10 h-10 text-indigo-400 mb-3" />
              <p className="text-slate-300">Run a scan to view detector scores and execution controls.</p>
            </motion.div>
          )}

          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`glass p-8 rounded-3xl border-2 ${blockStyle ? 'border-red-500/50' : reviewStyle ? 'border-amber-500/50' : 'border-emerald-500/50'}`}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className={`p-4 rounded-2xl ${blockStyle ? 'bg-red-500/20 text-red-500' : reviewStyle ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-500'}`}>
                  {blockStyle ? <ShieldAlert className="w-8 h-8" /> : reviewStyle ? <ShieldQuestion className="w-8 h-8" /> : <ShieldCheck className="w-8 h-8" />}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white">Decision: {result.decision}</h3>
                  <p className="text-slate-400">Risk Score {result.riskScore}/100</p>
                </div>
              </div>

              <p className="text-slate-300 mb-6">{result.reason}</p>

              <div className="space-y-3 mb-8">
                {Object.entries(result.detectors).map(([key, val]) => (
                  <div key={key} className="flex items-center justify-between text-sm">
                    <span className="uppercase text-slate-400">{key}</span>
                    <span className={val.score > 60 ? 'text-red-400' : 'text-emerald-400'}>{val.score}%</span>
                  </div>
                ))}
              </div>

              {confirmed ? (
                <div className="bg-emerald-500/20 text-emerald-400 font-bold py-3 rounded-xl flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5" /> Intent submitted successfully
                </div>
              ) : (
                <button
                  onClick={handleExecute}
                  disabled={blockStyle || submitting}
                  className={`w-full font-black py-4 rounded-2xl flex items-center justify-center gap-3 ${blockStyle ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                  {blockStyle ? 'Execution Blocked by Policy' : 'Submit Intent'}
                </button>
              )}

              {blockStyle && <p className="text-center text-xs text-slate-500 mt-4">High-risk transaction blocked before execution.</p>}
            </motion.div>
          )}

          {scanning && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-3xl p-8 border-slate-800 flex items-center justify-center gap-3 text-indigo-400">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="font-semibold">Scanning contract and ownership patterns...</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-6 flex items-start gap-2 text-xs text-slate-500">
        <AlertCircle className="w-4 h-4 mt-0.5" />
        <p>
          Using configured wallet <span className="font-mono text-slate-400">{DEFAULT_WALLET}</span>. Set <span className="font-mono">VITE_DEFAULT_WALLET</span> for your environment.
        </p>
      </div>
    </div>
  );
}
