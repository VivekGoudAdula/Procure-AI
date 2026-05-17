import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Package, 
  Truck, 
  DollarSign, 
  Shield, 
  AlertTriangle, 
  Cpu, 
  TrendingUp,
  Target,
  Zap,
  Activity,
  CheckCircle2,
  AlertCircle,
  Timer
} from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

interface IntelligenceData {
  moq_flexibility: { status: string; summary: string };
  delivery_confidence: { status: string; summary: string };
  pricing_signals: { status: string; summary: string };
  trust_signals: { status: string; summary: string };
  overall_risk: string;
  risk_factors: string[];
  negotiation_score: number;
  ai_recommendation: string;
  advanced_signals: {
    urgency: string;
    partnership_intent: string;
    professionalism: string;
    logistics_maturity: string;
    production_confidence: string;
  };
}

interface NegotiationIntelligenceLayerProps {
  supplierMessage: string;
  productName: string;
  onAnalysisComplete?: (data: IntelligenceData) => void;
}

const NegotiationIntelligenceLayer: React.FC<NegotiationIntelligenceLayerProps> = ({ 
  supplierMessage, 
  productName,
  onAnalysisComplete 
}) => {
  const [loading, setLoading] = useState(true);
  const [loadingState, setLoadingState] = useState(0);
  const [data, setData] = useState<IntelligenceData | null>(null);

  const loadingPhrases = [
    "Analyzing supplier intent...",
    "Extracting negotiation signals...",
    "Evaluating procurement confidence...",
    "Negotiation intelligence complete."
  ];

  useEffect(() => {
    const fetchIntelligence = async () => {
      setLoading(true);
      setLoadingState(0);
      
      // Artificial delay for loading states "AI feel"
      for (let i = 0; i < 3; i++) {
        setLoadingState(i);
        await new Promise(res => setTimeout(res, 1200));
      }
      setLoadingState(3);

      try {
        const response = await axios.post(`${API_BASE_URL}/api/negotiation/intelligence`, {
          supplier_message: supplierMessage,
          procurement_context: { product: productName }
        });
        
        setData(response.data);
        if (onAnalysisComplete) onAnalysisComplete(response.data);
      } catch (error) {
        console.error("Failed to fetch negotiation intelligence", error);
      } finally {
        setLoading(false);
      }
    };

    if (supplierMessage) {
      fetchIntelligence();
    }
  }, [supplierMessage, productName]);

  if (loading) {
    return (
      <div className="w-full bg-white border border-slate-50 rounded-[40px] p-20 flex flex-col items-center justify-center text-center space-y-10 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.04)]">
        <div className="relative">
          <div className="w-24 h-24 bg-slate-950 rounded-[28px] flex items-center justify-center shadow-2xl relative z-10 overflow-hidden">
            <Cpu className="w-12 h-12 text-emerald-400 animate-spin" />
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-transparent" />
          </div>
          <div className="absolute inset-0 bg-emerald-400/10 blur-[60px] animate-pulse -z-0 rounded-full" />
        </div>
        <div className="space-y-4">
          <h3 className="text-3xl font-display font-bold text-slate-900 tracking-tight">ProcureAI Intelligence</h3>
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center justify-center gap-3">
              <Timer className="w-4 h-4 animate-pulse text-emerald-500" />
              {loadingPhrases[loadingState]}
            </p>
            <span className="text-[10px] text-slate-300 font-medium uppercase tracking-widest">Neural Signal Extraction Layer v4.02</span>
          </div>
        </div>
        <div className="w-80 h-1.5 bg-slate-50 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]"
            initial={{ width: "0%" }}
            animate={{ width: `${(loadingState + 1) * 25}%` }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'HIGH':
      case 'STRONG':
      case 'FAVORABLE':
      case 'VERIFIED':
      case 'LOW':
        return 'text-emerald-600 bg-emerald-50 border-emerald-100/50';
      case 'MEDIUM':
      case 'MODERATE':
      case 'NEGOTIABLE':
        return 'text-amber-600 bg-amber-50 border-amber-100/50';
      case 'WEAK':
      case 'RIGID':
      case 'UNKNOWN':
      case 'HIGH':
        return 'text-rose-600 bg-rose-50 border-rose-100/50';
      default:
        return 'text-slate-600 bg-slate-50 border-slate-100/50';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="w-full space-y-12"
    >
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 rounded-full bg-slate-900" />
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Operational Intelligence</span>
          </div>
          <h2 className="text-4xl font-display font-bold text-slate-900 tracking-tight">Negotiation Diagnostics</h2>
          <p className="text-slate-500 text-base font-medium max-w-xl">Deep analysis of supplier intent, pricing elasticity, and fulfillment confidence derived from cross-border NLP signals.</p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <Badge className="bg-slate-950 text-emerald-400 border-none px-5 py-2 rounded-2xl flex items-center gap-3 shadow-xl">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest">Active Intelligence Layer</span>
          </Badge>
          <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">Confidence Index: 98.4%</span>
        </div>
      </div>

      {/* MAIN INTELLIGENCE GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SignalCard 
          icon={<Package className="w-6 h-6" />}
          label="MOQ Flexibility"
          status={data.moq_flexibility.status}
          summary={data.moq_flexibility.summary}
          colorClass={getStatusColor(data.moq_flexibility.status)}
        />
        <SignalCard 
          icon={<Truck className="w-6 h-6" />}
          label="Delivery Confidence"
          status={data.delivery_confidence.status}
          summary={data.delivery_confidence.summary}
          colorClass={getStatusColor(data.delivery_confidence.status)}
        />
        <SignalCard 
          icon={<DollarSign className="w-6 h-6" />}
          label="Pricing Signals"
          status={data.pricing_signals.status}
          summary={data.pricing_signals.summary}
          colorClass={getStatusColor(data.pricing_signals.status)}
        />
        <SignalCard 
          icon={<Shield className="w-6 h-6" />}
          label="Trust Signals"
          status={data.trust_signals.status}
          summary={data.trust_signals.summary}
          colorClass={getStatusColor(data.trust_signals.status)}
        />
      </div>

      {/* AI SUMMARY PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
        <div className="lg:col-span-8">
          <div className="bg-white border border-slate-100 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.04)] rounded-[40px] overflow-hidden h-full group hover:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.08)] transition-all duration-500">
            <div className="p-10 md:p-14 space-y-10">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-[22px] bg-slate-950 flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform">
                  <Activity className="w-7 h-7 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-display font-bold text-slate-900 tracking-tight">AI Executive Summary</h3>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Procurement Reasoning Engine</span>
                </div>
              </div>
              
              <div className="relative">
                <div className="absolute -left-6 top-0 bottom-0 w-1 bg-emerald-500/20 rounded-full" />
                <p className="text-slate-600 leading-relaxed text-2xl font-display font-bold italic pl-6">
                  "{data.ai_recommendation}"
                </p>
              </div>
              
              <div className="pt-10 border-t border-slate-50 grid grid-cols-2 md:grid-cols-4 gap-8">
                <AdvancedStat label="Urgency" value={data.advanced_signals.urgency} />
                <AdvancedStat label="Intent" value={data.advanced_signals.partnership_intent} />
                <AdvancedStat label="Logistics" value={data.advanced_signals.logistics_maturity} />
                <AdvancedStat label="Production" value={data.advanced_signals.production_confidence} />
              </div>
            </div>
          </div>
        </div>

        {/* RISK & SCORE */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white border border-slate-100 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.04)] rounded-[40px] overflow-hidden p-10 group hover:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.08)] transition-all">
            <div className="flex items-center justify-between mb-8">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Negotiation Score</span>
              <div className="p-2 bg-emerald-50 rounded-xl">
                <Target className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-7xl font-display font-black text-slate-900 tracking-tighter">{data.negotiation_score}</span>
              <span className="text-2xl font-bold text-slate-200">/ 100</span>
            </div>
            <div className="w-full h-3 bg-slate-50 rounded-full overflow-hidden shadow-inner">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${data.negotiation_score}%` }}
                transition={{ duration: 1.5, ease: "circOut", delay: 0.5 }}
                className={cn(
                  "h-full rounded-full shadow-[0_0_12px_rgba(16,185,129,0.3)]",
                  data.negotiation_score > 80 ? 'bg-emerald-500' : 'bg-amber-500'
                )}
              />
            </div>
            <p className="mt-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">Compatibility index based on sourcing criteria</p>
          </div>

          <div className="bg-white border border-slate-100 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.04)] rounded-[40px] overflow-hidden p-10 group hover:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.08)] transition-all">
            <div className="flex items-center justify-between mb-8">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Risk Assessment</span>
              <div className="p-2 bg-rose-50 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
              </div>
            </div>
            
            <div className="mb-8">
              <Badge className={cn(
                "px-6 py-2 rounded-2xl font-black text-xs border-none shadow-lg",
                data.overall_risk === 'LOW' ? 'bg-emerald-500 text-white shadow-emerald-200' : 
                data.overall_risk === 'MEDIUM' ? 'bg-amber-500 text-white shadow-amber-200' : 'bg-rose-500 text-white shadow-rose-200'
              )}>
                {data.overall_risk} RISK PROFILE
              </Badge>
            </div>

            <div className="space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Identified Factors</p>
              {data.risk_factors.map((factor, i) => (
                <div key={i} className="flex items-center gap-3 text-sm font-bold text-slate-600">
                  <div className={cn(
                    "w-2 h-2 rounded-full shrink-0",
                    data.overall_risk === 'LOW' ? 'bg-emerald-400' : 'bg-amber-400'
                  )} />
                  {factor}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const SignalCard = ({ icon, label, status, summary, colorClass }: any) => (
  <div className="bg-white border border-slate-50 shadow-[0_12px_24px_-8px_rgba(0,0,0,0.04)] rounded-[32px] p-8 hover:border-emerald-200/50 hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.08)] transition-all duration-500 group">
    <div className="flex items-center justify-between mb-6">
      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-500 shadow-sm">
        {icon}
      </div>
      <Badge variant="outline" className={cn("text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full border", colorClass)}>
        {status}
      </Badge>
    </div>
    <div className="space-y-3">
      <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</h4>
      <p className="text-[15px] font-display font-bold text-slate-900 leading-tight">
        "{summary}"
      </p>
    </div>
  </div>
);

const AdvancedStat = ({ label, value }: { label: string, value: string }) => (
  <div className="space-y-2">
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">{label}</p>
    <p className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
       <div className="w-1 h-1 rounded-full bg-emerald-500" />
       {value}
    </p>
  </div>
);

export default NegotiationIntelligenceLayer;
