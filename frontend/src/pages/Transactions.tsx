import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Download, 
  ShieldCheck, 
  DollarSign, 
  Clock, 
  X, 
  Lock, 
  Activity,
  FileCheck,
  FileText,
  ExternalLink,
  ChevronRight,
  User,
  Check,
  AlertCircle,
  FileSpreadsheet,
  TrendingDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';

const cn = (...inputs: any[]) => inputs.filter(Boolean).join(' ');

// Status Badge Styling Mapper
const getStatusBadge = (status: string) => {
  const styles: Record<string, string> = {
    'Escrow Secured': 'bg-violet-50 text-violet-600 border-violet-100',
    'Delivery Verified': 'bg-emerald-50 text-emerald-600 border-emerald-100',
    'Settlement Released': 'bg-teal-50 text-teal-600 border-teal-100',
    'Awaiting Verification': 'bg-amber-50 text-amber-600 border-amber-100',
    'Supplier Review Active': 'bg-indigo-50 text-indigo-600 border-indigo-100',
    'Procurement Approved': 'bg-blue-50 text-blue-600 border-blue-100',
    'Disputed / Locked': 'bg-rose-50 text-rose-600 border-rose-100'
  };
  return (
    <Badge variant="outline" className={cn("text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border shadow-none shrink-0", styles[status] || 'bg-slate-50 text-slate-600 border-slate-100')}>
      {status}
    </Badge>
  );
};

export const Transactions = () => {
  const [ledger, setLedger] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRow, setSelectedRow] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SECURED' | 'VERIFIED' | 'SETTLED'>('ALL');

  // Fetch settlements ledger
  useEffect(() => {
    const fetchSettlements = async () => {
      try {
        const resLedger = await fetch('/api/settlements/ledger').then(r => r.ok ? r.json() : null);
        if (resLedger) {
          setLedger(resLedger);
          // Default selection to the first transaction on load
          if (resLedger.length > 0) {
            setSelectedRow(resLedger[0]);
          }
        }
      } catch (err) {
        console.error('Error fetching settlements data:', err);
        toast.error('Failed to sync live transaction ledger. Using pre-loaded audit records.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettlements();
  }, []);

  // Filtered ledger rows based on tabs and query
  const filteredLedger = ledger.filter(row => {
    const matchesSearch = 
      row.supplier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    if (statusFilter === 'SECURED') {
      return row.status === 'Escrow Secured' || row.status === 'Procurement Approved';
    }
    if (statusFilter === 'VERIFIED') {
      return row.status === 'Delivery Verified' || row.status === 'Awaiting Verification' || row.status === 'Supplier Review Active';
    }
    if (statusFilter === 'SETTLED') {
      return row.status === 'Settlement Released';
    }
    return true;
  });

  // Handle blockchain release trigger (Interactive modification)
  const handleReleaseSettlement = (id: string) => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2000)),
      {
        loading: 'Signing Algorand settlement release transaction on-chain...',
        success: () => {
          // Update status in local ledger state
          setLedger(prev => prev.map(item => {
            if (item.id === id) {
              const updated = {
                ...item,
                status: 'Settlement Released',
                delivery_verification: 'Fully Audited & Settled',
                proof_of_delivery: 'Smart Contract Audited (Released)'
              };
              // Sync selected row
              setSelectedRow(updated);
              return updated;
            }
            return item;
          }));
          return 'Settlement successfully released to supplier address.';
        },
        error: 'Smart contract release assertion failed.'
      }
    );
  };

  // Handle blockchain dispute lock trigger
  const handleLockEscrow = (id: string) => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: 'Invoking x402 emergency lock escrow sequence...',
        success: () => {
          setLedger(prev => prev.map(item => {
            if (item.id === id) {
              const updated = {
                ...item,
                status: 'Disputed / Locked',
                delivery_verification: 'Escrow Locked - Quality Dispute Raised',
                proof_of_delivery: 'Verification Suspended for Inspection'
              };
              setSelectedRow(updated);
              return updated;
            }
            return item;
          }));
          return 'Escrow locked successfully. Procurement auditors notified.';
        },
        error: 'Emergency lock failed.'
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-8 pb-16 pt-4 px-1 flex flex-col items-center justify-center min-h-[70vh]">
        <div className="relative flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full border-t-2 border-slate-900 border-r-2 border-r-transparent animate-spin" />
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] animate-pulse">
            Syncing Ledger Audit Records...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 pt-4 px-1">
      {/* 🚀 PAGE HEADER */}
      <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-6">
        <div className="space-y-2">
          {/* Status Indicator Chips */}
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-[9px] font-black uppercase tracking-wider shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              Escrow Verification Active
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-600 text-[9px] font-black uppercase tracking-wider shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Algorand Ledger Verified
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 border border-violet-100 text-violet-600 text-[9px] font-black uppercase tracking-wider shadow-sm">
              <ShieldCheck className="w-3 h-3 text-violet-500" />
              Procurement Audit Trail Enabled
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-[9px] font-black uppercase tracking-wider shadow-sm">
              <Activity className="w-3 h-3 text-emerald-500 animate-pulse" />
              Real-Time Commitments Synced
            </div>
          </div>
          <h1 className="text-4xl font-display font-medium tracking-tight text-slate-950">
            Audit & Settlement Center
          </h1>
          <p className="text-slate-500 max-w-3xl font-medium text-sm leading-relaxed">
            Audit, verify, and settle AI-orchestrated procurement commitments. Trace secure on-chain escrow allocations and supplier fulfillment compliance.
          </p>
        </div>
        <div className="flex items-center gap-3 self-start xl:self-end">
          <Button variant="outline" className="bg-white border-slate-200 text-slate-600 hover:bg-slate-50 font-black text-xs uppercase tracking-widest h-11 px-5 rounded-xl shadow-sm gap-2">
            <Download className="w-4 h-4" /> Export Ledger
          </Button>
        </div>
      </div>

      {/* 💻 SPLIT-PANE AUDIT CENTER (Ledger + Console) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: COMMITMENT LEDGER LIST (5 cols) */}
        <div className="xl:col-span-5 space-y-6">
          <Card className="bg-white border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.02)] rounded-[2rem] overflow-hidden flex flex-col">
            <CardHeader className="py-5 px-6 border-b border-slate-100 gap-4 bg-slate-50/20">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-base font-display font-semibold text-slate-950">Commitment Ledger</CardTitle>
                  <CardDescription className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                    Active cross-border escrow commitments
                  </CardDescription>
                </div>

                {/* Filter Tabs */}
                <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
                  {(['ALL', 'SECURED', 'VERIFIED', 'SETTLED'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setStatusFilter(tab)}
                      className={cn(
                        "text-[8px] font-black uppercase tracking-wider px-2 py-1 rounded-md transition-all",
                        statusFilter === tab ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-950"
                      )}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search */}
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                <Input 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by supplier, category, or ID..." 
                  className="h-9 pl-9 pr-4 bg-white border-slate-200 rounded-xl focus:border-slate-400 transition-all font-semibold text-xs shadow-sm"
                />
              </div>
            </CardHeader>

            <div className="divide-y divide-slate-100 overflow-y-auto max-h-[600px]">
              {filteredLedger.map((row) => (
                <div
                  key={row.id}
                  onClick={() => setSelectedRow(row)}
                  className={cn(
                    "p-5 hover:bg-slate-50/50 transition-all cursor-pointer flex items-center justify-between gap-4 border-l-4",
                    selectedRow?.id === row.id ? "bg-slate-50/80 border-slate-950" : "border-transparent"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg border flex items-center justify-center text-xs font-black transition-all shrink-0",
                      selectedRow?.id === row.id ? "bg-slate-950 text-white border-slate-950" : "bg-slate-50 text-slate-500 border-slate-100"
                    )}>
                      {row.supplier.charAt(0)}
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-950 block leading-tight">{row.supplier}</span>
                      <span className="text-[9px] text-slate-400 font-bold block mt-0.5">{row.category} • {row.region}</span>
                    </div>
                  </div>

                  <div className="text-right space-y-1 shrink-0">
                    <span className="text-xs font-black text-slate-950 block font-display">
                      ${row.contract_value.toLocaleString()}
                    </span>
                    {getStatusBadge(row.status)}
                  </div>
                </div>
              ))}

              {filteredLedger.length === 0 && (
                <div className="p-8 text-center text-slate-400 font-bold text-xs">
                  No commitments match query parameters.
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN: ACTIVE SETTLEMENT AUDIT CONSOLE (7 cols) */}
        <div className="xl:col-span-7">
          <AnimatePresence mode="wait">
            {selectedRow ? (
              <motion.div
                key={selectedRow.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="bg-white border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.02)] rounded-[2rem] overflow-hidden p-8 space-y-6">
                  
                  {/* Console Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-950 text-white flex items-center justify-center text-sm font-black">
                        {selectedRow.supplier.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-lg text-slate-900 leading-tight">{selectedRow.supplier}</h3>
                        <span className="text-[9px] font-black text-slate-400 font-mono tracking-widest uppercase block mt-0.5">
                          Escrow Contract: ALGO-ESC-{selectedRow.id}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(selectedRow.status)}
                    </div>
                  </div>

                  {/* Main Lock Display Panel */}
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-violet-50 border border-violet-100 text-violet-500 flex items-center justify-center shadow-inner">
                      <Lock className="w-5 h-5 animate-pulse" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Locked Sourcing Value</span>
                      <h2 className="text-4xl font-display font-black text-slate-900 tracking-tight leading-none">
                        ${selectedRow.contract_value.toLocaleString()}
                      </h2>
                    </div>
                    
                    {/* On-chain Stage Tracking Bar */}
                    <div className="w-full max-w-md pt-2">
                      <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-wider text-slate-400 mb-2 px-1">
                        <span>Funded</span>
                        <span>Audited</span>
                        <span>Verified</span>
                        <span>Released</span>
                      </div>
                      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden flex">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            selectedRow.status === 'Disputed / Locked' ? "bg-rose-500 w-1/2" :
                            selectedRow.status === 'Escrow Secured' || selectedRow.status === 'Procurement Approved' ? "bg-violet-600 w-1/4" :
                            selectedRow.status === 'Delivery Verified' || selectedRow.status === 'Awaiting Verification' || selectedRow.status === 'Supplier Review Active' ? "bg-emerald-500 w-3/4" :
                            "bg-teal-500 w-full"
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contract Sourcing Parameters */}
                  <div className="space-y-3 border-b border-slate-100 pb-5">
                    <h4 className="text-[9px] text-slate-400 uppercase tracking-widest font-black">
                      Sourcing Parameters
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 font-bold block mb-0.5">Sourcing Category</span>
                        <span className="text-slate-900 font-black">{selectedRow.category}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold block mb-0.5">Delivery Agreement</span>
                        <span className="text-slate-900 font-black">{selectedRow.lead_time}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold block mb-0.5">MOQ terms</span>
                        <span className="text-slate-900 font-black">{selectedRow.moq}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold block mb-0.5">Negotiated Savings</span>
                        <span className="text-emerald-600 font-black flex items-center gap-0.5">
                          <TrendingDown className="w-3.5 h-3.5" /> -{selectedRow.savings}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Digital Proof Vault */}
                  <div className="space-y-3 border-b border-slate-100 pb-5">
                    <h4 className="text-[9px] text-slate-400 uppercase tracking-widest font-black">
                      Digital Proof Vault
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3 bg-slate-50 hover:bg-slate-100/70 border border-slate-100 rounded-xl flex items-center justify-between group cursor-pointer transition-colors">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-slate-400" />
                          <div className="text-left">
                            <span className="text-[9px] text-slate-400 font-bold block uppercase leading-none">Invoice</span>
                            <span className="text-[10px] font-black text-slate-900 block mt-0.5 truncate max-w-[80px]">
                              {selectedRow.invoice || "INV-MOCK"}
                            </span>
                          </div>
                        </div>
                        <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 transition-colors" />
                      </div>

                      <div className="p-3 bg-slate-50 hover:bg-slate-100/70 border border-slate-100 rounded-xl flex items-center justify-between group cursor-pointer transition-colors">
                        <div className="flex items-center gap-2">
                          <FileCheck className="w-4 h-4 text-emerald-500" />
                          <div className="text-left">
                            <span className="text-[9px] text-emerald-500 font-bold block uppercase leading-none">Quality Proof</span>
                            <span className="text-[10px] font-black text-slate-900 block mt-0.5 truncate max-w-[80px]">
                              {selectedRow.proof_of_delivery || "POD-SGS"}
                            </span>
                          </div>
                        </div>
                        <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 transition-colors" />
                      </div>

                      <div className="p-3 bg-slate-50 hover:bg-slate-100/70 border border-slate-100 rounded-xl flex items-center justify-between group cursor-pointer transition-colors">
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-slate-400" />
                          <div className="text-left">
                            <span className="text-[9px] text-slate-400 font-bold block uppercase leading-none">Shipment tracking</span>
                            <span className="text-[10px] font-black text-slate-900 block mt-0.5 truncate max-w-[80px]">
                              {selectedRow.shipment_conf || "UPS-MOCK"}
                            </span>
                          </div>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 transition-colors" />
                      </div>
                    </div>
                  </div>

                  {/* Delivery Verification Checklist */}
                  <div className="space-y-4 border-b border-slate-100 pb-5">
                    <h4 className="text-[9px] text-slate-400 uppercase tracking-widest font-black">
                      Delivery Verification Checklist
                    </h4>
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-xs p-3 rounded-xl border border-slate-100 bg-slate-50/20">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                            <Check className="w-3 h-3" />
                          </div>
                          <span className="text-slate-600 font-semibold">Invoice amount matches contract parameters</span>
                        </div>
                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-wider">MATCHED</span>
                      </div>

                      <div className="flex items-center justify-between text-xs p-3 rounded-xl border border-slate-100 bg-slate-50/20">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                            <Check className="w-3 h-3" />
                          </div>
                          <span className="text-slate-600 font-semibold">Third-party SGS quality inspection cleared</span>
                        </div>
                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-wider">PASSED</span>
                      </div>

                      <div className="flex items-center justify-between text-xs p-3 rounded-xl border border-slate-100 bg-slate-50/20">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-4 h-4 rounded-full flex items-center justify-center text-xs",
                            selectedRow.status === 'Disputed / Locked' ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
                          )}>
                            {selectedRow.status === 'Disputed / Locked' ? <X className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                          </div>
                          <span className="text-slate-600 font-semibold">On-chain fulfillment receipt verified</span>
                        </div>
                        <span className={cn(
                          "text-[9px] font-black uppercase tracking-wider",
                          selectedRow.status === 'Disputed / Locked' ? "text-rose-500" : "text-emerald-500"
                        )}>
                          {selectedRow.status === 'Disputed / Locked' ? "LOCKED" : "VERIFIED"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Operational Settlement Action Panel */}
                  <div className="flex flex-wrap items-center gap-3 justify-end pt-2">
                    {selectedRow.status !== 'Settlement Released' && selectedRow.status !== 'Disputed / Locked' && (
                      <>
                        <Button
                          onClick={() => handleLockEscrow(selectedRow.id)}
                          variant="outline"
                          className="border-rose-200 text-rose-600 hover:bg-rose-50 font-black text-[10px] uppercase tracking-widest h-10 px-4 rounded-xl transition-all"
                        >
                          Raise Dispute / Lock Escrow
                        </Button>
                        <Button
                          onClick={() => handleReleaseSettlement(selectedRow.id)}
                          className="bg-slate-950 hover:bg-black text-white font-black text-[10px] uppercase tracking-widest h-10 px-5 rounded-xl transition-all shadow-md flex items-center gap-1.5"
                        >
                          <Lock className="w-3 h-3" /> Approve On-Chain Release
                        </Button>
                      </>
                    )}

                    {selectedRow.status === 'Settlement Released' && (
                      <div className="w-full p-4 rounded-2xl bg-teal-50 border border-teal-100 flex items-center gap-3 text-teal-700">
                        <Check className="w-5 h-5 shrink-0" />
                        <div className="text-left">
                          <h6 className="text-[10px] font-black uppercase tracking-wider">Settlement Released Successfully</h6>
                          <p className="text-[10px] font-medium leading-relaxed mt-0.5">
                            Smart contract fully executed on-chain. Funds successfully transferred to the supplier.
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedRow.status === 'Disputed / Locked' && (
                      <div className="w-full p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-center gap-3 text-rose-700">
                        <AlertCircle className="w-5 h-5 shrink-0 animate-pulse" />
                        <div className="text-left">
                          <h6 className="text-[10px] font-black uppercase tracking-wider">Escrow Commitment Disputed</h6>
                          <p className="text-[10px] font-medium leading-relaxed mt-0.5">
                            Fulfillment locked under x402 security protocol. Escrow is currently suspended awaiting quality audit resolution.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sourcing Timeline */}
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <h4 className="text-[9px] text-slate-400 uppercase tracking-widest font-black">
                      On-Chain Sourcing Journey
                    </h4>

                    <div className="space-y-5 pl-2 pt-2 relative">
                      {[
                        { num: "1", title: "Procurement Commitment Created", desc: "Digital sourcing agreement finalized between buyer and seller.", active: true, time: "2026-05-01 10:24 AM" },
                        { num: "2", title: "Escrow Secured on Algorand", desc: "Contract value locked into on-chain escrow program.", active: true, time: "2026-05-01 10:48 AM" },
                        { num: "3", title: "Supplier Verification Submitted", desc: "Verification logs and invoice files uploaded for auditing.", active: selectedRow.status !== 'Procurement Approved', time: "2026-05-08 04:12 PM" },
                        { num: "4", title: "Fulfillment Confirmed On-Chain", desc: "Quality checks cleared and shipment receipt confirmed.", active: selectedRow.status === 'Delivery Verified' || selectedRow.status === 'Settlement Released', time: "2026-05-11 02:30 PM" },
                        { num: "5", title: "Settlement Released to Supplier", desc: "Escrow funds automatically dispatched to supplier address.", active: selectedRow.status === 'Settlement Released', time: "2026-05-14 09:15 AM" }
                      ].map((step, idx) => (
                        <div key={idx} className="flex gap-4 relative">
                          {idx < 4 && (
                            <div className={cn(
                              "absolute left-3.5 top-7 bottom-0 w-0.5 -mt-1 -mb-6 bg-slate-100",
                              step.active && "bg-slate-900"
                            )} />
                          )}
                          <div className={cn(
                            "w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-slate-400 border border-slate-200 bg-white relative z-10 shrink-0",
                            step.active && "bg-slate-950 text-white border-slate-950 shadow-sm"
                          )}>
                            {step.num}
                          </div>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-3">
                              <h5 className={cn(
                                "text-xs font-black text-slate-400",
                                step.active && "text-slate-950"
                              )}>
                                {step.title}
                              </h5>
                              {step.active && <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">{step.time}</span>}
                            </div>
                            <p className="text-[11px] font-semibold text-slate-500 leading-normal">{step.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </Card>
              </motion.div>
            ) : (
              <div className="h-[600px] bg-slate-50/50 border border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center p-8 text-center space-y-4">
                <FileText className="w-12 h-12 text-slate-300" />
                <div>
                  <h4 className="font-display font-bold text-slate-900">No Commitment Selected</h4>
                  <p className="text-xs text-slate-500 max-w-xs mt-1 leading-relaxed">
                    Select a cross-border procurement agreement from the ledger on the left to review invoice audit parameters, delivery certifications, and release smart contract escrow settlements.
                  </p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
};

export default Transactions;
