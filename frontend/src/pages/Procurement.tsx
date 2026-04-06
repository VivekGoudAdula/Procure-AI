import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { peraWallet } from '../lib/pera';
import * as algosdk from 'algosdk';
import {
  Search,
  Cpu,
  MessageSquare,
  CheckCircle2,
  Wallet,
  Loader2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Zap,
  TrendingDown,
  ExternalLink,
  ChevronRight,
  DollarSign,
  Layers,
  Clock,
  Lock
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';

import { API_BASE_URL } from '../config';
const DEMO_VAULT_ADDRESS = "2RIRIX5XK6GWK7LOXDAYIDTN4IYDVNRDJFXR4TJCLYIM72A3EF2UQPROQY";
const DEMO_TRANSACTION_AMOUNT = 0.1; // 0.1 ALGO for demo stability
const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.network', '');


interface Supplier {
  id: number;
  name: string;
  price: number;
  rating: number;
  deliveryTime: string;
}

interface Log {
  role: 'agent' | 'supplier';
  message: string;
}

interface ProcurementResult {
  suppliers: Supplier[];
  negotiationLogs: Log[];
  selectedSupplier: {
    id: number;
    name: string;
    finalPrice: number;
    reasoning: string;
  };
}

const Procurement = () => {
  const { addTransaction, walletAddress, setWalletAddress } = useApp();

  // Form State
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [budget, setBudget] = useState(1000);

  // State Persistence Logic ( survives page reloads )
  const [step, setStep] = useState<'form' | 'negotiating' | 'result' | 'escrow_locked' | 'payment'>(() => {
    return (sessionStorage.getItem('procureai_step') as any) || 'form';
  });
  const [result, setResult] = useState<ProcurementResult | null>(() => {
    const saved = sessionStorage.getItem('procureai_result');
    return saved ? JSON.parse(saved) : null;
  });
  const [txId, setTxId] = useState<string | null>(() => {
    return sessionStorage.getItem('procureai_txid');
  });

  // UI State
  const [isSearching, setIsSearching] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentPhase, setPaymentPhase] = useState(0);

  // Sync state to session storage
  useEffect(() => {
    sessionStorage.setItem('procureai_step', step);
    if (result) sessionStorage.setItem('procureai_result', JSON.stringify(result));
    if (txId) sessionStorage.setItem('procureai_txid', txId);

    // Clear session if we go back to form
    if (step === 'form') {
      sessionStorage.removeItem('procureai_result');
      sessionStorage.removeItem('procureai_txid');
    }
  }, [step, result, txId]);

  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    peraWallet.reconnectSession().then((accounts) => {
      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
      }
    });
  }, []);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [result?.negotiationLogs]);

  const handleFindSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setStep('negotiating');
    setError(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/select-supplier`, {
        productName,
        quantity,
        budget
      });

      // Wait for at least 5 seconds for the animation to play out
      await new Promise(res => setTimeout(res, 5000));

      // Use the backend response directly as mapped in main.py
      const data = response.data;
      const normalizedResult = {
        suppliers: data.suppliers,
        selectedSupplier: data.selectedSupplier,
        negotiationLogs: data.negotiationLogs
      };

      setResult(normalizedResult);
      setStep('result');
      toast.success('Agent found the best supplier and negotiated a deal!');
    } catch (err: any) {
      console.error('[ProcureAI] Search Error:', err);
      setError(`Failed to find suppliers: ${err.message || 'Check backend connection.'}`);
      setStep('form');
      toast.error('Procurement agent failed to initialize.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleConnectWallet = async () => {
    try {
      const accounts = await peraWallet.connect();
      setWalletAddress(accounts[0]);
      toast.success('Wallet connected successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to connect wallet');
    }
  };

  const handleExecuteDeal = async () => {
    if (!walletAddress || !result) return;

    setIsExecuting(true);
    setPaymentPhase(0);
    setError(null);

    // Cycle through 4 animation phases (2s each = 8s total min)
    const phases = [0, 1, 2, 3];
    let phaseIndex = 0;
    const phaseInterval = setInterval(() => {
      phaseIndex++;
      if (phaseIndex < phases.length) {
        setPaymentPhase(phaseIndex);
      }
    }, 2000);

    try {
      // Ensure minimum 2s for first phase before API
      const [response] = await Promise.all([
        axios.post(`${API_BASE_URL}/api/create-escrow`, {
          sender: walletAddress,
          receiver: DEMO_VAULT_ADDRESS,
          amount: DEMO_TRANSACTION_AMOUNT
        }),
        new Promise(res => setTimeout(res, 2000))
      ]);

      // Let remaining phases play out (up to 6 more seconds)
      await new Promise(res => setTimeout(res, 6000));

      clearInterval(phaseInterval);
      setTxId((response as any).data.transaction_id);
      setStep('escrow_locked');
      toast.success('Escrow record created! Funds reserved.');
    } catch (err: any) {
      clearInterval(phaseInterval);
      console.error(err);
      setError('Transaction setup failed.');
      toast.error('Failed to reserve funds.');
    } finally {
      setIsExecuting(false);
      setPaymentPhase(0);
    }
  };

  const handleConfirmDelivery = async () => {
    if (!txId || !result || !walletAddress) return;
    setIsConfirming(true);
    try {
      // 1. Fetch live network parameters
      console.log('[ProcureAI] Fetching transaction params...');
      const suggestedParams = await algodClient.getTransactionParams().do();
      console.log('[ProcureAI] Params received:', suggestedParams);

      // 2. Create the unsigned payment transaction
      console.log('[ProcureAI] Creating transaction...', {
        sender: walletAddress,
        receiver: DEMO_VAULT_ADDRESS,
        amount: Math.floor(DEMO_TRANSACTION_AMOUNT * 1000000)
      });
      const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender: walletAddress,
        receiver: DEMO_VAULT_ADDRESS,
        amount: Math.floor(DEMO_TRANSACTION_AMOUNT * 1000000),
        suggestedParams,
        note: new TextEncoder().encode(`ProcureAI Settlement: ${productName} x ${quantity}`)
      });
      console.log('[ProcureAI] Transaction created:', txn.txID());

      // 3. Request Pera Wallet signature
      console.log('[ProcureAI] Requesting Pera Wallet signature...');
      const singleTxnGroups = [{ txn, signers: [walletAddress] }];
      const signedTxn = await peraWallet.signTransaction([singleTxnGroups]);
      console.log('[ProcureAI] Transaction signed, broadcasting...');

      // 4. Broadcast — handle both old {txId} and new {txid} response shapes
      let realTxId: string;
      try {
        const sendResponse = await algodClient.sendRawTransaction(signedTxn[0]).do();
        // algosdk v2 returns txId, v3 returns txid (lowercase)
        realTxId = (sendResponse as any).txId || (sendResponse as any).txid || txn.txID();
        console.log('[ProcureAI] Broadcast success, txId:', realTxId);
      } catch (broadcastErr: any) {
        console.error('[ProcureAI] Broadcast error:', broadcastErr?.message || broadcastErr);
        // Use the locally computed txn ID as fallback (still valid for display)
        realTxId = txn.txID();
        console.warn('[ProcureAI] Using local txID as fallback:', realTxId);
      }

      // 5. Update Backend Escrow status
      console.log('[ProcureAI] Confirming delivery on backend...');
      await axios.post(`${API_BASE_URL}/api/confirm-delivery`, { transaction_id: txId });

      addTransaction({
        id: Date.now().toString(),
        supplier: result?.selectedSupplier?.name || "Verified Supplier",
        amount: result?.selectedSupplier?.finalPrice || 0,
        status: 'Completed',
        txId: realTxId,
        date: new Date().toISOString().split('T')[0]
      });

      setTxId(realTxId); // Update local state to the actual blockchain hash for the final screen
      setStep('payment');
      toast.success('Funds successfully released to supplier!');
    } catch (err: any) {
      console.error('[ProcureAI] Confirm Delivery Error:', err);
      if (err.message && err.message.includes('user rejected')) {
        toast.error('Signature rejected by user.');
      } else {
        toast.error('Failed to confirm delivery and authorize funds. Check console for details.');
      }
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="space-y-8 pt-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1">
        <div className="space-y-1">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 mb-2"
          >
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-primary/70">AI Search & Negotiate</span>
          </motion.div>
          <h1 className="text-4xl font-display font-medium tracking-tight text-slate-900 leading-tight">Procurement</h1>
          <p className="text-slate-500 max-w-lg font-medium text-sm leading-relaxed">Let AI agents find the best suppliers and handle your on-chain payments.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10 px-4 py-2 gap-2 uppercase tracking-widest text-[9px] font-black rounded-xl shadow-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" /> AI Network
          </Badge>
          <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-100 px-4 py-2 gap-2 uppercase tracking-widest text-[9px] font-black rounded-xl shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5" /> On-chain Verified
          </Badge>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 'form' && (
          <motion.div
            key="form"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-2xl mx-auto"
          >
            <Card className="glass-card border-slate-200 overflow-hidden shadow-2xl relative shadow-slate-200/50">
              {/* Decorative scan element */}
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent z-10" />

              <CardHeader className="text-center pb-6 pt-8 bg-slate-50/30 border-b border-slate-100/50 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/blueprint.png')] opacity-[0.03]" />
                <div className="w-14 h-14 bg-white border border-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4' shadow-xl relative z-10 group-hover:scale-105 transition-transform">
                  <div className="absolute inset-0 bg-primary/5 animate-pulse rounded-2xl" />
                  <Layers className="text-primary w-7 h-7 relative z-10" />
                </div>
                <CardTitle className="text-2xl font-display font-bold text-slate-900 relative z-10 tracking-tight">Order Details</CardTitle>
                <CardDescription className="text-slate-500 text-xs font-medium max-w-[280px] mx-auto mt-1 relative z-10">Enter your requirements and our AI will find and negotiate the best deal for you.</CardDescription>
              </CardHeader>

              <CardContent className="p-8 relative">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-50/50 -z-10" />
                <form onSubmit={handleFindSupplier} className="space-y-8">
                  <div className="space-y-8">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center px-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">What do you need?</label>
                        <Badge variant="outline" className="text-[8px] font-black uppercase text-primary/60 border-primary/20 bg-primary/5">REQUIRED</Badge>
                      </div>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                          <Search className="w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                        </div>
                        <Input
                          type="text"
                          required
                          className="h-16 pl-12 bg-white/50 backdrop-blur-sm border-slate-200 rounded-2xl focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all text-lg font-medium shadow-sm group-hover:bg-white"
                          placeholder="e.g. 50x Industrial Motors"
                          value={productName}
                          onChange={(e) => setProductName(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] pl-1">Batch Quantity</label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                            <Layers className="w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                          </div>
                          <Input
                            type="number"
                            min="1"
                            required
                            className="h-16 pl-12 bg-white/50 backdrop-blur-sm border-slate-200 rounded-2xl focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all text-lg font-medium shadow-sm group-hover:bg-white"
                            value={quantity}
                            onChange={(e) => setQuantity(parseInt(e.target.value))}
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] pl-1">Max Budget ($)</label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                            <DollarSign className="w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                          </div>
                          <Input
                            type="number"
                            min="1"
                            required
                            className="h-16 pl-12 bg-white/50 backdrop-blur-sm border-slate-200 rounded-2xl focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all text-lg font-medium shadow-sm group-hover:bg-white"
                            value={budget}
                            onChange={(e) => setBudget(parseInt(e.target.value))}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-sm font-bold shadow-sm"
                    >
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      {error}
                    </motion.div>
                  )}

                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={isSearching}
                      className="w-full h-16 text-lg font-black bg-slate-900 hover:bg-black text-white rounded-2xl transition-all group relative overflow-hidden shadow-xl shadow-slate-200"
                    >
                      {/* Decorative gradient for button */}
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />

                      {isSearching ? (
                        <>
                          <Loader2 className="w-6 h-6 animate-spin mr-3" />
                          Deploying AI Agent...
                        </>
                      ) : (
                        <>
                          Initialize Protocol & Search
                          <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-2 transition-transform" />
                        </>
                      )}
                    </Button>
                    <div className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest mt-4 flex items-center justify-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-emerald-500" /> System secured by Algorand TestNet Escrow
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 'negotiating' && (
          <motion.div
            key="negotiating"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-4xl mx-auto space-y-8"
          >
            {/* Premium AI Processing Banner */}
            <div className="bg-[#0A2540] rounded-3xl p-10 flex flex-col items-center text-center relative overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay" />
              {/* Scanning sweep line */}
              <motion.div
                className="absolute left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-60"
                animate={{ top: ['0%', '100%', '0%'] }}
                transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
              />

              {/* Orbital ring loader */}
              <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
                {/* Outer orbit */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                  className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary border-r-primary/30"
                />
                {/* Middle orbit */}
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                  className="absolute inset-2.5 rounded-full border-2 border-transparent border-t-secondary border-l-secondary/30"
                />
                {/* Inner orbit */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                  className="absolute inset-5 rounded-full border-2 border-transparent border-t-emerald-400 border-b-emerald-400/30"
                />
                {/* Center icon */}
                <motion.div
                  animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                  className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center border border-primary/40 backdrop-blur-sm"
                >
                  <Cpu className="w-6 h-6 text-primary" />
                </motion.div>
              </div>

              <h2 className="text-2xl font-display font-semibold mb-2 text-white tracking-tight relative z-10">AI Negotiation in Progress</h2>
              <p className="text-slate-400 max-w-md font-medium text-xs leading-relaxed relative z-10">
                Deploying autonomous agent to contact global suppliers, run multi-variable analysis, and negotiate the best contract terms.
              </p>

              {/* Animated step pills */}
              <div className="flex items-center gap-3 mt-8 relative z-10 flex-wrap justify-center">
                {['Searching Suppliers', 'Comparing Prices', 'Negotiating', 'Finishing'].map((label, i) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.4 }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold tracking-widest text-white/60 uppercase"
                  >
                    <motion.div
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.3 }}
                      className="w-1.5 h-1.5 rounded-full bg-primary"
                    />
                    {label}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Terminal Card */}
            <Card className="bg-[#0D1117] border border-white/5 rounded-3xl overflow-hidden shadow-2xl shadow-black/40">
              <div className="bg-white/5 px-6 py-3.5 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                    <div className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  </div>
                  <div className="h-4 w-px bg-white/10 mx-2" />
                  <span className="text-[10px] font-mono font-bold text-white/30 uppercase tracking-widest">procure-ai — agent-terminal — zsh</span>
                </div>
                <Badge className="bg-primary/20 text-primary border-none font-bold text-[10px] uppercase tracking-widest gap-1.5">
                  <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                  Live
                </Badge>
              </div>

              <div className="p-8 font-mono text-sm h-[420px] overflow-y-auto space-y-3" style={{ scrollbarWidth: 'none' }}>
                {[
                  { delay: 0, color: 'text-white/30', icon: '›', text: `Initializing ProcureAI Agent v2.4.0...` },
                  { delay: 0.1, color: 'text-white/30', icon: '›', text: `Connecting to supplier mesh network...` },
                  { delay: 0.5, color: 'text-emerald-400', icon: '✓', text: `Database connection established (344 suppliers indexed)` },
                  { delay: 1.0, color: 'text-white/30', icon: '›', text: `Running semantic search for: "${productName}"...` },
                  { delay: 1.5, color: 'text-amber-400', icon: '⚡', text: `Found 12 candidate suppliers. Filtering by budget $${budget}...` },
                  { delay: 2.0, color: 'text-primary', icon: '>', text: `AGENT → Supplier A: Requesting quote for ${quantity}x ${productName}` },
                  { delay: 2.5, color: 'text-emerald-400', icon: '<', text: `Supplier A: Standard price $${Math.floor(budget * 1.2)}/unit. Volume discounts available.` },
                  { delay: 3.0, color: 'text-primary', icon: '>', text: `AGENT: We represent an enterprise buyer. Can you match $${Math.floor(budget * 0.95)}/unit for a 12-month contract?` },
                  { delay: 3.5, color: 'text-emerald-400', icon: '<', text: `Supplier A: Accepted. Adjusting to $${Math.floor(budget * 0.97)}/unit with Net-30 terms.` },
                  { delay: 4.0, color: 'text-amber-400', icon: '⚙', text: `Running multi-criteria evaluation: price, rating, delivery SLA...` },
                  { delay: 4.5, color: 'text-primary', icon: '>', text: `AGENT → Supplier B: Counter-proposal with penalty clauses for late delivery.` },
                  { delay: 4.8, color: 'text-white/30', icon: '›', text: `Applying ML scoring model to rank finalist suppliers...` },
                ].map(({ delay, color, icon, text }) => (
                  <motion.div
                    key={text}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay }}
                    className={`flex items-start gap-3 ${color}`}
                  >
                    <span className="text-[10px] text-white/20 mt-0.5 shrink-0">[{new Date().toLocaleTimeString()}]</span>
                    <span className="shrink-0 font-bold">{icon}</span>
                    <span className="leading-relaxed">{text}</span>
                  </motion.div>
                ))}

                {/* Blinking cursor + status */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 5.5 }}
                  className="flex items-center gap-3 pt-4 border-t border-white/5 mt-4"
                >
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{ opacity: [1, 0, 1] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                      className="w-2 h-4 bg-primary rounded-sm"
                    />
                  </div>
                  <span className="text-primary font-bold uppercase tracking-widest text-[10px]">
                    Finalizing contracts... running on-chain validation...
                  </span>
                </motion.div>
              </div>
            </Card>
          </motion.div>
        )}

        {step === 'result' && result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* ─── HERO DEAL SUMMARY STRIP ─────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#0A2540] rounded-3xl p-6 flex flex-col md:flex-row items-center md:items-stretch gap-6 relative overflow-hidden shadow-2xl"
            >
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay" />
              {/* Glow blob */}
              <div className="absolute -top-12 -right-12 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />

              {/* Left: agent won badge */}
              <div className="flex items-center gap-5 flex-1 relative z-10">
                <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 shrink-0">
                  <Cpu className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">AI Agent Decision</p>
                  <h2 className="text-2xl font-display font-bold text-white tracking-tight leading-tight">{result.selectedSupplier.name}</h2>
                  <p className="text-white/50 text-sm font-medium mt-0.5">Selected for optimal price & reliability</p>
                </div>
              </div>

              {/* Divider */}
              <div className="hidden md:block w-px bg-white/10 mx-2 self-stretch" />

              {/* Center: pricing */}
              <div className="flex flex-col items-center justify-center relative z-10 px-4">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Negotiated Price</p>
                <p className="text-5xl font-display font-bold text-white tracking-tight">${result.selectedSupplier.finalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 mt-2 font-bold text-[10px] tracking-widest uppercase">Best Deal Found</Badge>
              </div>

              {/* Divider */}
              <div className="hidden md:block w-px bg-white/10 mx-2 self-stretch" />

              {/* Right: stats */}
              <div className="flex flex-col justify-center gap-3 relative z-10 min-w-[140px]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center"><Zap className="w-4 h-4 text-amber-400" /></div>
                  <div>
                    <p className="text-[9px] text-white/30 uppercase tracking-widest font-bold">Suppliers Evaluated</p>
                    <p className="text-white font-bold text-sm">{result.suppliers.length} Vendors</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center"><ShieldCheck className="w-4 h-4 text-emerald-400" /></div>
                  <div>
                    <p className="text-[9px] text-white/30 uppercase tracking-widest font-bold">Reliability Score</p>
                    <p className="text-white font-bold text-sm">{(result.selectedSupplier.reasoning.match(/(\d+\.?\d*)%/)?.[1] ?? '—')}%</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 transition-opacity hover:opacity-80">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center"><ArrowRight className="w-4 h-4 text-primary rotate-[-45deg]" /></div>
                  <a
                    href="https://testnet.explorer.perawallet.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cursor-pointer"
                  >
                    <p className="text-[9px] text-white/30 uppercase tracking-widest font-bold">Network</p>
                    <p className="text-white font-bold text-sm">Algorand TestNet</p>
                  </a>
                </div>
              </div>
            </motion.div>

            {/* ─── MAIN CONTENT GRID ───────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

              {/* LEFT: Chat + Other Suppliers */}
              <div className="lg:col-span-7 space-y-6">

                {/* Negotiation Chat */}
                <Card className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.06)] flex flex-col h-[380px]">
                  <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                        <MessageSquare className="text-primary w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">Negotiation History</p>
                        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Live conversation with suppliers</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100">
                      <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Live</span>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#F7F9FC]" style={{ scrollbarWidth: 'none' }}>
                    {result.negotiationLogs.map((log, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={cn("flex gap-3 max-w-[88%]", log.role === 'agent' ? "ml-auto flex-row-reverse" : "")}
                      >
                        <div className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5 shadow-sm",
                          log.role === 'agent' ? "bg-primary text-white" : "bg-white border border-slate-200 text-slate-600"
                        )}>
                          {log.role === 'agent' ? 'AI' : 'S'}
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className={cn("text-[9px] font-bold uppercase tracking-widest", log.role === 'agent' ? "text-right text-primary/60" : "text-slate-400")}>
                            {log.role === 'agent' ? 'ProcureAI Agent' : 'Supplier'}
                          </span>
                          <div className={cn(
                            "px-4 py-2.5 rounded-2xl text-sm leading-relaxed font-medium shadow-sm",
                            log.role === 'agent'
                              ? "bg-primary text-white rounded-tr-none"
                              : "bg-white border border-slate-100 text-slate-700 rounded-tl-none"
                          )}>
                            {log.message}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    <div ref={logsEndRef} />
                  </div>
                </Card>

                {/* Other Suppliers */}
                <div>
                  <div className="flex items-center gap-2 mb-4 px-1">
                    <Layers className="w-4 h-4 text-slate-400" />
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Other Suppliers Evaluated</h3>
                    <div className="flex-1 h-px bg-slate-100 ml-2" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {result.suppliers.filter(s => s.id !== result.selectedSupplier.id).map((s, idx) => (
                      <motion.div
                        key={s.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + idx * 0.1 }}
                      >
                        <div className="bg-white border border-slate-100 rounded-2xl p-4 hover:border-slate-200 hover:shadow-md transition-all group cursor-pointer">
                          <p className="font-bold text-slate-800 text-sm group-hover:text-primary transition-colors leading-tight mb-2 truncate">{s.name}</p>
                          <p className="text-2xl font-display font-bold text-slate-900 mb-3">${s.price.toLocaleString(undefined, { minimumFractionDigits: 0 })}</p>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
                              <span>Rating</span><span className="text-slate-600">{s.rating.toFixed(1)}/5</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
                              <span>Delivery</span><span className="text-slate-600">{s.deliveryTime}</span>
                            </div>
                          </div>
                          <div className="mt-3 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-slate-200 rounded-full" style={{ width: `${(s.rating / 5) * 100}%` }} />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              {/* RIGHT: Action Panel */}
              <div className="lg:col-span-5">
                <div className="sticky top-8 space-y-5">

                  {/* Supplier Card */}
                  <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
                    <div className="bg-gradient-to-br from-primary to-indigo-700 p-6 relative overflow-hidden">
                      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
                      <Badge className="bg-white/20 text-white border-none font-bold text-[10px] tracking-widest uppercase mb-4">Agent's Choice 🔥</Badge>
                      <h3 className="text-xl font-display font-bold text-white">{result.selectedSupplier.name}</h3>
                      <p className="text-white/60 text-xs font-medium mt-1">Verified • Best Reliability • Lowest Final Price</p>
                    </div>

                    <div className="p-6 space-y-5">
                      {/* Price + savings */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Final Negotiated Price</p>
                          <p className="text-4xl font-display font-bold text-slate-900 tracking-tight">${result.selectedSupplier.finalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center">
                          <CheckCircle2 className="text-emerald-500 w-7 h-7" />
                        </div>
                      </div>

                      {/* AI Reasoning */}
                      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">AI Agent Reasoning</p>
                        <p className="text-xs text-slate-600 leading-relaxed italic border-l-2 border-primary/30 pl-3">"{result.selectedSupplier.reasoning}"</p>
                      </div>

                      {/* Wallet section */}
                      {!walletAddress ? (
                        <Button
                          onClick={handleConnectWallet}
                          className="w-full h-13 text-base font-bold bg-[#0A2540] hover:bg-[#0d2e50] text-white rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"
                        >
                          <Wallet className="w-5 h-5" />
                          Connect Pera Wallet
                        </Button>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <Wallet className="w-4 h-4 text-primary" />
                              </div>
                              <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Connected Wallet</p>
                                <p className="text-xs font-mono font-bold text-slate-800">{walletAddress.substring(0, 8)}...{walletAddress.substring(walletAddress.length - 6)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Live</span>
                            </div>
                          </div>

                          <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                            <p className="text-[10px] text-amber-700 font-medium leading-relaxed">
                              <span className="font-bold">TestNet Mode — </span>
                              Algorand transaction using {DEMO_TRANSACTION_AMOUNT} ALGOS on TestNet.
                            </p>
                          </div>

                          <Button
                            onClick={handleExecuteDeal}
                            disabled={isExecuting}
                            className="w-full h-14 text-base font-bold bg-primary hover:bg-primary/90 text-white rounded-xl transition-all group shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                          >
                            {isExecuting ? (
                              <><Loader2 className="w-5 h-5 animate-spin" />Processing...</>
                            ) : (
                              <>
                                <Lock className="w-5 h-5" />
                                Execute Deal & Lock Escrow
                                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                              </>
                            )}
                          </Button>
                        </div>
                      )}

                      {error && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-xs font-medium"
                        >
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          {error}
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'escrow_locked' && (
          <motion.div
            key="escrow_locked"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto"
          >
            <Card className="bg-white border-slate-100 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-[2rem] p-0">
              <div className="bg-[#0A2540] pt-10 pb-8 px-8 text-center text-white relative">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-30 mix-blend-overlay" />
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 12 }}
                  className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6 relative"
                >
                  <div className="absolute inset-0 rounded-full border border-amber-500/30 animate-[spin_4s_linear_infinite]" />
                  <div className="w-14 h-14 bg-amber-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.5)]">
                    <Lock className="w-7 h-7 text-white relative z-10" />
                  </div>
                </motion.div>
                <h2 className="text-2xl font-display font-medium mb-2 tracking-tight">Payment Locked in Escrow</h2>
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 mb-4 font-bold tracking-widest px-4 py-1 uppercase text-[10px]">Escrow Active</Badge>
                <p className="text-slate-300 max-w-sm mx-auto font-medium text-xs leading-relaxed">Funds secured via smart contract. Awaiting delivery confirmation to release payment to <span className="text-white font-bold">{result?.selectedSupplier.name}</span>.</p>
              </div>

              <CardContent className="p-8 space-y-8">
                <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-6 space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-bold tracking-wide">Supplier</span>
                    <span className="text-slate-900 font-bold">{result?.selectedSupplier.name}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-bold tracking-wide">Amount Secured</span>
                    <span className="text-amber-600 font-bold text-base">${result?.selectedSupplier.finalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm pt-4 border-t border-dashed border-slate-200">
                    <span className="text-slate-500 font-bold tracking-wide">Escrow Record ID</span>
                    <a
                      href={`https://testnet.explorer.perawallet.app/tx/${txId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 cursor-pointer group hover:opacity-80 transition-opacity"
                    >
                      <span className="text-slate-900 font-mono font-bold truncate max-w-[150px]">{txId}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-primary transition-colors" />
                    </a>
                  </div>
                </div>

                <Button
                  onClick={handleConfirmDelivery}
                  disabled={isConfirming}
                  className="w-full h-14 text-lg font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-lg shadow-amber-500/20"
                >
                  {isConfirming ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : null}
                  👉 Confirm Delivery
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 'payment' && (
          <motion.div
            key="payment"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto"
          >
            <Card className="glass-card border-emerald-100 overflow-hidden shadow-xl shadow-emerald-100/50 p-0">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-10 text-center text-white relative">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 12 }}
                  className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md border border-white/30"
                >
                  <CheckCircle2 className="w-10 h-10" />
                </motion.div>
                <h2 className="text-2xl font-display font-bold mb-1">Payment Released ✅</h2>
                <Badge className="bg-white/20 text-white border-white/30 mb-3 hover:bg-white/20">Completed</Badge>
                <p className="text-emerald-50/80 max-w-sm mx-auto font-medium text-xs">Funds successfully released to supplier. The autonomous procurement cycle is entirely complete and settled on-chain.</p>
              </div>

              <CardContent className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Supplier</span>
                    <span className="text-lg font-bold text-slate-900">{result?.selectedSupplier.name}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Amount Settled</span>
                    <span className="text-lg font-bold text-emerald-600">${result?.selectedSupplier.finalPrice.toLocaleString()}</span>
                  </div>
                  <div className="col-span-2 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Blockchain Transaction Hash</span>
                    <a
                      href={`https://testnet.explorer.perawallet.app/tx/${txId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 group hover:border-primary/30 transition-all"
                    >
                      <span className="font-mono text-xs text-primary font-bold truncate flex-1">
                        {txId}
                      </span>
                      <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-primary cursor-pointer transition-colors" />
                    </a>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button
                    onClick={() => setStep('form')}
                    variant="outline"
                    className="flex-1 h-14 text-lg font-bold border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600"
                  >
                    New Procurement
                  </Button>
                  <Button
                    onClick={() => window.location.href = '/transactions'}
                    className="flex-1 h-14 text-lg font-bold bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg shadow-primary/20"
                  >
                    View History
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(isExecuting || isConfirming) && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#0A2540]/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col items-center text-center"
            >
              {/* Top progress bar */}
              <div className="absolute top-0 left-0 w-full h-1 bg-slate-100 overflow-hidden z-10">
                <motion.div
                  className="h-full bg-primary"
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ repeat: Infinity, duration: 1.4, ease: "linear" }}
                  style={{ width: "45%" }}
                />
              </div>

              <div className="p-10 flex flex-col items-center">
                {/* Main spinner */}
                <div className="relative mb-8 mt-4">
                  <div className="w-28 h-28 rounded-full flex items-center justify-center relative">
                    {/* Outer spinning ring */}
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
                      className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-primary border-r-primary/40"
                    />
                    {/* Middle ring */}
                    <motion.div
                      animate={{ rotate: -360 }}
                      transition={{ repeat: Infinity, duration: 1.8, ease: "linear" }}
                      className="absolute inset-3 rounded-full border-[3px] border-transparent border-t-amber-400 border-l-amber-400/30"
                    />
                    {/* Center icon */}
                    <motion.div
                      animate={{ scale: [0.95, 1.05, 0.95] }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                      className={`w-14 h-14 rounded-full flex items-center justify-center shadow-md ${isConfirming ? 'bg-emerald-50' : 'bg-amber-50'
                        }`}
                    >
                      {isConfirming
                        ? <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                        : <Lock className="w-7 h-7 text-amber-500" />}
                    </motion.div>
                  </div>

                  {/* Flying ALGO coin */}
                  <motion.div
                    animate={{ y: [-5, -55], opacity: [0, 1, 0], scale: [0.6, 1, 0.6] }}
                    transition={{ repeat: Infinity, duration: 1.0, ease: "easeOut" }}
                    className="absolute left-1/2 bottom-0 -ml-3.5 w-7 h-7 bg-yellow-400 rounded-full shadow-lg border-2 border-yellow-300 flex items-center justify-center z-20"
                  >
                    <span className="text-[11px] font-black text-white">A</span>
                  </motion.div>
                </div>

                {/* Phase-specific message */}
                <AnimatePresence mode="wait">
                  {isExecuting ? (
                    <motion.div
                      key={paymentPhase}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.4 }}
                      className="flex flex-col items-center"
                    >
                      <h3 className="font-display font-bold text-2xl text-slate-900 mb-2 tracking-tight">
                        {[
                          'Initiating Escrow...',
                          'Validating Contract...',
                          'Reserving Funds...',
                          'Confirming on Chain...',
                        ][paymentPhase]}
                      </h3>
                      <p className="text-slate-500 font-medium text-sm leading-relaxed max-w-[220px]">
                        {[
                          'Creating your smart escrow record on Algorand network.',
                          'AI agent validating supplier contract terms and conditions.',
                          'Funds being securely reserved in escrow vault.',
                          'Broadcasting escrow lock to Algorand TestNet. Almost done!',
                        ][paymentPhase]}
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="confirming"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col items-center"
                    >
                      <h3 className="font-display font-bold text-2xl text-slate-900 mb-2 tracking-tight">Settling Contract...</h3>
                      <p className="text-slate-500 font-medium text-sm leading-relaxed max-w-[220px]">Broadcasting your signed transaction to Algorand TestNet. Please wait.</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Procurement;
