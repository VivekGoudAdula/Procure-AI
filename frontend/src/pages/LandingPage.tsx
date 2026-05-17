import React, { Suspense, useRef, useMemo, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring, useInView } from 'motion/react';
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
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
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
    <div className="max-w-7xl mx-auto flex items-center justify-between bg-white/40 backdrop-blur-xl border border-white/20 px-8 py-4 rounded-3xl shadow-2xl shadow-slate-200/20">
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
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: f.delay, duration: 0.8 }}
              whileHover={{ y: -10 }}
              className="group relative p-10 rounded-[2.5rem] bg-white/60 backdrop-blur-2xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:bg-white/90 hover:shadow-2xl hover:shadow-indigo-100 hover:border-white"
            >
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-8 shadow-lg group-hover:scale-110 transition-transform`}>
                <f.icon className="text-white w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-slate-900">{f.title}</h3>
              <p className="text-slate-500 leading-relaxed mb-6 font-medium">{f.description}</p>

              <div className="flex items-center text-indigo-600 font-bold text-sm uppercase tracking-widest gap-2 group/btn cursor-pointer">
                Explore Feature
                <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
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
            <h2 className="text-4xl md:text-6xl font-bold mb-12 text-slate-900 tracking-tight">The 3-Step Alpha</h2>
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
    <section id="comparison" className="py-32 bg-white relative overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="text-center mb-24">
          <h2 className="text-4xl md:text-6xl font-bold mb-6 text-slate-900 tracking-tighter">
            ProcureAI vs <span className="text-slate-300">Traditional</span>
          </h2>
          <p className="text-xl text-slate-500 font-medium">Why industry leaders are switching to autonomous procurement.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Traditional Card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="group p-12 rounded-[3.5rem] bg-slate-50 border border-slate-100 flex flex-col transition-all hover:bg-white hover:shadow-xl"
          >
            <div className="space-y-10">
              <div className="flex items-center gap-4 text-slate-400">
                <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 shadow-sm">
                  <Activity className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold">Traditional Methods</h3>
              </div>

              <ul className="space-y-8">
                {[
                  { text: 'Manual sourcing calls', desc: 'Days of searching and vetting' },
                  { text: 'Slow email negotiations', desc: 'Endless back-and-forth' },
                  { text: 'Weeks of payment delay', desc: 'Manual wire transfers and processing' },
                  { text: 'Manual escrow handling', desc: 'Complex legal paperwork' }
                ].map((item, i) => (
                  <li key={i} className="flex gap-5 items-start">
                    <div className="w-6 h-6 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center mt-1.5 font-bold text-[10px] text-slate-500">
                      ✕
                    </div>
                    <div>
                      <div className="text-lg font-bold text-slate-400 line-through decoration-slate-300">{item.text}</div>
                      <div className="text-sm text-slate-400/70 font-medium">{item.desc}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* ProcureAI Card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="group relative p-12 rounded-[3.5rem] bg-slate-900 overflow-hidden shadow-[0_40px_80px_-15px_rgba(79,70,229,0.2)] flex flex-col justify-between"
          >
            {/* Animated Glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/30 blur-[100px] -mr-40 -mt-40 group-hover:bg-indigo-500/40 transition-colors" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-600/20 blur-[100px] -ml-40 -mb-40 group-hover:bg-purple-500/30 transition-colors" />

            <div className="relative z-10 space-y-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/40">
                  <Zap className="w-7 h-7" />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-2xl font-bold text-white">ProcureAI</h3>
                  <div className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-[0.2em]">Autonomous Agentic</div>
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
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex gap-5 items-start"
                  >
                    <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex-shrink-0 flex items-center justify-center mt-1.5 border border-indigo-500/30">
                      <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_12px_#22d3ee]" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">{item.text}</div>
                      <div className="text-sm text-indigo-300/50 font-medium">{item.desc}</div>
                    </div>
                  </motion.li>
                ))}
              </ul>

              {/* Efficiency Metric */}
              <div className="mt-12 pt-10 border-t border-white/5 flex items-end justify-between">
                <div>
                  <div className="text-indigo-400 font-extrabold text-[10px] uppercase tracking-widest mb-1">Total Efficiency</div>
                  <div className="text-white font-bold text-xl">Operational Gain</div>
                </div>
                <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400 tracking-tighter">
                  92%
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const FinalCTA = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const rotateX = useTransform(scrollYProgress, [0, 1], [15, -15]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1, 0.8]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.15, 0.25, 0.15]);

  return (
    <section ref={ref} className="py-60 bg-white relative overflow-hidden flex items-center justify-center">
      {/* Background Dashboard Animation - Re-tuned for Light Theme */}
      {/* Neon Glow behind Dashboard */}
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
        <motion.div
          style={{ opacity }}
          className="absolute w-full max-w-6xl h-[500px] bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-500 blur-[120px] rounded-[100%] opacity-30 mix-blend-multiply"
        />
        <motion.div
          style={{ rotateX, scale, perspective: 1000, opacity }}
          className="max-w-7xl w-full mx-auto rounded-[3rem] bg-white/60 backdrop-blur-2xl border border-white p-4 relative shadow-[0_0_80px_rgba(99,102,241,0.2)]"
        >
          <div className="rounded-[2.5rem] overflow-hidden bg-slate-50 border border-slate-200 shadow-xl">
            {/* Dashboard Mockup - Colorful and Visible */}
            <div className="bg-white border-b border-slate-200 p-6 flex items-center justify-between shadow-sm relative z-10">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-400 shadow-[0_0_10px_rgba(251,113,133,0.5)]" />
                <div className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]" />
                <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
              </div>
            </div>
            <div className="flex bg-slate-50 relative z-0">
              <div className="w-64 border-r border-slate-200 p-8 space-y-6 bg-white/50">
                {[...Array(5)].map((_, i) => <div key={i} className="h-4 w-full bg-indigo-100/50 rounded-lg" />)}
              </div>
              <div className="flex-1 p-12 space-y-12">
                <div className="grid grid-cols-3 gap-8">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-32 bg-white rounded-3xl border border-indigo-50 shadow-sm relative overflow-hidden">
                      <div className={`absolute inset-0 bg-gradient-to-br opacity-5 ${i === 0 ? 'from-cyan-500 to-blue-500' : i === 1 ? 'from-indigo-500 to-purple-500' : 'from-fuchsia-500 to-pink-500'}`} />
                    </div>
                  ))}
                </div>
                <div className="h-80 bg-white rounded-3xl border border-indigo-50 p-10 flex items-end gap-4 shadow-sm relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-indigo-50/50 to-transparent" />
                  {[80, 40, 60, 90, 50, 70, 45, 85].map((h, i) => (
                    <div key={i} className="flex-1 bg-gradient-to-t from-indigo-500 to-cyan-400 rounded-t-xl shadow-[0_0_15px_rgba(99,102,241,0.4)] relative z-10" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Decorative blobs for Light Theme */}
      <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden">
        <motion.div
          animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-600/10 blur-[100px] rounded-full"
        />
        <motion.div
          animate={{ y: [0, 20, 0], x: [0, -10, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute bottom-1/4 right-1/4 w-purple-600/5 blur-[120px] rounded-full text-white"
        />
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
            <h2 className="text-5xl md:text-8xl font-bold mb-10 text-slate-900 tracking-tighter leading-tight">
              Let AI Run Your <br />
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 bg-clip-text text-transparent italic">Procurement</span>
            </h2>
            <p className="text-xl md:text-2xl text-slate-500 mb-16 font-medium max-w-3xl mx-auto leading-relaxed">
              Join the elite network of companies automating their supply chains with agentic intelligence on Algorand.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
              <Link to="/signup" className="w-full sm:w-auto">
                <button className="w-full px-14 py-7 bg-slate-900 text-white rounded-[2.5rem] font-bold text-2xl hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-indigo-200">
                  Get Started Now
                </button>
              </Link>
              <button className="w-full sm:w-auto px-14 py-7 bg-white border border-slate-200 text-slate-900 rounded-[2.5rem] font-bold text-2xl hover:bg-slate-50 transition-all shadow-sm">
                Contact Sales
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};





const Footer = () => (
  <footer className="pt-20 bg-slate-50 border-t border-slate-100 overflow-hidden relative flex flex-col justify-between">
    <div className="container mx-auto px-6 relative z-10">
      <div className="grid md:grid-cols-4 gap-12">
        <div className="col-span-2 space-y-6">
          <div className="flex items-center gap-3 group cursor-pointer">
            <img src="/logo.png" alt="ProcureAI Logo" className="h-10 w-auto group-hover:scale-110 transition-all duration-500" />

            <span className="text-2xl font-bold tracking-tight text-slate-900">ProcureAI</span>
          </div>
          <p className="text-lg text-slate-500 font-medium max-w-sm">
            The world's first autonomous agentic commerce platform built on Algorand.
          </p>
        </div>
        <div>
          <h4 className="font-bold mb-6 text-slate-900 uppercase text-xs tracking-widest">Product</h4>
          <ul className="space-y-4 text-slate-500 font-bold text-sm">
            <li><a href="#" className="hover:text-indigo-600 transition-colors">Features</a></li>
            <li><a href="#" className="hover:text-indigo-600 transition-colors">Enterprise</a></li>
            <li><a href="#" className="hover:text-indigo-600 transition-colors">Escrow</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-6 text-slate-900 uppercase text-xs tracking-widest">Connect</h4>
          <ul className="space-y-4 text-slate-500 font-bold text-sm">
            <li><a href="#" className="hover:text-indigo-600 transition-colors">Twitter</a></li>
            <li><a href="#" className="hover:text-indigo-600 transition-colors">Discord</a></li>
            <li><a href="#" className="hover:text-indigo-600 transition-colors">GitHub</a></li>
            <li><a href="#" className="hover:text-indigo-600 transition-colors">LinkedIn</a></li>
          </ul>
        </div>
      </div>

    </div>
    
    {/* Giant Background Text */}
    <div className="w-full relative flex items-end justify-center overflow-hidden pointer-events-none mt-0">
      <h1 className="text-[14vw] md:text-[18vw] font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-slate-800 to-slate-50 select-none leading-none mb-[-2%] md:mb-[-4%] w-full text-center whitespace-nowrap">
        PROCURE AI
      </h1>
    </div>
  </footer>
);

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

        {/* Scroll Progress Bar */}
        <motion.div
          className="fixed top-0 left-0 right-0 h-1 bg-indigo-600 origin-left z-[100]"
          style={{ scaleX: useScroll().scrollYProgress }}
        />
      </div>
    </SmoothScroll>
  );
};

export default LandingPage;

