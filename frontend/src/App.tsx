import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  LayoutDashboard,
  Send,
  Settings,
  History,
  AlertTriangle,
  Menu,
  X,
  Bell
} from 'lucide-react';
import { useState } from 'react';
import { Web3Provider } from './services/web3';

import DashboardPage from './pages/Dashboard';
import SendPage from './pages/SendPage';
import PoliciesPage from './pages/PoliciesPage';
import AuditPage from './pages/AuditPage';
import EmergencyPage from './pages/EmergencyPage';

/**
 * Main App Component
 * Implements the Layout, Navigation, and Web3Modal provider
 */
export default function App() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Overview', icon: LayoutDashboard },
    { path: '/send', label: 'Send & Scan', icon: Send },
    { path: '/policies', label: 'Security Policies', icon: Settings },
    { path: '/audit', label: 'Audit Trail', icon: History },
    { path: '/emergency', label: 'Emergency', icon: AlertTriangle, color: 'text-red-400' },
  ];

  return (
    <Web3Provider>
      <div className="min-h-screen bg-slate-950 text-slate-200">

        {/* Navigation Sidebar (Desktop) */}
        <aside className="fixed left-0 top-0 h-full w-64 glass border-r border-slate-800 hidden lg:flex flex-col z-50">
          <div className="p-6 flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-tight text-white">Guardian<span className="text-indigo-400">Claw</span></h1>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">AI Firewall Engine</p>
            </div>
          </div>

          <nav className="flex-1 mt-6 px-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                    ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-lg shadow-indigo-500/5'
                    : `text-slate-400 hover:text-white hover:bg-slate-800/50 ${item.color || ''}`
                    }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-400' : ''}`} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 mt-auto">
            <div className="bg-slate-900/50 rounded-2xl p-4 border border-slate-800">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-tighter">System Status</span>
              </div>
              <p className="text-sm font-medium text-white">Agent Online</p>
              <p className="text-[11px] text-slate-500 mt-1">opBNB Testnet Node v1.0.4</p>
            </div>
          </div>
        </aside>

        {/* Header (Top) */}
        <header className="fixed top-0 right-0 left-0 lg:left-64 h-20 glass border-b border-slate-800 flex items-center justify-between px-6 lg:px-12 z-40">
          <div className="lg:hidden flex items-center gap-2">
            <Shield className="w-6 h-6 text-indigo-500" />
            <span className="font-bold text-lg">GuardianClaw</span>
          </div>

          <div className="hidden lg:block">
            <p className="text-sm text-slate-400 font-medium">Welcome back, Guardian</p>
            <h2 className="text-xs text-indigo-400 font-semibold uppercase tracking-widest">Non-Custodial Security Active</h2>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-indigo-500 rounded-full border-2 border-slate-900"></span>
            </button>
            <w3m-button balance="hide" />
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-slate-900 border border-slate-800"
            >
              {isMobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </header>

        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[60] lg:hidden"
            >
              <motion.aside
                initial={{ x: -200 }}
                animate={{ x: 0 }}
                exit={{ x: -200 }}
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                className="w-64 h-full bg-slate-900 border-r border-slate-800 p-6"
              >
                <div className="flex items-center gap-3 mb-10">
                  <Shield className="w-8 h-8 text-indigo-500" />
                  <span className="font-bold text-xl">GuardianClaw</span>
                </div>
                <nav className="space-y-4">
                  {navItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 text-slate-400 hover:text-white px-2 py-1"
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </nav>
              </motion.aside>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <main className="lg:ml-64 pt-20 min-h-screen">
          <div className="max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Routes>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/send" element={<SendPage />} />
                  <Route path="/policies" element={<PoliciesPage />} />
                  <Route path="/audit" element={<AuditPage />} />
                  <Route path="/emergency" element={<EmergencyPage />} />
                </Routes>
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </Web3Provider>
  );
}

