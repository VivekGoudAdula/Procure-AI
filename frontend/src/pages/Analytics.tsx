import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  Zap,
  Layers,
  Activity,
  Calendar
} from 'lucide-react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

const Analytics = () => {
  const stats = [
    {
      title: "Total Procurement Volume",
      value: "$1.2M",
      change: "+12.5%",
      trend: "up",
      icon: DollarSign,
      color: "primary"
    },
    {
      title: "Avg. Negotiation Time",
      value: "1.2s",
      change: "-18.2%",
      trend: "up",
      icon: Clock,
      color: "secondary"
    },
    {
      title: "Settlement Success Rate",
      value: "99.9%",
      change: "+0.2%",
      trend: "up",
      icon: CheckCircle2,
      color: "accent"
    },
    {
      title: "Agent Efficiency",
      value: "94.2%",
      change: "+5.1%",
      trend: "up",
      icon: Zap,
      color: "primary"
    }
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">Analytics & Insights</h1>
          <p className="text-foreground/60 mt-1">Real-time performance metrics for your autonomous commerce.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="glass border-white/10 gap-2">
            <Calendar className="w-4 h-4" /> Last 30 Days
          </Button>
          <Button className="bg-primary hover:bg-primary/90 neon-glow gap-2">
            <BarChart3 className="w-4 h-4" /> Generate Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="glass-card border-white/5 hover:border-primary/30 transition-all group overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center neon-glow",
                    stat.color === 'primary' ? "bg-primary/10" : stat.color === 'secondary' ? "bg-secondary/10" : "bg-accent/10"
                  )}>
                    <stat.icon className={cn(
                      "w-6 h-6",
                      stat.color === 'primary' ? "text-primary" : stat.color === 'secondary' ? "text-secondary" : "text-accent"
                    )} />
                  </div>
                  <Badge className={cn(
                    "uppercase tracking-widest text-[10px] font-bold flex items-center gap-1",
                    stat.trend === 'up' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-accent/10 text-accent border-accent/20"
                  )}>
                    {stat.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {stat.change}
                  </Badge>
                </div>
                <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">{stat.title}</p>
                <p className="text-3xl font-bold mt-1 tracking-tight">{stat.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <Card className="lg:col-span-8 glass-card border-white/5">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <TrendingUp className="text-primary w-5 h-5" />
              Volume Over Time
            </CardTitle>
            <CardDescription>Monthly procurement volume in USD</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center bg-black/20 rounded-xl border border-white/5 m-6">
            <div className="text-center space-y-4">
              <div className="flex items-end gap-2 h-32">
                {[40, 60, 45, 80, 55, 90, 70, 85, 65, 95, 75, 100].map((h, i) => (
                  <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ delay: i * 0.05, duration: 1 }}
                    className="w-4 bg-gradient-to-t from-primary to-secondary rounded-t-sm neon-glow"
                  />
                ))}
              </div>
              <p className="text-foreground/40 text-xs font-mono uppercase tracking-widest">Interactive Chart Coming Soon</p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-4 glass-card border-white/5">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Layers className="text-secondary w-5 h-5" />
              Category Distribution
            </CardTitle>
            <CardDescription>Procurement by category</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {[
              { name: "Hardware", value: 45, color: "primary" },
              { name: "Software", value: 30, color: "secondary" },
              { name: "Services", value: 15, color: "accent" },
              { name: "Logistics", value: 10, color: "foreground/40" }
            ].map((cat) => (
              <div key={cat.name} className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                  <span>{cat.name}</span>
                  <span>{cat.value}%</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${cat.value}%` }}
                    transition={{ duration: 1 }}
                    className={cn(
                      "h-full rounded-full neon-glow",
                      cat.color === 'primary' ? "bg-primary" : cat.color === 'secondary' ? "bg-secondary" : cat.color === 'accent' ? "bg-accent" : "bg-foreground/40"
                    )}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Helper for conditional classes
const cn = (...inputs: any[]) => inputs.filter(Boolean).join(' ');

export default Analytics;
