import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Globe, 
  ShieldCheck, 
  TrendingUp, 
  MessageSquare, 
  Lock, 
  DollarSign, 
  CheckCircle2, 
  Cpu, 
  Compass 
} from 'lucide-react';

interface Supplier {
  rank: number;
  name: string;
  location: string;
  matchScore: number;
  trustScore: number;
  status: 'highly_recommended' | 'verified' | 'vetting';
}

const INITIAL_SUPPLIERS: Supplier[] = [
  { rank: 1, name: 'SinoTech Materials Ltd', location: 'Shenzhen, CN', matchScore: 98, trustScore: 99, status: 'highly_recommended' },
  { rank: 2, name: 'Apex Logistics & Parts', location: 'Yokohama, JP', matchScore: 94, trustScore: 97, status: 'verified' },
  { rank: 3, name: 'EuroStandard Polymers', location: 'Stuttgart, DE', matchScore: 89, trustScore: 92, status: 'verified' },
  { rank: 4, name: 'Pacific Ind Manufacturing', location: 'Hanoi, VN', matchScore: 87, trustScore: 85, status: 'vetting' },
];

const NEGOTIATION_LOGS = [
  { time: '14:32:01', type: 'system', text: 'Initializing Autonomous Procurement Cycle' },
  { time: '14:32:05', type: 'discovery', text: 'Supplier Discovery Agent: Vetted 42 candidates globally' },
  { time: '14:32:12', type: 'translation', text: 'Translation Agent: Auto-converted RFQ to German & Mandarin' },
  { time: '14:32:18', type: 'negotiation', text: 'Negotiation Intelligence: Analyzed MOQ signals. Countered with $12.40/unit' },
  { time: '14:32:25', type: 'negotiation', text: 'Negotiation Intelligence: Supplier accepted $12.40/unit (originally $14.00)' },
  { time: '14:32:31', type: 'ranking', text: 'Supplier Ranking Agent: Recalculated trust & capacity matrix' },
  { time: '14:32:40', type: 'escrow', text: 'Escrow Commitment Agent: Created Algorand Smart Contract proposal' },
  { time: '14:32:45', type: 'system', text: 'Escrow Status: Committed & Awaiting signature' }
];

export const DashboardMockup: React.FC = () => {
  const [logs, setLogs] = useState<typeof NEGOTIATION_LOGS>([]);
  const [logIndex, setLogIndex] = useState(0);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    // Add logs one by one to simulate live AI processes
    if (logIndex < NEGOTIATION_LOGS.length) {
      const timer = setTimeout(() => {
        setLogs(prev => [...prev, NEGOTIATION_LOGS[logIndex]]);
        setLogIndex(prev => prev + 1);
        
        // Advance escrow step based on log flow
        if (logIndex >= 6) {
          setActiveStep(2); // Settled/Committed
        } else if (logIndex >= 4) {
          setActiveStep(1); // Locked
        } else if (logIndex >= 1) {
          setActiveStep(0); // Initiated
        }
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      // Loop logs after 6 seconds of completion to keep dashboard alive
      const resetTimer = setTimeout(() => {
        setLogs([]);
        setLogIndex(0);
        setActiveStep(0);
      }, 6000);
      return () => clearTimeout(resetTimer);
    }
  }, [logIndex]);

  return (
    <div className="w-full bg-slate-50/50 border border-slate-200/80 rounded-2xl shadow-xl overflow-hidden p-6 font-sans flex flex-col gap-6 text-slate-800 backdrop-blur-sm">
      {/* Dashboard Top Header */}
      <div className="flex items-center justify-between border-b border-slate-200/60 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Live Agent Session: proc-session-094c</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">ALGORAND TESTNET</span>
          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">ACTIVE LAYER</span>
        </div>
      </div>

      {/* Grid Layout: Map & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Map & Negotiation Signals (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Map Area */}
          <div className="relative bg-white border border-slate-200/60 rounded-xl p-4 h-[240px] overflow-hidden flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-start z-10">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Supply Route Optimization</span>
                <span className="text-sm font-semibold text-slate-700">Global Sourcing Matrix</span>
              </div>
              <Compass className="h-4 w-4 text-slate-400 animate-spin-slow" />
            </div>

            {/* SVG Abstract World Map & Nodes */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
              <svg width="100%" height="100%" viewBox="0 0 400 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Dots representing world grid */}
                <circle cx="40" cy="50" r="1.5" fill="#CBD5E1" />
                <circle cx="80" cy="60" r="1.5" fill="#CBD5E1" />
                <circle cx="120" cy="80" r="1.5" fill="#CBD5E1" />
                <circle cx="160" cy="90" r="1.5" fill="#CBD5E1" />
                <circle cx="200" cy="70" r="1.5" fill="#CBD5E1" />
                <circle cx="240" cy="60" r="1.5" fill="#CBD5E1" />
                <circle cx="280" cy="80" r="1.5" fill="#CBD5E1" />
                <circle cx="320" cy="110" r="1.5" fill="#CBD5E1" />
                <circle cx="360" cy="90" r="1.5" fill="#CBD5E1" />
                <circle cx="140" cy="130" r="1.5" fill="#CBD5E1" />
                <circle cx="210" cy="140" r="1.5" fill="#CBD5E1" />
                
                {/* Buyer Hub (US East) */}
                <circle cx="100" cy="70" r="4" fill="#6366F1" />
                <circle cx="100" cy="70" r="10" stroke="#6366F1" strokeWidth="1" strokeDasharray="2 2" className="animate-ping" />
                
                {/* Supplier Nodes (China, Germany) */}
                <circle cx="280" cy="80" r="4" fill="#10B981" />
                <circle cx="190" cy="65" r="4" fill="#10B981" />
                <circle cx="310" cy="120" r="4" fill="#F59E0B" />
                
                {/* Connection Arcs */}
                <path d="M 100 70 Q 190 20 280 80" stroke="#6366F1" strokeWidth="1.5" strokeDasharray="4 4" className="stroke-dash-offset" />
                <path d="M 100 70 Q 145 40 190 65" stroke="#6366F1" strokeWidth="1" strokeDasharray="3 3" />
                <path d="M 100 70 Q 205 100 310 120" stroke="#F59E0B" strokeWidth="1" strokeDasharray="4 4" />
              </svg>
            </div>

            {/* Map Legend */}
            <div className="flex gap-4 z-10 text-[10px] font-semibold text-slate-500 bg-white/80 backdrop-blur-sm p-2 rounded-lg border border-slate-100 w-fit">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                <span>Buyer (HQ)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Optimized Supplier</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>Negotiation Hub</span>
              </div>
            </div>
          </div>

          {/* Negotiation Signals Log */}
          <div className="bg-white border border-slate-200/60 rounded-xl p-4 flex-1 flex flex-col justify-between min-h-[220px] shadow-sm">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Autonomous Agent Actions</span>
              <span className="text-sm font-semibold text-slate-700 block mb-3">Live Negotiation & Discovery Stream</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[140px] pr-1 scrollbar-thin">
              <AnimatePresence>
                {logs.map((log, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-xs flex gap-2.5 leading-relaxed font-mono"
                  >
                    <span className="text-slate-400 font-medium select-none">{log.time}</span>
                    <span className="text-slate-400 font-bold select-none">[+]</span>
                    <span className={`flex-1 ${
                      log.type === 'system' ? 'text-slate-500 font-semibold' :
                      log.type === 'discovery' ? 'text-blue-600' :
                      log.type === 'translation' ? 'text-purple-600' :
                      log.type === 'negotiation' ? 'text-emerald-600 font-medium' :
                      log.type === 'ranking' ? 'text-indigo-600' :
                      'text-amber-600 font-medium'
                    }`}>
                      {log.text}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right Side: Rankings, Trust Score & Escrow (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Supplier Rankings & Trust Scores */}
          <div className="bg-white border border-slate-200/60 rounded-xl p-4 shadow-sm flex flex-col gap-3">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Supplier Intelligence</span>
              <span className="text-sm font-semibold text-slate-700">Ranked Alternatives</span>
            </div>

            <div className="flex flex-col gap-2">
              {INITIAL_SUPPLIERS.map((s, idx) => (
                <div key={idx} className="flex items-center justify-between border border-slate-100 hover:border-slate-200/80 p-2.5 rounded-lg transition-colors">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-bold text-slate-400">#{s.rank}</span>
                    <div>
                      <div className="text-xs font-bold text-slate-700">{s.name}</div>
                      <div className="text-[10px] text-slate-400 font-medium">{s.location}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs font-bold text-indigo-600">{s.matchScore}% Match</div>
                      <div className="text-[9px] text-emerald-600 font-semibold uppercase tracking-wider">Trust: {s.trustScore}/100</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Algorand Escrow status */}
          <div className="bg-white border border-slate-200/60 rounded-xl p-4 shadow-sm flex flex-col gap-4">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Algorand Settlement Layer</span>
              <span className="text-sm font-semibold text-slate-700">Escrow Commitment</span>
            </div>

            <div className="flex flex-col gap-3.5 relative">
              {/* Vertical line between steps */}
              <div className="absolute left-3 top-2.5 bottom-2.5 w-0.5 bg-slate-100 -z-10" />

              {/* Step 1 */}
              <div className="flex gap-3">
                <div className={`w-6.5 h-6.5 rounded-full flex items-center justify-center border text-[11px] font-bold transition-colors ${
                  activeStep >= 0 
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-600' 
                    : 'bg-white border-slate-200 text-slate-400'
                }`}>
                  {activeStep >= 1 ? <CheckCircle2 className="w-3.5 h-3.5" /> : '1'}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-700">Initialize Escrow</div>
                  <div className="text-[10px] text-slate-400 font-medium">Verify buyer-supplier specifications on-chain</div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-3">
                <div className={`w-6.5 h-6.5 rounded-full flex items-center justify-center border text-[11px] font-bold transition-colors ${
                  activeStep >= 1 
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-600' 
                    : 'bg-white border-slate-200 text-slate-400'
                }`}>
                  {activeStep >= 2 ? <CheckCircle2 className="w-3.5 h-3.5" /> : '2'}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-700">Lock Commitments</div>
                  <div className="text-[10px] text-slate-400 font-medium">Cryptographic holding via smart contracts</div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-3">
                <div className={`w-6.5 h-6.5 rounded-full flex items-center justify-center border text-[11px] font-bold transition-colors ${
                  activeStep >= 2 
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-600' 
                    : 'bg-white border-slate-200 text-slate-400'
                }`}>
                  {activeStep >= 2 ? <CheckCircle2 className="w-3.5 h-3.5" /> : '3'}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-700">Settle Transfer</div>
                  <div className="text-[10px] text-slate-400 font-medium">Instant finality with zero intermediary friction</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default DashboardMockup;
