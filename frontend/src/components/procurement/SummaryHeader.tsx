import React from 'react';
import { 
  Layers, 
  DollarSign, 
  Clock, 
  Globe, 
  Shield, 
  CheckCircle2,
  Package
} from 'lucide-react';
import { Badge } from '../ui/badge';

interface SummaryHeaderProps {
  details: {
    product_name: string;
    quantity: number;
    budget: number;
    shipping_region: string;
  };
  analysis: any;
}

const SummaryHeader: React.FC<SummaryHeaderProps> = ({ details, analysis }) => {
  return (
    <div className="bg-[#0D1117] border border-slate-800 rounded-3xl p-8 relative overflow-hidden shadow-2xl">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl -z-10" />
      
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center shadow-inner">
            <Package className="w-8 h-8 text-emerald-500" />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Procurement Initiative [PRO-INT-4.0]</p>
            <h1 className="text-3xl font-display font-bold text-white tracking-tight">
              {details.product_name}
            </h1>
            <div className="flex items-center gap-4 pt-1">
              <div className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-xs font-bold text-slate-400">{details.quantity} Units</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-slate-700" />
              <div className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-xs font-bold text-slate-400">{details.shipping_region} Fulfillment</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-8 bg-slate-900/50 backdrop-blur-sm p-6 rounded-2xl border border-slate-800 shadow-xl">
          <div className="space-y-1">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Target Budget</p>
            <p className="text-lg font-black text-emerald-500">${details.budget.toLocaleString()}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Policy Engine</p>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-xs font-bold text-emerald-400">ACTIVE</span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Trust Layer</p>
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-bold text-primary tracking-widest">ALGORAND</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryHeader;
