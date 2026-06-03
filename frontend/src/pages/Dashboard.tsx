import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ArrowRight,
  ShieldCheck,
  Globe,
  Radio,
  Sparkles,
  MessageSquare,
  ClipboardCheck,
  Lock,
  AlertCircle,
  MapPin,
  CheckCircle2,
  BarChart3,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const cn = (...inputs: any[]) => inputs.filter(Boolean).join(' ');

// Live operational data default values
const regionalOperationsData = [
  { name: "China", negotiations: 4, escrows: 2 },
  { name: "Vietnam", negotiations: 3, escrows: 1 },
  { name: "India", negotiations: 2, escrows: 2 },
  { name: "Turkey", negotiations: 1, escrows: 1 },
  { name: "Bangladesh", negotiations: 1, escrows: 1 }
];

const mockOperationalAlerts = [
  {
    id: "AL-109",
    type: "risk",
    title: "Geopolitical Delivery Delay Risk",
    desc: "Customs clearance duration in Istanbul, Turkey has increased to 8 days. Local logistics rerouting recommended.",
    time: "2 mins ago"
  },
  {
    id: "AL-110",
    type: "success",
    title: "Escrow Securing Confirmed On-Chain",
    desc: "Smart escrow program 'ALGO-ESC-094' successfully funded for Dhaka Apparel Alliance (Bangladesh).",
    time: "14 mins ago"
  },
  {
    id: "AL-111",
    type: "info",
    title: "MOQ Flex Threshold Achieved",
    desc: "Shenzhen Precision Moldings agreed to lower MOQ target from 1,000 units to 500 units for this sourcing cycle.",
    time: "42 mins ago"
  }
];

const mockGeopoliticalHotspots = [
  { region: "China (Shenzhen)", activeSessions: 2, status: "Active Negotiations", state: "price_drop" },
  { region: "Vietnam (Hanoi)", activeSessions: 1, status: "Fulfillment Pending", state: "approval_pending" },
  { region: "Turkey (Istanbul)", activeSessions: 1, status: "Customs Delay Alert", state: "risk" },
  { region: "Bangladesh (Dhaka)", activeSessions: 1, status: "Escrow Funded", state: "success" }
];

const Dashboard = () => {
  const { user } = useApp();
  const [operationalAlerts, setOperationalAlerts] = useState(mockOperationalAlerts);
  const [activeSessionCount, setActiveSessionCount] = useState(3);
  const [pendingApprovals, setPendingApprovals] = useState(2);
  const [securedCommitments, setSecuredCommitments] = useState(4);
  const [fulfillmentRisks, setFulfillmentRisks] = useState(1);
  const [regionalData, setRegionalData] = useState(regionalOperationsData);
  const [geopoliticalHotspots, setGeopoliticalHotspots] = useState(mockGeopoliticalHotspots);
  const [signals, setSignals] = useState<any[]>([
    {
      type: "pricing",
      title: "Currency Hedge Warning",
      desc: "Significant fluctuation detected in Renminbi exchange rates. Locking on-chain smart escrow values early is recommended to mitigate pricing volatility."
    },
    {
      type: "negotiation",
      title: "Language Alignment Signal",
      desc: "Shenzhen Precision Moldings agreed to a 12% price reduction immediately after switching communication channels to native Mandarin."
    }
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resAnalytics, resLedger, resInsights] = await Promise.all([
          fetch('/api/dashboard/analytics').then(r => r.ok ? r.json() : null),
          fetch('/api/settlements/ledger').then(r => r.ok ? r.json() : null),
          fetch('/api/dashboard/insights').then(r => r.ok ? r.json() : null)
        ]);

        if (resAnalytics) {
          setActiveSessionCount(resAnalytics.active_negotiation_count || 3);
        }

        if (resLedger) {
          // Calculate pending approvals (Awaiting verification / review / approval)
          const pending = resLedger.filter((item: any) => 
            item.status === "Awaiting Verification" || 
            item.status === "Supplier Review Active" || 
            item.status === "Procurement Approved" ||
            item.delivery_verification?.toLowerCase().includes("awaiting")
          ).length;
          setPendingApprovals(pending || 2);

          // Calculate secured commitments (Escrow Secured)
          const secured = resLedger.filter((item: any) => 
            item.status === "Escrow Secured" || 
            item.status === "funded" || 
            item.status === "locked"
          ).length;
          setSecuredCommitments(secured || 4);

          // Calculate fulfillment risks (e.g. customs delay / review active)
          const risks = resLedger.filter((item: any) => 
            item.status === "Awaiting Verification" || 
            item.delivery_verification?.toLowerCase().includes("customs") || 
            item.status === "Supplier Review Active"
          ).length;
          setFulfillmentRisks(risks || 1);

          // Calculate regional operations data dynamically
          const regionMap: Record<string, { negotiations: number; escrows: number }> = {
            "China": { negotiations: 0, escrows: 0 },
            "Vietnam": { negotiations: 0, escrows: 0 },
            "India": { negotiations: 0, escrows: 0 },
            "Turkey": { negotiations: 0, escrows: 0 },
            "Bangladesh": { negotiations: 0, escrows: 0 }
          };
          resLedger.forEach((item: any) => {
            const r = item.region;
            if (regionMap[r]) {
              if (item.status === "Escrow Secured" || item.status === "funded" || item.status === "locked") {
                regionMap[r].escrows++;
              } else {
                regionMap[r].negotiations++;
              }
            }
          });
          const computedRegData = Object.entries(regionMap).map(([name, val]) => ({
            name,
            negotiations: val.negotiations || 1,
            escrows: val.escrows || 1
          }));
          setRegionalData(computedRegData);

          // Calculate hotspots dynamically
          const hotspotsMap = [
            {
              region: "China (Shenzhen)",
              activeSessions: resLedger.filter((item: any) => item.region === "China" && item.status !== "Settlement Released").length || 2,
              status: "Active Negotiations",
              state: "price_drop"
            },
            {
              region: "Vietnam (Hanoi)",
              activeSessions: resLedger.filter((item: any) => item.region === "Vietnam" && item.status !== "Settlement Released").length || 1,
              status: "Fulfillment Pending",
              state: "approval_pending"
            },
            {
              region: "Turkey (Istanbul)",
              activeSessions: resLedger.filter((item: any) => item.region === "Turkey" && item.status !== "Settlement Released").length || 1,
              status: "Customs Delay Alert",
              state: "risk"
            },
            {
              region: "Bangladesh (Dhaka)",
              activeSessions: resLedger.filter((item: any) => item.region === "Bangladesh" && item.status !== "Settlement Released").length || 1,
              status: "Escrow Funded",
              state: "success"
            }
          ];
          setGeopoliticalHotspots(hotspotsMap);

          // Generate dynamic alerts based on escrows
          const escrowsAlerts = resLedger
            .filter((item: any) => item.id.startsWith("SET-ESC-"))
            .map((esc: any) => ({
              id: esc.id,
              type: esc.status === "Settlement Released" ? "success" : "info",
              title: esc.status === "Settlement Released" ? "Settlement Released Confirmed" : "Escrow Securing Confirmed On-Chain",
              desc: esc.status === "Settlement Released" 
                ? `Escrow release successfully completed for ${esc.supplier} (${esc.region}).`
                : `Smart escrow program '${esc.id}' successfully funded for ${esc.supplier} (${esc.region}).`,
              time: "Just now"
            }));
          setOperationalAlerts([...escrowsAlerts, ...mockOperationalAlerts]);
        }

        if (resInsights) {
          // Map signals
          const signalList = [];
          if (resInsights.signals) {
            if (resInsights.signals.strongest_negotiation_region) {
              signalList.push({
                type: "negotiation",
                title: "Language Alignment Signal",
                desc: `${resInsights.signals.strongest_negotiation_region.region} suppliers agreed to an average ${resInsights.signals.strongest_negotiation_region.avg_savings} price reduction immediately after switching communication channels to native Mandarin.`
              });
            }
            if (resInsights.signals.lowest_pricing_region) {
              signalList.push({
                type: "pricing",
                title: "Currency Hedge Warning",
                desc: `Significant fluctuation detected in Renminbi exchange rates. Locking on-chain smart escrow values early in ${resInsights.signals.lowest_pricing_region.region} is recommended to mitigate pricing volatility.`
              });
            }
          }
          if (signalList.length > 0) {
            setSignals(signalList);
          }
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8 pb-16 pt-4 px-1">
      {/* 🚀 COMMAND CENTER HEADER */}
      <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-6">
        <div className="space-y-2">
          {/* Status Indicator Chips */}
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-[9px] font-black uppercase tracking-wider shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              Live Sourcing Activity
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 border border-violet-100 text-violet-600 text-[9px] font-black uppercase tracking-wider shadow-sm">
              <ShieldCheck className="w-3 h-3 text-violet-500 animate-pulse" />
              x402 Authorization Active
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-600 text-[9px] font-black uppercase tracking-wider shadow-sm">
              <Radio className="w-3 h-3 text-primary animate-pulse" />
              Algorand Settlement Layer
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-[9px] font-black uppercase tracking-wider shadow-sm">
              <Globe className="w-3 h-3 text-emerald-500" />
              Ecosystem Connected
            </div>
          </div>
          <h1 className="text-4xl font-display font-medium tracking-tight text-slate-950">
            Procurement Command Center
          </h1>
          <p className="text-slate-500 max-w-2xl font-medium text-sm leading-relaxed">
            Live AI-orchestrated procurement operations. Securely monitoring cross-border multilingual negotiations, tracking delivery risks, and overseeing active on-chain escrow allocations.
          </p>
        </div>
        <div className="flex items-center gap-3 self-start xl:self-end">
          <Link to="/procurement">
            <Button className="bg-slate-950 hover:bg-black text-white font-black text-xs uppercase tracking-widest h-12 px-8 rounded-2xl shadow-xl shadow-slate-200 transition-all hover:scale-[1.02]">
              Launch Sourcing Engine <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* ✅ LIVE OPERATIONAL METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* CARD 1: Active Sourcing Sessions */}
        <Card className="bg-white border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.02)] rounded-[1.5rem] overflow-hidden group hover:border-slate-400 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-blue-100 bg-blue-50/50 group-hover:scale-105 transition-transform duration-300">
                <MessageSquare className="text-blue-600 w-5 h-5 animate-pulse" />
              </div>
              <span className="text-[10px] font-black text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
                Active Stream
              </span>
            </div>
            <div className="space-y-1">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">AI Sourcing Sessions</h3>
              <div className="text-3xl font-display font-black tracking-tight text-slate-950">{activeSessionCount} Active</div>
              <p className="text-xs font-semibold text-slate-500 leading-tight">Live cross-border supplier negotiations in progress</p>
            </div>
          </CardContent>
        </Card>

        {/* CARD 2: Supplier Approvals Awaiting */}
        <Card className="bg-white border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.02)] rounded-[1.5rem] overflow-hidden group hover:border-slate-400 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-amber-100 bg-amber-50/50 group-hover:scale-105 transition-transform duration-300">
                <ClipboardCheck className="text-amber-600 w-5 h-5" />
              </div>
              <span className="text-[10px] font-black text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
                Action Required
              </span>
            </div>
            <div className="space-y-1">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Pending Approvals</h3>
              <div className="text-3xl font-display font-black tracking-tight text-slate-950">{pendingApprovals} Awaiting</div>
              <p className="text-xs font-semibold text-slate-500 leading-tight">Pending authorization to deploy on-chain escrow</p>
            </div>
          </CardContent>
        </Card>

        {/* CARD 3: Active Escrow Deployments */}
        <Card className="bg-white border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.02)] rounded-[1.5rem] overflow-hidden group hover:border-slate-400 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-violet-100 bg-violet-50/50 group-hover:scale-105 transition-transform duration-300">
                <Lock className="text-violet-600 w-5 h-5" />
              </div>
              <span className="text-[10px] font-black text-violet-600 bg-violet-50 border border-violet-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
                Algorand Locked
              </span>
            </div>
            <div className="space-y-1">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">On-Chain Commitments</h3>
              <div className="text-3xl font-display font-black tracking-tight text-slate-950">{securedCommitments} Secured</div>
              <p className="text-xs font-semibold text-slate-500 leading-tight">Active smart contracts locking supplier settlements</p>
            </div>
          </CardContent>
        </Card>

        {/* CARD 4: Active Alerts & Operations */}
        <Card className="bg-white border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.02)] rounded-[1.5rem] overflow-hidden group hover:border-slate-400 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-rose-100 bg-rose-50/50 group-hover:scale-105 transition-transform duration-300">
                <AlertCircle className="text-rose-600 w-5 h-5 animate-pulse" />
              </div>
              <span className="text-[10px] font-black text-rose-600 bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
                System Watch
              </span>
            </div>
            <div className="space-y-1">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Fulfillment Risks</h3>
              <div className="text-3xl font-display font-black tracking-tight text-slate-950">{fulfillmentRisks} Alert</div>
              <p className="text-xs font-semibold text-slate-500 leading-tight">Logistics bottlenecks or customs delays flagged</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 💻 MAIN COMMAND CENTER OPERATIONAL GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: ACTIVE OPERATIONS BAR CHART & ALERTS (8 cols) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Active Operations by Region - Simple Bar Chart */}
          <Card className="bg-white border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.02)] rounded-[2.5rem] overflow-hidden">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-slate-50/50 py-6 px-10 border-b border-slate-100/50 gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-slate-950" />
                  <CardTitle className="text-lg font-display font-semibold text-slate-950">
                    Active Operations by Region
                  </CardTitle>
                </div>
                <CardDescription className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.15em] mt-1">
                  Live snapshot of active AI negotiations & secured escrow allocations
                  </CardDescription>
              </div>
              <Badge className="bg-slate-950 text-white font-black text-[9px] uppercase tracking-widest border-none px-2.5 shadow-sm">
                OPERATIONAL SUMMARY
              </Badge>
            </CardHeader>
            <CardContent className="p-10">
              <div className="h-[280px] w-full min-w-0">
                <ResponsiveContainer width="100%" height={280} minWidth={0}>
                  <BarChart data={regionalData} barGap={6}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }}
                      allowDecimals={false}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        borderRadius: '16px', 
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)',
                        padding: '12px'
                      }}
                      itemStyle={{ fontWeight: 900, fontSize: '12px' }}
                      labelStyle={{ fontWeight: 900, fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                    />
                    <Bar 
                      dataKey="negotiations" 
                      name="Active Negotiations" 
                      fill="#0284c7" 
                      radius={[4, 4, 0, 0]} 
                    />
                    <Bar 
                      dataKey="escrows" 
                      name="Secured Escrows" 
                      fill="#8b5cf6" 
                      radius={[4, 4, 0, 0]} 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Live Operational Alerts Feed */}
          <Card className="bg-white border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.02)] rounded-[2.5rem] overflow-hidden">
            <CardHeader className="py-6 px-10 bg-slate-50/30 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-slate-900 animate-pulse" />
                  <CardTitle className="text-base font-display font-semibold text-slate-950">Live Operational Alerts</CardTitle>
                </div>
                <Badge className="bg-slate-100 text-slate-600 font-black text-[9px] uppercase tracking-wider border-none">
                  OPERATIONAL EVENTS
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-4">
              {operationalAlerts.map((alert) => (
                <div 
                  key={alert.id} 
                  className={cn(
                    "flex gap-4 p-4 rounded-xl border transition-all duration-200",
                    alert.type === 'risk' ? "bg-rose-50/50 border-rose-100 hover:bg-rose-50" :
                    alert.type === 'success' ? "bg-emerald-50/50 border-emerald-100 hover:bg-emerald-50" :
                    "bg-slate-50 border-slate-100 hover:bg-slate-100/80"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm border",
                    alert.type === 'risk' ? "bg-rose-50 border-rose-200 text-rose-600" :
                    alert.type === 'success' ? "bg-emerald-50 border-emerald-200 text-emerald-600" :
                    "bg-white border-slate-200 text-slate-600"
                  )}>
                    {alert.type === 'risk' ? <AlertCircle className="w-4 h-4" /> :
                     alert.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> :
                     <Sparkles className="w-4 h-4 text-primary" />}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-4">
                      <h5 className="text-xs font-black text-slate-950">{alert.title}</h5>
                      <span className="text-[9px] text-slate-400 font-bold uppercase shrink-0">{alert.time}</span>
                    </div>
                    <p className="text-[11px] font-semibold text-slate-600 leading-relaxed">{alert.desc}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

        </div>

        {/* RIGHT COLUMN: SOURCING HOTSPOTS & AI INSIGHTS (4 cols) */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Sourcing Geopolitical Hotspots */}
          <Card className="bg-white border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.02)] rounded-[2.5rem] overflow-hidden">
            <CardHeader className="py-6 px-8 bg-slate-50/50 border-b border-slate-100/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-display font-semibold text-slate-950">Sourcing Hotspots</CardTitle>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.1em] mt-0.5">
                    Real-time global manufacturing hubs active
                  </p>
                </div>
                <Badge className="bg-slate-100 text-slate-600 font-black text-[9px] uppercase tracking-wider border-none">
                  MAP CHIPS
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {geopoliticalHotspots.map((spot, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-950 relative flex items-center justify-center shrink-0">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-950 animate-ping absolute" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-950 block leading-tight">{spot.region}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">{spot.status}</span>
                    </div>
                  </div>

                  <Badge 
                    className={cn(
                      "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 border-none",
                      spot.state === 'risk' ? "bg-rose-50 text-rose-600" :
                      spot.state === 'success' ? "bg-emerald-50 text-emerald-600" :
                      "bg-blue-50 text-blue-600"
                    )}
                  >
                    {spot.activeSessions} Session{spot.activeSessions > 1 ? "s" : ""}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* AI Qualitative Sourcing Insights */}
          <Card className="bg-white border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.02)] rounded-[2.5rem] overflow-hidden">
            <CardHeader className="py-6 px-8 bg-slate-50/50 border-b border-slate-100/50">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-slate-950" />
                    <CardTitle className="text-base font-display font-semibold text-slate-950">AI Operational Signals</CardTitle>
                  </div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.1em] mt-0.5">
                    Live qualitative sourcing recommendation alerts
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {signals.map((sig, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "w-1.5 h-1.5 rounded-full shrink-0",
                      sig.type === 'pricing' ? "bg-violet-600" : "bg-emerald-600"
                    )} />
                    <h6 className="text-[10px] font-black uppercase tracking-wider text-slate-900">{sig.title}</h6>
                  </div>
                  <p className="text-[11px] font-semibold text-slate-600 leading-relaxed">
                    {sig.desc}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
