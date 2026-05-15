import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Terminal as TerminalIcon, Cpu, ShieldCheck, Activity } from 'lucide-react';

interface ProcurementTerminalProps {
  logs: string[];
  isOpen: boolean;
}

const ProcurementTerminal: React.FC<ProcurementTerminalProps> = ({ logs, isOpen }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#0D1117] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl font-mono text-xs mb-8"
    >
      {/* Header */}
      <div className="bg-slate-900 px-6 py-4 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <div className="w-[1px] h-4 bg-slate-700 mx-1" />
          <div className="flex items-center gap-2 text-slate-400">
            <TerminalIcon className="w-3.5 h-3.5" />
            <span className="font-bold uppercase tracking-widest text-[9px]">Autonomous Intelligence Terminal</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-emerald-500/80">
            <Activity className="w-3 h-3 animate-pulse" />
            <span className="text-[8px] font-black uppercase">Live Link</span>
          </div>
        </div>
      </div>

      {/* Terminal Area */}
      <div 
        ref={scrollRef}
        className="p-6 h-[280px] overflow-y-auto scrollbar-hide space-y-2.5 selection:bg-emerald-500/30"
      >
        {logs.length === 0 ? (
          <div className="flex items-center gap-2 text-slate-600 italic">
            <span className="animate-pulse">_</span>
            Awaiting intelligence telemetry...
          </div>
        ) : (
          logs.map((log, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex gap-4 group"
            >
              <span className="text-slate-600 shrink-0 select-none">[{i.toString().padStart(2, '0')}]</span>
              <span className={log.includes('[PROCURE-AI]') ? "text-emerald-400 font-bold" : "text-slate-300"}>
                {log.replace('[PROCURE-AI]', '>')}
              </span>
            </motion.div>
          ))
        )}
        <div className="h-4" />
      </div>

      {/* Footer / Status */}
      <div className="bg-slate-900/50 px-6 py-3 border-t border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-4 text-[9px] font-bold uppercase tracking-widest text-slate-500">
          <span className="flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5" /> Processing</span>
          <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500/50" /> Secure Encryption</span>
        </div>
        <span className="text-[9px] text-slate-600 font-mono">v4.0.2-ALPHA</span>
      </div>
    </motion.div>
  );
};

export default ProcurementTerminal;
