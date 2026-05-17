import React, { useState, useEffect } from 'react';
import { 
  User, 
  Bell, 
  Shield, 
  Wallet as WalletIcon, 
  Globe, 
  Cpu,
  Save,
  CheckCircle2,
  RefreshCw,
  Server,
  Lock,
  Sparkles,
  Zap,
  Activity,
  ArrowRight,
  ShieldAlert,
  Loader2,
  ShieldCheck,
  Radio,
  ExternalLink,
  ChevronRight,
  TrendingDown,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { useApp } from '../context/AppContext';
import { cn } from '../lib/utils';

type SettingsTab = 'profile' | 'notifications' | 'security' | 'wallets' | 'ai' | 'network';

const Settings = () => {
  const { walletAddress, setWalletAddress } = useApp();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [isSaving, setIsSaving] = useState(false);

  // --- Profile States ---
  const [fullName, setFullName] = useState(() => localStorage.getItem('procureai_fullname') || 'Vivek Goud');
  const [email, setEmail] = useState(() => localStorage.getItem('procureai_email') || 'adulavivekgoud@gmail.com');
  const [org, setOrg] = useState(() => localStorage.getItem('procureai_org') || 'ProcureAI Labs');

  // --- AI Config States ---
  const [aggressive, setAggressive] = useState(() => localStorage.getItem('procureai_aggressive') !== 'false');
  const [autoSettle, setAutoSettle] = useState(() => localStorage.getItem('procureai_autosettle') === 'true');
  const [agentTone, setAgentTone] = useState(() => localStorage.getItem('procureai_tone') || 'Competitive');
  const [agentSpeed, setAgentSpeed] = useState(() => localStorage.getItem('procureai_speed') || 'Humanized');

  // --- Notification States ---
  const [emailAlerts, setEmailAlerts] = useState(() => localStorage.getItem('procureai_emailalerts') !== 'false');
  const [pushAlerts, setPushAlerts] = useState(() => localStorage.getItem('procureai_pushalerts') !== 'false');
  const [bcAlerts, setBcAlerts] = useState(() => localStorage.getItem('procureai_bcalerts') !== 'false');

  // --- Security States ---
  const [signPref, setSignPref] = useState(() => localStorage.getItem('procureai_signpref') || 'x402');
  const [biometricAuth, setBiometricAuth] = useState(() => localStorage.getItem('procureai_bioauth') === 'true');
  const [autoLockRisk, setAutoLockRisk] = useState(() => localStorage.getItem('procureai_autolock') !== 'false');

  // --- Network States ---
  const [network, setNetwork] = useState(() => localStorage.getItem('procureai_network') || 'Testnet');
  const [indexer, setIndexer] = useState(() => localStorage.getItem('procureai_indexer') || 'Algonode');

  // --- Wallet States ---
  const [mockBalance, setMockBalance] = useState('245.82 ALGO');
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);

  // --- Live Simulated Node Pings ---
  const [pings, setPings] = useState({
    shenzhen: 45,
    frankfurt: 82,
    hanoi: 54,
    bangalore: 28
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setPings({
        shenzhen: Math.floor(40 + Math.random() * 15),
        frankfurt: Math.floor(75 + Math.random() * 20),
        hanoi: Math.floor(50 + Math.random() * 15),
        bangalore: Math.floor(25 + Math.random() * 10)
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  /**
   * Restores settings state from localStorage, undoing any unsaved edits.
   */
  const handleCancel = () => {
    setFullName(localStorage.getItem('procureai_fullname') || 'Vivek Goud');
    setEmail(localStorage.getItem('procureai_email') || 'adulavivekgoud@gmail.com');
    setOrg(localStorage.getItem('procureai_org') || 'ProcureAI Labs');
    
    setAggressive(localStorage.getItem('procureai_aggressive') !== 'false');
    setAutoSettle(localStorage.getItem('procureai_autosettle') === 'true');
    setAgentTone(localStorage.getItem('procureai_tone') || 'Competitive');
    setAgentSpeed(localStorage.getItem('procureai_speed') || 'Humanized');

    setEmailAlerts(localStorage.getItem('procureai_emailalerts') !== 'false');
    setPushAlerts(localStorage.getItem('procureai_pushalerts') !== 'false');
    setBcAlerts(localStorage.getItem('procureai_bcalerts') !== 'false');

    setSignPref(localStorage.getItem('procureai_signpref') || 'x402');
    setBiometricAuth(localStorage.getItem('procureai_bioauth') === 'true');
    setAutoLockRisk(localStorage.getItem('procureai_autolock') !== 'false');

    setNetwork(localStorage.getItem('procureai_network') || 'Testnet');
    setIndexer(localStorage.getItem('procureai_indexer') || 'Algonode');

    toast.info('Changes reverted.');
  };

  /**
   * Persists all state configurations to localStorage and issues success notification.
   */
  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 800));

    try {
      localStorage.setItem('procureai_fullname', fullName);
      localStorage.setItem('procureai_email', email);
      localStorage.setItem('procureai_org', org);
      
      localStorage.setItem('procureai_aggressive', aggressive.toString());
      localStorage.setItem('procureai_autosettle', autoSettle.toString());
      localStorage.setItem('procureai_tone', agentTone);
      localStorage.setItem('procureai_speed', agentSpeed);

      localStorage.setItem('procureai_emailalerts', emailAlerts.toString());
      localStorage.setItem('procureai_pushalerts', pushAlerts.toString());
      localStorage.setItem('procureai_bcalerts', bcAlerts.toString());

      localStorage.setItem('procureai_signpref', signPref);
      localStorage.setItem('procureai_bioauth', biometricAuth.toString());
      localStorage.setItem('procureai_autolock', autoLockRisk.toString());

      localStorage.setItem('procureai_network', network);
      localStorage.setItem('procureai_indexer', indexer);

      // Sync active AppContext user
      localStorage.setItem('procureai_user', JSON.stringify({ email }));

      toast.success('Procurement settings saved successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Simulates connected wallet trigger inside Wallets tab.
   */
  const handleToggleWallet = () => {
    if (walletAddress) {
      setWalletAddress(null);
      toast.info('Wallet disconnected.');
    } else {
      setIsConnectingWallet(true);
      setTimeout(() => {
        setWalletAddress('V4OGJ656XNYHTQSP4V7P45EXS7YVLO6ZFWT6QGNECHHMRKIPW2G5EZXG2M');
        setMockBalance('584.20 ALGO');
        setIsConnectingWallet(false);
        toast.success('Wallet connected successfully via Pera Wallet!');
      }, 1000);
    }
  };

  return (
    <div className="space-y-8 w-full pb-16 pt-4 px-2">
      {/* 🚀 SETTINGS HEADER - EXPANDED FULL WIDTH */}
      <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-6 border-b border-slate-100 pb-6">
        <div className="space-y-2">
          {/* Status Indicator Chips */}
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-[9px] font-black uppercase tracking-wider shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              Settings Console
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 border border-violet-100 text-violet-600 text-[9px] font-black uppercase tracking-wider shadow-sm">
              <ShieldCheck className="w-3 h-3 text-violet-500 animate-pulse" />
              x402 Identity Configured
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-600 text-[9px] font-black uppercase tracking-wider shadow-sm">
              <Radio className="w-3 h-3 text-slate-500 animate-pulse" />
              Environment Synchronized
            </div>
          </div>
          <h1 className="text-4xl font-display font-medium tracking-tight text-slate-950">
            System Preferences
          </h1>
          <p className="text-slate-500 max-w-4xl font-medium text-sm leading-relaxed">
            Configure your enterprise account profile, autonomous AI agent negotiation behaviors, transaction signing methods, and smart contract node endpoints.
          </p>
        </div>
      </div>

      {/* Main Grid: Navigation Sidebar & Two-Column Grid Setup */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Navigation Sidebar Tabs - Left Span */}
        <div className="xl:col-span-3 space-y-1 bg-white p-3 rounded-[1.5rem] border border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          {[
            { id: 'profile', name: 'Profile', icon: User, desc: 'Enterprise Identity details' },
            { id: 'ai', name: 'AI Config', icon: Cpu, desc: 'Autonomous negotiation bots' },
            { id: 'notifications', name: 'Notifications', icon: Bell, desc: 'Sourcing email & push triggers' },
            { id: 'security', name: 'Security', icon: Shield, desc: 'Smart-contract signing preferences' },
            { id: 'wallets', name: 'Wallets', icon: WalletIcon, desc: 'Algorand wallet linkages' },
            { id: 'network', name: 'Network', icon: Globe, desc: 'RPC nodes and gateways' },
          ].map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as SettingsTab)}
                className={cn(
                  "w-full flex flex-col items-start gap-1 px-4 py-3 rounded-xl text-left transition-all relative",
                  isActive 
                    ? "bg-slate-950 text-white border-l-4 border-blue-500 font-bold shadow-md" 
                    : "text-slate-500 hover:text-slate-950 hover:bg-slate-50"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={cn("w-4.5 h-4.5 transition-colors", isActive ? "text-blue-400" : "text-slate-400")} />
                  <span className="text-sm font-bold">{item.name}</span>
                </div>
                <span className={cn("text-[9px] pl-7 font-semibold uppercase tracking-wider block", isActive ? "text-slate-400" : "text-slate-400/80")}>
                  {item.desc}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tab content wrappers - Right Span (Wider Grid) */}
        <div className="xl:col-span-9 space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              {/* DOUBLE-COLUMN GRID LAYOUT WITHIN CARDS */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* LEFT GRID COLUMN: Settings Controls (Spans 7 Cols) */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* PROFILE TAB PANEL */}
                  {activeTab === 'profile' && (
                    <Card className="bg-white border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.02)] rounded-[1.5rem] overflow-hidden">
                      <CardHeader className="border-b border-slate-100 pb-6">
                        <CardTitle className="text-xl font-bold text-slate-950 flex items-center gap-2.5">
                          <User className="w-5 h-5 text-blue-600" /> Account Profile
                        </CardTitle>
                        <CardDescription className="text-slate-500 text-xs mt-1">
                          Update your personal information and public enterprise profile.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6 pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Full Name</label>
                            <Input 
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              className="bg-white border-slate-200 text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 rounded-xl h-11" 
                              placeholder="e.g. Vivek Goud"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Email Address</label>
                            <Input 
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="bg-white border-slate-200 text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 rounded-xl h-11" 
                              placeholder="e.g. adulavivekgoud@gmail.com"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Organization</label>
                          <Input 
                            value={org}
                            onChange={(e) => setOrg(e.target.value)}
                            className="bg-white border-slate-200 text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 rounded-xl h-11" 
                            placeholder="e.g. ProcureAI Labs"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* AI CONFIG TAB PANEL */}
                  {activeTab === 'ai' && (
                    <Card className="bg-white border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.02)] rounded-[1.5rem] overflow-hidden">
                      <CardHeader className="border-b border-slate-100 pb-6">
                        <CardTitle className="text-xl font-bold text-slate-950 flex items-center gap-2.5">
                          <Cpu className="w-5 h-5 text-blue-600" /> AI Agent Preferences
                        </CardTitle>
                        <CardDescription className="text-slate-500 text-xs mt-1">
                          Control how your autonomous agents behave during supplier negotiations.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6 pt-6">
                        {/* Toggle: Aggressive Negotiation */}
                        <div className="flex items-center justify-between p-5 rounded-2xl bg-slate-50/50 border border-slate-100 hover:border-slate-200 transition-all shadow-sm">
                          <div className="space-y-1 pr-6">
                            <p className="text-sm font-semibold text-slate-900">Aggressive Negotiation</p>
                            <p className="text-xs text-slate-500 leading-relaxed">Agents will aggressively prioritize target budgets and pricing caps over expected delivery timelines.</p>
                          </div>
                          <button
                            onClick={() => setAggressive(!aggressive)}
                            className={cn(
                              "w-12 h-6.5 rounded-full p-1 transition-all duration-300 relative focus:outline-none flex items-center shadow-inner",
                              aggressive ? "bg-slate-950 shadow-slate-950/20" : "bg-slate-200"
                            )}
                          >
                            <div
                              className={cn(
                                "w-4.5 h-4.5 bg-white rounded-full transition-all duration-300 shadow-md",
                                aggressive ? "translate-x-5.5" : "translate-x-0"
                              )}
                            />
                          </button>
                        </div>

                        {/* Toggle: Auto-Settlement */}
                        <div className="flex items-center justify-between p-5 rounded-2xl bg-slate-50/50 border border-slate-100 hover:border-slate-200 transition-all shadow-sm">
                          <div className="space-y-1 pr-6">
                            <p className="text-sm font-semibold text-slate-900">Auto-Settlement</p>
                            <p className="text-xs text-slate-500 leading-relaxed">Automatically execute on-chain smart-contract funding deals that meet all criteria without physical approvals.</p>
                          </div>
                          <button
                            onClick={() => setAutoSettle(!autoSettle)}
                            className={cn(
                              "w-12 h-6.5 rounded-full p-1 transition-all duration-300 relative focus:outline-none flex items-center shadow-inner",
                              autoSettle ? "bg-slate-950 shadow-slate-950/20" : "bg-slate-200"
                            )}
                          >
                            <div
                              className={cn(
                                "w-4.5 h-4.5 bg-white rounded-full transition-all duration-300 shadow-md",
                                autoSettle ? "translate-x-5.5" : "translate-x-0"
                              )}
                            />
                          </button>
                        </div>

                        {/* Selector: Agent Tone */}
                        <div className="space-y-2.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Negotiation Strategy / Tone</label>
                          <div className="grid grid-cols-3 gap-3">
                            {['Collaborative', 'Diplomatic', 'Competitive'].map((tone) => (
                              <button
                                key={tone}
                                onClick={() => setAgentTone(tone)}
                                className={cn(
                                  "py-3 px-4 rounded-xl border text-xs font-bold transition-all text-center",
                                  agentTone === tone
                                    ? "bg-slate-950 border-slate-950 text-white font-bold shadow-md"
                                    : "bg-white border-slate-200 text-slate-500 hover:text-slate-950 hover:border-slate-300"
                                )}
                              >
                                {tone}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Selector: Agent Speed */}
                        <div className="space-y-2.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Agent Response Speed</label>
                          <div className="grid grid-cols-3 gap-3">
                            {['Instant', 'Humanized', 'Delayed'].map((speed) => (
                              <button
                                key={speed}
                                onClick={() => setAgentSpeed(speed)}
                                className={cn(
                                  "py-3 px-4 rounded-xl border text-xs font-bold transition-all text-center",
                                  agentSpeed === speed
                                    ? "bg-slate-950 border-slate-950 text-white font-bold shadow-md"
                                    : "bg-white border-slate-200 text-slate-500 hover:text-slate-950 hover:border-slate-300"
                                )}
                              >
                                {speed}
                              </button>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* NOTIFICATIONS TAB PANEL */}
                  {activeTab === 'notifications' && (
                    <Card className="bg-white border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.02)] rounded-[1.5rem] overflow-hidden">
                      <CardHeader className="border-b border-slate-100 pb-6">
                        <CardTitle className="text-xl font-bold text-slate-950 flex items-center gap-2.5">
                          <Bell className="w-5 h-5 text-blue-600" /> Alerts & Notifications
                        </CardTitle>
                        <CardDescription className="text-slate-500 text-xs mt-1">
                          Manage real-time channels for alerts, smart-contracts, and pipeline progress.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6 pt-6">
                        <div className="flex items-center justify-between p-5 rounded-2xl bg-slate-50/50 border border-slate-100 hover:border-slate-200 transition-all shadow-sm">
                          <div className="space-y-1 pr-6">
                            <p className="text-sm font-semibold text-slate-900">Email Sourcing Alerts</p>
                            <p className="text-xs text-slate-500 leading-relaxed">Receive immediate summaries when negotiations concluded or actions require review.</p>
                          </div>
                          <button
                            onClick={() => setEmailAlerts(!emailAlerts)}
                            className={cn(
                              "w-12 h-6.5 rounded-full p-1 transition-all duration-300 relative focus:outline-none flex items-center shadow-inner",
                              emailAlerts ? "bg-slate-950 shadow-slate-950/20" : "bg-slate-200"
                            )}
                          >
                            <div
                              className={cn(
                                "w-4.5 h-4.5 bg-white rounded-full transition-all duration-300 shadow-md",
                                emailAlerts ? "translate-x-5.5" : "translate-x-0"
                              )}
                            />
                          </button>
                        </div>

                        <div className="flex items-center justify-between p-5 rounded-2xl bg-slate-50/50 border border-slate-100 hover:border-slate-200 transition-all shadow-sm">
                          <div className="space-y-1 pr-6">
                            <p className="text-sm font-semibold text-slate-900">Live Push Broadcasts</p>
                            <p className="text-xs text-slate-500 leading-relaxed">In-browser system notifications for instant updates during live supplier sourcing scans.</p>
                          </div>
                          <button
                            onClick={() => setPushAlerts(!pushAlerts)}
                            className={cn(
                              "w-12 h-6.5 rounded-full p-1 transition-all duration-300 relative focus:outline-none flex items-center shadow-inner",
                              pushAlerts ? "bg-slate-950 shadow-slate-950/20" : "bg-slate-200"
                            )}
                          >
                            <div
                              className={cn(
                                "w-4.5 h-4.5 bg-white rounded-full transition-all duration-300 shadow-md",
                                pushAlerts ? "translate-x-5.5" : "translate-x-0"
                              )}
                            />
                          </button>
                        </div>

                        <div className="flex items-center justify-between p-5 rounded-2xl bg-slate-50/50 border border-slate-100 hover:border-slate-200 transition-all shadow-sm">
                          <div className="space-y-1 pr-6">
                            <p className="text-sm font-semibold text-slate-900">On-Chain Escrow Alerts</p>
                            <p className="text-xs text-slate-500 leading-relaxed">Receive alerts when contract states change (e.g. Funding locked, Proof uploaded, Settled).</p>
                          </div>
                          <button
                            onClick={() => setBcAlerts(!bcAlerts)}
                            className={cn(
                              "w-12 h-6.5 rounded-full p-1 transition-all duration-300 relative focus:outline-none flex items-center shadow-inner",
                              bcAlerts ? "bg-slate-950 shadow-slate-950/20" : "bg-slate-200"
                            )}
                          >
                            <div
                              className={cn(
                                "w-4.5 h-4.5 bg-white rounded-full transition-all duration-300 shadow-md",
                                bcAlerts ? "translate-x-5.5" : "translate-x-0"
                              )}
                            />
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* SECURITY TAB PANEL */}
                  {activeTab === 'security' && (
                    <Card className="bg-white border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.02)] rounded-[1.5rem] overflow-hidden">
                      <CardHeader className="border-b border-slate-100 pb-6">
                        <CardTitle className="text-xl font-bold text-slate-950 flex items-center gap-2.5">
                          <Shield className="w-5 h-5 text-blue-600" /> Transaction Security
                        </CardTitle>
                        <CardDescription className="text-slate-500 text-xs mt-1">
                          Configure secure signing schemes, compliance barriers, and access verification preferences.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6 pt-6">
                        <div className="flex items-center justify-between p-5 rounded-2xl bg-slate-50/50 border border-slate-100 hover:border-slate-200 transition-all shadow-sm">
                          <div className="space-y-1 pr-6">
                            <p className="text-sm font-semibold text-slate-900">Biometric Wallet Authorization</p>
                            <p className="text-xs text-slate-500 leading-relaxed">Prompt for biometric signatures when initiating Pera Wallet atomic transactions.</p>
                          </div>
                          <button
                            onClick={() => setBiometricAuth(!biometricAuth)}
                            className={cn(
                              "w-12 h-6.5 rounded-full p-1 transition-all duration-300 relative focus:outline-none flex items-center shadow-inner",
                              biometricAuth ? "bg-slate-950 shadow-slate-950/20" : "bg-slate-200"
                            )}
                          >
                            <div
                              className={cn(
                                "w-4.5 h-4.5 bg-white rounded-full transition-all duration-300 shadow-md",
                                biometricAuth ? "translate-x-5.5" : "translate-x-0"
                              )}
                        />
                      </button>
                        </div>

                        <div className="flex items-center justify-between p-5 rounded-2xl bg-slate-50/50 border border-slate-100 hover:border-slate-200 transition-all shadow-sm">
                          <div className="space-y-1 pr-6">
                            <p className="text-sm font-semibold text-slate-900">Autonomous Dispute Guard</p>
                            <p className="text-xs text-slate-500 leading-relaxed">Instantly lock escrow assets if supplier fulfillment risk threshold exceeds 75%.</p>
                          </div>
                          <button
                            onClick={() => setAutoLockRisk(!autoLockRisk)}
                            className={cn(
                              "w-12 h-6.5 rounded-full p-1 transition-all duration-300 relative focus:outline-none flex items-center shadow-inner",
                              autoLockRisk ? "bg-slate-950 shadow-slate-950/20" : "bg-slate-200"
                            )}
                          >
                            <div
                              className={cn(
                                "w-4.5 h-4.5 bg-white rounded-full transition-all duration-300 shadow-md",
                                autoLockRisk ? "translate-x-5.5" : "translate-x-0"
                              )}
                            />
                          </button>
                        </div>

                        <div className="space-y-2.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Escrow Release Signing Protocol</label>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {[
                              { id: 'single', label: 'Single Pera Tx', desc: 'Direct buyer trigger' },
                              { id: 'x402', label: 'x402 Double Sign', desc: 'Buyer + AI audit keys' },
                              { id: 'multisig', label: 'Multi-Sig 2-of-3', desc: 'Oracle + Buyer + Carrier' }
                            ].map((proto) => (
                              <button
                                key={proto.id}
                                onClick={() => setSignPref(proto.id)}
                                className={cn(
                                  "p-4 rounded-xl border text-left transition-all",
                                  signPref === proto.id
                                    ? "bg-slate-950 border-slate-950 text-white font-bold shadow-md"
                                    : "bg-white border-slate-200 text-slate-500 hover:text-slate-950 hover:border-slate-300"
                                )}
                              >
                                <p className="text-xs font-bold uppercase tracking-wider">{proto.label}</p>
                                <p className="text-[10px] text-slate-400 mt-1 font-medium">{proto.desc}</p>
                              </button>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* WALLETS TAB PANEL */}
                  {activeTab === 'wallets' && (
                    <Card className="bg-white border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.02)] rounded-[1.5rem] overflow-hidden">
                      <CardHeader className="border-b border-slate-100 pb-6">
                        <CardTitle className="text-xl font-bold text-slate-950 flex items-center gap-2.5">
                          <WalletIcon className="w-5 h-5 text-blue-600" /> Wallet Connections
                        </CardTitle>
                        <CardDescription className="text-slate-500 text-xs mt-1">
                          Link your Algorand non-custodial credentials to execute smart contract operations.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6 pt-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between p-5 rounded-2xl bg-slate-50/50 border border-slate-100 hover:border-slate-200 transition-all gap-4">
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-11 h-11 rounded-xl flex items-center justify-center transition-all",
                              walletAddress ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-slate-100 text-slate-400 border border-slate-200"
                            )}>
                              <WalletIcon className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-950 flex items-center gap-2">
                                Pera Wallet
                                {walletAddress ? (
                                  <Badge className="bg-emerald-50 text-emerald-600 border-none text-[8px] uppercase tracking-wider px-2 py-0.5 font-black">CONNECTED</Badge>
                                ) : (
                                  <Badge className="bg-slate-100 text-slate-500 border-none text-[8px] uppercase tracking-wider px-2 py-0.5 font-bold">DISCONNECTED</Badge>
                                )}
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {walletAddress 
                                  ? `${walletAddress.substring(0, 8)}...${walletAddress.substring(walletAddress.length - 8)}` 
                                  : "No account linked. Link now to enable smart contract execution."
                                }
                              </p>
                            </div>
                          </div>
                          
                          <Button
                            onClick={handleToggleWallet}
                            disabled={isConnectingWallet}
                            className={cn(
                              "text-xs font-bold rounded-xl transition-all shadow-sm h-10 px-4",
                              walletAddress 
                                ? "bg-white hover:bg-red-50 hover:text-red-600 border border-slate-200 text-slate-700 font-semibold"
                                : "bg-slate-950 hover:bg-black text-white font-black uppercase tracking-wider"
                            )}
                          >
                            {isConnectingWallet ? (
                              <span className="flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Connection...</span>
                            ) : walletAddress ? "Disconnect Account" : "Link Pera Wallet"}
                          </Button>
                        </div>

                        {walletAddress && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl bg-slate-50/50 border border-slate-100">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-0.5">Mock Account Balance</p>
                              <p className="text-xl font-black text-slate-950 mt-1">{mockBalance}</p>
                            </div>
                            <div className="p-4 rounded-xl bg-slate-50/50 border border-slate-100">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-0.5">Deployment Escrow Cushion</p>
                              <p className="text-xl font-black text-slate-950 mt-1">0.40 ALGO</p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* NETWORK TAB PANEL */}
                  {activeTab === 'network' && (
                    <Card className="bg-white border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.02)] rounded-[1.5rem] overflow-hidden">
                      <CardHeader className="border-b border-slate-100 pb-6">
                        <CardTitle className="text-xl font-bold text-slate-950 flex items-center gap-2.5">
                          <Globe className="w-5 h-5 text-blue-600" /> Algorand Network Node
                        </CardTitle>
                        <CardDescription className="text-slate-500 text-xs mt-1">
                          Configure your RPC gateway node settings and indexer configurations.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6 pt-6">
                        <div className="space-y-2.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Blockchain Environment</label>
                          <div className="grid grid-cols-2 gap-3">
                            {['Testnet', 'Mainnet'].map((net) => (
                              <button
                                key={net}
                                onClick={() => setNetwork(net)}
                                className={cn(
                                  "py-3 px-4 rounded-xl border text-xs font-bold transition-all text-center",
                                  network === net
                                    ? "bg-slate-950 border-slate-950 text-white font-bold shadow-md"
                                    : "bg-white border-slate-200 text-slate-500 hover:text-slate-950 hover:border-slate-300"
                                )}
                              >
                                {net}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Active Indexer Service Provider</label>
                          <div className="grid grid-cols-3 gap-3">
                            {['Algonode', 'Purestake', 'Local Sandbox'].map((idx) => (
                              <button
                                key={idx}
                                onClick={() => setIndexer(idx)}
                                className={cn(
                                  "py-3 px-4 rounded-xl border text-xs font-bold transition-all text-center",
                                  indexer === idx
                                    ? "bg-slate-950 border-slate-950 text-white font-bold shadow-md"
                                    : "bg-white border-slate-200 text-slate-500 hover:text-slate-950 hover:border-slate-300"
                                )}
                              >
                                {idx}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 text-xs">
                          <Server className="w-5 h-5 shrink-0 text-blue-500 mt-0.5" />
                          <div>
                            <p className="font-bold text-blue-700 uppercase tracking-wider text-[10px]">Node Endpoint Status: Synchronized</p>
                            <p className="mt-0.5 leading-relaxed text-slate-600">All smart contracts deployed by Procure-AI will settle using transaction validators aligned to the active indexer ledger snapshot.</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* RIGHT GRID COLUMN: Live Enterprise Context Simulator (Spans 5 Cols) */}
                <div className="lg:col-span-5 space-y-6">
                  
                  {/* SIMULATOR: PROFILE CARD PREVIEW */}
                  {activeTab === 'profile' && (
                    <Card className="bg-gradient-to-br from-slate-900 to-slate-950 text-white border-none shadow-xl rounded-[1.5rem] p-6 overflow-hidden relative group">
                      <div className="absolute right-0 top-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[9px] uppercase font-black tracking-widest px-2.5 py-0.5 shadow-sm">
                            Buyer Passport
                          </Badge>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">x402 Credential</span>
                        </div>
                        <div className="flex items-center gap-4.5 border-b border-slate-800/80 pb-6">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center font-display font-black text-xl text-white shadow-lg">
                            {fullName.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <h3 className="font-bold text-lg leading-tight text-white">{fullName}</h3>
                            <p className="text-xs text-slate-400 mt-1 font-medium">{email}</p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Authority Domain</span>
                            <span className="text-xs font-bold text-slate-300">{org}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Account Clearance</span>
                            <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 border border-emerald-500/20 rounded-md">Tier-1 Principal</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Verification Key</span>
                            <code className="text-[10px] text-slate-400 bg-slate-900 border border-slate-800 px-2 py-1 rounded">X402-AUTH-{email.substring(0, 4).toUpperCase()}</code>
                          </div>
                        </div>
                        <div className="pt-4 border-t border-slate-800/60 flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" /> Verified Buyer Footprint Active
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* SIMULATOR: AI AGENT BEHAVIOR PREVIEW */}
                  {activeTab === 'ai' && (
                    <Card className="bg-white border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.02)] rounded-[1.5rem] p-6 space-y-6">
                      <div>
                        <h3 className="text-sm font-black text-slate-950 uppercase tracking-wider flex items-center gap-2">
                          <Cpu className="w-4 h-4 text-blue-600" /> AI Bot Strategy Preview
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5 font-semibold">Real-time simulation of agent decision vectors during negotiation</p>
                      </div>

                      <div className="space-y-4.5 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                        {/* Radar 1: Pricing aggressiveness */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-600 uppercase tracking-wider">Price Aggressiveness</span>
                            <span className="font-black text-slate-950">{aggressive ? '95% (Maximum)' : '45% (Balanced)'}</span>
                          </div>
                          <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                            <div 
                              className="h-full bg-slate-950 transition-all duration-500 rounded-full" 
                              style={{ width: aggressive ? '95%' : '45%' }}
                            />
                          </div>
                        </div>

                        {/* Radar 2: Delivery flexibility */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-600 uppercase tracking-wider">Delivery Delay Tolerance</span>
                            <span className="font-black text-slate-950">{aggressive ? '80% (Highly Flexible)' : '25% (Strict limits)'}</span>
                          </div>
                          <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                            <div 
                              className="h-full bg-slate-950 transition-all duration-500 rounded-full" 
                              style={{ width: aggressive ? '80%' : '25%' }}
                            />
                          </div>
                        </div>

                        {/* Radar 3: Auto Settlement Safety */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-600 uppercase tracking-wider">Auto-Execution Speed</span>
                            <span className="font-black text-slate-950">{autoSettle ? 'Autonomous Fast-Track' : 'Requires Manual Audit'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            {autoSettle ? (
                              <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-100 text-[8px] uppercase tracking-wider px-2 py-0.5 font-black">FAST-PATH ON</Badge>
                            ) : (
                              <Badge className="bg-slate-100 text-slate-500 border border-slate-200 text-[8px] uppercase tracking-wider px-2 py-0.5 font-bold">MANUAL CHECKPOINT ACTIVE</Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-950 text-white font-mono text-[10px] space-y-1 select-none overflow-hidden">
                        <p className="text-emerald-400">// ACTIVE NEGOTIATION PROTOCOL //</p>
                        <p className="text-slate-400">"agent_tone": "{agentTone.toLowerCase()}",</p>
                        <p className="text-slate-400">"latency_speed": "{agentSpeed.toLowerCase()}",</p>
                        <p className="text-slate-400">"pricing_priority": {aggressive ? 'true' : 'false'},</p>
                        <p className="text-slate-400">"onchain_autosettle": {autoSettle ? 'true' : 'false'}</p>
                      </div>
                    </Card>
                  )}

                  {/* SIMULATOR: NOTIFICATION EVENT PREVIEW */}
                  {activeTab === 'notifications' && (
                    <Card className="bg-white border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.02)] rounded-[1.5rem] p-6 space-y-5">
                      <div>
                        <h3 className="text-sm font-black text-slate-950 uppercase tracking-wider flex items-center gap-2">
                          <Bell className="w-4 h-4 text-blue-600 animate-pulse" /> Live Broadcast Stream
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5 font-semibold">Visualizing notification broadcasts on active channels</p>
                      </div>

                      <div className="space-y-3.5">
                        {/* Feed Item 1 */}
                        {emailAlerts && (
                          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-start gap-3 transition-all hover:border-slate-200 shadow-sm">
                            <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                              <User className="w-3.5 h-3.5" />
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-xs font-bold text-slate-950 leading-tight">Supplier Negotiation Concluded</p>
                              <p className="text-[10px] text-slate-500 font-medium leading-relaxed">AI agent finalized price structure with Shenzhen Precision Moldings.</p>
                            </div>
                          </div>
                        )}

                        {/* Feed Item 2 */}
                        {bcAlerts && (
                          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-start gap-3 transition-all hover:border-slate-200 shadow-sm">
                            <div className="w-7 h-7 rounded-lg bg-violet-50 border border-violet-100 text-violet-600 flex items-center justify-center shrink-0">
                              <Lock className="w-3.5 h-3.5 animate-pulse" />
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-xs font-bold text-slate-950 leading-tight">Smart Escrow Program Funded</p>
                              <p className="text-[10px] text-slate-500 font-medium leading-relaxed">Locked 0.10 ALGO within on-chain application ID #845210.</p>
                            </div>
                          </div>
                        )}

                        {/* Feed Item 3 */}
                        {pushAlerts && (
                          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-start gap-3 transition-all hover:border-slate-200 shadow-sm">
                            <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                              <Activity className="w-3.5 h-3.5" />
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-xs font-bold text-slate-950 leading-tight">Carrier Tracking Authenticated</p>
                              <p className="text-[10px] text-slate-500 font-medium leading-relaxed">DHL shipping proof recognized and marked verified.</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  )}

                  {/* SIMULATOR: SECURITY GUARD CONSOLE */}
                  {activeTab === 'security' && (
                    <Card className="bg-gradient-to-br from-slate-950 to-slate-900 text-white border-none shadow-xl rounded-[1.5rem] p-6 space-y-6 relative overflow-hidden">
                      <div className="absolute right-0 top-0 w-36 h-36 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
                      <div>
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <Lock className="w-3.5 h-3.5 text-violet-400 animate-pulse" /> Compliance Shield Active
                        </h3>
                        <p className="text-lg font-black text-white mt-1 leading-tight">Smart Audit Status</p>
                      </div>

                      <div className="space-y-4">
                        <div className="p-4.5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 shadow-md">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Auth Protocol</span>
                            <span className="text-xs font-black text-violet-400">{signPref.toUpperCase()} Secured</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Risk Lock Barrier</span>
                            <span className="text-xs font-bold text-slate-200">{autoLockRisk ? 'AUTOMATIC' : 'MANUAL'}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Device Auth Mode</span>
                            <span className="text-xs font-bold text-slate-200">{biometricAuth ? 'BIOMETRIC SIGNING' : 'STANDARD'}</span>
                          </div>
                        </div>

                        <div className="p-3 bg-violet-950/20 border border-violet-500/10 rounded-xl text-[10px] text-slate-400 leading-normal flex items-start gap-2.5">
                          <ShieldCheck className="w-4 h-4 text-violet-400 shrink-0 mt-0.5 animate-pulse" />
                          <div>
                            <p className="font-bold text-white uppercase tracking-wider">Ledger Security Seal: ACTIVE</p>
                            <p className="mt-0.5 leading-relaxed text-slate-400">Smart-contract funding, audits, and escrow settlements are locked behind double-signing cryptographic consensus rules.</p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* SIMULATOR: LEDGER BALANCE AUDIT CARD */}
                  {activeTab === 'wallets' && (
                    <Card className="bg-white border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.02)] rounded-[1.5rem] p-6 space-y-5">
                      <div>
                        <h3 className="text-sm font-black text-slate-950 uppercase tracking-wider flex items-center gap-2">
                          <WalletIcon className="w-4 h-4 text-blue-600" /> Algorand Ledger Audit
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5 font-semibold">Active gas cost calculations for smart-contract operations</p>
                      </div>

                      {walletAddress ? (
                        <div className="space-y-4 bg-slate-50 p-4.5 rounded-2xl border border-slate-100">
                          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Account Balance</span>
                            <span className="text-sm font-black text-slate-950">{mockBalance}</span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-[11px] font-medium text-slate-500">
                              <span>Escrow Deploy Fee</span>
                              <span>0.001 ALGO</span>
                            </div>
                            <div className="flex justify-between text-[11px] font-medium text-slate-500">
                              <span>Rent Min-Funding Cushion</span>
                              <span>0.400 ALGO</span>
                            </div>
                            <div className="flex justify-between text-[11px] font-medium text-slate-500">
                              <span>ABI Call Execution Gas</span>
                              <span>0.002 ALGO</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-xs">
                            <span className="font-bold text-slate-600 uppercase tracking-wider">Total Gas Cushion</span>
                            <span className="font-black text-slate-950">0.403 ALGO</span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center space-y-2">
                          <ShieldAlert className="w-8 h-8 text-slate-400 mx-auto animate-bounce" />
                          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">No Wallet Connected</p>
                          <p className="text-[10px] text-slate-400 leading-relaxed px-4">Link Pera Wallet inside the control panel to display real-time transaction fee structures and active gas cushions.</p>
                        </div>
                      )}
                    </Card>
                  )}

                  {/* SIMULATOR: LIVE GATEWAY LATENCY MAP */}
                  {activeTab === 'network' && (
                    <Card className="bg-white border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.02)] rounded-[1.5rem] p-6 space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-black text-slate-950 uppercase tracking-wider flex items-center gap-2">
                            <Server className="w-4 h-4 text-blue-600" /> RPC Latency Scan
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5 font-semibold">Real-time pings to global Algorand node servers</p>
                        </div>
                        <Badge className="bg-blue-50 text-blue-600 border-none text-[8px] uppercase tracking-wider px-2 py-0.5 font-black flex items-center gap-1">
                          <span className="w-1 h-1 bg-blue-500 rounded-full animate-ping" />
                          LIVE
                        </Badge>
                      </div>

                      <div className="space-y-4.5 bg-slate-50 p-4.5 rounded-2xl border border-slate-100">
                        {/* Node 1: Bangalore */}
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="font-bold text-slate-700">Bangalore (Primary)</span>
                          </div>
                          <span className="font-black text-slate-950">{pings.bangalore} ms</span>
                        </div>

                        {/* Node 2: Shenzhen */}
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="font-bold text-slate-700">Shenzhen Node</span>
                          </div>
                          <span className="font-black text-slate-950">{pings.shenzhen} ms</span>
                        </div>

                        {/* Node 3: Hanoi */}
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="font-bold text-slate-700">Hanoi Node</span>
                          </div>
                          <span className="font-black text-slate-950">{pings.hanoi} ms</span>
                        </div>

                        {/* Node 4: Frankfurt */}
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-yellow-500" />
                            <span className="font-bold text-slate-700">Frankfurt Gateway</span>
                          </div>
                          <span className="font-black text-slate-950">{pings.frankfurt} ms</span>
                        </div>
                      </div>
                    </Card>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Action Trigger Row: Cancel / Save Changes */}
          <div className="flex justify-end gap-3.5 border-t border-slate-100 pt-6">
            <Button 
              variant="ghost" 
              onClick={handleCancel}
              className="text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-950 hover:bg-slate-50 border border-slate-200 rounded-xl h-12 px-6 transition-all"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={isSaving}
              className="bg-slate-950 hover:bg-black text-white font-black text-xs uppercase tracking-widest rounded-2xl h-12 px-8 shadow-xl shadow-slate-200 transition-all gap-2 hover:scale-[1.02]"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-white" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
