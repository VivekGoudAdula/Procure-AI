import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import algosdk from 'algosdk';
import {
  Lock,
  Unlock,
  Sparkles,
  ArrowLeft,
  ShieldCheck,
  TrendingUp,
  Truck,
  DollarSign,
  Globe,
  FileText,
  AlertTriangle,
  Layers,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  ArrowRight,
  Wallet,
  Loader2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Badge } from '../components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '../components/ui/card';
import { X402PaymentStatus, PaymentStep } from '../components/X402PaymentStatus';
import { API_BASE_URL } from '../config';
import { peraWallet } from '../lib/pera';
import { toast } from 'sonner';

// ─── Constants ───────────────────────────────────────────────────────────────

/** Algorand TestNet USDC ASA ID (Circle USDC TestNet) */
const USDC_ASSET_ID = 10_458_941;

/** Payment amount in USDC atomic units (6 decimals): 50000 = 0.05 USDC */
const USDC_PAYMENT_AMOUNT = 50_000;

/** GoPlausible fee-payer address — manages fee-pooling for the ATG */
const FEE_PAYER_ADDRESS = 'ZMFK2OI7ZBD2U27ISERZC4S6LKM6WMFJPZQ4MYNJDZ2VNBNMBA67RA22AA';

/** Treasury address that receives the USDC payment */
const TREASURY_ADDRESS = '2RIRIX5XK6GWK7LOXDAYIDTN4IYDVNRDJFXR4TJCLYIM72A3EF2UQPROQY';

// ─── Types ───────────────────────────────────────────────────────────────────

interface PremiumReportData {
  supplier_id: string;
  supplier_name: string;
  country: string;
  category: string;
  trust_score: number;
  risk_level: string;
  risk_score: number;
  delivery_confidence: number;
  recommended_order_value: string;
  base_price: number;
  lead_time_days: number;
  total_deals: number;
  negotiation_strategy: string;
  market_analysis: string;
  generated_by: string;
}

/** Suggested params returned by the 402 challenge body */
interface SuggestedParams {
  fee: number;
  genesisHash: string;
  genesisId: string;
  firstValid: number;
  lastValid: number;
  minFee: number;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function PremiumReport() {
  const [searchParams] = useSearchParams();
  const supplierId = searchParams.get('supplier_id') || 'ALB-1001';
  const navigate = useNavigate();
  const { walletAddress, setWalletAddress } = useApp();

  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<PremiumReportData | null>(null);
  const [paymentStep, setPaymentStep] = useState<PaymentStep>('checking_status');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [txId, setTxId] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [suggestedParams, setSuggestedParams] = useState<SuggestedParams | null>(null);

  /**
   * Guard: when true, the payment flow is in-progress.
   * Prevents useEffect from firing another fetchReport() (which would
   * generate a new 402 challenge) while the user is signing on their phone.
   */
  const isPaying = React.useRef(false);

  // ── Proof cache helpers ──────────────────────────────────────────────────
  const getCachedProof = () => localStorage.getItem(`x402_v2_proof_${supplierId}`);
  const setCachedProof = (proofB64: string) =>
    localStorage.setItem(`x402_v2_proof_${supplierId}`, proofB64);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // ── Fetch the report (with optional proof header) ────────────────────────
  const fetchReport = async (proofB64: string | null = null) => {
    const isSettlement = !!proofB64;

    // If it's a background check and payment is active, exit
    if (!isSettlement && isPaying.current) return;

    setLoading(true);
    setPaymentError(null);
    try {
      const headers: Record<string, string> = {};
      const actualProof = proofB64 || getCachedProof();
      if (actualProof) {
        headers['PAYMENT-SIGNATURE'] = actualProof;
      }

      const response = await axios.get(
        `${API_BASE_URL}/api/x402/premium-supplier-report`,
        { params: { supplier_id: supplierId }, headers }
      );

      // If this was a background check, and user started paying in the meantime, ignore
      if (!isSettlement && isPaying.current) return;

      setReport(response.data);
      setPaymentStep('success');

      // Extract TxID from PAYMENT-RESPONSE header
      const responseHeader = response.headers['payment-response'];
      if (responseHeader) {
        try {
          const respData = JSON.parse(atob(responseHeader));
          if (respData.txId) setTxId(respData.txId);
        } catch (e) {
          console.error('Error decoding PAYMENT-RESPONSE header:', e);
        }
      }
    } catch (error: any) {
      // If this was a background check, and user started paying in the meantime, ignore
      if (!isSettlement && isPaying.current) return;

      if (error.response?.status === 402) {
        setPaymentStep('idle');

        // Store suggestedParams for ATG construction
        if (error.response.data?.suggestedParams) {
          setSuggestedParams(error.response.data.suggestedParams);
        }
      } else {
        console.error('Error fetching report:', error);
        setPaymentError(
          error.response?.data?.detail || error.message || 'Failed to contact resource server'
        );
        setPaymentStep('error');
      }
    } finally {
      // Only set loading to false if we are not in the middle of paying, or if we are finishing the settlement
      if (isSettlement || !isPaying.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    // Do NOT re-fetch while the payment flow is active — it would generate
    // a new 402 challenge and interrupt the in-progress wallet signing.
    if (isPaying.current) return;
    setPaymentStep('checking_status');
    fetchReport();
  }, [supplierId, walletAddress]);

  // ── Connect Pera Wallet ──────────────────────────────────────────────────
  const connectWallet = async () => {
    setPaymentStep('connecting_wallet');
    try {
      const accounts = await peraWallet.connect();
      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
        localStorage.setItem('walletAddress', accounts[0]);
        toast.success('Wallet connected!');
        setPaymentStep('idle');
      } else {
        throw new Error('No accounts returned from Pera Wallet');
      }
    } catch (e: any) {
      console.error(e);
      setPaymentError(e.message || 'Failed to establish Pera Wallet session');
      setPaymentStep('error');
    }
  };

  // ── Build the x402 v2 Atomic Transaction Group (ATG) ─────────────────────
  /**
   * Constructs the two-transaction ATG required by x402 v2:
   *
   *   Tx0 (paymentIndex=0): AssetTransfer — buyer pays USDC to treasury
   *     sender:   walletAddress (buyer)
   *     receiver: TREASURY_ADDRESS
   *     assetId:  USDC_ASSET_ID
   *     amount:   USDC_PAYMENT_AMOUNT
   *     fee:      0  (covered by fee-pooling via Tx1)
   *
   *   Tx1 (feePayerIndex=1): Payment — facilitator self-transfer
   *     sender:   FEE_PAYER_ADDRESS  (managed by GoPlausible — NOT signed by us)
   *     receiver: FEE_PAYER_ADDRESS
   *     amount:   0
   *     fee:      2000  (pays for the entire atomic group)
   *
   * The buyer signs ONLY Tx0 via Pera Wallet.
   * The facilitator signs Tx1 during /settle — no private key needed on our side.
   */
  const buildAtomicGroup = async (
    sp: SuggestedParams
  ): Promise<{ tx0: algosdk.Transaction; tx1: algosdk.Transaction }> => {
    // Decode base64 genesisHash to Uint8Array required by algosdk
    const genesisHashBytes = new Uint8Array(
      atob(sp.genesisHash)
        .split('')
        .map(c => c.charCodeAt(0))
    );

    // Build suggested params object for algosdk
    const algodSp: algosdk.SuggestedParams = {
      fee: 0,
      genesisHash: genesisHashBytes,
      genesisID: sp.genesisId,
      firstValid: sp.firstValid,
      lastValid: sp.lastValid,
      minFee: sp.minFee,
      flatFee: true,
    };

    // Tx0: Buyer pays USDC to treasury (fee=0, fee-pooled)
    const tx0 = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      sender: walletAddress!,
      receiver: TREASURY_ADDRESS,
      assetIndex: USDC_ASSET_ID,
      amount: USDC_PAYMENT_AMOUNT,
      suggestedParams: { ...algodSp, fee: 0, flatFee: true },
      note: new TextEncoder().encode('ProcureAI Premium Sourcing Intelligence Report'),
    });

    // Tx1: Fee-payer self-transfer (unsigned — GoPlausible signs this during /settle)
    const tx1 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      sender: FEE_PAYER_ADDRESS,
      receiver: FEE_PAYER_ADDRESS,
      amount: 0,
      suggestedParams: { ...algodSp, fee: 2000, flatFee: true },
      note: new TextEncoder().encode('x402 fee abstraction'),
    });

    // Assign group ID to both transactions (makes them atomic)
    algosdk.assignGroupID([tx0, tx1]);

    return { tx0, tx1 };
  };

  // ── Execute the full x402 v2 payment flow ────────────────────────────────
  const executePayment = async () => {
    if (!walletAddress) {
      toast.error('Please connect your Pera Wallet first.');
      return;
    }

    // Prevent double-click and block useEffect re-fetches during payment
    if (isPaying.current || loading) return;
    isPaying.current = true;
    setLoading(true);

    setPaymentError(null);
    setPaymentStep('requesting_challenge');

    try {
      // 1. ALWAYS fetch fresh suggestedParams right now — not from cache.
      //    Cached params from the initial page load may have block numbers
      //    that expire before the user finishes signing on their phone.
      const challengeResp = await axios
        .get(`${API_BASE_URL}/api/x402/premium-supplier-report`, {
          params: { supplier_id: supplierId },
        })
        .catch(err => err.response);

      let params: SuggestedParams | null = null;
      if (challengeResp?.status === 402 && challengeResp.data?.suggestedParams) {
        params = challengeResp.data.suggestedParams as SuggestedParams;
        // Extend the validity window by +500 blocks (~35 min) to give the user
        // plenty of time to approve on their phone without the tx expiring.
        params = { ...params, lastValid: params.lastValid + 500 };
        setSuggestedParams(params);
      } else if (challengeResp?.status === 200) {
        // Already unlocked (cached proof still valid) — just show the report
        setReport(challengeResp.data);
        setPaymentStep('success');
        isPaying.current = false;
        setLoading(false);
        return;
      } else {
        throw new Error('Resource server did not return suggestedParams in the 402 challenge.');
      }

      // 2. Build the Atomic Transaction Group with the fresh params
      console.log('[PremiumReport] Building atomic transaction group...');
      const { tx0, tx1 } = await buildAtomicGroup(params!);
      console.log('[PremiumReport] Atomic group built successfully');

      // 3. Buyer signs ONLY Tx0 (their USDC payment) via Pera Wallet.
      //    isPaying.current stays true so useEffect won't fire a competing 402.
      setPaymentStep('signing_transaction');
      toast.info('Approve the USDC transfer in your Pera Wallet app, then come back here.');

      const txnsToSign = [
        {
          txn: tx0,
          signers: [walletAddress],  // buyer signs this
        },
        {
          txn: tx1,
          signers: [],               // empty = Pera Wallet skips signing Tx1
        },
      ];

      console.log('[PremiumReport] Requesting wallet signature for transactions...');
      console.log('[PremiumReport] Wallet address:', walletAddress);
      console.log('[PremiumReport] Transaction to sign:', tx0);
      const signedGroup = await peraWallet.signTransaction([txnsToSign]);
      console.log('[PremiumReport] Wallet signature received:', signedGroup);

      // signedGroup[0] = signed Tx0 bytes (buyer's signature)
      // signedGroup[1] = null/undefined (Pera skips empty-signer tx)

      // 4. Encode to base64 MsgPack for the paymentGroup array
      setPaymentStep('broadcasting_tx');

      const signedTx0B64 = algosdk.bytesToBase64(new Uint8Array(signedGroup[0]));

      const unsignedTx1Bytes = algosdk.encodeMsgpack(
        new algosdk.SignedTransaction({ txn: tx1 })
      );
      const unsignedTx1B64 = algosdk.bytesToBase64(unsignedTx1Bytes);

      // 5. Construct the x402 v2 paymentPayload
      const proofPayload = {
        x402Version: 2,
        paymentPayload: {
          x402Version: 2,
          paymentGroup: [signedTx0B64, unsignedTx1B64],
          paymentIndex: 0,
        },
        paymentRequirements: {
          x402Version: 2,
          scheme: 'exact',
          network: 'algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=',
          amount: String(USDC_PAYMENT_AMOUNT),
          maxAmountRequired: String(USDC_PAYMENT_AMOUNT),
          payTo: TREASURY_ADDRESS,
          asset: String(USDC_ASSET_ID),
          resource: `/api/x402/premium-supplier-report?supplier_id=${supplierId}`,
          extra: {
            feePayer: FEE_PAYER_ADDRESS,
            decimals: 6,
          },
        },
      };

      const proofB64 = btoa(JSON.stringify(proofPayload));
      setCachedProof(proofB64);

      // 6. Submit proof to backend for facilitator verification + settlement (in background)
      // Don't wait for it - show report immediately after signing
      setPaymentStep('success');
      fetchReport(proofB64).catch(err => {
        console.error('Background verification failed:', err);
      });
    } catch (e: any) {
      console.error('Payment protocol failure:', e);
      const msg = e.message || String(e) || '';
      const isPending = msg.includes('4100') ||
                        msg.toLowerCase().includes('pending') ||
                        msg.toLowerCase().includes('in progress');
      const isRejected = msg.toLowerCase().includes('cancel') ||
                         msg.toLowerCase().includes('reject') ||
                         msg.toLowerCase().includes('denied');

      if (isPending) {
        // Clear active session to self-heal from the stuck state
        try {
          await peraWallet.disconnect();
        } catch (disErr) {
          console.error('Failed to disconnect on pending error:', disErr);
        }
        setWalletAddress(null);
        localStorage.removeItem('walletAddress');
        setPaymentError(
          'Pera Wallet was blocked by a pending transaction request on your phone. We have reset the connection to clear it. Please reconnect your wallet and click Pay again.'
        );
      } else {
        setPaymentError(
          isRejected
            ? 'You cancelled the wallet approval. Click "Pay" again when ready.'
            : msg || 'Verification failed. Check your wallet approval or USDC balance.'
        );
      }
      setPaymentStep('error');
    } finally {
      // Always release the guard and reset loading so future attempts work
      isPaying.current = false;
      setLoading(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8 pb-16 pt-4 px-1">
      {/* Back button header */}
      <div className="flex items-center gap-4">
        <Link to="/procurement">
          <button className="border border-slate-300 bg-white hover:bg-slate-50 font-bold text-xs uppercase tracking-wider h-10 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer text-slate-700">
            <ArrowLeft className="w-4 h-4" /> Back to Sourcing
          </button>
        </Link>
        <div className="h-6 w-px bg-slate-300" />
        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider font-mono">
          Report Gated: {supplierId}
        </span>
      </div>

      {/* Locked Screen */}
      {!report && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-4">
          {/* Locked Information Panel (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-black uppercase tracking-wider shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                Premium Intelligence Panel
              </div>
              <h1 className="text-4xl font-display font-medium tracking-tight text-slate-950">
                Unlock Premium AI Supplier Report
              </h1>
              <p className="text-slate-500 font-medium text-sm leading-relaxed max-w-xl">
                Access deep analytical evaluations generated dynamically using large language models.
                Unlock crucial pricing, regional shipping risks, and structured negotiation points to
                maximise your procurement margins.
              </p>
            </div>

            {/* Features grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
              {[
                {
                  icon: <ShieldCheck className="w-5 h-5" />,
                  color: 'indigo',
                  title: 'Trust & Risk Score',
                  desc: 'Comprehensive audit scores outlining operational reliability and delivery confidence metrics.',
                },
                {
                  icon: <TrendingUp className="w-5 h-5" />,
                  color: 'violet',
                  title: 'AI Negotiation Advice',
                  desc: 'Custom, tailored negotiation frameworks based on past supplier deals and regional market trends.',
                },
                {
                  icon: <Truck className="w-5 h-5" />,
                  color: 'emerald',
                  title: 'Logistics & Market Info',
                  desc: 'Micro-analysis of manufacturing capacity, shipping bottlenecks, and duty structures.',
                },
                {
                  icon: <Layers className="w-5 h-5" />,
                  color: 'cyan',
                  title: 'Auditable On-Chain Proof',
                  desc: 'Every inquiry settles real USDC on Algorand TestNet — cryptographically auditable.',
                },
              ].map(feat => (
                <div
                  key={feat.title}
                  className="p-4 rounded-2xl bg-white border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.01)] hover:border-slate-300 transition-colors flex gap-3"
                >
                  <div className={`w-10 h-10 rounded-xl bg-${feat.color}-50 border border-${feat.color}-100 flex items-center justify-center text-${feat.color}-600 shrink-0`}>
                    {feat.icon}
                  </div>
                  <div>
                    <h6 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                      {feat.title}
                    </h6>
                    <p className="text-[10px] font-medium text-slate-400 leading-normal mt-0.5">
                      {feat.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Locked Status / Action Widget Panel (5 cols) */}
          <div className="lg:col-span-5 flex flex-col items-center">
            {paymentStep === 'checking_status' ? (
              <div className="w-full max-w-lg mx-auto bg-white border border-slate-200 rounded-3xl p-8 shadow-xl flex flex-col items-center justify-center text-center space-y-6 min-h-[380px]">
                <div className="w-16 h-16 rounded-2xl bg-slate-950 flex items-center justify-center text-white shadow-lg relative animate-pulse">
                  <Lock className="w-7 h-7" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" /> Verifying Access
                  </h3>
                  <p className="text-[11px] text-slate-400 font-semibold leading-relaxed max-w-xs mx-auto">
                    Checking payment status and credentials for this sourcing report on Algorand...
                  </p>
                </div>
              </div>
            ) : paymentStep === 'idle' || paymentStep === 'error' ? (
              <div className="w-full max-w-lg mx-auto bg-white border border-slate-200 rounded-3xl p-8 shadow-xl flex flex-col items-center text-center space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-slate-950 flex items-center justify-center text-white shadow-lg relative">
                  <Lock className="w-7 h-7" />
                  <span className="w-3.5 h-3.5 bg-indigo-500 rounded-full border-4 border-white absolute -bottom-1 -right-1 animate-pulse" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-wide">
                    Report Locked
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold leading-relaxed max-w-xs">
                    This intelligence panel requires a pay-per-use payment of{' '}
                    <span className="text-indigo-600 font-black">0.05 TestNet USDC</span> settled on
                    Algorand via x402 v2 protocol.
                  </p>
                </div>

                {/* Price tag */}
                <div className="w-full bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center justify-between text-left">
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">
                      Price Per Report
                    </span>
                    <span className="text-sm font-black text-indigo-600">
                      0.05 TestNet USDC
                    </span>
                    <span className="text-[9px] font-semibold text-slate-400 block">
                      50,000 atomic units · ASA 10458941
                    </span>
                  </div>
                  <Badge className="bg-indigo-50 text-indigo-600 font-black text-[9px] uppercase tracking-wider border-none">
                    ALGO TESTNET
                  </Badge>
                </div>

                {/* ATG info note */}
                <div className="w-full rounded-xl border border-indigo-100 bg-indigo-50/50 p-3 text-left space-y-1">
                  <p className="text-[9px] font-black text-indigo-700 uppercase tracking-wider">
                    x402 v2 — Atomic Transaction Group
                  </p>
                  <p className="text-[9px] text-indigo-600 font-medium leading-snug">
                    You sign only your USDC transfer (Tx0). GoPlausible co-signs the fee
                    transaction (Tx1) and settles the group on-chain — no fee ALGO needed.
                  </p>
                </div>

                {!walletAddress ? (
                  <button
                    id="connect-pera-wallet-btn"
                    onClick={connectWallet}
                    disabled={loading}
                    className={`w-full bg-slate-950 hover:bg-black text-white font-black text-xs uppercase tracking-widest h-12 rounded-xl shadow-xl shadow-slate-100 transition-all hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer ${
                      loading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <Wallet className="w-4 h-4" /> Connect Pera Wallet
                  </button>
                ) : (
                  <div className="w-full space-y-3">
                    <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-center justify-between text-left">
                      <span className="text-[10px] text-emerald-800 font-black uppercase tracking-wider flex items-center gap-1">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" /> Wallet Connected
                      </span>
                      <span className="text-[10px] font-mono font-bold text-slate-600 bg-white px-2 py-0.5 rounded shadow-sm">
                        {walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}
                      </span>
                    </div>

                    <button
                      id="unlock-report-btn"
                      onClick={executePayment}
                      disabled={loading || paymentStep !== 'idle'}
                      className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest h-12 rounded-xl shadow-xl shadow-indigo-100 transition-all hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer ${
                        (loading || paymentStep !== 'idle') ? 'opacity-50 cursor-not-allowed hover:scale-100' : ''
                      }`}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Fetching Challenge...
                        </>
                      ) : (
                        <>
                          Pay 0.05 USDC & Unlock Report <ChevronRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                )}

                {paymentStep === 'error' && paymentError && (
                  <div className="flex gap-2 p-3.5 rounded-xl border border-rose-100 bg-rose-50/50 hover:bg-rose-50 text-left">
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] font-semibold text-rose-700 leading-normal">
                      {paymentError}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <X402PaymentStatus
                step={paymentStep}
                error={paymentError}
                txId={txId}
                walletAddress={walletAddress}
                usdcAtomicAmount={USDC_PAYMENT_AMOUNT}
                onRetry={executePayment}
              />
            )}
          </div>
        </div>
      )}

      {/* Unlocked Premium Report */}
      {report && (
        <div className="space-y-8 animate-fade-in">
          {/* Header Panel */}
          <div className="flex flex-col xl:flex-row justify-between xl:items-start gap-6 border-b border-slate-200 pb-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-emerald-500 text-white font-black text-[9px] uppercase tracking-widest border-none px-2.5 shadow-md flex items-center gap-1">
                  <Unlock className="w-3 h-3" /> Unlocked
                </Badge>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-600 text-[9px] font-black uppercase tracking-wider shadow-sm">
                  <Globe className="w-3 h-3 text-slate-500" />
                  Supplier Origin: {report.country}
                </div>
              </div>
              <h1 className="text-4xl font-display font-medium tracking-tight text-slate-950 flex items-center gap-3">
                {report.supplier_name}{' '}
                <span className="text-xl font-mono text-slate-400">({report.supplier_id})</span>
              </h1>
              <p className="text-slate-500 max-w-2xl font-medium text-sm leading-relaxed">
                Dynamic market intelligence &amp; structured negotiation strategy audited on-chain
                using Algorand TestNet USDC payment records.
              </p>
            </div>

            {/* Verification tag */}
            <div className="shrink-0 self-start xl:self-end flex flex-col items-end gap-1.5">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                On-Chain Proof Status
              </span>
              <div className="px-4 py-2 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span className="text-[10px] text-emerald-800 font-black uppercase tracking-wider">
                  Algorand Verified
                </span>
              </div>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Trust Index */}
            <Card className="bg-white border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.02)] rounded-[1.5rem] overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Trust Index</h3>
                  <Badge className="bg-slate-100 text-slate-800 font-bold text-[9px] uppercase tracking-wide border-none px-2 rounded-full">Audited</Badge>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-display font-black tracking-tight text-slate-950">{report.trust_score}%</span>
                  <span className="text-xs font-bold text-emerald-600 mb-1">Excellent</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${report.trust_score}%` }} />
                </div>
              </CardContent>
            </Card>

            {/* Risk Assessment */}
            <Card className="bg-white border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.02)] rounded-[1.5rem] overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Risk Assessment</h3>
                  <Badge className={
                    report.risk_level === 'Low' ? 'bg-emerald-50 text-emerald-700' :
                    report.risk_level === 'Medium' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                  }>
                    {report.risk_level} Risk
                  </Badge>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-display font-black tracking-tight text-slate-950">{report.risk_score}</span>
                  <span className="text-xs font-bold text-slate-400 mb-1">/ 100 Factor</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div className={`h-full rounded-full ${
                    report.risk_level === 'Low' ? 'bg-emerald-500' :
                    report.risk_level === 'Medium' ? 'bg-amber-500' : 'bg-rose-500'
                  }`} style={{ width: `${report.risk_score}%` }} />
                </div>
              </CardContent>
            </Card>

            {/* Delivery Confidence */}
            <Card className="bg-white border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.02)] rounded-[1.5rem] overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Delivery Confidence</h3>
                  <Badge className="bg-indigo-50 text-indigo-700 font-bold text-[9px] uppercase tracking-wide border-none px-2 rounded-full">SLA Stable</Badge>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-display font-black tracking-tight text-slate-950">{report.delivery_confidence}%</span>
                  <span className="text-xs font-bold text-indigo-600 mb-1">{report.lead_time_days} Days Lead</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${report.delivery_confidence}%` }} />
                </div>
              </CardContent>
            </Card>

            {/* Recommended Value */}
            <Card className="bg-white border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.02)] rounded-[1.5rem] overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Recommended Value</h3>
                  <Badge className="bg-slate-950 text-white font-bold text-[9px] uppercase tracking-wide border-none px-2 rounded-full">Base Limit</Badge>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-display font-black tracking-tight text-slate-950">{report.recommended_order_value}</span>
                  <span className="text-xs font-bold text-slate-400 mb-1">{report.total_deals} Deals</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div className="h-full bg-slate-950 rounded-full" style={{ width: '80%' }} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Advice + Regional Logistics */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* AI Negotiation Advice (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              <Card className="bg-white border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.02)] rounded-[2.5rem] overflow-hidden">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-slate-50/50 py-6 px-10 border-b border-slate-100/50 gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4.5 h-4.5 text-indigo-600" />
                      <CardTitle className="text-lg font-display font-semibold text-slate-950">
                        AI Sourcing Negotiation Strategy
                      </CardTitle>
                    </div>
                    <CardDescription className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.15em] mt-1">
                      Structured arguments generated by ProcureAI Senior Supply Chain Auditor
                    </CardDescription>
                  </div>
                  <button
                    className="h-8 px-3 border border-slate-200 bg-white hover:bg-slate-50 text-[10px] font-bold uppercase tracking-wider rounded-xl shadow-sm flex items-center justify-center gap-1.5 cursor-pointer text-slate-700 transition-all"
                    onClick={() => handleCopy(report.negotiation_strategy, 'Strategy')}
                  >
                    {copiedText === 'Strategy' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    Copy Text
                  </button>
                </CardHeader>
                <CardContent className="p-10 relative">
                  <div className="absolute right-6 bottom-6 opacity-5 pointer-events-none text-slate-900">
                    <FileText className="w-40 h-40" />
                  </div>
                  <div className="space-y-6 relative z-10">
                    <blockquote className="border-l-4 border-indigo-500 pl-6 py-1">
                      <p className="text-sm font-semibold text-slate-700 leading-relaxed italic">
                        "{report.negotiation_strategy}"
                      </p>
                    </blockquote>
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Recommended Actions
                      </h5>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <span className="w-5 h-5 rounded-full bg-indigo-50 flex items-center justify-center text-[10px] font-black text-indigo-600 shrink-0 mt-0.5">1</span>
                          <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                            Proactively offer escrow setup during RFP to prove buyer liquidity and
                            secure priority production slots.
                          </p>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="w-5 h-5 rounded-full bg-indigo-50 flex items-center justify-center text-[10px] font-black text-indigo-600 shrink-0 mt-0.5">2</span>
                          <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                            Benchmark prices around{' '}
                            <span className="font-bold text-slate-950">${report.base_price}</span>{' '}
                            base price limit to prevent inflated margin requests.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Regional Logistics (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              <Card className="bg-white border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.02)] rounded-[2.5rem] overflow-hidden">
                <CardHeader className="py-6 px-8 bg-slate-50/50 border-b border-slate-100/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Globe className="w-4.5 h-4.5 text-indigo-600" />
                        <CardTitle className="text-base font-display font-semibold text-slate-950">
                          Regional Logistics Context
                        </CardTitle>
                      </div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.1em] mt-0.5">
                        Supply chain intelligence for {report.country}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <p className="text-xs font-semibold text-slate-600 leading-relaxed">
                    {report.market_analysis}
                  </p>
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-bold uppercase tracking-wider">Origin port</span>
                      <span className="text-slate-900 font-black">
                        {report.country === 'China' ? 'Shenzhen / Shanghai' : 'Local Regional Port'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-bold uppercase tracking-wider">Shipping Volatility</span>
                      <Badge className="bg-rose-50 text-rose-600 font-black text-[9px] border-none px-2 rounded-full">
                        3–5% Fluctuating
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-bold uppercase tracking-wider">Lead Time Stability</span>
                      <span className="text-slate-900 font-black">High Confidence</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* On-Chain Audit Log Panel */}
          <Card className="bg-slate-950 text-white rounded-[2rem] border-slate-900 shadow-2xl shadow-indigo-100/10 overflow-hidden relative">
            <div className="absolute right-0 top-0 w-80 h-80 rounded-full bg-indigo-600/10 blur-[100px] pointer-events-none" />
            <div className="absolute left-1/4 bottom-0 w-60 h-60 rounded-full bg-violet-600/10 blur-[80px] pointer-events-none" />

            <CardHeader className="py-6 px-10 border-b border-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <CardTitle className="text-base font-display font-semibold text-white">
                    Verified x402 v2 Audit Ledger
                  </CardTitle>
                </div>
                <CardDescription className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.12em] mt-1">
                  Cryptographic USDC settlement parameters for this premium resource access
                </CardDescription>
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-400 font-black text-[9px] uppercase tracking-widest border border-emerald-500/20 px-3 rounded-full">
                Ledger Logged
              </Badge>
            </CardHeader>

            <CardContent className="p-10">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">AVM Blockchain Network</span>
                  <span className="text-xs font-black text-white font-mono block">algorand:testnet</span>
                </div>
                <div>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Treasury Destination</span>
                  <span className="text-xs font-black text-white font-mono block truncate" title={TREASURY_ADDRESS}>
                    {TREASURY_ADDRESS}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Settlement Value</span>
                  <span className="text-xs font-black text-indigo-400 font-mono block">
                    0.05 USDC (ASA 10458941)
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Transaction Reference</span>
                  {txId ? (
                    <a
                      href={`https://testnet.explorer.perawallet.app/tx/${txId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-black text-indigo-400 hover:text-indigo-300 font-mono flex items-center gap-1 group truncate"
                    >
                      {txId.slice(0, 10)}…{txId.slice(-6)}
                      <ExternalLink className="w-3.5 h-3.5 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                    </a>
                  ) : (
                    <span className="text-xs font-black text-slate-500 block">Pending confirmation</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Commit to Procurement CTA */}
          <div className="relative rounded-[2rem] overflow-hidden border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50 shadow-xl shadow-emerald-100/40 p-10">
            <div className="absolute -top-10 -right-10 w-64 h-64 rounded-full bg-emerald-400/10 blur-[80px] pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-teal-400/10 blur-[60px] pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-3 max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-700 text-[10px] font-black uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Intelligence Verified · Ready to Execute
                </div>
                <h2 className="text-2xl font-display font-bold text-slate-950 tracking-tight">
                  You've seen the intelligence. Now lock in the deal.
                </h2>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                  Commit your procurement order and deploy an Algorand smart-contract escrow that
                  automatically releases funds only after verified delivery.
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  {['AI Found Supplier', 'x402 Unlocked Intelligence', 'You Read the Report', 'Algorand Escrow', 'Settlement'].map(
                    (label, i, arr) => (
                      <React.Fragment key={label}>
                        <span className={i === 3 ? 'text-emerald-600' : 'text-slate-500'}>{label}</span>
                        {i < arr.length - 1 && <ArrowRight className="w-3 h-3 text-slate-300" />}
                      </React.Fragment>
                    )
                  )}
                </div>
              </div>

              <div className="shrink-0 flex flex-col items-center gap-3">
                <button
                  id="commit-to-procurement-btn"
                  onClick={() => navigate('/procurement?commit=true')}
                  className="relative overflow-hidden group h-16 px-10 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-2xl shadow-emerald-400/30 hover:shadow-emerald-400/50 flex items-center gap-3 cursor-pointer"
                >
                  <Wallet className="w-5 h-5 relative z-10" />
                  <span className="relative z-10">Commit to Procurement</span>
                  <ArrowRight className="w-5 h-5 relative z-10" />
                </button>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest text-center">
                  Creates Algorand Smart-Contract Escrow
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
