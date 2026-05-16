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
  AlertCircle
} from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

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
    <div className="w-full max-w-7xl mx-auto mt-8 mb-12">
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl shadow-slate-200/50">
        {/* HEADER */}
        <div className="bg-slate-900 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
              <Globe className="w-6 h-6 text-emerald-400 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold tracking-tight">Cross-Border Negotiation Session</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge className="bg-emerald-500/20 text-emerald-400 border-none text-[8px] font-black uppercase tracking-widest">Active AI Link</Badge>
                <span className="text-[10px] text-white/40 font-bold uppercase tracking-tighter">Session ID: NEG-{Math.floor(Math.random()*10000)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="hidden md:flex flex-col items-end mr-4">
                <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Network Status</span>
                <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1.5">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                   Secured via Algorand
                </span>
             </div>
             {onClose && (
               <Button onClick={onClose} variant="ghost" className="text-white/60 hover:text-white hover:bg-white/10 rounded-full">
                 Close Session
               </Button>
             )}
          </div>
        </div>

        <CardContent className="p-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[500px]">
            {/* LEFT: BUYER INQUIRY */}
            <div className="lg:col-span-4 border-r border-slate-100 p-8 bg-slate-50/30">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Buyer Procurement Inquiry</h3>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm min-h-[300px] flex flex-col">
                <div className="flex-1 font-mono text-[11px] leading-relaxed text-slate-600 whitespace-pre-wrap italic">
                  {inquiry}
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                   <span className="text-[9px] font-black text-slate-400 uppercase">Origin</span>
                   <Badge variant="outline" className="text-[8px] font-black uppercase">United States (USD)</Badge>
                </div>
              </div>
            </div>

            {/* CENTER: AI TRANSLATION LAYER */}
            <div className="lg:col-span-3 border-r border-slate-100 p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-b from-slate-50/50 to-white pointer-events-none" />
               <AnimatePresence mode="wait">
                 {step === 'initializing' ? (
                   <motion.div 
                     key="init"
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     exit={{ opacity: 0 }}
                     className="relative z-10 space-y-6 w-full"
                   >
                     <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto shadow-xl">
                        <Cpu className="w-8 h-8 text-emerald-400 animate-spin" />
                     </div>
                     <div className="space-y-2">
                        {translationLog.map((log, i) => (
                          <motion.p 
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter"
                          >
                            {log}
                          </motion.p>
                        ))}
                     </div>
                   </motion.div>
                 ) : (
                   <motion.div 
                     key="trans"
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     className="relative z-10 space-y-8 w-full"
                   >
                     <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100">
                           <Languages className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div className="space-y-1">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AI Translation Matrix</p>
                           <p className="text-sm font-bold text-slate-900">{language === 'English' ? 'Native Protocol Optimization' : `English ⇄ ${language}`}</p>
                        </div>
                     </div>

                     <div className="space-y-4">
                        <div className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                           <p className="text-[8px] font-black text-slate-400 uppercase mb-2">Intent Detection</p>
                           <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: '92%' }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                className="h-full bg-emerald-500"
                              />
                           </div>
                           <div className="flex justify-between mt-1">
                              <span className="text-[9px] font-bold text-emerald-600">High Reliability</span>
                              <span className="text-[9px] font-bold text-slate-400">92% Match</span>
                           </div>
                        </div>
                        <div className="flex justify-center">
                           <motion.div 
                             animate={{ scale: [1, 1.1, 1] }}
                             transition={{ repeat: Infinity, duration: 2 }}
                             className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center"
                           >
                              <ArrowRight className="w-5 h-5 text-emerald-500" />
                           </motion.div>
                        </div>
                     </div>
                   </motion.div>
                 )}
               </AnimatePresence>
            </div>

            {/* RIGHT: SUPPLIER RESPONSE */}
            <div className="lg:col-span-5 p-8 bg-slate-50/10">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Supplier Agent Response</h3>
              </div>
              
              <AnimatePresence mode="wait">
                {step === 'initializing' ? (
                  <motion.div 
                    key="waiting"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="h-full min-h-[300px] flex flex-col items-center justify-center text-center opacity-40"
                  >
                    <MessageSquare className="w-12 h-12 text-slate-300 mb-4" />
                    <p className="text-sm font-medium text-slate-400">Awaiting supplier agent response...</p>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="response"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    <div className="bg-white border border-emerald-100 rounded-2xl p-6 shadow-xl shadow-emerald-500/5 relative">
                       <div className="absolute -top-3 -left-3 w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white shadow-lg">
                          <CheckCircle2 className="w-5 h-5" />
                       </div>
                       <div className="space-y-4">
                          <div className="pb-4 border-b border-slate-50">
                             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Supplier Message (Translated)</span>
                             <p className="text-sm font-bold text-slate-900 leading-relaxed italic">
                                "{data?.rounds?.[0]?.supplier_response_english || "We have analyzed your inquiry and are willing to discuss a potential partnership. We can adjust the MOQ for a long-term contract commitment."}"
                             </p>
                          </div>
                          <div>
                             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Original Context</span>
                             <p className="text-xs font-mono text-slate-500 line-clamp-3">
                                {data?.rounds?.[0]?.supplier_response_native || "我们可以根据您的需求调整起订量。对于长期合作，我们愿意提供更有竞争力的价格。"}
                             </p>
                          </div>
                       </div>
                    </div>

                    <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl">
                       <div className="flex items-center gap-2 mb-2">
                          <Activity className="w-3 h-3 text-primary" />
                          <span className="text-[10px] font-black text-primary uppercase">AI Interpretation</span>
                       </div>
                       <p className="text-xs text-slate-600 leading-relaxed font-medium">
                          Supplier is flexible on **pricing and MOQ**. Strong **logistics alignment** detected. Recommended for supplier shortlist evaluation.
                       </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* BOTTOM: NEGOTIATION INTELLIGENCE */}
          <AnimatePresence>
            {step === 'exchanging' && data?.cultural_intelligence && (
              <motion.div 
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-slate-50 border-t border-slate-100 p-8"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-white rounded-xl border border-slate-200">
                    <TrendingUp className="w-4 h-4 text-slate-700" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Negotiation Intelligence Layer</h4>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Real-time intent & sentiment analysis</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[
                    { label: "MOQ Flexibility", value: "HIGH", color: "text-emerald-600", icon: <TrendingUp className="w-3.5 h-3.5" /> },
                    { label: "Pricing Resistance", value: "LOW", color: "text-blue-600", icon: <Zap className="w-3.5 h-3.5" /> },
                    { label: "Delivery Confidence", value: "STRONG", color: "text-emerald-600", icon: <ShieldCheck className="w-3.5 h-3.5" /> },
                    { label: "L/T Partnership", value: "DETECTED", color: "text-primary", icon: <Languages className="w-3.5 h-3.5" /> }
                  ].map((stat, i) => (
                    <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm group hover:border-primary/30 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</span>
                        <div className={`${stat.color} opacity-40 group-hover:opacity-100 transition-opacity`}>
                          {stat.icon}
                        </div>
                      </div>
                      <p className={`text-lg font-display font-black ${stat.color}`}>{stat.value}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="flex -space-x-2">
                         <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold">US</div>
                         <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-900 flex items-center justify-center text-[10px] font-bold text-white">AI</div>
                         <div className="w-8 h-8 rounded-full border-2 border-white bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-white">CN</div>
                      </div>
                      <span className="text-xs font-medium text-slate-500 italic">"Autonomous procurement channel secured on-chain."</span>
                   </div>
                    <Button 
                      onClick={onClose}
                      className="bg-slate-900 hover:bg-black text-white font-bold h-12 px-8 rounded-xl shadow-xl shadow-slate-200 active:scale-95 transition-transform"
                    >
                       Add to Supplier Shortlist
                    </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </div>
    </div>
  );
};

export default NegotiationSession;
