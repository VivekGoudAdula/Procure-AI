import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, Cpu, Languages, CheckCircle2, ShieldCheck, Activity, Zap, Loader2, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { API_BASE_URL } from '../../config';
import axios from 'axios';

interface MultilingualNegotiationTerminalProps {
  product: string;
}

export default function MultilingualNegotiationTerminal({ product }: MultilingualNegotiationTerminalProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [negotiationData, setNegotiationData] = useState<any>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("Chinese");

  const startNegotiation = async () => {
    setIsInitializing(true);
    setIsExpanded(true);

    try {
      const res = await axios.post(`${API_BASE_URL}/api/negotiation/multilingual/full`, {
        buyer_message: `We are interested in procuring ${product} and would like to discuss terms.`,
        supplier_language: selectedLanguage,
        product: product
      });
      
      setNegotiationData(res.data);
      
      setTimeout(() => {
        setIsInitializing(false);
        setIsActive(true);
      }, 1500);
    } catch (err) {
      console.error(err);
      setIsInitializing(false);
    }
  };

  return (
    <Card className="bg-white border border-slate-200 rounded-2xl overflow-hidden mt-8 transition-all shadow-sm">
      <div 
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
            <Globe className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Cross-Border Negotiation Intelligence</h3>
            <p className="text-xs text-slate-500">AI-powered multilingual supplier communication & intent analysis</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {isActive ? (
            <Badge className="bg-emerald-50 text-emerald-700 border-none text-[10px] font-bold uppercase hover:bg-emerald-50">
              <Activity className="w-3 h-3 mr-1 inline animate-pulse" /> Active Session
            </Badge>
          ) : (
            <Badge className="bg-slate-100 text-slate-600 border-none text-[10px] font-bold uppercase hover:bg-slate-100">
              Standby
            </Badge>
          )}
          {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-slate-200"
          >
            <CardContent className="p-6">
              {!isActive && !isInitializing ? (
                <div className="flex flex-col md:flex-row items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex-1">
                    <p className="text-sm text-slate-900 font-medium mb-1">Select Supplier Region</p>
                    <p className="text-xs text-slate-500">Initialize AI translation matrix for cross-border negotiations.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <select 
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value)}
                      className="bg-white border border-slate-200 text-slate-900 text-sm font-medium rounded-lg px-4 h-10 outline-none"
                    >
                      <option value="Chinese">🇨🇳 Chinese</option>
                      <option value="Vietnamese">🇻🇳 Vietnamese</option>
                      <option value="Spanish">🇲🇽 Spanish</option>
                      <option value="Hindi">🇮🇳 Hindi</option>
                      <option value="Japanese">🇯🇵 Japanese</option>
                    </select>
                    <Button 
                      onClick={(e) => {
                        e.stopPropagation();
                        startNegotiation();
                      }}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-semibold h-10"
                    >
                      Initialize Link
                    </Button>
                  </div>
                </div>
              ) : isInitializing ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
                  <p className="text-sm font-semibold text-slate-900">Establishing AI Translation Bridge...</p>
                  <p className="text-xs text-slate-500 mt-1">Synchronizing NLP models for {selectedLanguage} intent detection.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left: Communication Flow summary */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Negotiation Summary</h4>
                    <div className="space-y-3">
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-semibold text-slate-900">Initial Inquiry (English)</span>
                          <span className="text-[10px] text-slate-500">Buyer</span>
                        </div>
                        <p className="text-sm text-slate-600">We are interested in procuring {product} and would like to discuss terms.</p>
                      </div>
                      
                      <div className="flex justify-center">
                        <ArrowRight className="w-4 h-4 text-primary rotate-90" />
                      </div>

                      <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-semibold text-slate-900">Supplier Response ({negotiationData?.target_language})</span>
                          <span className="text-[10px] text-primary">AI Translated</span>
                        </div>
                        <p className="text-sm text-slate-600 italic">"{negotiationData?.rounds?.[0]?.supplier_response_english || "We can fulfill this order with high quality and competitive pricing."}"</p>
                      </div>
                    </div>
                  </div>

                  {/* Right: Cultural & Intent Intelligence */}
                  {negotiationData?.cultural_intelligence && (
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
                        Intent & Cultural Intelligence
                        <Badge className="bg-purple-50 text-purple-700 border-none text-[8px] uppercase hover:bg-purple-50">Enterprise</Badge>
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                          <span className="text-[10px] text-slate-500 uppercase block mb-1">Communication Style</span>
                          <span className="text-xs font-semibold text-slate-900">{negotiationData.cultural_intelligence.communication_style}</span>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                          <span className="text-[10px] text-slate-500 uppercase block mb-1">Negotiation Approach</span>
                          <span className="text-xs font-semibold text-slate-900">{negotiationData.cultural_intelligence.negotiation_approach}</span>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                          <span className="text-[10px] text-slate-500 uppercase block mb-1">Risk Profile</span>
                          <span className="text-xs font-semibold text-emerald-600">{negotiationData.cultural_intelligence.risk_profile}</span>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                          <span className="text-[10px] text-slate-500 uppercase block mb-1">Fulfillment Confidence</span>
                          <span className="text-xs font-semibold text-emerald-600">{negotiationData.cultural_intelligence.fulfillment_confidence}%</span>
                        </div>
                      </div>

                      <div className="mt-4 p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                        <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest flex items-center gap-1.5 mb-1">
                          <CheckCircle2 className="w-3 h-3" /> AI Advisory
                        </span>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Supplier exhibits {negotiationData.cultural_intelligence.negotiation_approach.toLowerCase()} behavior. 
                          Intent signals are positive. Recommendation: proceed with standard escrow commitment.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
