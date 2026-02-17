import { useEffect, useMemo, useState } from 'react';
import { History, ShieldCheck, ShieldAlert, Download, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import type { AuditRecord } from '../types';

const DEFAULT_WALLET = import.meta.env.VITE_DEFAULT_WALLET || '0x000000000000000000000000000000000000dEaD';

export default function AuditPage() {
  const [filter, setFilter] = useState<'ALL' | 'ALLOW' | 'BLOCK' | 'REVIEW'>('ALL');
  const [records, setRecords] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAudit = async () => {
    setLoading(true);
    setError(null);
    try {
      setRecords(await api.getAudit(DEFAULT_WALLET));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not fetch audit records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudit();
  }, []);

  const filtered = useMemo(
    () => records.filter((r) => filter === 'ALL' || r.classification === filter || r.decision === filter),
    [records, filter]
  );

  const exportCsv = () => {
    const header = ['id', 'to', 'value', 'riskScore', 'classification', 'timestamp'];
    const rows = filtered.map((r) => [r.id, r.to, r.value, r.riskScore, r.classification || r.decision, r.timestamp]);
    const csv = [header, ...rows].map((row) => row.map((x) => `"${x ?? ''}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `guardianclaw-audit-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 lg:p-12 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-extrabold text-white mb-2">Audit Trail</h1>
          <p className="text-slate-400">Live intent history from relayer logs.</p>
        </div>
        <div className="flex gap-2">
          {(['ALL', 'ALLOW', 'BLOCK', 'REVIEW'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-2 rounded-xl border ${filter === f ? 'border-indigo-500 text-indigo-300' : 'border-slate-700 text-slate-400'}`}>
              {f}
            </button>
          ))}
          <button onClick={fetchAudit} className="px-3 py-2 rounded-xl border border-slate-700 text-slate-300"><RefreshCw className="w-4 h-4" /></button>
          <button onClick={exportCsv} className="px-3 py-2 rounded-xl border border-slate-700 text-slate-300 flex items-center gap-2"><Download className="w-4 h-4" />CSV</button>
        </div>
      </div>

      {loading && <p className="text-slate-400">Loading audit records...</p>}
      {error && <p className="text-red-400">{error}</p>}

      <div className="space-y-4">
        {!loading && filtered.length === 0 && <p className="text-slate-500">No audit entries found.</p>}
        {filtered.map((item) => {
          const blocked = (item.classification || item.decision) === 'BLOCK';
          return (
            <div key={item.id || `${item.to}-${item.timestamp}`} className="glass rounded-3xl p-6 border border-slate-800">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${blocked ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                    {blocked ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-white font-bold">{item.classification || item.decision || 'UNKNOWN'}</p>
                    <p className="text-xs font-mono text-slate-500">{item.to}</p>
                  </div>
                </div>
                <div className="text-right text-sm">
                  <p className="text-slate-300">Risk: {item.riskScore ?? '-'}</p>
                  <p className="text-slate-500">{item.timestamp ? new Date(item.timestamp).toLocaleString() : '-'}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 text-xs text-slate-500 flex items-center gap-2"><History className="w-4 h-4" />Wallet scope: {DEFAULT_WALLET}</div>
    </div>
  );
}
