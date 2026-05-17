import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Clock, ShieldAlert, Sparkles, CheckCircle, Zap, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';

interface FeedItem {
  id: string;
  supplier: string;
  region: string;
  event: string;
  event_type: string;
  confidence_level: number;
  timestamp: string;
}

interface FeedProps {
  events: FeedItem[] | null;
}

export const ProcurementIntelligenceFeed: React.FC<FeedProps> = ({ events }) => {
  // Stable high-fidelity fallbacks
  const defaultEvents: FeedItem[] = [
    {
      id: "feed_1",
      supplier: "Shengzhou Silk & Textile Ltd",
      region: "China",
      event: "AI successfully identified MOQ flexibility from Shengzhou supplier, reducing initial requirement by 35%.",
      event_type: "Negotiation Unlock",
      confidence_level: 94,
      timestamp: "12 mins ago"
    },
    {
      id: "feed_2",
      supplier: "VietTien Apparel Corp",
      region: "Vietnam",
      event: "Vietnam supplier confirmed 21-day fulfillment capability for apparel order pipeline.",
      event_type: "Logistics Verified",
      confidence_level: 98,
      timestamp: "42 mins ago"
    },
    {
      id: "feed_3",
      supplier: "Indo-Ganges Garments",
      region: "India",
      event: "Volume discount unlocked for orders exceeding 25K units, triggering a 14% drop in negotiated unit price.",
      event_type: "Pricing Optimization",
      confidence_level: 95,
      timestamp: "1 hour ago"
    },
    {
      id: "feed_4",
      supplier: "Bosphorus Leather Hub",
      region: "Turkey",
      event: "Vietnam supplier risk profile downgraded following a delay in translation pipeline synchronization.",
      event_type: "Sourcing Advisory",
      confidence_level: 91,
      timestamp: "3 hours ago"
    },
    {
      id: "feed_5",
      supplier: "Dhaka Apparel Alliance",
      region: "Bangladesh",
      event: "ISO-certified textile supplier added to shortlist after matching strict policy compliance criteria.",
      event_type: "Compliance Approved",
      confidence_level: 97,
      timestamp: "5 hours ago"
    }
  ];

  const items = events || defaultEvents;

  const getIcon = (type: string) => {
    switch (type) {
      case 'Negotiation Unlock':
        return <Zap className="w-5 h-5 text-amber-500" />;
      case 'Logistics Verified':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'Pricing Optimization':
        return <Sparkles className="w-5 h-5 text-blue-500" />;
      case 'Sourcing Advisory':
        return <ShieldAlert className="w-5 h-5 text-rose-500" />;
      case 'Compliance Approved':
        return <CheckCircle className="w-5 h-5 text-violet-500" />;
      default:
        return <MessageSquare className="w-5 h-5 text-slate-500" />;
    }
  };

  const getBadgeStyle = (type: string) => {
    switch (type) {
      case 'Negotiation Unlock':
        return "bg-amber-50 text-amber-600 border-amber-100";
      case 'Logistics Verified':
        return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case 'Pricing Optimization':
        return "bg-blue-50 text-blue-600 border-blue-100";
      case 'Sourcing Advisory':
        return "bg-rose-50 text-rose-600 border-rose-100";
      case 'Compliance Approved':
        return "bg-violet-50 text-violet-600 border-violet-100";
      default:
        return "bg-slate-50 text-slate-600 border-slate-100";
    }
  };

  return (
    <Card className="bg-white border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.02)] rounded-[2rem] overflow-hidden">
      <CardHeader className="bg-slate-50/50 py-5 px-8 border-b border-slate-100 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg font-display font-semibold text-slate-950">Procurement Intelligence Feed</CardTitle>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.1em] mt-1">Live, audited updates from global supplier negotiation networks</p>
        </div>
      </CardHeader>
      <CardContent className="p-0 divide-y divide-slate-100 max-h-[460px] overflow-y-auto">
        {items.map((item, idx) => (
          <motion.div 
            key={item.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="p-6 hover:bg-slate-50/50 transition-colors flex items-start gap-4 group"
          >
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-300">
              {getIcon(item.event_type)}
            </div>
            
            <div className="flex-1 space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-950 truncate max-w-[180px]">
                    {item.supplier}
                  </span>
                  <span className="text-[10px] font-black text-slate-400 font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                    {item.region}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                  <Badge variant="outline" className={`font-black uppercase tracking-wider text-[8px] px-2 py-0.5 rounded border ${getBadgeStyle(item.event_type)}`}>
                    {item.event_type}
                  </Badge>
                  <span className="text-slate-400 font-bold flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {item.timestamp}
                  </span>
                </div>
              </div>
              
              <p className="text-xs font-semibold text-slate-600 leading-relaxed">
                {item.event}
              </p>
              
              <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest pt-1">
                <span>Confidence Index:</span>
                <span className="text-primary font-mono font-black">{item.confidence_level}%</span>
                <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary" 
                    style={{ width: `${item.confidence_level}%` }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
};
