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
  has_deviations?: boolean;
  trade_assurance?: boolean;
  verified?: boolean;
}

interface SupplierComparisonTableProps {
  suppliers: Supplier[];
  onSelect: (supplier: Supplier) => void;
}

const SupplierComparisonTable: React.FC<SupplierComparisonTableProps> = ({ suppliers, onSelect }) => {
  return (
    <div className="w-full overflow-hidden border border-slate-200 rounded-2xl bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-[9px] font-bold uppercase tracking-wider border-b border-slate-200">
              <th className="py-3 px-5 font-semibold">Supplier & Product</th>
              <th className="py-3 px-3 font-semibold">Region</th>
              <th className="py-3 px-3 font-semibold text-center">MOQ</th>
              <th className="py-3 px-3 font-semibold text-center">Lead Time</th>
              <th className="py-3 px-3 font-semibold text-center">Trust Index</th>
              <th className="py-3 px-3 font-semibold text-center">Success Rate</th>
              <th className="py-3 px-3 font-semibold">Verification</th>
              <th className="py-3 px-3 font-semibold text-right">Negotiated Price</th>
              <th className="py-3 px-5 font-semibold text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {suppliers.map((s, i) => (
              <motion.tr
                key={s.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group hover:bg-slate-50 transition-all cursor-default"
              >
                <td className="py-3 px-5">
                  <div className="flex items-center gap-3">
                    {s.product_image && (
                      <div className="w-8 h-8 rounded-lg border border-slate-200 overflow-hidden shrink-0 bg-slate-50">
                        <img src={s.product_image} alt={s.product_title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-slate-900 group-hover:text-primary transition-colors truncate">{s.name}</span>
                        {s.has_deviations && (
                          <AlertCircle className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                        )}
                      </div>
                      <span className="text-[9px] text-slate-500 font-medium truncate max-w-[150px]">{s.product_title || s.language + ' Support Enabled'}</span>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-3">
                  <div className="flex items-center gap-1">
                    <Globe className="w-3 h-3 text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-600">{s.country}</span>
                  </div>
                </td>
                <td className="py-3 px-3 text-center">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold text-slate-900">{s.moq}</span>
                    {s.moq > 50 && (
                      <Badge className="bg-amber-50 text-amber-700 border-none text-[7px] font-black uppercase px-1 py-0 rounded">Negotiable</Badge>
                    )}
                  </div>
                </td>
                <td className="py-3 px-3 text-center">
                  <div className="flex flex-col items-center">
                    <span className={cn(
                      "text-[10px] font-bold",
                      s.lead_time_days <= 10 ? "text-emerald-600" : "text-slate-900"
                    )}>
                      {s.lead_time_days}d
                    </span>
                    <span className="text-[7px] text-slate-400 font-black uppercase tracking-tighter">Est. Delivery</span>
                  </div>
                </td>
                <td className="py-3 px-3">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${s.trust_score}%` }}
                        className={cn(
                          "h-full rounded-full",
                          s.trust_score >= 90 ? "bg-emerald-500" : s.trust_score >= 80 ? "bg-amber-500" : "bg-red-500"
                        )}
                      />
                    </div>
                    <span className="text-[9px] font-bold text-slate-900">{s.trust_score}%</span>
                  </div>
                </td>
                <td className="py-3 px-3 text-center">
                  <Badge variant="outline" className={cn(
                    "font-black text-[8px] border-none px-1.5 py-0 rounded-md",
                    s.success_rate >= 95 ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-600"
                  )}>
                    {s.success_rate}%
                  </Badge>
                </td>
                <td className="py-3 px-3">
                  {s.trade_assurance ? (
                    <div className="flex items-center gap-1">
                      <div className="p-0.5 bg-amber-50 rounded">
                        <ShieldCheck className="w-3 h-3 text-amber-500" />
                      </div>
                      <span className="text-[7px] font-black text-amber-600 uppercase tracking-tighter leading-none">Trade Assurance</span>
                    </div>
                  ) : s.verified ? (
                    <div className="flex items-center gap-1">
                      <div className="p-0.5 bg-emerald-50 rounded">
                        <ShieldCheck className="w-3 h-3 text-emerald-500" />
                      </div>
                      <span className="text-[7px] font-black text-emerald-600 uppercase tracking-tighter leading-none">Verified Supplier</span>
                    </div>
                  ) : (
                    <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter leading-none">Standard Supplier</span>
                  )}
                </td>
                <td className="py-3 px-3 text-right">
                  <div className="flex flex-col items-end">
                    <span className="text-[11px] font-bold text-slate-900">${s.negotiated_price.toLocaleString()}</span>
                    <span className="text-[7px] text-emerald-600 font-black uppercase tracking-widest">-12% NEGOTIATED</span>
                  </div>
                </td>
                <td className="py-3 px-5 text-center">
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => onSelect(s)}
                    className="h-7 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg transition-all group/btn"
                  >
                    <span className="text-[9px] font-black uppercase tracking-widest mr-1.5">Proceed</span>
                    <ChevronRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
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
