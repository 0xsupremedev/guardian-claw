import { useState } from 'react';
import {
    History,
    ExternalLink,
    FileSearch,
    ShieldCheck,
    ShieldAlert,
    ArrowUpRight,
    Filter,
    Download,
    Info,
    Zap
} from 'lucide-react';

/**
 * AuditPage Component
 * Displays the intervention history and references to on-chain AuditNFTs
 */
export default function AuditPage() {
    const [filter, setFilter] = useState('ALL');

    const interventions = [
        {
            id: 4,
            type: 'BLOCKED',
            target: '0x1a2b...3c4d',
            name: 'Unverified Token Swap',
            risk: 92,
            reason: 'Sell tax exceeding 99% (Honeypot)',
            time: '1h 24m ago',
            tx: '0xabc...def',
            nft: '45'
        },
        {
            id: 3,
            type: 'SAFE',
            target: '0x pancake...router',
            name: 'PancakeSwap V3 Router',
            risk: 5,
            reason: 'Known official router contract.',
            time: '4h 12m ago',
            tx: '0x789...012',
            nft: '44'
        },
        {
            id: 2,
            type: 'BLOCKED',
            target: '0x ffff...dead',
            name: 'Malicious Mint Attempt',
            risk: 88,
            reason: 'Unauthorized mint() sequence detected.',
            time: 'Yesterday',
            tx: '0x555...666',
            nft: '43'
        },
        {
            id: 1,
            type: 'REVOKED',
            target: 'Agent Node #4',
            name: 'Session Key Revocation',
            risk: 0,
            reason: 'User manual emergency revocation.',
            time: '2 days ago',
            tx: '0x111...222',
            nft: '42'
        },
    ];

    return (
        <div className="p-6 lg:p-12 max-w-6xl mx-auto">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-12">
                <div>
                    <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">Audit Trail</h1>
                    <p className="text-slate-400 text-lg">Immutable history of AI interventions and security actions.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 text-slate-400 font-bold rounded-xl hover:text-white transition-all">
                        <Filter className="w-4 h-4" />
                        Filter
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 text-slate-400 font-bold rounded-xl hover:text-white transition-all">
                        <Download className="w-4 h-4" />
                        Export CSV
                    </button>
                </div>
            </div>

            <div className="space-y-6">
                {interventions.map((item) => (
                    <div key={item.id} className="glass rounded-[2rem] p-8 border-slate-800 relative group transition-all hover:border-indigo-500/30">
                        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                            <div className="flex items-center gap-6">
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${item.type === 'BLOCKED' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                                    item.type === 'SAFE' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                                        'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                    }`}>
                                    {item.type === 'BLOCKED' ? <ShieldAlert className="w-8 h-8" /> :
                                        item.type === 'SAFE' ? <ShieldCheck className="w-8 h-8" /> :
                                            <History className="w-8 h-8" />}
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="text-xl font-bold text-white tracking-tight">{item.name}</h3>
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${item.type === 'BLOCKED' ? 'bg-red-500/20 text-red-400' :
                                            item.type === 'SAFE' ? 'bg-emerald-500/20 text-emerald-400' :
                                                'bg-indigo-500/20 text-indigo-400'
                                            }`}>
                                            {item.type}
                                        </span>
                                    </div>
                                    <p className="font-mono text-xs text-slate-500 mb-2">{item.target}</p>
                                    <p className="text-sm text-slate-400 max-w-xl leading-relaxed">{item.reason}</p>
                                </div>
                            </div>

                            <div className="flex lg:flex-col items-center lg:items-end justify-between w-full lg:w-auto gap-4 lg:gap-2">
                                <div className="text-right">
                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-tighter">Intervention ID</p>
                                    <p className="text-xl font-black text-white">#000{item.id}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-400 font-medium">{item.time}</p>
                                    <div className={`text-xs font-bold mt-1 ${item.risk > 70 ? 'text-red-400' : 'text-emerald-400'}`}>
                                        {item.risk}% Risk Confidence
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-800/50 flex flex-wrap items-center justify-between gap-4">
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2 bg-slate-900/40 px-4 py-2 rounded-xl border border-slate-800/50">
                                    <Zap className="w-3.5 h-3.5 text-indigo-400" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AuditNFT #{item.nft}</span>
                                </div>
                                <div className="flex items-center gap-2 bg-slate-900/40 px-4 py-2 rounded-xl border border-slate-800/50">
                                    <FileSearch className="w-3.5 h-3.5 text-slate-500" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tx: {item.tx}</span>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button className="flex items-center gap-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
                                    Verify NFT <ArrowUpRight className="w-3 h-3" />
                                </button>
                                <span className="text-slate-700">|</span>
                                <button className="flex items-center gap-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
                                    View Payload <ExternalLink className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-12 p-8 rounded-[2rem] bg-indigo-600/5 border border-indigo-600/10">
                <div className="flex gap-6">
                    <div className="w-12 h-12 bg-indigo-600/20 rounded-2xl flex items-center justify-center shrink-0">
                        <Info className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white mb-2 underline decoration-indigo-500/50 underline-offset-4">Verifiable Proof-of-Action (PoA)</h3>
                        <p className="text-slate-400 text-sm leading-relaxed max-w-4xl">
                            Every record in this trail is linked to a non-fungible token (AuditNFT) minted on opBNB. The NFT metadata contains early-intent signatures and risk engine logs that are cryptographically bound to the final transaction status. This provides an immutable proof-of-protection for insurance and compliance purposes.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
