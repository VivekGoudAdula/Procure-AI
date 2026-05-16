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
  Shield,
  Zap
} from 'lucide-react';
import { Badge } from '../ui/badge';
import SupplierComparisonTable from './SupplierComparisonTable';
import RecommendationPanel from './RecommendationPanel';
import MultilingualNegotiationTerminal from './MultilingualNegotiationTerminal';
import ProcurementMessageEngine from './ProcurementMessageEngine';

interface SupplierIntelligenceDashboardProps {
  data: {
    suppliers: any[];
    recommended_suppliers: any[];
    procurement_analysis: any;
    rejected_suppliers: any[];
  };
  onSelectSupplier: (supplier: any) => void;
  requestDetails: {
    product_name: string;
    quantity: number;
    budget: number;
    shipping_region: string;
    lead_time: string;
    custom_requirements: string;
  };
}

const SupplierIntelligenceDashboard: React.FC<SupplierIntelligenceDashboardProps> = ({ 
  data, 
  onSelectSupplier,
  requestDetails
}) => {
  // Robustly determine top 3 recommendations (fallback to top 3 suppliers if needed)
  const recommendations = data.recommended_suppliers?.length > 0 
    ? data.recommended_suppliers 
    : data.suppliers?.slice(0, 3) || [];

  // Exclude the recommendations from the table list
  const tableSuppliers = data.suppliers?.filter(s => 
    !recommendations.some((r: any) => r.id === s.id)
  ) || [];

  return (
    <div className="space-y-6 pb-20 mt-2">
      {/* 1. AI RECOMMENDATION PANEL (HERO) */}
      <RecommendationPanel 
        recommendations={recommendations} 
        reasoning={data.procurement_analysis?.recommendation_reasoning || []}
        onSelect={(supplier) => onSelectSupplier(supplier)}
      />

      {/* 2. AI SOURCING STRATEGY OVERVIEW */}
      <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-slate-200">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Cpu className="w-32 h-32 text-emerald-400" />
        </div>
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-xl border border-emerald-500/30">
              <Zap className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold">AI Sourcing Strategy Activated</h3>
              <p className="text-emerald-400/70 text-[10px] font-black uppercase tracking-widest">Autonomous Negotiation & Localization Layer Ready</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol</p>
              <p className="text-sm font-medium">Multi-Region Sourcing Optimization</p>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inquiry Status</p>
              <p className="text-sm font-medium">Structured & Ready for Transmission</p>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recommended Action</p>
              <p className="text-sm font-medium text-emerald-400">Select a supplier below to initiate localized communication</p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. SUPPLIER COMPARISON TABLE */}
      <div className="space-y-3 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-slate-100 rounded-lg border border-slate-200">
              <Database className="w-4 h-4 text-slate-700" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Supplier Intelligence Matrix</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Global Scan results excluding top matches</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100 border-none text-[8px] font-black uppercase tracking-widest px-2 py-0.5">
              {data.procurement_analysis?.total_scanned || 0} Total
            </Badge>
            <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-none text-[8px] font-black uppercase tracking-widest px-2 py-0.5">
              {tableSuppliers.length} Listed
            </Badge>
          </div>
        </div>

        <SupplierComparisonTable 
          suppliers={tableSuppliers} 
          onSelect={onSelectSupplier} 
        />
      </div>

    </div>
  );
};

export default SupplierIntelligenceDashboard;
