import React from 'react';
import { motion } from 'motion/react';
import { 
  Trophy, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Cpu,
  BarChart3,
  Clock,
  Globe,
  Database
} from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';

interface RecommendationPanelProps {
  recommendation: any;
  reasoning: string[];
  onSelect: () => void;
}

const RecommendationPanel: React.FC<RecommendationPanelProps> = ({ 
  recommendation, 
  reasoning, 
  onSelect 
}) => {
  if (!recommendation) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative group"
    >
      {/* Background Glow */}
      <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-emerald-500/10 to-primary/20 rounded-[32px] blur-xl opacity-50 group-hover:opacity-100 transition-opacity" />
      
      <Card className="relative overflow-hidden border-slate-200 rounded-[32px] bg-white shadow-2xl shadow-slate-200/50">
        {/* Top Accent Bar */}
        <div className="h-2 w-full bg-gradient-to-r from-primary via-emerald-400 to-primary" />
        
        <CardContent className="p-0">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Left Info Section */}
            <div className="lg:col-span-8 p-10 lg:p-12 border-b lg:border-b-0 lg:border-r border-slate-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-primary/10 rounded-lg">
                      <Trophy className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">AI Procurement Recommendation</span>
                  </div>
                  <h2 className="text-4xl font-display font-bold text-slate-900 tracking-tight">{recommendation.name}</h2>
                  <div className="flex items-center gap-6 pt-2">
                    {recommendation.product_image && (
                      <div className="w-16 h-16 rounded-2xl border-2 border-primary/20 overflow-hidden shadow-lg shadow-primary/10">
                        <img src={recommendation.product_image} alt={recommendation.product_title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                          🏆 Optimized Choice
                        </Badge>
                        <div className="flex items-center gap-1 text-slate-400">
                          <Globe className="w-3.5 h-3.5" />
                          <span className="text-xs font-bold">{recommendation.country}</span>
                        </div>
                      </div>
                      <p className="text-xs font-medium text-slate-500 max-w-[400px] truncate">{recommendation.product_title}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-center min-w-[160px]">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Negotiated Price</p>
                  <p className="text-3xl font-black text-slate-900">${recommendation.negotiated_price.toLocaleString()}</p>
                  <p className="text-[9px] text-emerald-600 font-bold uppercase tracking-tighter mt-1">✓ Best Market Value</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <ShieldCheck className="w-3 h-3" /> Trust Score
                  </p>
                  <p className="text-xl font-black text-slate-900">{recommendation.trust_score}%</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Clock className="w-3 h-3" /> Lead Time
                  </p>
                  <p className="text-xl font-black text-slate-900">{recommendation.lead_time_days} Days</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Database className="w-3 h-3" /> Capacity
                  </p>
                  <p className="text-xl font-black text-slate-900">{recommendation.production_capacity.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <BarChart3 className="w-3 h-3" /> Success Rate
                  </p>
                  <p className="text-xl font-black text-slate-900">{recommendation.success_rate}%</p>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">AI Reasoning Analysis:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {reasoning.map((reason, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + (i * 0.1) }}
                      className="flex items-start gap-3 p-3 bg-slate-50/50 rounded-xl border border-slate-100"
                    >
                      <div className="mt-0.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      </div>
                      <span className="text-xs font-medium text-slate-600 leading-tight">{reason}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right CTA Section */}
            <div className="lg:col-span-4 bg-slate-50/50 p-10 lg:p-12 flex flex-col justify-between">
              <div className="space-y-8">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Autonomous Evaluation</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    Our AI has analyzed multi-dimensional data points including historical delivery performance, financial stability, and technical production capacity to determine that <span className="font-bold text-slate-900">{recommendation.name}</span> offers the lowest risk profile for this procurement request.
                  </p>
                </div>

                <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Policy Compliance</span>
                    <Badge className="bg-emerald-500 text-white border-none text-[8px] font-black">100% MATCH</Badge>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Pricing</span>
                      <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">✓ COMPLIANT</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Trust</span>
                      <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">✓ COMPLIANT</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Region</span>
                      <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">✓ COMPLIANT</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-10">
                <Button 
                  onClick={onSelect}
                  className="w-full h-16 bg-slate-900 hover:bg-black text-white rounded-2xl text-lg font-black group relative overflow-hidden transition-all shadow-xl shadow-slate-200"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  Proceed with Supplier
                  <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-2 transition-transform" />
                </Button>
                <p className="text-[9px] text-center text-slate-400 font-bold uppercase tracking-widest mt-4">
                  Manual human decision required to initiate escrow
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default RecommendationPanel;
