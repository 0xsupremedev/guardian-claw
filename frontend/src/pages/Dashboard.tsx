import { Link } from 'react-router-dom';
import { Shield, Send, LayoutDashboard, Settings, AlertTriangle } from 'lucide-react';

export default function DashboardPage() {
    return (
        <div className="p-6 lg:p-12">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-12">
                <div>
                    <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2 text-gradient">Security Overview</h1>
                    <p className="text-slate-400 text-lg">Protection active across all monitored assets.</p>
                </div>
                <div className="flex gap-4">
                    <div className="glass p-4 rounded-2xl border border-indigo-500/20 text-center min-w-[140px]">
                        <p className="text-2xl font-bold text-white">92.4%</p>
                        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mt-1">Trust Score</p>
                    </div>
                    <div className="glass p-4 rounded-2xl border border-emerald-500/20 text-center min-w-[140px]">
                        <p className="text-2xl font-bold text-emerald-400">12</p>
                        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mt-1">Txs Blocked</p>
                    </div>
                </div>
            </div>

            {/* Hero Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {[
                    { label: 'Wallet Balance', value: '12.45 tBNB', sub: 'opBNB Testnet', icon: Shield },
                    { label: 'Daily Spent', value: '1.20 / 10 BNB', sub: '12.0% of limit', icon: Send },
                    { label: 'Agent Actions', value: '456', sub: 'Simulations run', icon: LayoutDashboard },
                    { label: 'Protection Coverage', value: '100%', sub: 'Real-time', icon: Settings },
                ].map((stat, i) => (
                    <div key={i} className="glass p-6 rounded-3xl relative group overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 blur-3xl transition-all group-hover:bg-indigo-500/10"></div>
                        <stat.icon className="w-8 h-8 text-indigo-500 mb-4" />
                        <p className="text-slate-500 text-sm font-semibold uppercase tracking-tight">{stat.label}</p>
                        <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                        <p className="text-xs text-slate-400 mt-1">{stat.sub}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 glass rounded-3xl p-8 border border-slate-800">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-bold text-white">Recent Interventions</h3>
                        <Link to="/audit" className="text-sm text-indigo-400 font-semibold hover:underline">View All</Link>
                    </div>
                    <div className="space-y-6">
                        {[
                            { type: 'Blocked', target: 'Honeypot Contract', risk: 94, time: '2h ago', tx: '0x12...34' },
                            { type: 'Safe', target: 'PancakeSwap LP', risk: 12, time: '5h ago', tx: '0x88...ab' },
                            { type: 'Blocked', target: 'Suspicious Proxy', risk: 88, time: 'Yesterday', tx: '0xcc...01' },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/40 border border-slate-800/50 hover:border-slate-700 transition-all cursor-pointer group">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-xl ${item.type === 'Blocked' ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                        {item.type === 'Blocked' ? <AlertTriangle className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <p className="font-bold text-white transition-colors group-hover:text-indigo-400">{item.target}</p>
                                        <p className="text-xs text-slate-500">Tx: {item.tx} • {item.time}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`text-sm font-bold ${item.risk > 70 ? 'text-red-400' : 'text-emerald-400'}`}>{item.risk}% Risk</p>
                                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{item.type}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass rounded-3xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent"></div>
                    <div className="relative z-10">
                        <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-indigo-500/50 animate-pulse-slow">
                            <Shield className="w-10 h-10 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2 underline decoration-indigo-500/30 underline-offset-4">Policy Guard</h3>
                        <p className="text-slate-400 text-sm mb-6 leading-relaxed">Your transaction firewall is currently enforcing 4 active security policies on opBNB Testnet.</p>
                        <Link to="/policies" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-slate-950 font-bold rounded-xl hover:bg-slate-200 transition-all shadow-xl shadow-white/5">
                            Configure Policies
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
