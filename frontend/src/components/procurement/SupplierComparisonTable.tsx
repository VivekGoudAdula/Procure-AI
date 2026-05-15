import React from 'react';
import { motion } from 'motion/react';
import { 
  ShieldCheck, 
  Globe, 
  Clock, 
  Layers, 
  TrendingUp, 
  ArrowRight,
  ExternalLink,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

interface Supplier {
  id: number;
  name: string;
  product_title?: string;
  product_image?: string;
  country: string;
  moq: number;
  lead_time_days: number;
  production_capacity: number;
  trust_score: number;
  success_rate: number;
  language: string;
  negotiated_price: number;
  on_chain_verified: boolean;
  shipping_region: string;
}

interface SupplierComparisonTableProps {
  suppliers: Supplier[];
  onSelect: (supplier: Supplier) => void;
}

const SupplierComparisonTable: React.FC<SupplierComparisonTableProps> = ({ suppliers, onSelect }) => {
  return (
    <div className="w-full overflow-hidden border border-slate-200 rounded-3xl bg-white shadow-xl shadow-slate-200/50">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900 text-slate-300 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-800">
              <th className="py-5 px-6 font-black">Supplier & Product</th>
              <th className="py-5 px-4 font-black">Region</th>
              <th className="py-5 px-4 font-black text-center">MOQ</th>
              <th className="py-5 px-4 font-black text-center">Lead Time</th>
              <th className="py-5 px-4 font-black text-center">Trust Index</th>
              <th className="py-5 px-4 font-black text-center">Success Rate</th>
              <th className="py-5 px-4 font-black">Verification</th>
              <th className="py-5 px-4 font-black text-right">Negotiated Price</th>
              <th className="py-5 px-6 font-black text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {suppliers.map((s, i) => (
              <motion.tr
                key={s.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group hover:bg-slate-50/80 transition-all cursor-default"
              >
                <td className="py-5 px-6">
                  <div className="flex items-center gap-4">
                    {s.product_image && (
                      <div className="w-12 h-12 rounded-xl border border-slate-100 overflow-hidden shrink-0 bg-slate-50">
                        <img src={s.product_image} alt={s.product_title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors truncate">{s.name}</span>
                        {s.has_deviations && (
                          <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium truncate max-w-[200px]">{s.product_title || s.language + ' Support Enabled'}</span>
                    </div>
                  </div>
                </td>
                <td className="py-5 px-4">
                  <div className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs font-bold text-slate-600">{s.country}</span>
                  </div>
                </td>
                <td className="py-5 px-4 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs font-black text-slate-700">{s.moq}</span>
                    {s.moq > 50 && (
                      <Badge className="bg-amber-50 text-amber-700 border-none text-[7px] font-black uppercase px-1">Negotiable</Badge>
                    )}
                  </div>
                </td>
                <td className="py-5 px-4 text-center">
                  <div className="flex flex-col items-center">
                    <span className={cn(
                      "text-xs font-black",
                      s.lead_time_days <= 10 ? "text-emerald-600" : "text-slate-700"
                    )}>
                      {s.lead_time_days}d
                    </span>
                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter">Est. Delivery</span>
                  </div>
                </td>
                <td className="py-5 px-4">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${s.trust_score}%` }}
                        className={cn(
                          "h-full rounded-full",
                          s.trust_score >= 90 ? "bg-emerald-500" : s.trust_score >= 80 ? "bg-amber-500" : "bg-rose-500"
                        )}
                      />
                    </div>
                    <span className="text-[10px] font-black text-slate-900">{s.trust_score}%</span>
                  </div>
                </td>
                <td className="py-5 px-4 text-center">
                  <Badge variant="outline" className={cn(
                    "font-black text-[9px] border-none px-2",
                    s.success_rate >= 95 ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-600"
                  )}>
                    {s.success_rate}%
                  </Badge>
                </td>
                <td className="py-5 px-4">
                  {s.trade_assurance ? (
                    <div className="flex items-center gap-1.5">
                      <div className="p-1 bg-amber-50 rounded-md">
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                      </div>
                      <span className="text-[8px] font-black text-amber-700 uppercase tracking-tighter leading-none">Trade Assurance</span>
                    </div>
                  ) : s.verified ? (
                    <div className="flex items-center gap-1.5">
                      <div className="p-1 bg-emerald-50 rounded-md">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      <span className="text-[8px] font-black text-emerald-700 uppercase tracking-tighter leading-none">Verified Supplier</span>
                    </div>
                  ) : (
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter leading-none">Standard Supplier</span>
                  )}
                </td>
                <td className="py-5 px-4 text-right">
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-black text-slate-900">${s.negotiated_price.toLocaleString()}</span>
                    <span className="text-[8px] text-emerald-600 font-bold uppercase tracking-widest">-12% NEGOTIATED</span>
                  </div>
                </td>
                <td className="py-5 px-6">
                  <div className="flex items-center justify-center gap-2">
                    <Button 
                      size="icon" 
                      variant="outline"
                      className="w-8 h-8 rounded-lg border-slate-200 text-slate-400 hover:text-primary hover:border-primary/30 transition-all"
                      title="View Intelligence"
                    >
                      <Layers className="w-3.5 h-3.5" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="outline"
                      className="w-8 h-8 rounded-lg border-slate-200 text-slate-400 hover:text-primary hover:border-primary/30 transition-all"
                      title="Compare"
                    >
                      <TrendingUp className="w-3.5 h-3.5" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => onSelect(s)}
                      className="h-8 px-3 hover:bg-slate-900 hover:text-white rounded-lg transition-all group/btn"
                    >
                      <span className="text-[10px] font-black uppercase tracking-widest mr-2">Proceed</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SupplierComparisonTable;
