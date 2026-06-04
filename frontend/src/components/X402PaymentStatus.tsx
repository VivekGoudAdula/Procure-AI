import React from 'react';
import {
  Wallet,
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  ShieldAlert,
  Layers,
  Send,
  BarChart2,
  BadgeCheck,
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

/**
 * Payment steps for the x402 v2 Algorand ATG flow:
 * 1. connecting_wallet   — Pera Wallet session establishment
 * 2. requesting_challenge — Fetch 402 challenge + suggestedParams from resource server
 * 3. signing_transaction  — Buyer signs Tx0 (USDC AssetTransfer) in Pera Wallet
 * 4. broadcasting_tx      — Send ATG proof (paymentGroup) to backend
 * 5. verifying_payment    — Backend calls GoPlausible /verify then /settle
 * 6. success / error      — Terminal states
 */
export type PaymentStep =
  | 'idle'
  | 'checking_status'
  | 'connecting_wallet'
  | 'requesting_challenge'
  | 'signing_transaction'
  | 'broadcasting_tx'
  | 'verifying_payment'
  | 'success'
  | 'error';

interface X402PaymentStatusProps {
  step: PaymentStep;
  error?: string | null;
  txId?: string | null;
  walletAddress?: string | null;
  /** USDC amount in atomic units (6 decimals). Default: 50000 = 0.05 USDC */
  usdcAtomicAmount?: number;
  onRetry?: () => void;
}

/** Format USDC atomic units to a human-readable string (e.g. 50000 → "0.05 USDC") */
const formatUsdc = (atomicAmount: number): string =>
  `${(atomicAmount / 1_000_000).toFixed(2)} USDC`;

export const X402PaymentStatus: React.FC<X402PaymentStatusProps> = ({
  step,
  error,
  txId,
  walletAddress,
  usdcAtomicAmount = 50_000,
  onRetry,
}) => {
  /** Six-stage x402 v2 Algorand ATG pipeline */
  const stepsList = [
    {
      id: 'wallet',
      label: 'Wallet Connected',
      description: 'Establish Algorand TestNet session via Pera Wallet',
      icon: <Wallet className="w-3 h-3" />,
      activeSteps: ['connecting_wallet'] as PaymentStep[],
    },
    {
      id: 'challenge',
      label: 'Payment Challenge',
      description: 'Retrieve 402 parameters and suggested network params',
      icon: <Layers className="w-3 h-3" />,
      activeSteps: ['requesting_challenge'] as PaymentStep[],
    },
    {
      id: 'signing',
      label: 'Sign USDC Transfer',
      description: 'Sign Tx0 (USDC AssetTransfer) in Pera Wallet — fee-payer Tx1 remains unsigned',
      icon: <BadgeCheck className="w-3 h-3" />,
      activeSteps: ['signing_transaction'] as PaymentStep[],
    },
    {
      id: 'broadcasting',
      label: 'Send ATG Proof',
      description: 'Submit signed ATG paymentGroup to the resource server',
      icon: <Send className="w-3 h-3" />,
      activeSteps: ['broadcasting_tx'] as PaymentStep[],
    },
    {
      id: 'verifying',
      label: 'Facilitator Settlement',
      description: 'GoPlausible co-signs fee-payer Tx1 and broadcasts the atomic group on-chain',
      icon: <BarChart2 className="w-3 h-3" />,
      activeSteps: ['verifying_payment'] as PaymentStep[],
    },
  ];

  /** Resolve the display status of each step */
  const getStepStatus = (index: number): 'completed' | 'active' | 'failed' | 'upcoming' => {
    if (step === 'success') return 'completed';
    const activeIndex = stepsList.findIndex(s => s.activeSteps.includes(step));
    if (step === 'error' && activeIndex === index) return 'failed';
    if (step === 'error' && index > activeIndex) return 'upcoming';
    if (step === 'error' && index < activeIndex) return 'completed';
    if (activeIndex === -1) return 'upcoming';
    if (activeIndex === index) return 'active';
    if (activeIndex > index) return 'completed';
    return 'upcoming';
  };

  const getStatusColor = () => {
    switch (step) {
      case 'success': return 'text-emerald-500 bg-emerald-50 border-emerald-100';
      case 'error':   return 'text-rose-500 bg-rose-50 border-rose-100';
      case 'idle':    return 'text-slate-500 bg-slate-50 border-slate-100';
      default:        return 'text-indigo-500 bg-indigo-50 border-indigo-100';
    }
  };

  const getStatusText = () => {
    switch (step) {
      case 'idle':                return 'Awaiting Initiation';
      case 'checking_status':     return 'Checking Report Status…';
      case 'connecting_wallet':   return 'Establishing Wallet Session…';
      case 'requesting_challenge':return 'Fetching Payment Challenge…';
      case 'signing_transaction': return 'Awaiting Pera Wallet Signature…';
      case 'broadcasting_tx':     return 'Submitting ATG Proof to Server…';
      case 'verifying_payment':   return 'Facilitator Settling On-Chain…';
      case 'success':             return 'USDC Payment Verified & Settled!';
      case 'error':               return 'Payment Protocol Error';
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-white/70 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-6 shadow-2xl shadow-indigo-100/50 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="space-y-1">
          <Badge className="bg-indigo-50 border-indigo-100 text-indigo-600 hover:bg-indigo-100/80 font-black text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full">
            Algorand x402 v2 Protocol
          </Badge>
          <h4 className="text-base font-bold text-slate-950">Payment Gated Access</h4>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Amount</span>
          <span className="text-lg font-black text-slate-950">{formatUsdc(usdcAtomicAmount)}</span>
          <span className="text-[9px] text-slate-400 font-semibold block">TestNet USDC</span>
        </div>
      </div>

      {/* Main status display */}
      <div className={`p-4 rounded-2xl border flex items-start gap-3 transition-colors duration-300 ${getStatusColor()}`}>
        <div className="shrink-0 mt-0.5">
          {step === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-500 animate-bounce" />
          ) : step === 'error' ? (
            <AlertCircle className="w-5 h-5 text-rose-500 animate-pulse" />
          ) : step === 'idle' ? (
            <Wallet className="w-5 h-5 text-slate-400" />
          ) : (
            <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
          )}
        </div>
        <div className="space-y-1 w-full min-w-0">
          <span className="text-xs font-black uppercase tracking-wider block">{getStatusText()}</span>
          {walletAddress && (
            <p className="text-[10px] text-slate-500 font-semibold truncate">
              Wallet: <span className="font-mono text-[9px] bg-slate-100 px-1 py-0.5 rounded text-slate-700">{walletAddress}</span>
            </p>
          )}
          {txId && (
            <div className="flex items-center justify-between w-full mt-1.5 pt-1.5 border-t border-indigo-100/30">
              <span className="text-[9px] text-indigo-600 font-bold uppercase truncate flex items-center gap-1.5">
                TxID: <span className="font-mono text-slate-600">{txId.slice(0, 12)}…{txId.slice(-6)}</span>
              </span>
              <a
                href={`https://testnet.explorer.perawallet.app/tx/${txId}`}
                target="_blank"
                rel="noreferrer"
                className="text-[9px] text-indigo-600 hover:text-indigo-800 font-bold uppercase tracking-wider flex items-center gap-0.5 shrink-0"
              >
                Explorer <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Protocol pipeline steps */}
      <div className="space-y-4">
        <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
          ATG Protocol Pipeline (x402 v2)
        </h5>
        <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
          {stepsList.map((s, index) => {
            const stepStatus = getStepStatus(index);
            return (
              <div key={s.id} className="relative flex gap-3 items-start group">
                {/* Step circle indicator */}
                <div className={`absolute -left-6 w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-300 ${
                  stepStatus === 'completed' ? 'bg-emerald-500 border-emerald-500 text-white' :
                  stepStatus === 'failed'    ? 'bg-rose-500 border-rose-500 text-white' :
                  stepStatus === 'active'    ? 'bg-white border-indigo-500 text-indigo-500 ring-4 ring-indigo-50' :
                  'bg-white border-slate-200 text-slate-300'
                }`}>
                  {stepStatus === 'completed' ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  ) : stepStatus === 'failed' ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  ) : stepStatus === 'active' ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
                  ) : null}
                </div>

                {/* Step text */}
                <div className="space-y-0.5">
                  <span className={`text-[11px] font-bold block leading-none transition-colors duration-300 ${
                    stepStatus === 'completed' ? 'text-slate-500 font-semibold' :
                    stepStatus === 'active'    ? 'text-indigo-600 font-extrabold' :
                    stepStatus === 'failed'    ? 'text-rose-600 font-extrabold' :
                    'text-slate-400'
                  }`}>
                    {s.label}
                  </span>
                  <span className="text-[9px] text-slate-400 font-medium block leading-snug">
                    {s.description}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Error state */}
      {step === 'error' && (
        <div className="space-y-3 pt-2">
          {error && (
            <div className="flex gap-2 p-3.5 rounded-xl border border-rose-100 bg-rose-50/50 hover:bg-rose-50 transition-colors">
              <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <p className="text-[10px] font-bold text-rose-700 leading-relaxed break-words">{error}</p>
            </div>
          )}
          {onRetry && (
            <Button
              onClick={onRetry}
              className="w-full bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-widest h-11 rounded-xl shadow-lg shadow-rose-100/50 transition-transform active:scale-[0.98]"
            >
              Retry Protocol Handshake
            </Button>
          )}
        </div>
      )}

      {/* Success state */}
      {step === 'success' && (
        <div className="pt-2 text-center">
          <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-none font-bold text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-xl shadow-md shadow-emerald-100">
            Access Granted · USDC Settled On-Chain
          </Badge>
        </div>
      )}
    </div>
  );
};
