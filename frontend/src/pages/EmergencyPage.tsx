import { useState } from 'react';
import {
    AlertTriangle,
    RotateCcw,
    Trash2,
    ShieldX,
    ShieldOff,
    Lock,
    Key,
    ChevronRight,
    Zap,
    CheckCircle2
} from 'lucide-react';

/**
 * EmergencyPage Component
 * Handles critical safety actions: revoking session keys, pausing the wallet, and manual asset recovery.
 */
export default function EmergencyPage() {
    const [revoked, setRevoked] = useState(false);
    const [paused, setPaused] = useState(false);

    return (
        <div className="p-6 lg:p-12 max-w-5xl mx-auto">
            <div className="mb-12">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                    Emergency Protocol Area
                </div>
                <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">Emergency Controls</h1>
                <p className="text-slate-400 text-lg underline decoration-red-500/30 underline-offset-8">Critical actions to secure your assets in case of compromised security.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Revoke Agent Access */}
                <div className="glass rounded-[2rem] p-8 border-slate-800 flex flex-col h-full relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Key className="w-32 h-32 text-indigo-500" />
                    </div>
                    <div className="relative z-10 flex-1">
                        <div className={`p-4 rounded-3xl w-fit mb-6 transition-colors ${revoked ? 'bg-emerald-500/20 text-emerald-500' : 'bg-indigo-500/20 text-indigo-500'}`}>
                            <ShieldX className="w-10 h-10" />
                        </div>
                        <h3 className="text-2xl font-black text-white mb-2">Revoke Agent Session</h3>
                        <p className="text-slate-400 text-sm leading-relaxed mb-8">
                            Instantly invalidate the AI agent's current session key. The agent will lose all ability to suggest or block transactions for your wallet.
                        </p>

                        {revoked ? (
                            <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-2xl font-bold">
                                <CheckCircle2 className="w-5 h-5" />
                                Session Access Revoked
                            </div>
                        ) : (
                            <button
                                onClick={() => setRevoked(true)}
                                className="w-full bg-slate-900 border border-slate-800 hover:border-red-500/50 hover:bg-red-500/5 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-3 active:scale-95"
                            >
                                Revoke Critical Access
                                <Trash2 className="w-5 h-5" />
                            </button>
                        )}

                        <p className="text-[10px] text-slate-600 mt-4 text-center font-bold uppercase tracking-widest">Action requires on-chain transaction</p>
                    </div>
                </div>

                {/* Global Pause */}
                <div className="glass rounded-[2rem] p-8 border-slate-800 flex flex-col h-full relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity text-red-500">
                        <Lock className="w-32 h-32" />
                    </div>
                    <div className="relative z-10 flex-1">
                        <div className={`p-4 rounded-3xl w-fit mb-6 transition-colors ${paused ? 'bg-red-600 text-white' : 'bg-red-500/20 text-red-500'}`}>
                            <ShieldOff className="w-10 h-10" />
                        </div>
                        <h3 className="text-2xl font-black text-white mb-2">Global Wallet Pause</h3>
                        <p className="text-slate-400 text-sm leading-relaxed mb-8">
                            Locks all outgoing transactions from your smart wallet. No funds can move until you manually unpause. Use if you suspect your recovery key is compromised.
                        </p>

                        <button
                            onClick={() => setPaused(!paused)}
                            className={`w-full font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-3 active:scale-95 ${paused ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-red-600 hover:bg-red-500 text-white'
                                }`}
                        >
                            {paused ? 'Resume Transactions' : 'Initiate Lockdown'}
                            {paused ? <RotateCcw className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                        </button>

                        <p className="text-[10px] text-red-500/50 mt-4 text-center font-bold uppercase tracking-widest">
                            {paused ? 'Wallet is currently locked' : 'Immediate effect after confirmation'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Recovery Helper */}
            <div className="mt-8 glass rounded-[2rem] p-10 border-slate-800 bg-gradient-to-br from-indigo-500/[0.03] to-transparent">
                <div className="max-w-3xl">
                    <h3 className="text-xl font-black text-white mb-4">Manual Asset Recovery</h3>
                    <p className="text-slate-400 text-sm leading-relaxed mb-8">
                        If the GuardianClaw interface is inaccessible or the agent is unresponsive, you can always bypass the firewall using your Owner Key directly on the smart contract. This is a non-custodial failsafe that ensures you are never locked out of your own funds.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            'Withdraw to Owner EOA',
                            'Decommission Smart Wallet',
                            'Force Update PolicyGuard',
                            'Export Intervention Keys'
                        ].map((item, i) => (
                            <button key={i} className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 hover:text-white hover:border-indigo-500/50 transition-all font-bold text-sm">
                                {item}
                                <ChevronRight className="w-4 h-4 text-slate-600" />
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-12 flex items-center gap-4 p-6 bg-amber-500/10 border border-amber-500/20 rounded-3xl">
                <Zap className="w-6 h-6 text-amber-500 shrink-0" />
                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                    <span className="text-amber-500 font-black uppercase">Failsafe Mode:</span> In case of any technical failure in our relayers or agent infrastructure, your funds remain secure on-chain. You can interact with the <span className="text-white font-bold underline decoration-blue-500">GuardianWallet</span> contract via opBNBScan using your primary wallet at any time.
                </p>
            </div>
        </div>
    );
}
