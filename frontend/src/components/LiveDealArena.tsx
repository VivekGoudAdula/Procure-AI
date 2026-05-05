import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingDown, 
  Clock, 
  ShieldCheck, 
  Trophy, 
  ArrowRight,
  Zap,
  Target,
  ChevronRight,
  Activity
} from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';

interface SupplierRoundData {
  name: string;
  price: number;
  delivery: number;
  message: string;
}

interface Round {
  round: number;
  suppliers: SupplierRoundData[];
}

interface DealData {
  deal: {
    product: string;
    quantity: number;
    budget: number;
  };
  rounds: Round[];
  final_decision: {
    winner: string;
    price: number;
    delivery: number;
    reliability: number;
    reason: string;
  };
}

const LiveDealArena = ({ data }: { data: DealData }) => {
  const [currentRound, setCurrentRound] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (currentRound < data.rounds.length) {
      const timer = setTimeout(() => {
        setCurrentRound(prev => prev + 1);
      }, 3000); // 3 seconds per round for animation
      return () => clearTimeout(timer);
    } else {
      setIsComplete(true);
    }
  }, [currentRound, data.rounds.length]);

  const roundsToShow = data.rounds.slice(0, currentRound);
  const currentSuppliers = data.rounds[Math.min(currentRound - 1, data.rounds.length - 1)]?.suppliers || [];
  
  // Previous round for price drop comparison
  const prevSuppliers = currentRound > 1 ? data.rounds[currentRound - 2].suppliers : null;

  return (
    <Card className="bg-slate-900 border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl mb-12">
      <CardContent className="p-0">
        {/* SECTION 1: Deal Header */}
        <div className="bg-slate-800/50 p-8 border-b border-slate-700/50 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30">
              <Target className="text-primary w-8 h-8" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Active Procurement Deal</p>
              <h2 className="text-2xl font-display font-bold text-white tracking-tight">{data.deal.product}</h2>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-slate-300 text-xs font-medium">Qty: <span className="text-white font-bold">{data.deal.quantity}</span></span>
                <div className="w-1 h-1 rounded-full bg-slate-600" />
                <span className="text-slate-300 text-xs font-medium">Budget: <span className="text-emerald-400 font-bold">${data.deal.budget.toLocaleString()}</span></span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <Badge className={cn(
               "px-4 py-2 rounded-xl border-none font-bold text-[10px] uppercase tracking-widest gap-2",
               isComplete ? "bg-emerald-500/20 text-emerald-400" : "bg-primary/20 text-primary"
             )}>
               <div className={cn("w-2 h-2 rounded-full", isComplete ? "bg-emerald-400" : "bg-primary animate-pulse")} />
               {isComplete ? "Negotiation Complete" : `Negotiation Round ${Math.min(currentRound + 1, 3)}/3`}
             </Badge>
          </div>
        </div>

        <div className="p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* SECTION 2: Supplier Agents */}
          <div className="lg:col-span-4 space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4" /> Competing Agents
            </h3>
            {data.rounds[0].suppliers.map((s, idx) => {
              const liveData = currentSuppliers.find(cs => cs.name === s.name);
              const prevData = prevSuppliers?.find(ps => ps.name === s.name);
              const priceDrop = prevData ? prevData.price - (liveData?.price || 0) : 0;

              return (
                <motion.div
                  key={s.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={cn(
                    "p-5 rounded-3xl border transition-all duration-500",
                    isComplete && data.final_decision.winner === s.name 
                      ? "bg-primary/10 border-primary/30 shadow-lg shadow-primary/5" 
                      : "bg-slate-800/30 border-slate-700/50"
                  )}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-white font-bold text-base">{s.name}</h4>
                      <p className="text-[10px] text-slate-500 uppercase font-black tracking-tighter">Supplier Agent #{100 + idx}</p>
                    </div>
                    {isComplete && data.final_decision.winner === s.name && (
                       <Badge className="bg-primary text-white text-[8px] font-black uppercase rounded-lg">Winner</Badge>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Live Offer</span>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          {priceDrop > 0 && (
                            <motion.span 
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="text-emerald-400 text-[10px] font-bold flex items-center"
                            >
                              <TrendingDown className="w-3 h-3 mr-0.5" /> -${priceDrop.toFixed(2)}
                            </motion.span>
                          )}
                          <span className="text-xl font-display font-bold text-white">${liveData?.price || s.price}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-700/30">
                      <div className="space-y-1">
                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Delivery</span>
                        <div className="flex items-center gap-1.5 text-white text-xs font-bold">
                          <Clock className="w-3 h-3 text-slate-400" /> {liveData?.delivery || s.delivery}d
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Reliability</span>
                        <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
                          <ShieldCheck className="w-3 h-3" /> {data.final_decision.reliability}%
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* SECTION 3: Negotiation Timeline */}
          <div className="lg:col-span-8 space-y-6">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4" /> Competition Timeline
            </h3>
            
            <div className="space-y-4">
              <AnimatePresence>
                {roundsToShow.map((r, rIdx) => (
                  <motion.div
                    key={r.round}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative pl-8 border-l-2 border-slate-700/50 pb-4 last:pb-0"
                  >
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-900 border-2 border-primary flex items-center justify-center">
                      <div className="w-1 h-1 rounded-full bg-primary" />
                    </div>
                    
                    <div className="bg-slate-800/20 rounded-2xl p-4 border border-slate-700/30">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">Round {r.round}</span>
                        <span className="text-[9px] text-slate-500 font-medium">Step {rIdx + 1} of 3</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {r.suppliers.map((rs, rsIdx) => {
                          const prevR = data.rounds[rIdx - 1];
                          const prevRS = prevR?.suppliers.find(p => p.name === rs.name);
                          const isPriceDrop = prevRS && rs.price < prevRS.price;

                          return (
                            <div key={rs.name} className="space-y-1">
                              <p className="text-[10px] text-slate-400 font-bold truncate">{rs.name}</p>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-white">${rs.price}</span>
                                {isPriceDrop && <TrendingDown className="w-3 h-3 text-emerald-400" />}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {!isComplete && currentRound < 3 && (
                <div className="relative pl-8 border-l-2 border-slate-700/50 border-dashed">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-900 border-2 border-slate-700 flex items-center justify-center">
                    <div className="w-1 h-1 rounded-full bg-slate-700" />
                  </div>
                  <div className="py-4">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest animate-pulse">
                      Analyzing Round {currentRound + 1} Responses...
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 4: Winner Banner */}
            <AnimatePresence>
              {isComplete && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-8 bg-gradient-to-br from-primary/20 to-emerald-500/10 rounded-[2rem] p-8 border border-primary/20 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Trophy className="w-32 h-32 text-primary" />
                  </div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                        <Trophy className="text-white w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest">Winning Agent Selected</p>
                        <h4 className="text-2xl font-display font-bold text-white">{data.final_decision.winner}</h4>
                      </div>
                    </div>
                    
                    <p className="text-slate-300 text-sm leading-relaxed mb-6 max-w-xl font-medium">
                      {data.final_decision.reason}
                    </p>
                    
                    <div className="flex flex-wrap gap-4">
                      <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl p-4 border border-white/5 flex-1 min-w-[120px]">
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1">Final Price</p>
                        <p className="text-xl font-bold text-white">${data.final_decision.price}</p>
                      </div>
                      <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl p-4 border border-white/5 flex-1 min-w-[120px]">
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1">Lead Time</p>
                        <p className="text-xl font-bold text-white">{data.final_decision.delivery} Days</p>
                      </div>
                      <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl p-4 border border-white/5 flex-1 min-w-[120px]">
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1">Trust Score</p>
                        <div className="flex items-center gap-2">
                           <p className="text-xl font-bold text-emerald-400">{data.final_decision.reliability}%</p>
                           <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-8 flex items-center gap-4">
                      <button className="bg-white text-slate-900 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:scale-105 transition-transform flex items-center gap-2">
                        View Detailed Log <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveDealArena;
