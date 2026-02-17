import { useEffect, useState } from 'react';
import { Shield, Send, LayoutDashboard, Settings, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

interface Metrics {
  totalAnalyzed: number;
  blocked: number;
  allowed: number;
  reviewed: number;
  avgRiskScore: number;
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);

  useEffect(() => {
    api.getAgentMetrics().then(setMetrics).catch(() => setMetrics(null));
  }, []);

  const statCards = [
    { label: 'Transactions Analyzed', value: metrics?.totalAnalyzed ?? '-', sub: 'From AI agent', icon: Shield },
    { label: 'Blocked', value: metrics?.blocked ?? '-', sub: 'Prevented intents', icon: AlertTriangle },
    { label: 'Allowed', value: metrics?.allowed ?? '-', sub: 'Cleared intents', icon: Send },
    { label: 'Avg Risk', value: metrics ? `${metrics.avgRiskScore}/100` : '-', sub: 'Current average', icon: LayoutDashboard }
  ];

  return (
    <div className="p-6 lg:p-12">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-extrabold text-white mb-2">Security Overview</h1>
          <p className="text-slate-400 text-lg">Live risk telemetry from the running agent.</p>
        </div>
        <Link to="/send" className="px-5 py-3 bg-indigo-600 text-white rounded-xl font-semibold">New Scan</Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {statCards.map((stat) => (
          <div key={stat.label} className="glass p-6 rounded-3xl">
            <stat.icon className="w-8 h-8 text-indigo-500 mb-4" />
            <p className="text-slate-500 text-sm font-semibold uppercase">{stat.label}</p>
            <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
            <p className="text-xs text-slate-400 mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="glass rounded-3xl p-8 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">Policy posture</h3>
          <Settings className="w-5 h-5 text-indigo-400" />
        </div>
        <p className="text-slate-400">Switch to the Security Policies page to manage allowlists, blocklists, and daily limits with on-chain enforcement.</p>
      </div>
    </div>
  );
}
