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
import { Badge } from '../ui/badge';
import SupplierComparisonTable from './SupplierComparisonTable';
import RecommendationPanel from './RecommendationPanel';
import MultilingualNegotiationTerminal from './MultilingualNegotiationTerminal';

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

      {/* 2. SUPPLIER COMPARISON TABLE */}
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
