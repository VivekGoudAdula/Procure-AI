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
              
              <CardContent className="p-4 pt-10 flex flex-col flex-1">
                <div className="space-y-4 flex-1">
                  {/* 1. Header: Image, Name & Price */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 shadow-inner overflow-hidden">
                      {rec.product_image ? (
                        <img src={rec.product_image} alt={rec.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-6 h-6 text-slate-300" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[13px] font-display font-bold text-slate-950 tracking-tight truncate leading-tight">{rec.name}</h3>
                      <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                        <Globe className="w-2.5 h-2.5" /> {rec.country}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex items-baseline justify-end gap-0.5">
                        <span className="text-xl font-display font-black tracking-tighter bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">
                          ${rec.negotiated_price}
                        </span>
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">/U</span>
                      </div>
                      <p className="text-[7px] font-black text-emerald-500/70 uppercase tracking-widest -mt-1">Best Quote</p>
                    </div>
                  </div>

                  {/* 2. Compact Stats Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                      <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Trust Index</span>
                      <span className="text-[11px] font-black text-slate-900">{rec.trust_score}%</span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                      <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Lead Time</span>
                      <span className="text-[11px] font-black text-slate-900">{rec.lead_time_days}d</span>
                    </div>
                  </div>

                  {/* 3. Secondary Stats Row */}
                  <div className="flex items-center justify-between px-1 py-0.5 border-t border-slate-50 pt-2">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5 text-blue-500" />
                        <span className="text-[8px] font-bold text-slate-500">Verified</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Zap className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                        <span className="text-[8px] font-bold text-slate-500">{rec.success_rate}% Success</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[7px] font-black bg-emerald-50 text-emerald-600 border-emerald-100 py-0 h-4">
                      POLICY MATCH
                    </Badge>
                  </div>
                </div>

                <div className="mt-4">
                  <Button 
                    onClick={() => onSelect(rec)}
                    className="w-full h-9 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all bg-primary text-white shadow-lg shadow-primary/10 hover:bg-primary/90 hover:scale-[1.02]"
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
