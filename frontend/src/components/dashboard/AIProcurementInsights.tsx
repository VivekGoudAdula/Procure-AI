import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Sparkles, Compass, ShieldCheck, DollarSign, Clock, Zap } from 'lucide-react';
import { motion } from 'motion/react';

interface InsightItem {
  id: string;
  title: string;
  description: string;
  category: string;
  impact: string;
  recommendation: string;
}

interface SourcingSignals {
  fastest_sourcing_region: { region: string; avg_delivery: string; confidence_level: number };
  lowest_pricing_region: { region: string; avg_price_index: string; confidence_level: number };
  highest_trust_region: { region: string; verification_rate: string; confidence_level: number };
  strongest_negotiation_region: { region: string; avg_savings: string; confidence_level: number };
  lowest_delivery_risk_region: { region: string; ontime_delivery: string; confidence_level: number };
}

interface InsightsProps {
  insights: InsightItem[] | null;
  signals: SourcingSignals | null;
}

export const AIProcurementInsights: React.FC<InsightsProps> = ({ insights, signals }) => {
  // Stable out-of-the-box fallbacks
  const defaultInsights: InsightItem[] = [
    {
      id: "ins_1",
      title: "East Asian Sourcing Correction",
      description: "Textile supplier pricing decreased 8% across East Asia as production capacity stabilizes.",
      category: "Pricing Index",
      impact: "High Impact",
      recommendation: "Leverage active negotiation sessions to lock in long-term apparel supply contracts."
    },
    {
      id: "ins_2",
      title: "Fulfillment Speed Leadership",
      description: "Vietnam suppliers currently outperform China by 25% in fulfillment speed for apparel and textile sourcing.",
      category: "Logistics Audit",
      impact: "Medium Impact",
      recommendation: "Shift critical speed-to-market orders to qualified Vietnamese suppliers."
    },
    {
      id: "ins_3",
      title: "MOQ Flexibility Dynamics",
      description: "MOQ flexibility is highest among suppliers offering long-term procurement commitments rather than spot purchases.",
      category: "Negotiation Intel",
      impact: "High Impact",
      recommendation: "Utilize x402 commitments to trigger automated 15% MOQ reductions."
    },
    {
      id: "ins_4",
      title: "Fulfillment Confidence Anchor",
      description: "Suppliers with SGS or Bureau Veritas third-party verification demonstrate a 24% higher fulfillment compliance rate.",
      category: "Risk Control",
      impact: "High Impact",
      recommendation: "Prioritize Alibaba Verified and Gold status partners in RFQ routing lists."
    }
  ];

  const defaultSignals: SourcingSignals = {
    fastest_sourcing_region: { region: 'Vietnam', avg_delivery: '9 days', confidence_level: 94 },
    lowest_pricing_region: { region: 'Bangladesh', avg_price_index: '$9.40/unit', confidence_level: 88 },
    highest_trust_region: { region: 'Turkey', verification_rate: '91% verified', confidence_level: 96 },
    strongest_negotiation_region: { region: 'China', avg_savings: '22.4%', confidence_level: 95 },
    lowest_delivery_risk_region: { region: 'Vietnam', ontime_delivery: '98.2%', confidence_level: 93 }
  };

  const list = insights || defaultInsights;
  const sig = signals || defaultSignals;

  return (
    <div className="space-y-6">
      {/* Real-Time Sourcing Signals Widget */}
      <Card className="bg-slate-900 border-none relative overflow-hidden rounded-[2rem] shadow-xl text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full -mr-32 -mt-32 blur-[100px]" />
        <CardContent className="p-8 relative z-10 space-y-6">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 shadow-2xl">
              <Compass className="text-white w-5.5 h-5.5" />
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Active Signals</span>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-display font-bold text-white">Global Procurement Signals</h3>
            <p className="text-white/40 text-xs mt-1">Calculated operational leadership from active supplier pipelines</p>
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between text-xs border-b border-white/5 pb-2">
              <span className="text-white/55 font-bold flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-primary" /> Fastest Sourcing Hub</span>
              <span className="text-white font-black">{sig.fastest_sourcing_region.region} ({sig.fastest_sourcing_region.avg_delivery})</span>
            </div>
            <div className="flex items-center justify-between text-xs border-b border-white/5 pb-2">
              <span className="text-white/55 font-bold flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Lowest Cost Sourcing</span>
              <span className="text-white font-black">{sig.lowest_pricing_region.region} ({sig.lowest_pricing_region.avg_price_index})</span>
            </div>
            <div className="flex items-center justify-between text-xs border-b border-white/5 pb-2">
              <span className="text-white/55 font-bold flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-violet-400" /> Highest Verification Index</span>
              <span className="text-white font-black">{sig.highest_trust_region.region} ({sig.highest_trust_region.verification_rate})</span>
            </div>
            <div className="flex items-center justify-between text-xs pb-1">
              <span className="text-white/55 font-bold flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-amber-400" /> Maximum Pricing Leverage</span>
              <span className="text-white font-black">{sig.strongest_negotiation_region.region} ({sig.strongest_negotiation_region.avg_savings} savings)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sourcing Insights Panel */}
      <Card className="bg-white border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.02)] rounded-[2rem] overflow-hidden">
        <CardHeader className="py-5 px-8 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <CardTitle className="text-sm font-black text-slate-900 uppercase tracking-wider">AI Procurement Insights</CardTitle>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Autonomous sourcing intelligence derived from live supplier data</p>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {list.map((ins, idx) => (
            <motion.div 
              key={ins.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              className="space-y-2 border-b border-slate-100 pb-4 last:border-none last:pb-0 group"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-black text-slate-900 group-hover:text-primary transition-colors">
                  {ins.title}
                </span>
                <Badge variant="outline" className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded border bg-slate-50 border-slate-200 text-slate-500">
                  {ins.category}
                </Badge>
              </div>
              <p className="text-xs font-semibold text-slate-500 leading-relaxed">
                {ins.description}
              </p>
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 text-[10px] font-semibold text-slate-600">
                <span className="font-black text-slate-950 uppercase tracking-widest block mb-0.5">Actionable Recommendation</span>
                {ins.recommendation}
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
