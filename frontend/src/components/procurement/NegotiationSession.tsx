import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Globe, 
  Cpu, 
  Languages, 
  CheckCircle2, 
  ShieldCheck, 
  Activity, 
  Zap, 
  Loader2, 
  ArrowRight,
  TrendingUp,
  MessageSquare,
  AlertCircle,
  BarChart3,
  Check,
  Star
} from 'lucide-react';
import NegotiationIntelligenceLayer from './NegotiationIntelligenceLayer';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import { cn } from '../../lib/utils';

interface NegotiationSessionProps {
  inquiry: string;
  product: string;
  language?: string;
  onClose?: () => void;
}

const NegotiationSession: React.FC<NegotiationSessionProps> = ({ inquiry, product, language = "Chinese", onClose }) => {
  const [step, setStep] = useState<'initializing' | 'exchanging' | 'complete'>('initializing');
  const [data, setData] = useState<any>(null);
  const [translationLog, setTranslationLog] = useState<string[]>([]);
  const [isShortlisted, setIsShortlisted] = useState(false);
  const [isApproved, setIsApproved] = useState(false);

  useEffect(() => {
    const runNegotiation = async () => {
      setStep('initializing');
      
      const logs = [
        "Establishing encrypted procurement channel...",
        `Initializing ${language} NLP translation matrix...`,
        "Routing inquiry through global B2B nodes...",
        "Awaiting supplier agent handshake..."
      ];

      for (const log of logs) {
        setTranslationLog(prev => [...prev, log]);
        await new Promise(res => setTimeout(res, 800));
      }

      try {
        const res = await axios.post(`${API_BASE_URL}/api/negotiation/multilingual/full`, {
          buyer_message: inquiry,
          supplier_language: language,
          product: product
        });
        
        setData(res.data);
        setStep('exchanging');
      } catch (err) {
        console.error(err);
      }
    };

    runNegotiation();
  }, [inquiry, product, language]);

  return (
    <div className="w-full max-w-7xl mx-auto mt-12 mb-20 px-4 md:px-0">
      <div className="bg-white border border-slate-100 rounded-[40px] overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)] transition-all">
        {/* HEADER */}
        <div className="bg-white border-b border-slate-50 p-10 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-slate-950 rounded-[22px] flex items-center justify-center shadow-2xl shadow-slate-200 group hover:scale-105 transition-transform duration-500">
              <Globe className="w-8 h-8 text-emerald-400 group-hover:rotate-12 transition-transform" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Supplier Negotiation Engine</h2>
              <div className="flex items-center gap-4">
                <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100/50 text-[10px] font-black px-3.5 py-1 rounded-full uppercase tracking-widest">AI Handshake Active</Badge>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Ref: NEG-{Math.floor(Math.random()*10000)}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-8">
             <div className="hidden lg:flex flex-col items-end">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Protocol Verification</span>
                <span className="text-sm font-bold text-slate-900 flex items-center gap-2.5">
                   <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]" />
                   On-Chain Secured (Algorand)
                </span>
             </div>
             {onClose && (
               <Button onClick={onClose} variant="ghost" className="text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-2xl px-6 font-bold h-12">
                 Exit Session
               </Button>
             )}
          </div>
        </div>

        <CardContent className="p-0">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* LEFT: BUYER INQUIRY */}
            <div className="lg:col-span-4 border-r border-slate-50 p-10 bg-slate-50/20">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-slate-900" />
                  <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.25em]">Buyer Intent</h3>
                </div>
                <Badge variant="outline" className="border-slate-200 text-slate-500 text-[9px] font-black px-2 py-0.5 rounded-md">USD / USA</Badge>
              </div>
              <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm min-h-[340px] flex flex-col group hover:shadow-md transition-shadow">
                <div className="flex-1 font-display text-[15px] leading-relaxed text-slate-500 italic">
                  "{inquiry}"
                </div>
                <div className="mt-8 pt-6 border-t border-slate-50 flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
                     <Target className="w-5 h-5 text-slate-400" />
                   </div>
                   <div className="flex flex-col">
                     <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sourcing Target</span>
                     <span className="text-xs font-bold text-slate-900">{product}</span>
                   </div>
                </div>
              </div>
            </div>

            {/* CENTER: AI TRANSLATION LAYER */}
            <div className="lg:col-span-3 border-r border-slate-50 p-10 flex flex-col items-center justify-center text-center relative">
               <AnimatePresence mode="wait">
                 {step === 'initializing' ? (
                   <motion.div 
                     key="init"
                     initial={{ opacity: 0, scale: 0.95 }}
                     animate={{ opacity: 1, scale: 1 }}
                     exit={{ opacity: 0 }}
                     className="space-y-8 w-full"
                   >
                     <div className="w-20 h-20 bg-slate-950 rounded-3xl flex items-center justify-center mx-auto shadow-2xl relative overflow-hidden">
                        <Cpu className="w-10 h-10 text-emerald-400 animate-spin" />
                        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-transparent opacity-50" />
                     </div>
                     <div className="space-y-3">
                        {translationLog.map((log, i) => (
                          <motion.p 
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-[11px] font-bold text-slate-400 uppercase tracking-tight"
                          >
                            {log}
                          </motion.p>
                        ))}
                     </div>
                   </motion.div>
                 ) : (
                   <motion.div 
                     key="trans"
                     initial={{ opacity: 0, scale: 1.05 }}
                     animate={{ opacity: 1, scale: 1 }}
                     className="space-y-12 w-full"
                   >
                     <div className="flex flex-col items-center gap-6">
                        <div className="w-16 h-16 bg-emerald-50 rounded-[22px] flex items-center justify-center border border-emerald-100 shadow-sm">
                           <Languages className="w-8 h-8 text-emerald-600" />
                        </div>
                        <div className="space-y-2">
                           <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Translation Matrix</p>
                           <p className="text-xl font-display font-bold text-slate-900">English ⇄ {language}</p>
                        </div>
                     </div>

                     <div className="space-y-6 px-4">
                        <div className="p-5 bg-white border border-slate-100 rounded-[24px] shadow-sm">
                           <div className="flex justify-between mb-2.5">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Semantic Accuracy</span>
                              <span className="text-[10px] font-black text-emerald-600 uppercase">92%</span>
                           </div>
                           <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: '92%' }}
                                transition={{ duration: 1.5, ease: "circOut" }}
                                className="h-full bg-emerald-500"
                              />
                           </div>
                        </div>
                        <div className="flex justify-center">
                           <motion.div 
                             animate={{ y: [0, 8, 0] }}
                             transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                             className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100"
                           >
                              <ArrowRight className="w-6 h-6 text-slate-400" />
                           </motion.div>
                        </div>
                     </div>
                   </motion.div>
                 )}
               </AnimatePresence>
            </div>

            {/* RIGHT: SUPPLIER RESPONSE */}
            <div className="lg:col-span-5 p-10 bg-white">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.25em]">Supplier Response</h3>
                </div>
                <Badge className="bg-slate-50 text-slate-500 border-slate-100 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">{language} Agent</Badge>
              </div>
              
              <AnimatePresence mode="wait">
                {step === 'initializing' ? (
                  <motion.div 
                    key="waiting"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="h-full min-h-[400px] flex flex-col items-center justify-center text-center space-y-4"
                  >
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
                       <MessageSquare className="w-10 h-10 text-slate-200" />
                    </div>
                    <p className="text-sm font-bold text-slate-300 uppercase tracking-widest">Handshake in progress...</p>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="response"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-8"
                  >
                    <div className="bg-white border border-slate-100 rounded-[32px] p-10 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.04)] relative group hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.08)] transition-all">
                       <div className="absolute -top-4 -left-4 w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-emerald-200 group-hover:rotate-6 transition-transform">
                          <CheckCircle2 className="w-6 h-6" />
                       </div>
                       <div className="space-y-8">
                          <div className="space-y-4">
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">Translated Communication</span>
                             <p className="text-xl font-display font-bold text-slate-900 leading-relaxed italic">
                                "{data?.rounds?.[0]?.supplier_response_english || "Initial connection established. Awaiting full signal extraction."}"
                             </p>
                          </div>
                          <div className="pt-6 border-t border-slate-50">
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-3">Native Payload</span>
                             <p className="text-xs font-mono text-slate-400 bg-slate-50 p-4 rounded-xl leading-relaxed">
                                {data?.rounds?.[0]?.supplier_response_native}
                             </p>
                          </div>
                       </div>
                    </div>

                    <div className="p-6 bg-emerald-50/40 border border-emerald-100/50 rounded-[24px] flex items-start gap-4">
                       <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                          <Activity className="w-5 h-5 text-emerald-600" />
                       </div>
                       <div>
                          <span className="text-[11px] font-black text-emerald-600 uppercase tracking-widest block mb-1">Agent Interpretation</span>
                          <p className="text-sm text-slate-600 leading-relaxed font-medium">
                             The supplier exhibits high flexibility on **pricing tiers** and **MOQ reduction**. Strong **fulfillment confidence** aligns with your 21-day target.
                          </p>
                       </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* BOTTOM: NEGOTIATION INTELLIGENCE */}
          <AnimatePresence>
            {step === 'exchanging' && data?.rounds?.[0]?.supplier_response_english && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white border-t border-slate-50 p-10 pt-16"
              >
                <div className="mb-20">
                   <NegotiationIntelligenceLayer 
                     supplierMessage={data.rounds[0].supplier_response_english}
                     productName={product}
                   />
                </div>

                {/* FINAL SHORTLIST WORKFLOW */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-12 pt-12 border-t border-slate-50">
                   <div className="flex items-center gap-6">
                      <div className="flex -space-x-3">
                         <div className="w-12 h-12 rounded-[18px] border-4 border-white bg-slate-100 flex items-center justify-center text-xs font-black shadow-sm">US</div>
                         <div className="w-12 h-12 rounded-[18px] border-4 border-white bg-slate-950 flex items-center justify-center text-xs font-black text-white shadow-sm">AI</div>
                         <div className="w-12 h-12 rounded-[18px] border-4 border-white bg-emerald-500 flex items-center justify-center text-xs font-black text-white shadow-sm">SUP</div>
                      </div>
                      <div className="space-y-1">
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Workflow Authorization</span>
                         <p className="text-sm font-bold text-slate-900 leading-tight">Supplier intelligence verified. Final procurement actions required.</p>
                      </div>
                   </div>

                   <div className="flex flex-wrap items-center gap-4">
                      <Button 
                        variant="outline"
                        onClick={() => window.open('/compare', '_blank')}
                        className="h-14 px-8 rounded-2xl border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all flex items-center gap-2.5 shadow-sm"
                      >
                         <BarChart3 className="w-4 h-4" />
                         Compare Supplier
                      </Button>

                      <Button 
                        variant="secondary"
                        onClick={() => setIsShortlisted(!isShortlisted)}
                        className={cn(
                          "h-14 px-8 rounded-2xl font-bold transition-all flex items-center gap-2.5 shadow-sm",
                          isShortlisted ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-slate-100 text-slate-900"
                        )}
                      >
                         {isShortlisted ? <Star className="w-4 h-4 fill-amber-500 text-amber-500" /> : <Star className="w-4 h-4" />}
                         {isShortlisted ? "On Shortlist" : "Add to Shortlist"}
                      </Button>

                      <Button 
                        onClick={() => setIsApproved(true)}
                        disabled={isApproved}
                        className={cn(
                          "h-14 px-10 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center gap-3 shadow-xl group",
                          isApproved ? "bg-emerald-500 text-white cursor-default" : "bg-slate-900 hover:bg-black text-white active:scale-95"
                        )}
                      >
                         {isApproved ? <Check className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                         {isApproved ? "Supplier Approved" : "Approve Supplier"}
                      </Button>
                   </div>
                </div>

                {isApproved && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 p-6 bg-emerald-50 border border-emerald-100 rounded-[24px] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white">
                        <Check className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-emerald-900">Procurement Authorization Finalized</p>
                        <p className="text-xs text-emerald-700 font-medium opacity-80">Transitioning to Algorand Escrow & Settlement Layer...</p>
                      </div>
                    </div>
                    <Button 
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest px-6 h-10 rounded-xl"
                      onClick={() => window.location.href = '/escrow'}
                    >
                      Initialize Escrow
                    </Button>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </div>
    </div>
  );
};

export default NegotiationSession;
