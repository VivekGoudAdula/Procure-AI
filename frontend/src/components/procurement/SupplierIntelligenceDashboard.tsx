import React from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  ShieldCheck, 
  Truck, 
  Layers, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Globe,
  Database,
  Cpu,
  ArrowRight,
  Shield
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import SupplierComparisonTable from './SupplierComparisonTable';
import RecommendationPanel from './RecommendationPanel';
import SummaryHeader from './SummaryHeader';

interface SupplierIntelligenceDashboardProps {
  data: {
    suppliers: any[];
    recommended_supplier: any;
    procurement_analysis: any;
    rejected_suppliers: any[];
  };
  onSelectSupplier: (supplier: any) => void;
  requestDetails: {
    product_name: string;
    quantity: number;
    budget: number;
    shipping_region: string;
  };
}

const SupplierIntelligenceDashboard: React.FC<SupplierIntelligenceDashboardProps> = ({ 
  data, 
  onSelectSupplier,
  requestDetails
}) => {
  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-20 px-4">
      {/* 1. PROCUREMENT SUMMARY HEADER */}
      <SummaryHeader 
        details={requestDetails} 
        analysis={data.procurement_analysis} 
      />

      {/* 2. AI RECOMMENDATION PANEL */}
      <RecommendationPanel 
        recommendation={data.recommended_supplier} 
        reasoning={data.procurement_analysis.recommendation_reasoning}
        onSelect={() => onSelectSupplier(data.recommended_supplier)}
      />

      {/* 3. SUPPLIER COMPARISON TABLE */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-900 rounded-lg">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Supplier Intelligence Matrix</h2>
              <p className="text-xs text-slate-500 font-medium">Real-time evaluation of {data.suppliers.length} eligible suppliers</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">
              {data.procurement_analysis.total_scanned} Scanned
            </Badge>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200">
              {data.procurement_analysis.eligible_count} Eligible
            </Badge>
          </div>
        </div>

        <SupplierComparisonTable 
          suppliers={data.suppliers} 
          onSelect={onSelectSupplier} 
        />
      </div>

      {/* 4. NEGOTIATION & ADVISORY PANEL */}
      {data.suppliers.filter(s => s.has_deviations).length > 0 && (
        <div className="pt-8 border-t border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-amber-50 rounded-lg">
              <AlertCircle className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Procurement Negotiation Required</h2>
              <p className="text-xs text-slate-500 font-medium">Suppliers with policy deviations requiring AI agent negotiation</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.suppliers.filter(s => s.has_deviations).map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-4 bg-slate-50 border border-slate-100 rounded-2xl group hover:border-amber-200 transition-all"
              >
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-bold text-slate-700 truncate max-w-[150px]">{s.name}</h4>
                  <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-none text-[8px] font-black uppercase">Negotiation Possible</Badge>
                </div>
                <div className="space-y-1.5">
                  {s.deviations.map((d: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-1.5">
                      <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5" />
                      <p className="text-[10px] text-slate-500 leading-tight font-medium">{d}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200/50 flex justify-between items-center">
                  <span className="text-[9px] font-black text-slate-400 uppercase">Trust Index: {s.trust_score}%</span>
                  <Button variant="ghost" className="h-6 px-2 text-[9px] font-bold text-amber-600 hover:text-amber-700 hover:bg-amber-50" onClick={() => onSelectSupplier(s)}>
                    Start AI Negotiation
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* 5. LIVE PROCUREMENT STATUS FOOTER */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
        <motion.div 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 p-2 px-6 rounded-full shadow-2xl flex items-center gap-6"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] font-bold text-white uppercase tracking-widest">Intelligence Complete</span>
          </div>
          <div className="w-[1px] h-4 bg-slate-700" />
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] font-bold text-white uppercase tracking-widest">Trust Evaluation Complete</span>
          </div>
          <div className="w-[1px] h-4 bg-slate-700" />
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] font-bold text-white uppercase tracking-widest">Policy Validated</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SupplierIntelligenceDashboard;
