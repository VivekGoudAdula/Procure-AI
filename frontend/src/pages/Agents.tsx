import React from 'react';
import { 
  Cpu, 
  Plus, 
  Activity, 
  Shield, 
  Zap, 
  Settings, 
  MoreVertical,
  Play,
  Pause,
  Terminal,
  BrainCircuit,
  Network,
  Lock
} from 'lucide-react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { cn } from '../lib/utils';

const Agents = () => {
  const agents = [
    {
      id: 1,
      name: "Procure-Alpha",
      type: "Procurement",
      status: "Active",
      tasks: 124,
      successRate: "99.2%",
      uptime: "14d 2h",
      lastAction: "Negotiated GPU Cluster deal",
      icon: <BrainCircuit className="w-6 h-6" />,
      color: "from-violet-500 to-purple-600"
    },
    {
      id: 2,
      name: "Settle-Bot",
      type: "Settlement",
      status: "Idle",
      tasks: 89,
      successRate: "100%",
      uptime: "3d 5h",
      lastAction: "Settled ALGO_X92J transaction",
      icon: <Network className="w-6 h-6" />,
      color: "from-rose-500 to-pink-600"
    },
    {
      id: 3,
      name: "Audit-Sentinel",
      type: "Compliance",
      status: "Active",
      tasks: 542,
      successRate: "98.5%",
      uptime: "45d 12h",
      lastAction: "Verified supplier rating for TechCorp",
      icon: <Lock className="w-6 h-6" />,
      color: "from-emerald-500 to-teal-600"
    }
  ];

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-display font-bold tracking-tight text-slate-900">AI Agents</h1>
          <p className="text-slate-500 mt-2 font-medium">Manage and monitor your autonomous workforce.</p>
        </div>
        <Button className="bg-slate-900 hover:bg-slate-800 text-white gap-2 font-bold px-6 py-6 rounded-2xl shadow-xl shadow-slate-200 transition-all hover:scale-[1.02] active:scale-[0.98]">
          <Plus className="w-5 h-5" /> Deploy New Agent
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {agents.map((agent, idx) => (
          <motion.div
            key={agent.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="bg-white border-slate-100 rounded-[2rem] hover:border-primary/20 transition-all group overflow-hidden shadow-sm hover:shadow-xl hover:shadow-slate-200/50">
              <CardHeader className="pb-4 relative">
                <div className="flex justify-between items-start">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg shadow-slate-200 text-white",
                    agent.color
                  )}>
                    {agent.icon}
                  </div>
                  <Badge className={cn(
                    "uppercase tracking-widest text-[10px] font-bold px-3 py-1 rounded-full border shadow-none",
                    agent.status === 'Active' 
                      ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                      : "bg-slate-50 text-slate-400 border-slate-100"
                  )}>
                    <span className={cn(
                      "w-1.5 h-1.5 rounded-full mr-2",
                      agent.status === 'Active' ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
                    )} />
                    {agent.status}
                  </Badge>
                </div>
                <div className="mt-6">
                  <CardTitle className="text-2xl font-display font-bold text-slate-900">{agent.name}</CardTitle>
                  <CardDescription className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">{agent.type} Agent</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Success Rate</p>
                    <p className="text-xl font-bold text-emerald-600">{agent.successRate}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tasks Done</p>
                    <p className="text-xl font-bold text-slate-900">{agent.tasks}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                    <Terminal className="w-3 h-3" /> Last Action
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                    <p className="text-[11px] text-emerald-400/90 font-mono truncate">&gt; {agent.lastAction}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Button variant="outline" size="sm" className="flex-1 bg-white border-slate-200 hover:bg-slate-50 gap-2 text-[10px] uppercase font-bold tracking-widest text-slate-600 h-10 rounded-xl">
                    {agent.status === 'Active' ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                    {agent.status === 'Active' ? 'Pause' : 'Resume'}
                  </Button>
                  <Button variant="ghost" size="icon" className="w-10 h-10 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-900 rounded-xl">
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="bg-white border-slate-100 rounded-[2rem] shadow-sm overflow-hidden">
        <CardHeader className="border-b border-slate-50 bg-slate-50/30 px-8 py-6">
          <CardTitle className="text-xl font-display font-bold flex items-center gap-3 text-slate-900">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Activity className="text-primary w-5 h-5" />
            </div>
            Agent Activity Stream
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-50">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start gap-6 p-8 hover:bg-slate-50/50 transition-colors group">
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center group-hover:bg-white transition-colors shadow-inner">
                    <Cpu className="text-slate-400 group-hover:text-primary w-6 h-6 transition-colors" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-base font-bold text-slate-700">Procure-Alpha initiated negotiation with Supplier #821</p>
                    <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-widest border-slate-200 text-slate-400 px-3 py-1 rounded-full">Log</Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <p className="text-xs text-slate-400 font-medium">2 minutes ago</p>
                    <div className="w-1 h-1 rounded-full bg-slate-200" />
                    <p className="text-xs text-slate-400 font-medium">Procurement Center</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Agents;
