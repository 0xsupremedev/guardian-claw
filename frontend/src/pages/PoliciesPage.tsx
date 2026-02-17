import { useState } from 'react';
import {
    Shield,
    Lock,
    Unlock,
    Sliders,
    Ban,
    Plus,
    Trash2,
    Search,
    Zap,
    CheckCircle2
} from 'lucide-react';

/**
 * PoliciesPage Component
 * Manages spending limits, blocklists, and risk modes (STRICT/BALANCED/RELAXED)
 */
export default function PoliciesPage() {
    const [riskMode, setRiskMode] = useState('BALANCED');
    const [dailyLimit, setDailyLimit] = useState('10.0');
    const [blocklist, setBlocklist] = useState([
        { address: '0x1234...5678', reason: 'Known Honeypot', date: '2024-02-15' },
        { address: '0x8888...9999', reason: 'Malicious Proxy', date: '2024-02-10' },
    ]);
    const [newBlock, setNewBlock] = useState('');

    const riskModes = [
        { name: 'STRICT', desc: 'Whitelist only. AI blocks all non-verified targets.', color: 'text-red-400' },
        { name: 'BALANCED', desc: 'Standard AI scanning. Blocks high-risk patterns.', color: 'text-indigo-400' },
        { name: 'RELAXED', desc: 'Warning only. AI flags issues but allows override.', color: 'text-emerald-400' },
    ];

    return (
        <div className="p-6 lg:p-12 max-w-6xl mx-auto">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-12">
                <div>
                    <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">Security Policies</h1>
                    <p className="text-slate-400 text-lg">Define the on-chain rules for your GuardianClaw firewall.</p>
                </div>
                <button className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all shadow-xl shadow-indigo-600/20 active:scale-95">
                    <CheckCircle2 className="w-5 h-5" />
                    Save Changes
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Risk Modes */}
                <div className="space-y-6">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] px-2">Risk Enforcement Mode</h3>
                    <div className="space-y-4">
                        {riskModes.map((mode) => (
                            <button
                                key={mode.name}
                                onClick={() => setRiskMode(mode.name)}
                                className={`w-full text-left p-6 rounded-3xl border transition-all relative group overflow-hidden ${riskMode === mode.name
                                        ? 'bg-slate-900 border-indigo-500/50 shadow-2xl shadow-indigo-500/5'
                                        : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                                    }`}
                            >
                                {riskMode === mode.name && (
                                    <div className="absolute top-0 right-0 p-4">
                                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                                    </div>
                                )}
                                <h4 className={`text-xl font-black mb-1 ${riskMode === mode.name ? mode.color : 'text-slate-600'}`}>{mode.name}</h4>
                                <p className="text-xs text-slate-500 leading-relaxed font-medium">{mode.desc}</p>
                            </button>
                        ))}
                    </div>

                    <div className="glass p-6 rounded-3xl border-slate-800 mt-8">
                        <div className="flex items-center gap-3 mb-4">
                            <Sliders className="w-5 h-5 text-indigo-400" />
                            <h4 className="font-bold text-white">Daily Spending Limit</h4>
                        </div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-4">Max tBNB per 24 hours</p>
                        <div className="flex items-center gap-4">
                            <input
                                type="text"
                                value={dailyLimit}
                                onChange={(e) => setDailyLimit(e.target.value)}
                                className="flex-1 bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-white font-bold text-xl focus:outline-none focus:border-indigo-500 transition-colors"
                            />
                            <span className="font-black text-slate-600">tBNB</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-3 italic">Limit resets daily at 00:00 UTC</p>
                    </div>
                </div>

                {/* Right: Blocklist Management */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="glass rounded-3xl p-8 border-slate-800 h-full">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-xl font-black text-white">Firewall Blocklist</h3>
                                <p className="text-xs text-slate-500 font-medium">Addresses on this list are blocked on-chain, even if AI bypasses.</p>
                            </div>
                            <div className="bg-red-500/10 text-red-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-500/20">
                                {blocklist.length} Blocked
                            </div>
                        </div>

                        <div className="relative mb-6">
                            <input
                                type="text"
                                placeholder="Block new address (0x...)"
                                value={newBlock}
                                onChange={(e) => setNewBlock(e.target.value)}
                                className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-red-500 transition-all font-mono text-sm"
                            />
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-600">
                                <Ban className="w-5 h-5" />
                            </div>
                            <button className="absolute right-3 top-3 bg-red-600 hover:bg-red-500 text-white p-2 rounded-xl transition-colors">
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {blocklist.map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-red-500/20 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-red-500/5 text-red-500/40 rounded-xl group-hover:text-red-500 transition-colors">
                                            <Lock className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-mono text-sm text-white">{item.address}</p>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">{item.reason} • Added {item.date}</p>
                                        </div>
                                    </div>
                                    <button className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}

                            {blocklist.length === 0 && (
                                <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-3xl">
                                    <Unlock className="w-12 h-12 text-slate-800 mx-auto mb-4" />
                                    <p className="text-slate-600 font-bold">Blocklist is empty</p>
                                    <p className="text-xs text-slate-700">Add malicious addresses to ensure they stay blocked.</p>
                                </div>
                            )}
                        </div>

                        <div className="mt-10 p-6 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
                            <div className="flex gap-4">
                                <Shield className="w-6 h-6 text-indigo-400 shrink-0" />
                                <div>
                                    <h4 className="text-sm font-bold text-white mb-1">Global Intelligence Sharing</h4>
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        GuardianClaw automatically synchronizes with the Global Scam Registry. High-confidence malicious actors are automatically added to your local blocklist in <span className="text-indigo-400">BALANCED</span> mode.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
