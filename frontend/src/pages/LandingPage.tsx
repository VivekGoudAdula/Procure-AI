import React, { useEffect } from 'react';
import { motion, useScroll } from 'motion/react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Cpu,
  ShieldCheck,
  Zap,
  Layers,
  Lock,
  Coins,
  BarChart3,
  Network,
  Activity,
  ChevronRight,
  Globe,
  Play
} from 'lucide-react';


import Lenis from 'lenis';
import HeroAnimation from '../components/HeroAnimation';


// --- Types & Constants ---

const COLORS = {
  background: '#F8FAFC',
  primary: '#4F46E5', // Indigo 600
  secondary: '#9333EA', // Purple 600
  accent: '#22D3EE', // Cyan 400
  text: '#0F172A', // Slate 900
};

// --- Components ---

// 1. Smooth Scroll Wrapper
const SmoothScroll = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 0.8,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);

  return <>{children}</>;
};

// 2. 3D Elements



// --- Section Components ---

const Navbar = () => (
  <nav className="fixed top-0 left-0 w-full z-50 px-6 py-6">
    <div className="max-w-7xl mx-auto flex items-center justify-between bg-white/40 backdrop-blur-xl border border-slate-200 px-8 py-4 rounded-3xl shadow-2xl shadow-slate-200/20">
      <div className="flex items-center gap-3 group px-2 cursor-pointer">
        <img src="/logo.png" alt="ProcureAI Logo" className="h-10 w-auto group-hover:scale-110 transition-all duration-500" />
        <span className="text-xl font-bold tracking-tight text-slate-900">ProcureAI</span>
      </div>

      <div className="hidden md:flex items-center gap-8" />

      <div className="flex items-center gap-4">
        <Link to="/login" className="hidden sm:block text-sm font-bold text-slate-600 hover:text-indigo-600 px-4 transition-colors">
          Login
        </Link>
        <Link to="/signup">
          <button className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold px-6 py-3 rounded-xl transition-all hover:scale-[1.05] active:scale-95 shadow-xl shadow-slate-900/10">
            Get Started
          </button>
        </Link>
      </div>
    </div>
  </nav>
);

const Hero = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center pt-32 overflow-hidden bg-slate-50/50">
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Side (Content) */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col items-start max-w-2xl text-left pl-4 lg:pl-12"
          >
            <h1 className="text-6xl md:text-7xl lg:text-[5rem] font-bold mb-8 mt-8 leading-[1.05] tracking-tighter text-slate-900">
              AI that Negotiates.<br />
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 bg-clip-text text-transparent">Blockchain that Settles.</span>
            </h1>

            <p className="text-xl md:text-2xl text-slate-500 mb-12 font-medium leading-relaxed">
              Automated, Transparent, Unstoppable.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-6 w-full sm:w-auto">
              <button className="w-full sm:w-auto px-10 py-5 bg-slate-900 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-3 shadow-2xl shadow-indigo-200 hover:bg-indigo-600 transition-all hover:-translate-y-1 group">
                Get Started
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

            </div>

            <div className="mt-16 mb-16 flex items-center gap-12">
              <div className="space-y-1">
                <div className="text-3xl font-bold text-slate-900">1,240+</div>
                <div className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Deals Negotiated</div>
              </div>
              <div className="w-px h-12 bg-slate-200" />
              <div className="space-y-1">
                <div className="text-3xl font-bold text-slate-900">Live</div>
                <div className="text-sm font-semibold text-slate-400 uppercase tracking-wider">On Algorand TestNet</div>
              </div>
            </div>
          </motion.div>

          {/* Right Side (Visual) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative hidden lg:flex items-center justify-center -translate-x-12"
          >
            <HeroAnimation />
          </motion.div>
        </div>
      </div>

      {/* Background Decorative Gradient */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-50/50 to-transparent -z-10" />
      <div className="absolute inset-0 -z-20 bg-white" />
    </section>
  );
};

const Features = () => {
  const features = [
    {
      title: "Autonomous AI Agents",
      description: "Agents that proactively scan markets, analyze trends, and identify optimal procurement opportunities.",
      icon: Network,
      color: "from-blue-500 to-indigo-600",
      delay: 0.1
    },
    {
      title: "Agent-to-Agent Negotiation",
      description: "Proprietary LLM-driven negotiation protocols that secure best pricing without human intervention.",
      icon: Zap,
      color: "from-purple-500 to-pink-600",
      delay: 0.2
    },
    {
      title: "Smart Contract Escrow",
      description: "Full transaction security on Algorand. Funds are only released when delivery milestones are verified.",
      icon: Lock,
      color: "from-cyan-500 to-teal-600",
      delay: 0.3
    }
  ];

  return (
    <section id="features" className="py-32 bg-white relative overflow-hidden">
      {/* Background Video - Increased zoom and right shift */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[1] scale-130 translate-x-20 blur-[1.5px]">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        >
          <source src="/world.mp4" type="video/mp4" />
        </video>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-slate-900 tracking-tight [text-shadow:0_4px_30px_rgba(255,255,255,1),_0_0_15px_rgba(255,255,255,0.8)] relative z-10">
            Built for the future of commerce
            {/* Adding absolute white glow behind text for even better visibility */}
            <div className="absolute inset-0 bg-white/40 blur-2xl -z-10 rounded-full" />
          </h2>
          <p className="text-xl text-slate-800 font-bold [text-shadow:0_2px_15px_rgba(255,255,255,1),_0_0_10px_rgba(255,255,255,0.9)] relative z-10">
            Streamline your operations with intelligence that works around the clock.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: f.delay, type: "spring", stiffness: 80, damping: 20 }}
              whileHover={{ y: -15, scale: 1.02 }}
              className="group relative p-12 rounded-[3rem] bg-white/70 backdrop-blur-3xl border border-white/80 shadow-[0_15px_40px_rgb(0,0,0,0.06)] transition-all duration-500 hover:bg-white overflow-hidden flex flex-col justify-between h-full"
            >
              {/* Animated Inner Glows */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                <div className={`absolute -top-10 -right-10 w-64 h-64 bg-gradient-to-br ${f.color} opacity-[0.08] blur-[50px] rounded-full group-hover:scale-[1.8] transition-transform duration-700 ease-out`} />
                <div className={`absolute -bottom-10 -left-10 w-64 h-64 bg-gradient-to-tr ${f.color} opacity-[0.08] blur-[50px] rounded-full group-hover:scale-[1.8] transition-transform duration-700 ease-out`} />
              </div>

              <div className="relative z-10">
                <div className={`w-16 h-16 rounded-[1.25rem] bg-gradient-to-br ${f.color} flex items-center justify-center mb-8 shadow-xl shadow-slate-200 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500`}>
                  <f.icon className="text-white w-8 h-8" />
                </div>
                <h3 className="text-[1.75rem] font-black mb-5 text-slate-900 leading-[1.15] tracking-tight">{f.title}</h3>
                <p className="text-slate-500 text-lg leading-relaxed mb-10 font-medium">{f.description}</p>
              </div>

              <div className="relative z-10 mt-auto">
                <div className="inline-flex items-center text-indigo-600 font-bold text-sm uppercase tracking-widest gap-2 group-hover:text-indigo-500 transition-colors cursor-pointer">
                  Explore Feature
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform duration-300" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const HowItWorks = () => {
  const steps = [
    {
      id: "01",
      title: "Input Requirement",
      desc: "Define your needs in natural language. Our agents understand complex specs and criteria.",
      icon: Layers
    },
    {
      id: "02",
      title: "AI Negotiating",
      desc: "Agents reach out to suppliers, negotiate terms, and compare options automatically.",
      icon: Network
    },
    {
      id: "03",
      title: "Algorand Settlement",
      desc: "Transactions are executed via smart contracts, ensuring trust and instant settlement.",
      icon: ShieldCheck
    }
  ];

  return (
    <section className="py-32 bg-slate-50 relative overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          {/* Left Side: Video Animation */}
          <div className="relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="aspect-square rounded-[3.5rem] bg-slate-200 overflow-hidden shadow-3xl relative p-1 group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 opacity-20 group-hover:opacity-30 transition-opacity" />
              <video
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover rounded-[3.3rem] relative z-10 shadow-inner scale-110"
              >
                <source src="/aibot.mp4" type="video/mp4" />
              </video>

              {/* Floating element for depth */}
              <div className="absolute bottom-10 right-10 z-20 bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-3xl shadow-2xl animate-bounce-slow">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold text-white uppercase tracking-widest">AI Agent Active</span>
                </div>
              </div>
            </motion.div>

            {/* Decorative blobs */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-400/20 blur-3xl rounded-full" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-400/20 blur-3xl rounded-full" />
          </div>

          {/* Right Side: Step Info */}
          <div className="pl-0 lg:pl-10">
            <h2 className="text-3xl md:text-5xl lg:text-[3.5rem] xl:text-6xl font-black mb-12 text-slate-900 tracking-tighter whitespace-nowrap">The 3-Step Alpha</h2>
            <div className="space-y-12">
              {steps.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2 }}
                  className="flex gap-8 group"
                >
                  <div className="flex-shrink-0 w-16 h-16 rounded-[2rem] bg-white border border-slate-200 flex items-center justify-center text-2xl font-bold text-slate-400 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 group-hover:scale-110 transition-all duration-500 shadow-sm group-hover:shadow-xl group-hover:shadow-indigo-200">
                    {s.id}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2 text-slate-900 group-hover:text-indigo-600 transition-colors">{s.title}</h3>
                    <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-md">{s.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const Comparison = () => {
  return (
    <section id="comparison" className="pt-32 pb-10 bg-white relative overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="text-center mb-24">
          <h2 className="text-5xl md:text-7xl lg:text-[5.5rem] font-black mb-6 text-slate-900 tracking-tighter">
            ProcureAI vs <span className="text-transparent bg-clip-text bg-gradient-to-b from-slate-300 to-slate-400">Traditional</span>
          </h2>
          <p className="text-xl text-slate-500 font-medium">Why industry leaders are switching to autonomous procurement.</p>
        </div>

        <div className="relative max-w-6xl mx-auto rounded-[3.5rem] p-2 bg-slate-200/50 backdrop-blur-2xl border border-white/60 flex flex-col lg:flex-row shadow-[0_20px_80px_-15px_rgba(0,0,0,0.05)]">
          
          {/* VS Badge */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-16 h-16 bg-white rounded-full items-center justify-center font-black text-xl text-slate-800 shadow-[0_10px_40px_rgba(0,0,0,0.15)] border border-slate-100 hidden lg:flex">
            VS
          </div>

          {/* Traditional Card */}
          <div className="flex-1 bg-white/90 rounded-[3rem] p-10 lg:pr-20 relative overflow-hidden transition-all">
            <div className="flex items-center gap-5 mb-10">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 shadow-inner">
                <Activity className="w-7 h-7" />
              </div>
              <h3 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tighter">Traditional Methods</h3>
            </div>

            <ul className="space-y-8">
              {[
                { text: 'Manual sourcing calls', desc: 'Days of searching and vetting' },
                { text: 'Slow email negotiations', desc: 'Endless back-and-forth' },
                { text: 'Weeks of payment delay', desc: 'Manual wire transfers and processing' },
                { text: 'Manual escrow handling', desc: 'Complex legal paperwork' }
              ].map((item, i) => (
                <li key={i} className="flex gap-6 items-start opacity-70 hover:opacity-100 transition-opacity duration-300 group">
                  <div className="w-7 h-7 rounded-full bg-rose-50 flex-shrink-0 flex items-center justify-center mt-0.5 text-rose-400 border border-rose-100 group-hover:bg-rose-100 group-hover:text-rose-500 transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-slate-600 line-through decoration-slate-300 group-hover:decoration-rose-300 transition-colors">{item.text}</div>
                    <div className="text-sm text-slate-400 font-medium mt-1.5">{item.desc}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* ProcureAI Card */}
          <div className="flex-1 bg-slate-900 rounded-[3rem] p-10 lg:pl-20 relative overflow-hidden shadow-2xl z-10 border border-slate-800">
            {/* Animated Glows */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/20 blur-[120px] -mr-40 -mt-40 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-500/10 blur-[120px] -ml-40 -mb-40 pointer-events-none" />

            <div className="relative z-10 space-y-10">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-[0_0_30px_rgba(99,102,241,0.4)]">
                  <Zap className="w-7 h-7" />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-3xl md:text-4xl font-black text-white tracking-tighter">ProcureAI</h3>
                  <div className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em] mt-1">Autonomous Agentic</div>
                </div>
              </div>

              <ul className="space-y-8">
                {[
                  { text: 'Instant agent-search', desc: 'Seconds to find the best vendors' },
                  { text: 'LLM-powered negotiation', desc: '24/7 autonomous pricing optimization' },
                  { text: 'Real-time settle on Algorand', desc: 'Instant global payments' },
                  { text: 'Automated smart-contracts', desc: 'Programmable trust and security' }
                ].map((item, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    viewport={{ once: true }}
                    className="flex gap-6 items-start group cursor-default"
                  >
                    <div className="w-7 h-7 rounded-full bg-indigo-500/10 flex-shrink-0 flex items-center justify-center mt-0.5 border border-indigo-500/30 group-hover:bg-indigo-500/30 transition-all duration-300 group-hover:border-indigo-400/50 shadow-[0_0_15px_rgba(99,102,241,0)] group-hover:shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                      <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_12px_#22d3ee] group-hover:scale-[1.6] group-hover:bg-white transition-all duration-300" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors duration-300">{item.text}</div>
                      <div className="text-sm text-indigo-200/60 font-medium mt-1.5">{item.desc}</div>
                    </div>
                  </motion.li>
                ))}
              </ul>


            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const FinalCTA = () => {

  return (
    <section className="pt-20 pb-40 bg-white relative overflow-hidden flex items-center justify-center">
      {/* Soft ambient glow */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute w-[600px] h-[400px] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-500 blur-3xl rounded-full opacity-[0.07]" />
        <div className="absolute top-1/4 left-1/4 w-48 h-48 bg-indigo-600/10 blur-3xl rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-purple-600/8 blur-3xl rounded-full" />
      </div>

      {/* CTA Content - High Contrast Slates */}
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
          >
            <h2 className="text-5xl md:text-[6rem] lg:text-[7rem] font-extrabold mb-8 text-slate-900 tracking-tighter leading-[1.05]">
              Let AI Run Your <br />
              <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500 bg-clip-text text-transparent italic font-black pr-4 pb-2 inline-block">Procurement</span>
            </h2>
            <p className="text-xl md:text-2xl text-slate-500 mb-16 font-medium max-w-3xl mx-auto leading-relaxed">
              Join the elite network of companies automating their supply chains with agentic intelligence on Algorand.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
              <Link to="/login" className="w-full sm:w-auto">
                <button className="w-full px-12 py-6 bg-slate-900 text-white rounded-[2.5rem] font-bold text-xl hover:scale-105 active:scale-95 transition-all shadow-[0_10px_40px_rgba(15,23,42,0.3)] border border-slate-700">
                  Get Started Now
                </button>
              </Link>
              <Link to="/login" className="w-full sm:w-auto">
                <button className="w-full px-12 py-6 bg-white border-2 border-slate-100 text-slate-900 rounded-[2.5rem] font-bold text-xl hover:bg-slate-50 hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all">
                  Contact Sales
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};





const Footer = () => (
  <footer className="pt-24 bg-slate-50 border-t border-slate-200 overflow-hidden relative flex flex-col justify-between z-10">
    {/* Animated Background Element */}
    <motion.div
      animate={{ y: [0, -30, 0], opacity: [0.3, 0.6, 0.3] }}
      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-indigo-200/40 to-purple-200/40 rounded-full blur-[100px] pointer-events-none -z-10"
    />

    <div className="container mx-auto px-6 relative z-10">
      <div className="grid md:grid-cols-4 gap-12 pb-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="col-span-2 space-y-8"
        >
          <div className="flex items-center gap-3 group cursor-pointer w-fit">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-400 blur-lg opacity-0 group-hover:opacity-40 transition-opacity duration-500" />
              <img src="/logo.png" alt="ProcureAI Logo" className="h-10 w-auto group-hover:scale-110 transition-transform duration-500 relative z-10" />
            </div>
            <span className="text-2xl font-black tracking-tighter text-slate-900">ProcureAI</span>
          </div>
          <p className="text-lg text-slate-500 font-medium max-w-sm leading-relaxed">
            The world's first autonomous agentic commerce platform built on Algorand.
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          <h4 className="font-black mb-8 text-slate-900 uppercase text-xs tracking-[0.2em]">Product</h4>
          <ul className="space-y-5 text-slate-500 font-bold text-sm">
            {['Features', 'Enterprise', 'Escrow'].map((item) => (
              <li key={item}>
                <a href="#" className="group flex items-center gap-2 hover:text-indigo-600 transition-colors w-fit">
                  <span className="relative overflow-hidden">
                    <span className="block transition-transform duration-300 group-hover:-translate-y-full">{item}</span>
                    <span className="block absolute top-0 left-0 transition-transform duration-300 translate-y-full group-hover:translate-y-0 text-indigo-600">{item}</span>
                  </span>
                  <span className="opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-indigo-500">→</span>
                </a>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <h4 className="font-black mb-8 text-slate-900 uppercase text-xs tracking-[0.2em]">Connect</h4>
          <ul className="space-y-5 text-slate-500 font-bold text-sm">
            {['Twitter', 'Discord', 'GitHub', 'LinkedIn'].map((item) => (
              <li key={item}>
                <a href="#" className="group flex items-center gap-2 hover:text-indigo-600 transition-colors w-fit">
                  <span className="relative overflow-hidden">
                    <span className="block transition-transform duration-300 group-hover:-translate-y-full">{item}</span>
                    <span className="block absolute top-0 left-0 transition-transform duration-300 translate-y-full group-hover:translate-y-0 text-indigo-600">{item}</span>
                  </span>
                  <span className="opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-indigo-500">→</span>
                </a>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </div>
    
    {/* Giant Background Text */}
    <div className="w-full relative flex items-end justify-center overflow-hidden pointer-events-none mt-0 z-0">
      <h1 className="text-[14vw] md:text-[18vw] font-semibold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-slate-950 via-slate-600 to-slate-200 select-none leading-none mb-[-2%] md:mb-[-4%] w-full text-center whitespace-nowrap">
        PROCURE AI
      </h1>
    </div>
  </footer>
);

// Scroll progress bar as its own component to avoid hook-in-JSX anti-pattern
const ScrollProgressBar = () => {
  const { scrollYProgress } = useScroll();
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 bg-indigo-600 origin-left z-[100]"
      style={{ scaleX: scrollYProgress }}
    />
  );
};

// --- Main Page Component ---

const LandingPage = () => {
  return (
    <SmoothScroll>
      <div className="noise-overlay" />
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 relative">
        <Navbar />
        <main>
          <Hero />
          <Features />
          <HowItWorks />
          <Comparison />
          <FinalCTA />
        </main>
        <Footer />
        <ScrollProgressBar />
      </div>
    </SmoothScroll>
  );
};

export default LandingPage;

