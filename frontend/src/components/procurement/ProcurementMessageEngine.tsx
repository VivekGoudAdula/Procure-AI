import React, { useState } from 'react';
import axios from 'axios';
import { 
  FileText, 
  Copy, 
  Download, 
  CheckCircle2, 
  Loader2, 
  ShieldCheck, 
  Globe,
  ArrowRight,
  Sparkles,
  Zap,
  Send,
  MessageSquare,
  Languages,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { API_BASE_URL } from '../../config';
import NegotiationSession from './NegotiationSession';

interface ProcurementMessageEngineProps {
  intent: {
    product: string;
    quantity: number | string;
    budget: number | string;
    lead_time: string;
    requirements: string | string[];
    destination_country?: string;
    shipping_preference?: string;
  };
}

const ProcurementMessageEngine: React.FC<ProcurementMessageEngineProps> = ({ intent }) => {
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [inquiry, setInquiry] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<any>(null);
  const [showNegotiation, setShowNegotiation] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const loadingMessages = [
    "Structuring procurement inquiry...",
    "Generating supplier-ready communication...",
    "Procurement inquiry optimized."
  ];

  const handleGenerate = async () => {
    setLoading(true);
    setLoadingStep(0);
    setInquiry(null);

    // Simulate loading steps for UX
    const interval = setInterval(() => {
      setLoadingStep(prev => (prev < 2 ? prev + 1 : prev));
    }, 1200);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/procurement/generate-inquiry`, {
        product: intent.product,
        quantity: intent.quantity,
        budget: intent.budget,
        lead_time: intent.lead_time,
        requirements: intent.requirements,
        destination_country: intent.destination_country || "Global",
        shipping_preference: intent.shipping_preference || "EXW / FOB"
      });

      // Artificial delay to finish the animation
      setTimeout(() => {
        clearInterval(interval);
        setInquiry(response.data.message);
        setMetadata(response.data.metadata);
        setLoading(false);
        toast.success("Procurement inquiry generated successfully.");
      }, 3000);
    } catch (error) {
      clearInterval(interval);
      setLoading(false);
      toast.error("Failed to generate procurement inquiry.");
    }
  };

  const handleInitiateCommunication = () => {
    setIsSending(true);
    toast.loading("Initiating secure communication channel...");
    
    setTimeout(() => {
      toast.dismiss();
      setShowNegotiation(true);
      toast.success("Supplier agent connection established.");
    }, 2000);
  };

  const copyToClipboard = () => {
    if (inquiry) {
      navigator.clipboard.writeText(inquiry);
      toast.success("Inquiry copied to clipboard.");
    }
  };

  const exportAsPDF = () => {
    toast.info("Exporting as PDF... (Feature coming soon)");
  };

  if (showNegotiation && inquiry) {
    return (
      <NegotiationSession 
        inquiry={inquiry}
        product={intent.product}
        language={(() => {
          const country = intent.destination_country?.toLowerCase() || '';
          if (country.includes('china')) return 'Chinese';
          if (country.includes('vietnam')) return 'Vietnamese';
          if (country.includes('mexico')) return 'Spanish';
          if (country.includes('india')) return 'Hindi';
          if (country.includes('japan')) return 'Japanese';
          return 'Chinese'; // Default for sourcing Demo
        })()}
        onClose={() => setShowNegotiation(false)}
      />
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto mt-12 mb-12">
      <div className="flex flex-col gap-2 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-900 rounded-xl">
              <Zap className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-slate-900 tracking-tight">AI Procurement Workflow Engine</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Autonomous supplier inquiry orchestration</p>
            </div>
          </div>
          {inquiry && (
            <Badge className="bg-emerald-50 text-emerald-600 border-none text-[8px] font-black uppercase tracking-widest px-3 py-1">
               <Activity className="w-3 h-3 mr-1.5 inline animate-pulse" /> Inquiry Optimized
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT PANEL: Buyer Procurement Intent */}
        <div className="lg:col-span-4">
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm sticky top-8">
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Buyer Intent Parameters</h3>
              <Badge className="bg-blue-50 text-blue-600 border-none text-[8px] font-black uppercase tracking-widest">AI Validated</Badge>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Target Product</span>
                  <p className="text-sm font-bold text-slate-900">{intent.product}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Volume</span>
                    <p className="text-sm font-bold text-slate-900">{intent.quantity}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Price Pt.</span>
                    <p className="text-sm font-bold text-emerald-600">${intent.budget}</p>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Lead Time</span>
                  <p className="text-sm font-bold text-slate-900">{intent.lead_time}</p>
                </div>
              </div>

              {!inquiry && !loading ? (
                <Button 
                  onClick={handleGenerate}
                  className="w-full h-14 bg-slate-900 hover:bg-black text-white font-bold rounded-2xl shadow-xl shadow-slate-200 transition-all flex items-center justify-center gap-3 group"
                >
                  <Sparkles className="w-5 h-5 text-emerald-400 group-hover:animate-pulse" />
                  Generate Inquiry Structure
                </Button>
              ) : inquiry && (
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                   <div className="flex items-center gap-2 mb-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span className="text-[10px] font-black text-emerald-700 uppercase">Optimization Status</span>
                   </div>
                   <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                      Your procurement needs have been structured into a professional supplier inquiry.
                   </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: AI Procurement Inquiry */}
        <div className="lg:col-span-8">
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm h-full flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Supplier-Ready Inquiry</h3>
                 {inquiry && <Badge className="bg-emerald-100 text-emerald-700 border-none text-[8px] font-black uppercase">Optimized for Conversion</Badge>}
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-slate-100 text-slate-500 border-none text-[8px] font-black uppercase tracking-widest">v1.2 Agentic</Badge>
              </div>
            </div>

            <div className="p-8 flex-1 relative bg-white">
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div 
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center"
                  >
                    <div className="w-16 h-16 mb-6 relative">
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        className="absolute inset-0 border-4 border-slate-100 border-t-primary rounded-full"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-primary animate-spin" />
                      </div>
                    </div>
                    <motion.div 
                      key={loadingStep}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-1"
                    >
                      <p className="text-slate-900 font-bold text-sm tracking-tight">{loadingMessages[loadingStep]}</p>
                      <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest">AI Agent Orchestrating...</p>
                    </motion.div>
                  </motion.div>
                ) : inquiry ? (
                  <motion.div 
                    key="inquiry"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col h-full"
                  >
                    <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-8 font-mono text-[13px] leading-relaxed text-slate-700 whitespace-pre-wrap shadow-inner overflow-y-auto max-h-[500px] border-dashed">
                      {inquiry}
                    </div>
                    
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button 
                          onClick={handleInitiateCommunication}
                          disabled={isSending}
                          className="h-16 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl shadow-xl shadow-primary/20 gap-3 text-lg"
                        >
                          {isSending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
                          Initiate Supplier Communication
                        </Button>
                        <div className="grid grid-cols-2 gap-3">
                           <Button 
                             onClick={copyToClipboard}
                             variant="outline" 
                             className="h-16 rounded-2xl border-slate-200 hover:bg-slate-50 text-slate-600 flex-col gap-1 py-0"
                           >
                             <Copy className="w-4 h-4" />
                             <span className="text-[10px] font-black uppercase tracking-widest">Copy</span>
                           </Button>
                           <Button 
                             onClick={() => toast.info("Translation Layer Active. Start negotiation to trigger.")}
                             variant="outline" 
                             className="h-16 rounded-2xl border-slate-200 hover:bg-slate-50 text-slate-600 flex-col gap-1 py-0"
                           >
                             <Languages className="w-4 h-4" />
                             <span className="text-[10px] font-black uppercase tracking-widest">Translate</span>
                           </Button>
                        </div>
                    </div>

                    <div className="flex items-center justify-center gap-4 mt-8 opacity-40">
                       <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-3 h-3" />
                          <span className="text-[9px] font-black uppercase tracking-widest">B2B Standard</span>
                       </div>
                       <div className="w-1 h-1 rounded-full bg-slate-300" />
                       <div className="flex items-center gap-2">
                          <Languages className="w-3 h-3" />
                          <span className="text-[9px] font-black uppercase tracking-widest">Multilingual Ready</span>
                       </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6 shadow-inner border border-slate-100">
                      <MessageSquare className="w-10 h-10 text-slate-300" />
                    </div>
                    <h4 className="text-slate-900 font-bold mb-2">Ready for Orchestration</h4>
                    <p className="text-slate-500 font-medium text-sm max-w-[280px] mx-auto">
                      Define your procurement intent on the left to generate a high-conversion supplier inquiry.
                    </p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcurementMessageEngine;
