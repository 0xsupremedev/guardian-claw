import { useState, useEffect } from 'react';
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
    Info
} from 'lucide-react';
import { ethers } from 'ethers';

/**
 * SendPage Component
 * Handles transaction creation, agent scanning, and EIP-712 submission
 */
export default function SendPage() {
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');
    const [scanning, setScanning] = useState(false);
    const [result, setResult] = useState<null | {
        decision: 'ALLOW' | 'BLOCK' | 'REVIEW';
        riskScore: number;
        reason: string;
        detectors: any;
    }>(null);
    const [confirmed, setConfirmed] = useState(false);

    const mockScan = async () => {
        setScanning(true);
        setResult(null);
        setConfirmed(false);

        // Simulate agent processing
        await new Promise(r => setTimeout(r, 2500));

        // Simple logic for demo: if starts with 0x0...0 or ends in 13, its a honeypot
        const isHoneypot = recipient.toLowerCase().includes('dead') || recipient.endsWith('13');

        if (isHoneypot) {
            setResult({
                decision: 'BLOCK',
                riskScore: 92,
                reason: 'Honeypot signature detected in bytecode. Sell function is restricted.',
                detectors: {
                    honeypot: { flagged: true, score: 95 },
                    liquidity: { flagged: false, score: 10 },
                    ownership: { flagged: true, score: 85 }
                }
            });
        } else {
            setResult({
                decision: 'ALLOW',
                riskScore: 8,
                reason: 'Transaction appears safe. Destination contract has high trust score.',
                detectors: {
                    honeypot: { flagged: false, score: 0 },
                    liquidity: { flagged: false, score: 12 },
                    ownership: { flagged: false, score: 5 }
                }
            });
        }
        setScanning(false);
    };

    const handleExecute = () => {
        setConfirmed(true);
    };

    return (
        <div className="p-6 lg:p-12 max-w-4xl mx-auto">
            <div className="mb-12">
                <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">Send & Scan</h1>
                <p className="text-slate-400 text-lg">AI-powered scanning for every outgoing transaction.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Left: Input Form */}
                <div className="space-y-8">
                    <div className="glass p-8 rounded-3xl border-slate-800">
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Recipient Address</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-500 transition-colors">
                                        <Search className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="text"
                                        value={recipient}
                                        onChange={(e) => setRecipient(e.target.value)}
                                        placeholder="0x... or ENS"
                                        className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-mono"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Amount (tBNB)</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-500 transition-colors">
                                        <Zap className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={mockScan}
                                disabled={!recipient || !amount || scanning}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                            >
                                {scanning ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                                {scanning ? 'Analyzing Transaction...' : 'Scan with OpenClaw AI'}
                            </button>
                        </div>
                    </div>

                    <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6">
                        <div className="flex gap-4">
                            <div className="p-2 bg-indigo-500/10 rounded-lg h-fit">
                                <Info className="w-5 h-5 text-indigo-400" />
                            </div>
                            <div>
                                <h4 className="font-bold text-white text-sm mb-1">Non-Custodial Agent</h4>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    The GuardianClaw agent never takes control of your keys. It provides a signed attestation (EIP-712) that satisfies your wallet's on-chain policy requirements.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Results / Scanning Animation */}
                <div className="relative flex flex-col justify-center min-h-[400px]">
                    <AnimatePresence mode="wait">
                        {!scanning && !result && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-center space-y-4"
                            >
                                <div className="w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center mx-auto text-slate-700 border-2 border-dashed border-slate-800">
                                    <ShieldCheck className="w-12 h-12" />
                                </div>
                                <h3 className="text-slate-500 font-bold uppercase tracking-widest text-sm">Waiting for Scan</h3>
                                <p className="text-slate-600 text-sm max-w-[200px] mx-auto">Input a destination to begin AI risk assessment.</p>
                            </motion.div>
                        )}

                        {scanning && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="flex flex-col items-center justify-center"
                            >
                                <div className="relative w-48 h-48 mb-8">
                                    <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20"></div>
                                    <motion.div
                                        className="absolute inset-0 rounded-full border-t-4 border-indigo-500"
                                        animate={{ rotate: 360 }}
                                        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                    ></motion.div>
                                    <div className="absolute inset-4 rounded-full bg-indigo-500/5 flex flex-col items-center justify-center text-center p-4">
                                        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-2" />
                                        <p className="text-xs font-black uppercase text-indigo-400 tracking-tighter">AI SCANNING</p>
                                    </div>
                                </div>
                                <div className="space-y-4 text-center">
                                    <p className="text-indigo-400 font-bold animate-pulse">Running Honeypot Detectors...</p>
                                    <div className="flex gap-1 justify-center">
                                        {[0, 1, 2, 3].map(i => <div key={i} className="w-12 h-1 bg-indigo-500/20 rounded-full overflow-hidden"><motion.div initial={{ x: -50 }} animate={{ x: 50 }} transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }} className="w-full h-full bg-indigo-500"></motion.div></div>)}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {result && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`glass p-8 rounded-3xl border-2 ${result.decision === 'BLOCK' ? 'border-red-500/50 shadow-2xl shadow-red-500/10' : 'border-emerald-500/50 shadow-2xl shadow-emerald-500/10'}`}
                            >
                                <div className="flex items-center gap-4 mb-6">
                                    <div className={`p-4 rounded-2xl ${result.decision === 'BLOCK' ? 'bg-red-500/20 text-red-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                                        {result.decision === 'BLOCK' ? <ShieldAlert className="w-10 h-10" /> : <ShieldCheck className="w-10 h-10" />}
                                    </div>
                                    <div>
                                        <h3 className={`text-2xl font-black ${result.decision === 'BLOCK' ? 'text-red-500' : 'text-emerald-500'}`}>{result.decision === 'BLOCK' ? 'RISK DETECTED' : 'SAFE TRANSACTION'}</h3>
                                        <p className="text-slate-400 font-medium">Risk Score: <span className="text-white font-bold">{result.riskScore}/100</span></p>
                                    </div>
                                </div>

                                <div className="bg-slate-900/60 rounded-2xl p-6 mb-8">
                                    <p className="text-white font-semibold mb-2">Agent Reason:</p>
                                    <p className="text-slate-400 text-sm leading-relaxed">{result.reason}</p>
                                </div>

                                <div className="space-y-4 mb-10">
                                    {Object.entries(result.detectors).map(([key, val]: [string, any]) => (
                                        <div key={key} className="flex items-center justify-between group">
                                            <span className="text-sm font-bold text-slate-500 uppercase tracking-widest group-hover:text-slate-300 transition-colors">{key}</span>
                                            <div className="flex items-center gap-3">
                                                <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full transition-all duration-1000 ${val.score > 60 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${val.score}%` }}></div>
                                                </div>
                                                <span className={`text-xs font-black ${val.score > 60 ? 'text-red-400' : 'text-emerald-400'}`}>{val.score}%</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {confirmed ? (
                                    <motion.div
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="bg-emerald-500 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/20"
                                    >
                                        <CheckCircle2 className="w-6 h-6" />
                                        TRANSACTION CONFIRMED
                                    </motion.div>
                                ) : (
                                    <button
                                        onClick={handleExecute}
                                        disabled={result.decision === 'BLOCK'}
                                        className={`w-full font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-3 active:scale-[0.98] ${result.decision === 'BLOCK'
                                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                                                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/20'
                                            }`}
                                    >
                                        {result.decision === 'BLOCK' ? 'Execution Prevented' : 'Confirm & Execute'}
                                        <ArrowRight className="w-5 h-5" />
                                    </button>
                                )}

                                {result.decision === 'BLOCK' && (
                                    <p className="text-center text-[10px] text-slate-500 mt-4 uppercase tracking-tighter">On-chain Policy (PolicyGuard) will revert this attempt instantly.</p>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
