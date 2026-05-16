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
  Database,
  Layers,
  MessageSquare,
  Truck,
  DollarSign,
  UserCheck,
  Check
} from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';

interface RecommendationPanelProps {
  recommendations: any[];
  reasoning: string[];
  onSelect: (supplier: any) => void;
}

const RecommendationPanel: React.FC<RecommendationPanelProps> = ({ 
  recommendations, 
  reasoning, 
  onSelect 
}) => {
  if (!recommendations || recommendations.length === 0) return null;

  // Take top 3 recommendations
  const topRecommendations = recommendations.slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Trophy className="w-3.5 h-3.5 text-primary" />
            <span className="text-[9px] uppercase font-black tracking-[0.2em] text-primary/70">Intelligence Leaderboard</span>
          </div>
          <h2 className="text-xl font-display font-bold tracking-tight text-slate-950">Top Procurement Picks</h2>
          <p className="text-slate-500 max-w-2xl font-medium text-[10px] uppercase tracking-wider">
            AI-Ranked based on trust, resilience, and negotiation delta.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {topRecommendations.map((rec, idx) => (
          <motion.div
            key={rec.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="flex"
          >
            <Card className="relative overflow-hidden rounded-[1.5rem] bg-white border border-primary/20 shadow-lg shadow-primary/5 flex flex-col w-full transition-all hover:shadow-xl hover:shadow-primary/10">
              {/* Top Gradient Line */}
              <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-primary via-emerald-400 to-primary" />

              {/* Rank Badge */}
              <div className="absolute top-0 left-0 p-3">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black border bg-primary text-white border-primary">
                  #{idx + 1}
                </div>
              </div>

              <div className="absolute top-0 right-0 p-3">
                <Badge className="bg-emerald-50 text-emerald-600 border-none text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5">MATCHED</Badge>
              </div>
              
              <CardContent className="p-5 pt-10 flex flex-col flex-1">
                <div className="space-y-4 flex-1">
                  {/* Supplier Info */}
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto shadow-inner overflow-hidden">
                      {rec.product_image ? (
                        <img src={rec.product_image} alt={rec.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-6 h-6 text-slate-300" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-[13px] font-display font-bold text-slate-950 tracking-tight line-clamp-1">{rec.name}</h3>
                      <div className="flex items-center justify-center gap-1.5 text-[9px] font-bold text-slate-500">
                        <Globe className="w-2.5 h-2.5" /> {rec.country}
                      </div>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="p-3 bg-slate-50 rounded-xl text-center border border-slate-100/50">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Negotiated Price</p>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-2xl font-display font-black text-slate-950">${rec.negotiated_price}</span>
                      <span className="text-[8px] font-black text-emerald-600 uppercase tracking-tighter">/ Unit</span>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3 border-y border-slate-50 py-3">
                    <div className="space-y-0.5">
                      <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Trust Index</p>
                      <p className="text-xs font-black text-slate-900">{rec.trust_score}%</p>
                    </div>
                    <div className="space-y-0.5 text-right">
                      <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Lead Time</p>
                      <p className="text-xs font-black text-slate-900">{rec.lead_time_days}d</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Capacity</p>
                      <p className="text-xs font-black text-slate-900">VERIFIED</p>
                    </div>
                    <div className="space-y-0.5 text-right">
                      <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Success</p>
                      <p className="text-xs font-black text-emerald-600">{rec.success_rate}%</p>
                    </div>
                  </div>

                  {/* AI Reasoning (Vertical List) */}
                  <div className="space-y-1.5">
                    {(rec.reasons || ["Optimal logistics risk", "Verified capacity"]).slice(0, 2).map((reason: string, i: number) => (
                      <div key={i} className="flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-100 rounded-md">
                        <Check className="w-2 h-2 text-emerald-500" />
                        <span className="text-[8px] font-bold text-slate-500 truncate">{reason}</span>
                      </div>
                    ))}
                  </div>

                  {/* Policy Match Small */}
                  <div className="flex items-center justify-between p-2 bg-emerald-50/50 rounded-lg border border-emerald-100/50">
                    <span className="text-[8px] font-black text-emerald-700 uppercase">Policy Compliance</span>
                    <span className="text-[8px] font-black text-emerald-600 flex items-center gap-0.5">
                      <Check className="w-2.5 h-2.5" /> 100%
                    </span>
                  </div>
                </div>

                <div className="mt-5 space-y-2">
                  <Button 
                    onClick={() => onSelect(rec)}
                    className="w-full h-9 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all bg-slate-950 text-white shadow-lg shadow-slate-200 hover:scale-[1.02]"
                  >
                    Select Option <ArrowRight className="ml-1.5 w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default RecommendationPanel;
