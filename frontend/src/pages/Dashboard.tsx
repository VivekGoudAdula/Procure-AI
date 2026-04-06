import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  TrendingUp, 
  Package, 
  ShieldCheck, 
  Zap,
  ArrowRight,
  Cpu,
  Activity,
  ArrowUpRight,
  Clock,
  MoreHorizontal,
  ChevronRight,
  Target,
  Users
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const chartData = [
  { name: 'Jan', value: 4000 },
  { name: 'Feb', value: 3000 },
  { name: 'Mar', value: 5000 },
  { name: 'Apr', value: 2780 },
  { name: 'May', value: 1890 },
  { name: 'Jun', value: 2390 },
  { name: 'Jul', value: 3490 },
];

const Dashboard = () => {
  const { user, transactions } = useApp();

  const stats = [
    { name: 'Total Procured', value: '$42,500', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: '+12.5%' },
    { name: 'Active Orders', value: '3', icon: Package, color: 'text-primary', bg: 'bg-primary/5', trend: 'Stable' },
    { name: 'Settled On-chain', value: '12', icon: ShieldCheck, color: 'text-secondary', bg: 'bg-secondary/5', trend: '+2' },
    { name: 'AI Efficiency', value: '+24%', icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50', trend: '+4.2%' },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-10 pb-16 pt-4">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] uppercase font-black tracking-[0.2em] text-primary/70">System Health: Operational</span>
          </div>
          <h1 className="text-4xl font-display font-medium tracking-tight text-slate-950">
            Command Center
          </h1>
          <p className="text-slate-500 max-w-lg font-medium text-sm">
            Welcome back, <span className="text-slate-950 font-black">{user?.name || user?.email.split('@')[0]}</span>. Protocols are running at peak efficiency.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="bg-white border-slate-200 text-slate-900 font-black text-xs uppercase tracking-widest h-12 px-6 rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
            Audit Logs
          </Button>
          <Link to="/procurement">
            <Button className="bg-slate-950 hover:bg-black text-white font-black text-xs uppercase tracking-widest h-12 px-8 rounded-2xl shadow-2xl shadow-slate-200 transition-all hover:scale-[1.02]">
              New Protocol <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {stats.map((stat) => (
          <motion.div key={stat.name} variants={item}>
            <Card className="bg-white border-slate-100/60 hover:border-primary/30 transition-all group shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 rounded-[2rem] overflow-hidden">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className={cn(stat.bg, "w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner")}>
                    <stat.icon className={cn(stat.color, "w-7 h-7")} />
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest">
                      {stat.trend}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{stat.name}</h3>
                  <div className="text-3xl font-display font-black tracking-tight text-slate-950">{stat.value}</div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Main Content Grid (Bento) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Chart Section */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-8"
        >
          <Card className="bg-white border-slate-100 shadow-sm h-full overflow-hidden rounded-[2.5rem]">
            <CardHeader className="flex flex-row items-center justify-between bg-slate-50/50 py-7 px-10 border-b border-slate-100/50">
              <div>
                <CardTitle className="text-xl font-display font-medium text-slate-950">Procurement Dynamics</CardTitle>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.1em] mt-1.5">Aggregate performance metrics across intelligence nodes</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="bg-white border-slate-200 text-slate-500 font-black text-[9px] uppercase tracking-widest px-4 py-1.5 rounded-xl shadow-sm">6-Month Audit</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-10">
              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#000" stopOpacity={0.05}/>
                        <stop offset="95%" stopColor="#000" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }}
                      dy={15}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        borderRadius: '20px', 
                        border: '1px solid #f1f5f9',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
                        padding: '12px'
                      }}
                      itemStyle={{ fontWeight: 900, fontSize: '12px' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#0f172a" 
                      strokeWidth={4}
                      fillOpacity={1} 
                      fill="url(#colorValue)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Right Sidebar Widgets */}
        <div className="lg:col-span-4 space-y-8">
          {/* Active Agents Widget */}
          <Card className="bg-slate-950 border-none relative overflow-hidden group rounded-[2.5rem] shadow-2xl shadow-slate-200">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full -mr-32 -mt-32 blur-[100px] group-hover:scale-150 transition-transform duration-1000" />
            <CardContent className="p-10 relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center backdrop-blur-2xl border border-white/10 shadow-2xl">
                  <Activity className="text-white w-7 h-7" />
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Live Protocol</span>
                </div>
              </div>
              <h3 className="text-2xl font-display font-medium text-white mb-3">Intelligence Hub</h3>
              <p className="text-white/50 text-sm mb-10 leading-relaxed font-medium">98.2% Efficiency across 5 active intelligence nodes currently negotiating on-chain.</p>
              
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-white/30 font-black uppercase tracking-[0.2em]">Deployment Load</span>
                    <span className="text-white font-black">94.8%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '94.8%' }}
                      transition={{ duration: 1.5, delay: 0.5 }}
                      className="h-full bg-primary"
                    />
                  </div>
                </div>
              </div>

              <Link to="/agents" className="block mt-12">
                <Button className="w-full bg-white text-slate-950 hover:bg-slate-100 font-black text-xs uppercase tracking-widest h-12 rounded-2xl transition-all shadow-xl">
                  Sync Agents <ChevronRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Goals Widget */}
          <Card className="bg-white border-slate-100 shadow-sm rounded-[2.5rem]">
            <CardHeader className="py-7 px-9 border-b border-slate-50">
              <CardTitle className="text-xs font-black text-slate-400 flex items-center gap-2 uppercase tracking-[0.2em]">
                <Target className="w-4 h-4 text-primary" />
                Optimization Goals
              </CardTitle>
            </CardHeader>
            <CardContent className="p-9 space-y-8">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-500 font-black uppercase tracking-widest">Cost Hard-Cap</span>
                  <span className="text-slate-950 font-black">$12k / 15k</span>
                </div>
                <div className="w-full h-2.5 bg-slate-50 rounded-full overflow-hidden shadow-inner">
                  <div className="h-full bg-slate-950 w-[82%] rounded-full shadow-lg" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-500 font-black uppercase tracking-widest">Latency Floor</span>
                  <span className="text-slate-950 font-black">1.2s Floor</span>
                </div>
                <div className="w-full h-2.5 bg-slate-50 rounded-full overflow-hidden shadow-inner">
                  <div className="h-full bg-primary w-[95%] rounded-full shadow-lg" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="lg:col-span-12"
        >
          <Card className="bg-white border-slate-100 shadow-sm overflow-hidden rounded-[2.5rem] mb-12">
            <CardHeader className="flex flex-row items-center justify-between bg-slate-50/50 py-8 px-10 border-b border-slate-100/50">
              <div>
                <CardTitle className="text-xl font-display font-medium text-slate-950">Settlement Logs</CardTitle>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.1em] mt-1.5">Sequential ledger entries from autonomous on-chain settlements</p>
              </div>
              <Link to="/transactions">
                <Button variant="outline" className="text-slate-950 border-slate-200 hover:bg-slate-50 font-black text-[10px] uppercase tracking-widest px-6 h-10 rounded-xl shadow-sm">
                  Full Analytics <ArrowRight className="ml-2 w-3.5 h-3.5" />
                </Button>
              </Link>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/30 text-slate-400 text-[10px] uppercase tracking-[0.2em]">
                    <th className="px-10 py-5 font-black">Counterparty</th>
                    <th className="px-10 py-5 font-black">Settle Value</th>
                    <th className="px-10 py-5 font-black">State</th>
                    <th className="px-10 py-5 font-black">Protocol Date</th>
                    <th className="px-10 py-5 font-black text-right">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {transactions.slice(0, 5).map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/40 transition-all group cursor-pointer">
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-xs font-black text-slate-950 group-hover:bg-slate-950 group-hover:text-white group-hover:border-slate-950 transition-all shadow-sm">
                            {tx.supplier.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-slate-950">{tx.supplier}</span>
                            <span className="text-[10px] font-bold text-slate-400 font-mono">TX-{tx.id.substring(0, 8)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <span className="text-sm font-black text-slate-950 font-display">${tx.amount.toLocaleString()}</span>
                      </td>
                      <td className="px-10 py-6">
                        <Badge className={cn(
                          "text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border shadow-none",
                          tx.status === 'Completed' 
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                            : "bg-amber-50 text-amber-600 border-amber-100"
                        )}>
                          {tx.status}
                        </Badge>
                      </td>
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-2.5 text-xs text-slate-400 font-bold uppercase tracking-tighter">
                          <Clock className="w-3.5 h-3.5" />
                          {tx.date}
                        </div>
                      </td>
                      <td className="px-10 py-6 text-right">
                        <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl text-slate-400 hover:text-slate-950 hover:bg-slate-100 transition-all">
                          <ArrowUpRight className="w-5 h-5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
