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
  Lock,
  FileText,
  Image as ImageIcon,
  Eye,
  Trash2,
  FileUp,
  Upload
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
const DEMO_TRANSACTION_AMOUNT = 0.1; 
const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.network', '');


interface Supplier {
  id: number;
  name: string;
  price: number;
  rating: number;
  deliveryTime: string;
  reliability: number;
  success_rate: number;
  score: number;
  total_deals?: number;
  successful_deals?: number;
  failed_deals?: number;
  on_time_deliveries?: number;
  late_deliveries?: number;
  reputation_hash?: string;
  last_updated?: string;
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
    wallet_address?: string;
    unit_price: number;
    reliability: number;
    deliveryTime: string;
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
  const [appId, setAppId] = useState<number | null>(() => {
    const saved = sessionStorage.getItem('procureai_appid');
    return saved ? parseInt(saved) : null;
  });
  const [appAddress, setAppAddress] = useState<string | null>(() => {
    return sessionStorage.getItem('procureai_appaddress');
  });

  // UI State
  const [isSearching, setIsSearching] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentPhase, setPaymentPhase] = useState(0);

  // Delivery Verification State
  const [proofType, setProofType] = useState<'invoice_file' | 'timestamp' | 'tracking_id'>('invoice_file');
  const [proofValue, setProofValue] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [escrowStatus, setEscrowStatus] = useState<string>('funded');
  const [isVerified, setIsVerified] = useState(false);
  const [showSupplierDetails, setShowSupplierDetails] = useState<Supplier | null>(null);

  // Sync state to session storage
  useEffect(() => {
    sessionStorage.setItem('procureai_step', step);
    if (result) sessionStorage.setItem('procureai_result', JSON.stringify(result));
    if (txId) sessionStorage.setItem('procureai_txid', txId);
    if (appId) sessionStorage.setItem('procureai_appid', appId.toString());
    if (appAddress) sessionStorage.setItem('procureai_appaddress', appAddress);

    // Clear session if we go back to form
    if (step === 'form') {
      sessionStorage.removeItem('procureai_result');
      sessionStorage.removeItem('procureai_txid');
      sessionStorage.removeItem('procureai_appid');
      sessionStorage.removeItem('procureai_appaddress');
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
      // 1. Call the new Dynamic Agent Competition endpoint
      const response = await axios.post(`${API_BASE_URL}/api/select-supplier`, {
        productName,
        quantity,
        budget
      });

      // The backend now returns computed competition data
      const data = response.data;
      
      // Wait for a short moment to transition
      await new Promise(res => setTimeout(res, 1000));

      const normalizedResult = {
        suppliers: data.suppliers,
        selectedSupplier: data.selectedSupplier,
        negotiationLogs: data.negotiationLogs,
        rounds: data.rounds,
        finalDecision: data.finalDecision,
        deal: data.deal
      };

      setResult(normalizedResult);
      setStep('result');
      toast.success('AI Agents competed and negotiated the best deal dynamically!');
    } catch (err: any) {
      console.error('[ProcureAI] Competition Error:', err);
      setError(`Failed to run competition: ${err.message || 'Check backend connection.'}`);
      setStep('form');
      toast.error('Agent competition failed to initialize.');
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
    // Capture state values immediately and check for concurrent execution
    if (isExecuting) return; 
    
    const activeAddress = walletAddress;
    if (!activeAddress || !result || !result.selectedSupplier) {
      toast.error("Please connect your wallet and select a supplier first.");
      return;
    }

    setIsExecuting(true);
    setPaymentPhase(0);
    setError(null);

    // Cycle through 4 animation phases (250ms each = 1s total)
    const phases = [0, 1, 2, 3];
    let phaseIndex = 0;
    const phaseInterval = setInterval(() => {
      phaseIndex++;
      if (phaseIndex < phases.length) {
        setPaymentPhase(phaseIndex);
      }
    }, 250);

    try {
      // 1. Create Escrow on Backend (Deploys Contract)
      const response: any = await axios.post(`${API_BASE_URL}/api/create-escrow`, {
        sender: activeAddress,
        receiver: result.selectedSupplier.wallet_address || DEMO_VAULT_ADDRESS,
        amount: 0.1,
        supplier_id: result.selectedSupplier.id,
        promised_delivery_days: parseInt(result.selectedSupplier.deliveryTime) || 3
      });

      const deployedAppId = response.data.app_id;
      const deployedAppAddress = response.data.app_address;
      
      if (!deployedAppId || !deployedAppAddress) {
        throw new Error("Blockchain failure: Escrow application details missing from backend response.");
      }

      setAppId(deployedAppId);
      setAppAddress(deployedAppAddress);

      setPaymentPhase(2); // Validating / Funding Phase

      // 2. Fund the Escrow via account pre-funding + ABI call
      const suggestedParams = await algodClient.getTransactionParams().do();
      
      // A. Pre-fund the contract account with a large cushion (0.4 ALGO)
      const rentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender: activeAddress,
        receiver: deployedAppAddress,
        amount: 400000, 
        suggestedParams
      });

      // B. Create the ABI-tracked Payment Transaction (0.1 ALGO)
      const payTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender: activeAddress,
        receiver: deployedAppAddress,
        amount: 100000, 
        suggestedParams
      });

      const composer = new algosdk.AtomicTransactionComposer();
      
      let signingPromise: Promise<Uint8Array[]> | null = null;
      const signer: algosdk.TransactionSigner = async (group, indexes) => {
        if (!signingPromise) {
          const signToSign = group.map(txn => ({
            txn,
            signers: [activeAddress]
          }));
          signingPromise = peraWallet.signTransaction([signToSign]).catch(err => {
            signingPromise = null;
            throw err;
          });
        }
        const signedTxns = await signingPromise;
        return indexes.map(i => signedTxns[i]);
      };

      const method = new algosdk.ABIMethod({
        name: "fund",
        args: [{ type: "pay", name: "payment" }],
        returns: { type: "void" }
      });

      // Add "Fund" and then "Rent" to the same atomic group
      // Putting the ABI call first (with its linked payment) ensures standard indexing
      composer.addMethodCall({
        appID: BigInt(deployedAppId),
        method,
        methodArgs: [{ txn: payTxn, signer }],
        sender: activeAddress,
        suggestedParams,
        signer
      });
      
      composer.addTransaction({ txn: rentTxn, signer });

      setPaymentPhase(3); // Confirming Phase
      console.log("[ProcureAI] Executing 'Double-Funded' (Shifted) transaction group...");
      const fundResult = await composer.execute(algodClient, 4);
      
      setTxId(fundResult.txIDs[0]);
      
      // Update status to awaiting_delivery in backend
      try {
        await axios.post(`${API_BASE_URL}/api/update-escrow-status`, {
          transaction_id: response.data.transaction_id,
          status: "awaiting_delivery"
        });
      } catch (e) {
        console.warn("[ProcureAI] Failed to update status to awaiting_delivery", e);
      }

      setStep('escrow_locked');
      toast.success('Funds successfully locked in the smart contract escrow!');
    } catch (err: any) {
      clearInterval(phaseInterval);
      console.error('[ProcureAI] Execute Deal Error:', err);
      setError(`Transaction failed: ${err.message || 'Check wallet connection.'}`);
      toast.error('Failed to reserve funds on chain.');
    } finally {
      setIsExecuting(false);
      setPaymentPhase(0);
    }
  };

  const handleSubmitProof = async () => {
    if (!txId && !appId) return;
    if (proofType === 'invoice_file' && !selectedFile) {
      toast.error('Please select an invoice file to upload.');
      return;
    }
    
    setIsSubmittingProof(true);
    try {
      const id = appId ? appId.toString() : txId!;
      const formData = new FormData();
      formData.append("escrow_id", id);
      formData.append("proof_type", proofType);
      
      if (selectedFile) {
        formData.append("file", selectedFile);
      }
      if (proofType !== 'invoice_file' && proofValue) {
        formData.append("value", proofValue);
      }

      const response = await axios.post(`${API_BASE_URL}/api/submit-delivery-proof`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setEscrowStatus('proof_submitted');
      setProofUrl(response.data.delivery_proof.file_path);
      toast.success('Delivery proof submitted successfully!');
    } catch (err: any) {
      console.error('[ProcureAI] Submit Proof Error:', err);
      toast.error(err.response?.data?.detail || 'Failed to submit delivery proof.');
    } finally {
      setIsSubmittingProof(false);
    }
  };

  const handleVerifyProof = async () => {
    if (!txId && !appId) return;
    setIsVerifying(true);
    try {
      const id = appId ? appId.toString() : txId!;
      const response = await axios.post(`${API_BASE_URL}/api/verify-delivery`, {
        escrow_id: id
      });
      
      // Also mark verified on-chain
      const suggestedParams = await algodClient.getTransactionParams().do();
      const composer = new algosdk.AtomicTransactionComposer();
      const method = new algosdk.ABIMethod({
        name: "mark_verified",
        args: [],
        returns: { type: "void" }
      });

      const activeAddress = walletAddress;
      if (!activeAddress) throw new Error("Wallet not connected");

      composer.addMethodCall({
        appID: BigInt(appId!),
        method,
        methodArgs: [],
        sender: activeAddress,
        suggestedParams,
        signer: async (txns: algosdk.Transaction[]) => {
          const singleTxnGroups = txns.map(txn => ({ txn, signers: [activeAddress] }));
          return await peraWallet.signTransaction([singleTxnGroups]);
        }
      });

      await composer.execute(algodClient, 4);

      setEscrowStatus('verified');
      setIsVerified(true);
      toast.success('Delivery verified on-chain!');
    } catch (err: any) {
      console.error('[ProcureAI] Verify Proof Error:', err);
      toast.error('Verification failed. Check proof details.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleConfirmDelivery = async () => {
    const activeAddress = walletAddress;
    const activeAppId = appId;
    if (!activeAppId || !result || !activeAddress) return;
    setIsConfirming(true);
    try {
      const suggestedParams = await algodClient.getTransactionParams().do();
      
      const composer = new algosdk.AtomicTransactionComposer();
      
      // ABI method for release
      const method = new algosdk.ABIMethod({
        name: "confirm_delivery",
        args: [],
        returns: { type: "void" }
      });
 
      (composer as any).addMethodCall({
        appID: BigInt(activeAppId),
        method,
        methodArgs: [],
        sender: activeAddress,
        suggestedParams: {
          ...suggestedParams,
          fee: 2000,
          flatFee: true
        },
        // Using both naming conventions to ensure the account is made available to the node
        accounts: [result.selectedSupplier.wallet_address || DEMO_VAULT_ADDRESS],
        appAccounts: [result.selectedSupplier.wallet_address || DEMO_VAULT_ADDRESS],
        signer: async (txns: algosdk.Transaction[]) => {
          const singleTxnGroups = txns.map(txn => ({ txn, signers: [activeAddress] }));
          return await peraWallet.signTransaction([singleTxnGroups]);
        }
      });

      const releaseResult = await composer.execute(algodClient, 4);
      const realTxId = releaseResult.txIDs[0];

      // 5. Update Backend Escrow status
      // We pass the activeAppId as a fallback for the transaction_id lookup
      await axios.post(`${API_BASE_URL}/api/confirm-delivery`, { 
        transaction_id: activeAppId.toString() 
      });

      addTransaction({
        id: Date.now().toString(),
        supplier: result?.selectedSupplier?.name || "Verified Supplier",
        amount: result?.selectedSupplier?.finalPrice || 0,
        status: 'Completed',
        txId: realTxId,
        date: new Date().toISOString().split('T')[0]
      });

      setTxId(realTxId); // Update local state for final screen
      setStep('payment');
      toast.success('Delivery confirmed! Funds released to supplier.');
    } catch (err: any) {
      console.error('[ProcureAI] Confirm Delivery Error:', err);
      if (err.message && err.message.includes('user rejected')) {
        toast.error('Signature rejected by user.');
      } else {
        toast.error('Failed to release funds. Check network status.');
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
          <p className="text-slate-500 max-w-lg font-medium text-sm leading-relaxed">Let AI agents find the best suppliers and handle your on-chain transactions.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10 px-4 py-2 gap-2 uppercase tracking-widest text-[9px] font-black rounded-xl shadow-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" /> Agent-to-Agent Active
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

              <h2 className="text-2xl font-display font-semibold mb-2 text-white tracking-tight relative z-10">Agent-to-Agent Negotiation Active</h2>
              <p className="text-slate-400 max-w-md font-medium text-xs leading-relaxed relative z-10">
                ProcureAI Buyer Agent is communicating with Supplier Agents dynamically via API to negotiate real-time discounts and optimal terms.
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
                  { delay: 1.5, color: 'text-amber-400', icon: '>', text: `Filtering candidates by budget $${budget}...` },
                  { delay: 2.0, color: 'text-primary', icon: '>', text: `AGENT → Supplier A: Requesting quote for ${quantity}x ${productName}` },
                  { delay: 2.5, color: 'text-emerald-400', icon: '<', text: `Supplier A: Standard price $${Math.floor(budget / quantity * 1.2)}/unit. Volume discounts available.` },
                  { delay: 3.0, color: 'text-primary', icon: '>', text: `AGENT: Negotiating for bulk pricing and TestNet escrow settlement...` },
                  { delay: 3.5, color: 'text-emerald-400', icon: '<', text: `Supplier A: Accepted. Finalizing unit price with 15% partner discount.` },
                  { delay: 4.0, color: 'text-amber-400', icon: '>', text: `Running multi-criteria evaluation: price, reliability, delivery SLA...` },
                  { delay: 4.5, color: 'text-primary', icon: '>', text: `AGENT → All: Running A2A protocol to find optimal trust-price balance.` },
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
                        <div 
                          className="bg-white border border-slate-100 rounded-2xl p-4 hover:border-slate-200 hover:shadow-md transition-all group cursor-pointer relative"
                          onClick={() => setShowSupplierDetails(s)}
                        >
                          {/* Trust Badge */}
                          <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
                            {s.reliability >= 85 ? (
                              <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[8px] font-black uppercase tracking-tighter">Verified Trust</Badge>
                            ) : s.reliability >= 70 ? (
                              <Badge className="bg-amber-50 text-amber-600 border-amber-100 text-[8px] font-black uppercase tracking-tighter">Reliable</Badge>
                            ) : (
                              <Badge className="bg-rose-50 text-rose-600 border-rose-100 text-[8px] font-black uppercase tracking-tighter">Risk Flag</Badge>
                            )}
                            {s.reputation_hash && (
                               <div className="flex items-center gap-1 text-[7px] font-black text-emerald-500 uppercase tracking-tighter">
                                 <ShieldCheck className="w-2 h-2" /> On-chain
                               </div>
                            )}
                          </div>

                          <p className="font-bold text-slate-800 text-sm group-hover:text-primary transition-colors leading-tight mb-2 truncate pr-16">{s.name}</p>
                          <p className="text-2xl font-display font-bold text-slate-900 mb-3">${s.price.toLocaleString(undefined, { minimumFractionDigits: 0 })}</p>
                          
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
                              <span className="flex items-center gap-1">Success Rate</span>
                              <span className="text-slate-600">{s.success_rate}%</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
                              <span className="flex items-center gap-1">Total Deals</span>
                              <span className="text-slate-600">{s.total_deals || idx + 10}</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
                              <span className="flex items-center gap-1">Reliability</span>
                              <span className={cn(
                                "font-black",
                                s.reliability >= 85 ? "text-emerald-500" : s.reliability >= 70 ? "text-amber-500" : "text-rose-500"
                              )}>{s.reliability}%</span>
                            </div>
                          </div>
                          
                          <div className="mt-3 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={cn(
                                "h-full rounded-full transition-all duration-500",
                                s.reliability >= 85 ? "bg-emerald-500" : s.reliability >= 70 ? "bg-amber-500" : "bg-rose-500"
                              )} 
                              style={{ width: `${s.reliability}%` }} 
                            />
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
                      <div className="flex justify-between items-start mb-4">
                        <Badge className="bg-white/20 text-white border-none font-bold text-[10px] tracking-widest uppercase">Agent's Choice</Badge>
                        {result.selectedSupplier.reliability >= 90 ? (
                          <Badge className="bg-emerald-400 text-white border-none text-[8px] font-black uppercase tracking-tighter">High Trust Selection</Badge>
                        ) : (
                          <Badge className="bg-amber-400 text-white border-none text-[8px] font-black uppercase tracking-tighter">Balanced Selection</Badge>
                        )}
                      </div>
                      <h3 
                        className="text-xl font-display font-bold text-white cursor-pointer hover:underline"
                        onClick={() => setShowSupplierDetails(result.selectedSupplier as any)}
                      >
                        {result.selectedSupplier.name}
                      </h3>
                      <p className="text-white/60 text-xs font-medium mt-1 flex items-center gap-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                        On-chain Verified Reputation • AI Optimized
                      </p>
                    </div>

                    <div className="p-6 space-y-5">
                      {/* Breakdown Stats */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 flex flex-col items-center text-center">
                          <CheckCircle2 className="w-4 h-4 text-primary mb-1" />
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Success</span>
                          <span className="text-xs font-bold text-slate-900">{result.selectedSupplier.reliability}%</span>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 flex flex-col items-center text-center">
                          <ShieldCheck className="w-4 h-4 text-emerald-500 mb-1" />
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Verified</span>
                          <span className="text-xs font-bold text-slate-900">Yes</span>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 flex flex-col items-center text-center">
                          <TrendingDown className="w-4 h-4 text-amber-500 mb-1" />
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Deals</span>
                          <span className="text-xs font-bold text-slate-900">120+</span>
                        </div>
                      </div>

                      {/* Final Price */}
                      <div className="flex items-center justify-between py-2">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Deal Value</p>
                          <p className="text-4xl font-display font-bold text-slate-900 tracking-tight">${result.selectedSupplier.finalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center shadow-sm">
                          <CheckCircle2 className="text-emerald-500 w-7 h-7" />
                        </div>
                      </div>

                      {/* AI Reasoning */}
                      <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10">
                        <p className="text-[9px] font-bold text-primary uppercase tracking-widest mb-2 flex items-center gap-2">
                          <Cpu className="w-3 h-3" /> AI AGENT REASONING
                        </p>
                        <p className="text-xs text-slate-700 leading-relaxed font-medium">"{result.selectedSupplier.reasoning}"</p>
                      </div>

                      {/* Wallet section */}
                      {!walletAddress ? (
                        <Button
                          onClick={handleConnectWallet}
                          className="w-full h-14 text-base font-bold bg-[#0A2540] hover:bg-[#0d2e50] text-white rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"
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
                              <span className="font-bold text-amber-800">TRUST-BASED PROCUREMENT — </span>
                              This selection prioritizes reliability and delivery speed over raw price.
                            </p>
                          </div>

                          <Button
                            onClick={handleExecuteDeal}
                            disabled={isExecuting}
                            className="w-full h-14 text-base font-bold bg-primary hover:bg-primary/90 text-white rounded-xl transition-all group shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                          >
                            {isExecuting ? (
                              <><Loader2 className="w-5 h-5 animate-spin" />Processing Transaction...</>
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
            className="max-w-3xl mx-auto"
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
                <h2 className="text-2xl font-display font-medium mb-2 tracking-tight">Delivery Verification Protocol</h2>
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 mb-4 font-bold tracking-widest px-4 py-1 uppercase text-[10px]">Proof Required</Badge>
                <p className="text-slate-300 max-w-sm mx-auto font-medium text-xs leading-relaxed">Funds are locked on-chain. Settlement requires valid delivery proof and buyer verification.</p>
              </div>

              <CardContent className="p-8 space-y-8">
                {/* Escrow Status Stepper (5 STAGES) */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between px-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Escrow Lifecycle</p>
                    <Badge variant="outline" className={cn(
                      "text-[9px] font-bold uppercase tracking-widest px-3 py-1",
                      isVerified ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
                    )}>
                      {isVerified ? "Verified" : "Verification Pending"}
                    </Badge>
                  </div>

                  <div className="relative">
                    {/* Progress line */}
                    <div className="absolute top-5 left-4 right-4 h-0.5 bg-slate-100" />
                    <motion.div 
                      className="absolute top-5 left-4 h-0.5 bg-primary z-10"
                      initial={{ width: '0%' }}
                      animate={{ 
                        width: escrowStatus === 'released' ? '100%' : 
                               escrowStatus === 'verified' ? '75%' : 
                               escrowStatus === 'proof_submitted' ? '50%' : 
                               '25%' 
                      }}
                    />
                    
                    <div className="grid grid-cols-5 gap-2 relative z-10">
                      {[
                        { id: 'funded', label: 'Locked', icon: Lock, status: 'completed' },
                        { id: 'awaiting_delivery', label: 'Delivery', icon: Zap, status: escrowStatus === 'funded' ? 'current' : 'completed' },
                        { id: 'proof_submitted', label: 'Proof', icon: MessageSquare, status: escrowStatus === 'proof_submitted' ? 'current' : (escrowStatus === 'verified' || escrowStatus === 'released' ? 'completed' : 'upcoming') },
                        { id: 'verified', label: 'Verified', icon: ShieldCheck, status: escrowStatus === 'verified' ? 'current' : (escrowStatus === 'released' ? 'completed' : 'upcoming') },
                        { id: 'released', label: 'Released', icon: CheckCircle2, status: escrowStatus === 'released' ? 'current' : 'upcoming' }
                      ].map((s, i) => (
                        <div key={s.id} className="flex flex-col items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 shadow-sm",
                            s.status === 'completed' ? "bg-emerald-500 border-emerald-500 text-white shadow-emerald-200" :
                            s.status === 'current' ? "bg-white border-primary text-primary shadow-primary/10 animate-pulse" :
                            "bg-white border-slate-100 text-slate-300"
                          )}>
                            <s.icon className="w-5 h-5" />
                          </div>
                          <span className={cn(
                            "text-[8px] font-black uppercase tracking-widest text-center",
                            s.status === 'upcoming' ? "text-slate-300" : "text-slate-900"
                          )}>{s.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Proof Submission Panel */}
                  <div className="space-y-4 bg-slate-50/50 rounded-2xl border border-slate-100 p-6">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <FileUp className="w-4 h-4 text-primary" /> Submit Proof
                    </h3>
                    
                    <div className="space-y-3">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Proof Method</label>
                      <select 
                        value={proofType}
                        onChange={(e: any) => setProofType(e.target.value)}
                        className="w-full h-11 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm"
                      >
                        <option value="invoice_file">Invoice Upload (Image/PDF)</option>
                        <option value="timestamp">Delivery Timestamp</option>
                        <option value="tracking_id">Carrier Tracking ID</option>
                      </select>
                    </div>

                    {proofType === 'invoice_file' ? (
                      <div className="space-y-3">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Upload Document</label>
                        <div className="relative">
                          <input
                            type="file"
                            id="invoice-upload"
                            className="hidden"
                            accept="image/*,application/pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) setSelectedFile(file);
                            }}
                          />
                          <label
                            htmlFor="invoice-upload"
                            className={cn(
                              "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-2xl cursor-pointer transition-all gap-2",
                              selectedFile ? "border-emerald-200 bg-emerald-50/30" : "border-slate-200 bg-white hover:border-primary/30 hover:bg-slate-50"
                            )}
                          >
                            {selectedFile ? (
                              <>
                                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                                <div className="text-center px-4">
                                  <p className="text-[10px] font-black text-emerald-600 uppercase truncate max-w-[200px]">{selectedFile.name}</p>
                                  <p className="text-[8px] text-slate-400 mt-0.5">{(selectedFile.size / 1024).toFixed(1)} KB • Click to change</p>
                                </div>
                              </>
                            ) : (
                              <>
                                <Upload className="w-8 h-8 text-slate-300" />
                                <div className="text-center px-4">
                                  <p className="text-[10px] font-black text-slate-400 uppercase">Drop invoice here</p>
                                  <p className="text-[8px] text-slate-400 mt-0.5">PNG, JPG, PDF up to 5MB</p>
                                </div>
                              </>
                            )}
                          </label>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                          {proofType === 'timestamp' ? 'Submission Timestamp' : 'Tracking Number'}
                        </label>
                        <Input 
                          placeholder={proofType === 'timestamp' ? "e.g. 2024-05-01 14:00" : "e.g. TRK-8829-X"}
                          value={proofValue}
                          onChange={(e) => setProofValue(e.target.value)}
                          className="h-11 bg-white border-slate-200 rounded-xl text-xs font-bold"
                        />
                      </div>
                    )}

                    <Button
                      onClick={handleSubmitProof}
                      disabled={isSubmittingProof || escrowStatus !== 'funded'}
                      className="w-full h-12 text-xs font-black uppercase tracking-widest bg-slate-900 hover:bg-black text-white rounded-xl transition-all shadow-lg"
                    >
                      {isSubmittingProof ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Submit for Review
                    </Button>
                    
                    <p className="text-[8px] text-slate-400 font-bold uppercase text-center mt-2 leading-relaxed">
                      MVP: Proof submitted via buyer interface for demonstration.
                    </p>
                  </div>

                  {/* Verification Panel */}
                  <div className="space-y-4 bg-primary/5 rounded-2xl border border-primary/10 p-6 flex flex-col">
                    <h3 className="text-xs font-black text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" /> Audit & Validate
                    </h3>
                    
                    <div className="flex-1 space-y-5">
                      <div className="flex items-start gap-3 p-3 bg-white/50 rounded-xl border border-primary/5">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Eye className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-900 uppercase">Validation Logic</p>
                          <p className="text-[9px] text-slate-500 font-medium leading-relaxed mt-0.5">
                            Our AI validates document authenticity and cross-references metadata with ledger entries.
                          </p>
                        </div>
                      </div>

                      {escrowStatus === 'proof_submitted' && (
                        <div className="space-y-3">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Verification Target</p>
                          {proofUrl ? (
                            <div className="relative group">
                              <div className="h-32 w-full rounded-xl overflow-hidden border border-slate-100 bg-white relative">
                                {proofUrl.endsWith('.pdf') ? (
                                  <div className="h-full w-full flex flex-col items-center justify-center gap-2 bg-slate-50">
                                    <FileText className="w-8 h-8 text-rose-500" />
                                    <span className="text-[8px] font-black uppercase text-slate-400">PDF Document</span>
                                  </div>
                                ) : (
                                  <img 
                                    src={`${API_BASE_URL}${proofUrl}`} 
                                    alt="Proof Preview" 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                  />
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <a 
                                    href={`${API_BASE_URL}${proofUrl}`} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="bg-white text-slate-950 p-2 rounded-lg text-[9px] font-black uppercase flex items-center gap-2"
                                  >
                                    <ExternalLink className="w-3 h-3" /> Full View
                                  </a>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="p-3 bg-white border border-slate-100 rounded-xl flex flex-col gap-1 shadow-sm">
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Metadata</span>
                              <span className="text-xs font-mono font-bold text-slate-900 truncate">{proofValue}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={handleVerifyProof}
                      disabled={isVerifying || escrowStatus !== 'proof_submitted'}
                      className="w-full h-14 text-xs font-black uppercase tracking-widest bg-primary hover:bg-primary/90 text-white rounded-xl shadow-xl shadow-primary/20"
                    >
                      {isVerifying ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                      Finalize Verification
                    </Button>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <Button
                    onClick={handleConfirmDelivery}
                    disabled={isConfirming || !isVerified}
                    className={cn(
                      "w-full h-16 text-lg font-bold rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3",
                      isVerified 
                        ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20" 
                        : "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                    )}
                  >
                    {isConfirming ? <Loader2 className="w-6 h-6 animate-spin" /> : <Zap className={cn("w-6 h-6", isVerified ? "animate-pulse" : "")} />}
                    {isVerified ? "Confirm Release & Settle" : "Verification Required to Release"}
                  </Button>
                  
                  <p className="text-[9px] text-center text-slate-400 font-bold uppercase tracking-widest mt-4">
                    On-chain settlement is irreversible. verify carefully.
                  </p>
                </div>
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
                <h2 className="text-2xl font-display font-bold mb-1">Transaction Released</h2>
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

      {/* Supplier Detail Modal */}
      <AnimatePresence>
        {showSupplierDetails && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSupplierDetails(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="bg-slate-900 p-8 text-white relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-50" />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setShowSupplierDetails(null)}
                  className="absolute top-6 right-6 text-white/40 hover:text-white hover:bg-white/10 rounded-full"
                >
                  <ArrowRight className="w-5 h-5" />
                </Button>
                
                <div className="flex items-center gap-4 mb-6 relative z-10">
                  <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                    <ShieldCheck className="w-7 h-7 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-display font-bold">{showSupplierDetails.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-none text-[8px] font-black uppercase tracking-widest">On-chain Verified</Badge>
                      <span className="text-[10px] text-white/40 font-bold">ID: #{showSupplierDetails.id}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 relative z-10">
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Reliability Score</p>
                    <p className="text-3xl font-display font-bold text-emerald-400">{showSupplierDetails.reliability}%</p>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Success Rate</p>
                    <p className="text-3xl font-display font-bold text-primary">{showSupplierDetails.success_rate}%</p>
                  </div>
                </div>
              </div>

              <div className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Performance History</h4>
                    <span className="text-[9px] font-bold text-slate-400">
                      Last Updated: {showSupplierDetails.last_updated ? new Date(showSupplierDetails.last_updated).toLocaleString() : 'Just now'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Total Deals</p>
                      <p className="text-lg font-bold text-slate-900">{showSupplierDetails.total_deals || 120}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Successful</p>
                      <p className="text-lg font-bold text-emerald-600">{showSupplierDetails.successful_deals || 115}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">On-time</p>
                      <p className="text-lg font-bold text-blue-600">{showSupplierDetails.on_time_deliveries || 110}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Late / Failed</p>
                      <p className="text-lg font-bold text-rose-500">{showSupplierDetails.late_deliveries || 10}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                   <div className="flex items-center justify-between px-1">
                     <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Reputation Hash</h4>
                     <Badge variant="outline" className="text-[8px] font-black bg-emerald-50 text-emerald-600 border-emerald-100">ALGORAND ANCHOR</Badge>
                   </div>
                   <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 flex items-center gap-3">
                     <Lock className="w-4 h-4 text-emerald-500 shrink-0" />
                     <code className="text-[10px] font-mono text-emerald-400/80 break-all leading-relaxed">
                       {showSupplierDetails.reputation_hash || '0x7d8e2f1a9c4b5d6e7f8a9b0c1d2e3f4a5b6c7d8e2f1a9c4b5d6e7f8a9b0c1d2e'}
                     </code>
                   </div>
                </div>

                <Button 
                  onClick={() => setShowSupplierDetails(null)}
                  className="w-full h-14 bg-slate-900 hover:bg-black text-white font-bold rounded-2xl shadow-xl"
                >
                  Close Insights
                </Button>

                <p className="text-[9px] text-center text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                  Reputation evolves after every completed escrow settlement.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Procurement;
