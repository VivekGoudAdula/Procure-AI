import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  AreaChart, 
  Area, 
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const savingsData = [
  { name: 'Jan', value: 145000, compliance: 92, response: 94, volume: 1.2 },
  { name: 'Feb', value: 189000, compliance: 94, response: 91, volume: 1.5 },
  { name: 'Mar', value: 245000, compliance: 93, response: 95, volume: 1.8 },
  { name: 'Apr', value: 310000, compliance: 96, response: 92, volume: 2.1 },
  { name: 'May', value: 385000, compliance: 95, response: 96, volume: 2.3 },
  { name: 'Jun', value: 441000, compliance: 97, response: 93, volume: 2.4 }
];

export const ProcurementTrendsChart: React.FC = () => {
  const [metric, setMetric] = useState<'savings' | 'compliance' | 'response'>('savings');

  const getActiveData = () => {
    switch (metric) {
      case 'compliance':
        return savingsData.map(d => ({ name: d.name, value: d.compliance, label: 'Fulfillment Compliance (%)' }));
      case 'response':
        return savingsData.map(d => ({ name: d.name, value: d.response, label: 'Supplier Response Rate (%)' }));
      default:
        return savingsData.map(d => ({ name: d.name, value: d.value / 1000, label: 'Procurement Savings ($K)' }));
    }
  };

  const getStrokeColor = () => {
    switch (metric) {
      case 'compliance': return '#8b5cf6'; // Violet
      case 'response': return '#f59e0b'; // Amber
      default: return '#10b981'; // Emerald
    }
  };

  const getGradientId = () => `grad_${metric}`;

  return (
    <Card className="bg-white border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.02)] rounded-[2.5rem] overflow-hidden">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-slate-50/50 py-6 px-10 border-b border-slate-100/50 gap-4">
        <div>
          <CardTitle className="text-lg font-display font-semibold text-slate-950">Procurement Trends & Performance</CardTitle>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.1em] mt-1">Multi-dimensional operational telemetry across global sourcing cycles</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button 
            variant={metric === 'savings' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setMetric('savings')}
            className={`text-[9px] uppercase tracking-widest font-black h-8 px-3 rounded-lg transition-all ${
              metric === 'savings' ? 'bg-slate-950 text-white' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
            }`}
          >
            Savings ($)
          </Button>
          <Button 
            variant={metric === 'compliance' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setMetric('compliance')}
            className={`text-[9px] uppercase tracking-widest font-black h-8 px-3 rounded-lg transition-all ${
              metric === 'compliance' ? 'bg-slate-950 text-white' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
            }`}
          >
            Compliance (%)
          </Button>
          <Button 
            variant={metric === 'response' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setMetric('response')}
            className={`text-[9px] uppercase tracking-widest font-black h-8 px-3 rounded-lg transition-all ${
              metric === 'response' ? 'bg-slate-950 text-white' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
            }`}
          >
            Response (%)
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-10">
        <div className="h-[320px] w-full min-w-0">
          <ResponsiveContainer width="100%" height={320} minWidth={0}>
            <AreaChart data={getActiveData()}>
              <defs>
                <linearGradient id={getGradientId()} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={getStrokeColor()} stopOpacity={0.06}/>
                  <stop offset="95%" stopColor={getStrokeColor()} stopOpacity={0}/>
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
                  borderRadius: '16px', 
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)',
                  padding: '12px'
                }}
                itemStyle={{ fontWeight: 900, fontSize: '12px' }}
                labelStyle={{ fontWeight: 900, fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                name={metric === 'savings' ? 'Savings ($K)' : metric === 'compliance' ? 'Compliance (%)' : 'Response (%)'}
                stroke={getStrokeColor()} 
                strokeWidth={3}
                fillOpacity={1} 
                fill={`url(#${getGradientId()})`} 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
