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
  Upload,
  Settings,
  Shield,
  Activity,
  Truck,
  Percent,
  Check,
  Package
} from 'lucide-react';
import IntelligenceLoading from '../components/procurement/IntelligenceLoading';
import SupplierIntelligenceDashboard from '../components/procurement/SupplierIntelligenceDashboard';
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
  status?: string;
  reason?: string;
  policy_applied?: boolean;
  filtered_out_count?: number;
  rejection_reasons?: Array<{ supplier: string; reasons: string[] }>;
}

interface IntelligenceResult {
  suppliers: any[];
  recommended_supplier: any;
  procurement_analysis: any;
  rejected_suppliers: any[];
}

const Procurement = () => {
  const { addTransaction, walletAddress, setWalletAddress } = useApp();

  // Form State
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [budget, setBudget] = useState(1000);
  const [shippingRegion, setShippingRegion] = useState('Global');

  // Policy Engine State
  const [enablePolicy, setEnablePolicy] = useState(false);
  const [minReliability, setMinReliability] = useState<number>(80);
  const [maxDeliveryDays, setMaxDeliveryDays] = useState<number>(7);
  const [minSuccessRate, setMinSuccessRate] = useState<number>(85);
  const [requireOnChain, setRequireOnChain] = useState(false);

  // State Persistence Logic ( survives page reloads )
  const [step, setStep] = useState<'form' | 'intelligence_loading' | 'intelligence_dashboard' | 'escrow_locked' | 'payment'>(() => {
    return (sessionStorage.getItem('procureai_step') as any) || 'form';
  });
  const [intelligenceResult, setIntelligenceResult] = useState<IntelligenceResult | null>(() => {
    const saved = sessionStorage.getItem('procureai_intelligence');
    return saved ? JSON.parse(saved) : null;
  });
  const [procurementLogs, setProcurementLogs] = useState<string[]>([]);
  const [showTerminal, setShowTerminal] = useState(false);
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
  const [x402Session, setX402Session] = useState<any>(() => {
    const saved = sessionStorage.getItem('procureai_x402_session');
    return saved ? JSON.parse(saved) : null;
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
    if (intelligenceResult) sessionStorage.setItem('procureai_intelligence', JSON.stringify(intelligenceResult));
    if (txId) sessionStorage.setItem('procureai_txid', txId);
    if (appId) sessionStorage.setItem('procureai_appid', appId.toString());
    if (appAddress) sessionStorage.setItem('procureai_appaddress', appAddress);
    if (x402Session) sessionStorage.setItem('procureai_x402_session', JSON.stringify(x402Session));

    // Clear session if we go back to form
    if (step === 'form') {
      sessionStorage.removeItem('procureai_result');
      sessionStorage.removeItem('procureai_txid');
      sessionStorage.removeItem('procureai_appid');
      sessionStorage.removeItem('procureai_appaddress');
      sessionStorage.removeItem('procureai_x402_session');
    }
  }, [step, result, txId, x402Session]);

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

  const streamLogs = async (logs: string[]) => {
    for (const log of logs) {
      await new Promise(res => setTimeout(res, 600 + Math.random() * 600));
      setProcurementLogs(prev => [...prev, `[PROCURE-AI] ${log}`]);
    }
  };

  const handleFindSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setStep('intelligence_loading');
    setError(null);
    setProcurementLogs([]);

    try {
      // 1. Initialize x402 Procurement Session
      const x402Res = await axios.post(`${API_BASE_URL}/api/x402/initiate-session`, {
        product_name: productName,
        quantity,
        budget
      });
      setX402Session(x402Res.data);
      
      // 2. Stream x402 Protocol Logs
      await streamLogs(x402Res.data.logs);

      // 3. Run Global Intelligence Scan
      const response = await axios.post(`${API_BASE_URL}/api/procurement/intelligence`, {
        product_name: productName,
        quantity,
        budget,
        shipping_region: shippingRegion,
        procurement_policy: enablePolicy ? {
          min_reliability: minReliability,
          max_delivery_days: maxDeliveryDays,
          min_success_rate: minSuccessRate,
          require_on_chain: requireOnChain
        } : null
      });

      setIntelligenceResult(response.data);
      
      // 4. Stream Intelligence Logs
      const intelLogs = response.data.logs || [];
      for (const log of intelLogs) {
        await new Promise(res => setTimeout(res, 400));
        setProcurementLogs(prev => [...prev, log]);
      }
      
      // Small final buffer
      await new Promise(res => setTimeout(res, 1000));

      setShowTerminal(true);
      setStep('intelligence_dashboard');
      toast.success('x402 Secure Procurement Session Established!');
    } catch (err: any) {
      console.error('[ProcureAI] Intelligence Error:', err);
      setError(`Failed to fetch intelligence: ${err.message || 'Check backend connection.'}`);
      setStep('form');
      toast.error('Procurement scan failed.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectIntelligenceSupplier = async (supplier: any) => {
    // Human approval logs
    const approvalLogs = [
      "Human procurement approval received.",
      "Supplier partnership authorized.",
      "Negotiation lifecycle finalized.",
      "Preparing procurement commitment..."
    ];
    
    await streamLogs(approvalLogs);

    try {
      // Call backend to select supplier
      const response = await axios.post(`${API_BASE_URL}/api/procurement/select-supplier`, {
        supplier_id: supplier.id,
        session_id: x402Session?.session_id || "DEMO-SESSION"
      });
      console.log("[ProcureAI] Select Supplier Response:", response.data);
    } catch (err) {
      console.error("[ProcureAI] Failed to notify backend of selection", err);
    }

    // Map intelligence supplier to the format expected by the escrow flow
    const selected = {
      id: supplier.id,
      name: supplier.name,
      finalPrice: supplier.negotiated_price * quantity,
      unit_price: supplier.negotiated_price,
      deliveryTime: `${supplier.lead_time_days} Days`,
      reliability: supplier.trust_score,
      reasoning: "AI recommended based on optimal price and trust index.",
      wallet_address: supplier.address || DEMO_VAULT_ADDRESS
    };

    setResult({
      suppliers: intelligenceResult?.suppliers.map(s => ({
        ...s,
        price: s.negotiated_price,
        deliveryTime: `${s.lead_time_days} days`,
        reliability: s.trust_score,
        rating: s.rating,
        success_rate: s.success_rate
      })) || [],
      selectedSupplier: selected,
      negotiationLogs: [
        { role: 'agent', message: "System scan complete. Evaluating candidates..." },
        { role: 'supplier', message: `Best offer: $${supplier.negotiated_price} per unit.` }
      ]
    });

    // Directly move to escrow phase after selection
    handleExecuteDealFromSelection(selected);
  };

  const handleExecuteDealFromSelection = async (selected: any) => {
    // This is essentially handleExecuteDeal but using the passed supplier
    if (isExecuting) return; 
    
    const activeAddress = walletAddress;
    if (!activeAddress) {
      toast.error("Please connect your wallet first.");
      return;
    }

    setIsExecuting(true);
    setPaymentPhase(0);
    setError(null);

    // Cycle through 4 animation phases
    const phaseInterval = setInterval(() => {
      setPaymentPhase(p => (p < 3 ? p + 1 : p));
    }, 250);

    try {
      const response: any = await axios.post(`${API_BASE_URL}/api/procurement/initiate-commitment`, {
        sender: activeAddress,
        receiver: selected.wallet_address || DEMO_VAULT_ADDRESS,
        amount: 0.1,
        supplier_id: selected.id,
        promised_delivery_days: parseInt(selected.deliveryTime) || 3
      });

      const deployedAppId = response.data.app_id;
      const deployedAppAddress = response.data.app_address;
      
      setAppId(deployedAppId);
      setAppAddress(deployedAppAddress);

      const suggestedParams = await algodClient.getTransactionParams().do();
      const rentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender: activeAddress,
        receiver: deployedAppAddress,
        amount: 400000, 
        suggestedParams
      });

      const payTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender: activeAddress,
        receiver: deployedAppAddress,
        amount: 100000, 
        suggestedParams
      });

      const composer = new algosdk.AtomicTransactionComposer();
      const signer: algosdk.TransactionSigner = async (group, indexes) => {
        const signToSign = group.map(txn => ({ txn, signers: [activeAddress] }));
        const signedTxns = await peraWallet.signTransaction([signToSign]);
        return indexes.map(i => signedTxns[i]);
      };

      const method = new algosdk.ABIMethod({
        name: "fund",
        args: [{ type: "pay", name: "payment" }],
        returns: { type: "void" }
      });

      composer.addMethodCall({
        appID: BigInt(deployedAppId),
        method,
        methodArgs: [{ txn: payTxn, signer }],
        sender: activeAddress,
        suggestedParams,
        signer
      });
      composer.addTransaction({ txn: rentTxn, signer });

      const fundResult = await composer.execute(algodClient, 4);
      setTxId(fundResult.txIDs[0]);
      
      setStep('escrow_locked');
      toast.success('Escrow settlement initiated and funds locked!');
    } catch (err: any) {
      clearInterval(phaseInterval);
      setError(`Transaction failed: ${err.message || 'Check wallet connection.'}`);
      toast.error('Failed to initiate escrow settlement.');
    } finally {
      setIsExecuting(false);
      setPaymentPhase(0);
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
      const response: any = await axios.post(`${API_BASE_URL}/api/procurement/initiate-commitment`, {
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
      const response = await axios.post(`${API_BASE_URL}/api/procurement/verify-delivery`, {
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
      await axios.post(`${API_BASE_URL}/api/procurement/release-settlement`, { 
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
    <div className="space-y-6 min-h-[calc(100vh-2rem)] bg-slate-50 p-6 -mx-4 md:-mx-8 lg:-mx-12 -mt-4 text-slate-900">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1 max-w-7xl mx-auto">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-slate-900">AI Procurement Intelligence</h1>
          <p className="text-slate-500 mt-1.5 font-medium text-xs">Enterprise copilot for global sourcing.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-50 text-emerald-600 border-none text-[8px] font-black uppercase tracking-widest">x402 Authorized</Badge>
          <Badge className="bg-amber-50 text-amber-600 border-none text-[8px] font-black uppercase tracking-widest">Trade Assurance</Badge>
          <Badge className="bg-primary/10 text-primary border-none text-[8px] font-black uppercase tracking-widest">Algorand Secured</Badge>
          {!walletAddress && (
            <Button onClick={handleConnectWallet} className="bg-primary text-white hover:bg-primary/90 px-6 font-semibold">
              Connect Wallet
            </Button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 'form' && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-7xl mx-auto space-y-12"
          >
            {/* SECTION 1: Procurement Input Area */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <form onSubmit={handleFindSupplier} className="flex flex-col lg:flex-row gap-4 items-center">
                <div className="flex-1 w-full flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 h-12">
                  <Search className="w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    className="bg-transparent border-none outline-none text-slate-900 w-full text-sm font-medium placeholder-slate-400"
                    placeholder="Search product (e.g. 50x Industrial Motors)"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                  />
                </div>
                
                <div className="w-full lg:w-32 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 h-12">
                  <Layers className="w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    min="1"
                    required
                    className="bg-transparent border-none outline-none text-slate-900 w-full text-sm font-medium placeholder-slate-400"
                    placeholder="Qty"
                    value={quantity || ''}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                  />
                </div>

                <div className="w-full lg:w-40 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 h-12">
                  <DollarSign className="w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    min="1"
                    required
                    className="bg-transparent border-none outline-none text-slate-900 w-full text-sm font-medium placeholder-slate-400"
                    placeholder="Budget"
                    value={budget || ''}
                    onChange={(e) => setBudget(parseInt(e.target.value) || 0)}
                  />
                </div>

                <div className="w-full lg:w-48 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 h-12">
                  <Truck className="w-4 h-4 text-slate-400" />
                  <select
                    className="bg-transparent border-none outline-none text-slate-900 w-full text-sm font-medium appearance-none"
                    value={shippingRegion}
                    onChange={(e) => setShippingRegion(e.target.value)}
                  >
                    <option value="Global">Global</option>
                    <option value="China">China</option>
                    <option value="India">India</option>
                    <option value="Europe">Europe</option>
                    <option value="USA">USA</option>
                  </select>
                </div>

                <Button
                  type="submit"
                  disabled={isSearching}
                  className="w-full lg:w-auto h-12 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold px-8 shadow-sm transition-colors"
                >
                  {isSearching ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                  Procure AI
                </Button>
              </form>
            </div>
            {error && (
              <div className="mt-4 p-4 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-xl text-[#EF4444] text-sm font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {error}
              </div>
            )}
          </motion.div>
        )}

        {step === 'intelligence_loading' && (
          <motion.div
            key="intelligence_loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-12"
          >
            <IntelligenceLoading />
          </motion.div>
        )}

        {step === 'intelligence_dashboard' && intelligenceResult && (
          <motion.div
            key="intelligence_dashboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-7xl mx-auto space-y-8"
          >
            <SupplierIntelligenceDashboard 
              data={intelligenceResult}
              onSelectSupplier={handleSelectIntelligenceSupplier}
              requestDetails={{
                product_name: productName,
                quantity: quantity,
                budget: budget,
                shipping_region: "Global"
              }}
            />
          </motion.div>
        )}


        {step === 'escrow_locked' && txId && (
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
                <h2 className="text-2xl font-display font-medium mb-2 tracking-tight">Secure Procurement Commitment</h2>
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 mb-4 font-bold tracking-widest px-4 py-1 uppercase text-[10px]">Proof Required</Badge>
                <p className="text-slate-300 max-w-sm mx-auto font-medium text-xs leading-relaxed">Algorand-secured procurement settlement lifecycle</p>
              </div>

              <CardContent className="p-8 space-y-8">
                {/* Enterprise Procurement Summary Panel */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6">
                  <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Database className="w-4 h-4 text-primary" /> Enterprise Procurement Summary
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Selected Supplier</p>
                      <p className="text-sm font-bold text-slate-900 truncate" title={result?.selectedSupplier?.name}>{result?.selectedSupplier?.name}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Negotiated Price</p>
                      <p className="text-sm font-bold text-emerald-600">${result?.selectedSupplier?.finalPrice}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Expected Lead Time</p>
                      <p className="text-sm font-bold text-slate-900">{result?.selectedSupplier?.deliveryTime}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Procurement Risk</p>
                      <p className="text-sm font-bold text-emerald-600">LOW</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">AI Confidence</p>
                      <p className="text-sm font-bold text-primary">{result?.selectedSupplier?.reliability}%</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Policy Compliance</p>
                      <p className="text-sm font-bold text-emerald-600">VERIFIED</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">x402 Session Status</p>
                      <p className="text-sm font-bold text-cyan-600 truncate">AUTHORIZED • {x402Session?.session_id}</p>
                    </div>
                  </div>
                </div>

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
                        { id: 'approved', label: 'Supplier Approved', icon: ShieldCheck, status: 'completed' },
                        { id: 'funded', label: 'Commitment Initialized', icon: Lock, status: 'completed' },
                        { id: 'awaiting_delivery', label: 'Funds Secured', icon: Zap, status: escrowStatus === 'funded' ? 'current' : 'completed' },
                        { id: 'proof_submitted', label: 'Delivery Verification', icon: MessageSquare, status: escrowStatus === 'proof_submitted' || escrowStatus === 'verified' ? 'current' : (escrowStatus === 'released' ? 'completed' : 'upcoming') },
                        { id: 'released', label: 'Settlement Released', icon: CheckCircle2, status: escrowStatus === 'released' ? 'current' : 'upcoming' }
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

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-5 bg-slate-50 border border-slate-100 rounded-2xl text-center">
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Commitment Status</span>
                    <span className="text-xs font-bold text-emerald-600">ACTIVE</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Settlement Layer</span>
                    <span className="text-xs font-bold text-slate-900">Algorand</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Escrow Protection</span>
                    <span className="text-xs font-bold text-slate-900">ENABLED</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Delivery Verification</span>
                    <span className="text-xs font-bold text-slate-900">REQUIRED</span>
                  </div>
                  <div className="flex flex-col gap-1 border-l-0 md:border-l border-slate-200">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Supplier Approval</span>
                    <span className="text-xs font-bold text-emerald-600">VERIFIED</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Proof Submission Panel */}
                  <div className="space-y-4 bg-slate-50/50 rounded-2xl border border-slate-100 p-6">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <FileUp className="w-4 h-4 text-primary" /> Submit Proof
                    </h3>
                    <p className="text-[10px] font-bold bg-amber-50 text-amber-700 px-3 py-2 rounded-lg mb-4">
                      Settlement release requires verified fulfillment.
                    </p>
                    
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
                    {isVerified ? "Release Procurement Settlement" : "Verification Required to Release"}
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
                <h2 className="text-2xl font-display font-bold mb-1">Procurement Commitment Secured</h2>
                <Badge className="bg-white/20 text-white border-white/30 mb-3 hover:bg-white/20">Settled on Algorand</Badge>
                <p className="text-emerald-50/80 max-w-sm mx-auto font-medium text-xs">The procurement commitment has been secured on the Algorand blockchain. The autonomous procurement cycle is entirely complete.</p>
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
                          'Initializing x402 Protocol...',
                          'Securing Commitment...',
                          'Anchoring Contract...',
                          'Finalizing Authorization...',
                        ][paymentPhase]}
                      </h3>
                      <p className="text-slate-500 font-medium text-sm leading-relaxed max-w-[220px]">
                        {[
                          'Establishing agentic authorization channel for the procurement cycle.',
                          'Securing procurement commitment on Algorand immutable ledger.',
                          'Anchoring digital contract terms to the blockchain network.',
                          'Finalizing machine-to-machine authorization for settlement.',
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
                      <h3 className="font-display font-bold text-2xl text-slate-900 mb-2 tracking-tight">Securing Commitment...</h3>
                      <p className="text-slate-500 font-medium text-sm leading-relaxed max-w-[220px]">Broadcasting your procurement commitment to the Algorand network. Please wait.</p>
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
