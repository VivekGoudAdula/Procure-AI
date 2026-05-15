import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Loader2, 
  Search, 
  ShieldCheck, 
  Cpu, 
  Network,
  Zap,
  Globe,
  Database
} from 'lucide-react';

const steps = [
  { id: 1, text: "Scanning global supplier ecosystems...", icon: Search, color: "text-blue-500" },
  { id: 2, text: "Fetching procurement intelligence...", icon: Database, color: "text-purple-500" },
  { id: 3, text: "Evaluating trust and fulfillment risk...", icon: ShieldCheck, color: "text-emerald-500" },
  { id: 4, text: "Optimizing negotiated pricing via AI agents...", icon: Zap, color: "text-amber-500" }
];

const IntelligenceLoading: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep(prev => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] text-center space-y-12 max-w-2xl mx-auto">
      <div className="relative">
        {/* Pulsing Core */}
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center relative">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.8, 0.5]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity
            }}
            className="absolute inset-0 bg-primary/20 rounded-full"
          />
          <Cpu className="w-12 h-12 text-primary relative z-10" />
        </div>

        {/* Orbiting Elements */}
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute inset-[-40px] border border-dashed border-slate-200 rounded-full"
        />
        <motion.div 
          animate={{ rotate: -360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute inset-[-80px] border border-dashed border-slate-100 rounded-full"
        />
      </div>

      <div className="space-y-6 w-full">
        <h2 className="text-3xl font-display font-bold text-slate-900 tracking-tight">
          Processing Intelligence Layer
        </h2>
        
        <div className="space-y-4">
          {steps.map((step, i) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ 
                opacity: i <= currentStep ? 1 : 0.3,
                y: 0,
                scale: i === currentStep ? 1.05 : 1
              }}
              className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm"
            >
              <div className={`p-2 rounded-lg ${i < currentStep ? 'bg-emerald-50' : 'bg-slate-50'}`}>
                {i < currentStep ? (
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                ) : (
                  <step.icon className={`w-5 h-5 ${i === currentStep ? step.color : 'text-slate-400'}`} />
                )}
              </div>
              <span className={`text-sm font-bold ${i === currentStep ? 'text-slate-900' : 'text-slate-400'}`}>
                {step.text}
              </span>
              {i === currentStep && (
                <Loader2 className="w-4 h-4 animate-spin ml-auto text-primary" />
              )}
              {i < currentStep && (
                <div className="ml-auto text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                  COMPLETE
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">
        Connecting to Alibaba DataHub & Global Logistics Registry
      </p>
    </div>
  );
};

export default IntelligenceLoading;
