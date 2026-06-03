import React, { useEffect, useState } from 'react';
import { motion, useScroll, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Cpu,
  ShieldCheck,
  Zap,
  Layers,
  Lock,
  BarChart3,
  Network,
  ChevronRight,
  Globe,
  Play,
  FileText,
  Languages,
  Check,
  Building,
  ArrowUpRight,
  Database,
  Briefcase,
  GitBranch,
  Key,
  X,
  FileCode,
  Wallet,
  Activity,
  Server
} from 'lucide-react';

import Lenis from 'lenis';

// --- Smooth Scroll Wrapper ---
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

// --- Scroll Progress Bar ---
const ScrollProgressBar = () => {
  const { scrollYProgress } = useScroll();
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 bg-slate-900 origin-left z-[100]"
      style={{ scaleX: scrollYProgress }}
    />
  );
};

// --- Navbar ---
const Navbar = () => (
  <nav className="fixed top-0 left-0 w-full z-50 px-6 py-6 flex justify-center">
    <div className="w-full max-w-4xl flex items-center justify-between bg-[#050716]/30 backdrop-blur-lg border border-slate-800/50 px-6 py-3 rounded-full shadow-2xl">
      <Link 
        to="/" 
        onClick={(e) => {
          if (window.location.pathname === '/') {
            e.preventDefault();
            document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' });
          }
        }}
        className="flex items-center gap-2.5 px-2"
      >
        <img src="/logo.png" alt="ProcureAI Logo" className="h-7 w-auto" />
        <span className="text-base font-bold tracking-tight text-white font-sans">ProcureAI</span>
      </Link>

      <div className="hidden md:flex items-center gap-8 text-xs font-medium text-slate-400">
        <a 
          href="#problem" 
          onClick={(e) => { e.preventDefault(); document.getElementById('problem')?.scrollIntoView({ behavior: 'smooth' }); }}
          className="hover:text-white transition-colors"
        >
          Platform
        </a>
        <a 
          href="#workflow" 
          onClick={(e) => { e.preventDefault(); document.getElementById('workflow')?.scrollIntoView({ behavior: 'smooth' }); }}
          className="hover:text-white transition-colors"
        >
          Workflow
        </a>
        <a 
          href="#comparison" 
          onClick={(e) => { e.preventDefault(); document.getElementById('comparison')?.scrollIntoView({ behavior: 'smooth' }); }}
          className="hover:text-white transition-colors"
        >
          Why Us
        </a>
        <a 
          href="#impact" 
          onClick={(e) => { e.preventDefault(); document.getElementById('impact')?.scrollIntoView({ behavior: 'smooth' }); }}
          className="hover:text-white transition-colors"
        >
          Impact
        </a>
      </div>

      <div className="flex items-center gap-4">
        <Link to="/login">
          <button className="bg-white hover:bg-slate-100 text-slate-950 text-[11px] font-bold px-4 py-2 rounded-full transition-all flex items-center gap-1">
            Login
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </Link>
      </div>
    </div>
  </nav>
);

// --- Hero ---
const Hero = () => (
  <section id="hero" className="relative min-h-screen pt-36 pb-20 overflow-hidden bg-[#050716] flex items-center">
    {/* Spline 3D Globe Viewer - absolute background element on the left, z-0 */}
    <div 
      className="absolute top-0 left-0 z-0 w-full lg:w-[50%] h-full pointer-events-auto scale-90 lg:scale-[1.1] origin-center lg:translate-x-12 lg:translate-y-16"
      dangerouslySetInnerHTML={{
        __html: `<spline-viewer url="https://prod.spline.design/vs9v7rgJ0aBrhMk9/scene.splinecode"></spline-viewer>`
      }}
    />

    {/* Gradient overlay to fade the globe into the dark background on the right */}
    <div className="absolute inset-y-0 right-0 w-full lg:w-[65%] bg-gradient-to-r from-transparent via-[#050716]/70 to-[#050716] pointer-events-none z-10" />

    {/* Subtle dark grid overlay in background - z-0 */}
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none z-0" />

    <div className="max-w-7xl mx-auto px-6 relative z-20 w-full flex justify-end">
      <div className="max-w-2xl text-left flex flex-col items-start transform lg:translate-x-24 md:translate-x-12">
        <h1 
           className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.25] mb-6"
           style={{ textShadow: '0 4px 20px rgba(0,0,0,0.95), 0 2px 4px rgba(0,0,0,0.9)' }}
         >
           Find Suppliers. Negotiate Smarter. Settle Securely.
         </h1>
         <p 
           className="text-base md:text-lg text-slate-400 font-normal leading-relaxed mb-8 max-w-xl"
           style={{ textShadow: '0 2px 10px rgba(0,0,0,0.95)' }}
         >
           One autonomous procurement platform powered by AI agents and Algorand smart contracts.
         </p>

        <div className="w-full flex justify-start md:justify-start">
          <Link to="/signup">
            <button className="px-6 py-3 bg-white text-slate-950 rounded-full font-semibold text-sm hover:bg-slate-200 transition-all flex items-center gap-2">
              Launch Platform
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </Link>
        </div>
      </div>
    </div>
  </section>
);

// --- Section 2: Global Procurement Remains Fragmented ---
const ProblemSection = () => {
  const cards = [
    { title: "Supplier Discovery", desc: "Manual supplier searching", icon: Globe },
    { title: "Language Barriers", desc: "Cross-border communication challenges", icon: Languages },
    { title: "Negotiation Complexity", desc: "MOQ and pricing uncertainty", icon: Briefcase },
    { title: "Supplier Trust Validation", desc: "Risk assessment difficulties", icon: ShieldCheck },
    { title: "RFQ Generation", desc: "Time-consuming procurement inquiries", icon: FileText },
    { title: "Payment Coordination", desc: "Manual escrow and settlement workflows", icon: Lock }
  ];

  return (
    <section id="problem" className="py-24 bg-white border-t border-slate-100 relative scroll-mt-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="max-w-3xl mb-16">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Current Industry Inefficiencies</span>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
            Global Procurement Remains Fragmented
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {cards.map((card, idx) => (
            <div
              key={idx}
              className="bg-white border border-slate-200/80 hover:border-slate-400 p-8 rounded-2xl transition-all duration-300 shadow-sm flex flex-col justify-between min-h-[180px]"
            >
              <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200/60 flex items-center justify-center mb-6">
                <card.icon className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-950 mb-1">{card.title}</h3>
                <p className="text-sm text-slate-500 font-normal">{card.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-100 pt-8 flex items-center justify-between">
          <p className="text-slate-500 text-sm font-medium">
            Fragmented channels, timezone discrepancies, and compliance friction.
          </p>
          <span className="text-sm font-bold text-slate-950 font-mono">
            What should take minutes often takes weeks.
          </span>
        </div>
      </div>
    </section>
  );
};

// --- Section 3: How It Works Visual Flow ---
const WorkflowSection = () => {
  const steps = [
    { title: "Buyer Requirement", desc: "Raw specification input via platform UI", icon: FileText },
    { title: "Supplier Discovery Agent", desc: "Global matching using vector db filters", icon: Globe },
    { title: "Translation Agent", desc: "Cross-border communication localization", icon: Languages },
    { title: "Negotiation Intel Agent", desc: "Autonomous negotiation of MOQ & target rates", icon: Cpu },
    { title: "Supplier Ranking Agent", desc: "Synthesizing scores & ranking candidates", icon: BarChart3 },
    { title: "Algorand Escrow Settlement", desc: "On-chain smart contract escrow locked", icon: ShieldCheck }
  ];

  return (
    <section id="workflow" className="py-24 bg-[#050716] border-t border-b border-slate-900 relative overflow-hidden scroll-mt-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="max-w-3xl mb-16">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Architectural Workflow</span>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
            How ProcureAI Works
          </h2>
        </div>

        {/* Visual Connector Line Graph */}
        <div className="relative flex flex-col lg:flex-row items-stretch justify-between gap-6 lg:gap-4 mt-8">

          {/* Background Connecting Line */}
          <div className="absolute top-[36px] left-[5%] right-[5%] h-0.5 bg-slate-800 hidden lg:block -z-10" />

          {steps.map((step, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center text-center group relative">
              {/* Outer circle indicator */}
              <div className="w-[72px] h-[72px] rounded-full bg-slate-900 border-2 border-slate-800 group-hover:border-indigo-500 flex items-center justify-center shadow-md transition-all duration-300 z-10">
                <div className="w-[56px] h-[56px] rounded-full bg-slate-800/50 group-hover:bg-indigo-950/50 flex items-center justify-center transition-colors duration-300">
                  <step.icon className="w-6 h-6 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                </div>
              </div>

              {/* Text Blocks */}
              <div className="mt-6 bg-slate-900/50 p-4 rounded-xl border border-slate-800/60 shadow-sm max-w-[200px] w-full lg:max-w-none flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] font-bold text-slate-500 font-mono mb-1">STEP 0{idx + 1}</div>
                  <h3 className="text-xs font-bold text-white mb-1.5 leading-snug">{step.title}</h3>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed font-normal mt-1">{step.desc}</p>
              </div>

              {/* Dynamic status arrow for mobile */}
              {idx < steps.length - 1 && (
                <div className="block lg:hidden text-slate-700 my-2 text-xl font-bold">↓</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};



// --- Section 5: Why ProcureAI (Visual Side-by-Side Cards) ---
const ComparisonSection = () => {
  const items = [
    { label: "Supplier Discovery", traditional: "Manual supplier discovery", procure: "AI supplier intelligence" },
    { label: "Translation Layer", traditional: "Manual translation", procure: "Multilingual procurement AI" },
    { label: "Negotiation Protocol", traditional: "Email negotiations", procure: "Negotiation intelligence" },
    { label: "Analysis Method", traditional: "Spreadsheet analysis", procure: "Supplier trust scoring" },
    { label: "Trust Assurance", traditional: "Manual escrow", procure: "Blockchain escrow commitments" },
    { label: "Operational Model", traditional: "Human-heavy workflows", procure: "Autonomous procurement workflows" }
  ];

  return (
    <section id="comparison" className="py-24 bg-white border-t border-b border-slate-100 scroll-mt-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="max-w-3xl mb-16">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Performance Benchmarks</span>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
            Why ProcureAI
          </h2>
        </div>

        {/* Side by Side visual card layout */}
        <div className="grid lg:grid-cols-2 gap-8 items-stretch max-w-5xl mx-auto">

          {/* Traditional Panel */}
          <div className="bg-white border border-slate-200 rounded-2xl p-8 flex flex-col justify-between shadow-sm relative">
            <div>
              <div className="flex items-center gap-3 border-b border-slate-100 pb-5 mb-6">
                <div className="w-10 h-10 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center">
                  <X className="w-5 h-5 text-rose-500" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Traditional Procurement</h3>
                  <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Manual & Fragmented</span>
                </div>
              </div>

              <div className="space-y-4">
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-300 mt-2 flex-shrink-0" />
                    <div>
                      <span className="text-slate-400 text-xs block font-semibold">{item.label}</span>
                      <span className="text-slate-500 font-normal">{item.traditional}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-6 mt-8">
              <span className="text-xs font-mono font-bold text-slate-400">Bottlenecks: Delays, human error, security overhead</span>
            </div>
          </div>

          {/* ProcureAI Panel */}
          <div className="bg-slate-950 border border-slate-900 rounded-2xl p-8 flex flex-col justify-between shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />

            <div>
              <div className="flex items-center gap-3 border-b border-slate-900 pb-5 mb-6">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                  <Check className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">ProcureAI Platform</h3>
                  <span className="text-[10px] text-indigo-400 font-mono uppercase tracking-wider">Autonomous Infrastructure</span>
                </div>
              </div>

              <div className="space-y-4">
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
                    <div>
                      <span className="text-slate-500 text-xs block font-semibold">{item.label}</span>
                      <span className="text-indigo-200 font-semibold">{item.procure}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-900 pt-6 mt-8">
              <span className="text-xs font-mono font-bold text-indigo-400">Optimization: Zero trust overhead, autonomous scaling</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};



// --- Section 7: Business Impact ---
const ImpactSection = () => {
  const metrics = [
    { label: "Reduce supplier discovery time", val: "90% Reduction", sub: "From 14 days down to seconds using semantic multi-agent mapping" },
    { label: "Reduce negotiation overhead", val: "80% Time Saved", sub: "Agents resolve MOQ and initial price parameters autonomously" },
    { label: "Reduce communication friction", val: "No Barriers", sub: "Translates technical specifications into 40+ regional dialects" },
    { label: "Improve supplier trust evaluation", val: "Verifiable Profiles", sub: "On-chain identity tracking prevents counterparty risk" },
    { label: "Accelerate procurement cycles", val: "10x Throughput", sub: "Automate raw sourcing input directly to escrow execution" },
    { label: "Enable programmable settlements", val: "Instant Finality", sub: "Payments locked and released transparently via smart contracts" }
  ];

  return (
    <section id="impact" className="py-24 bg-[#050716] border-t border-b border-slate-900 scroll-mt-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="max-w-3xl mb-16">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Empirical Efficiencies</span>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
            Business Impact
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {metrics.map((metric, idx) => (
            <div key={idx} className="bg-slate-900/50 border border-slate-800/60 p-8 rounded-2xl shadow-sm flex flex-col justify-between min-h-[190px]">
              <div>
                <span className="text-xs font-bold text-slate-500 block mb-1 font-mono uppercase tracking-wide">{metric.label}</span>
                <div className="text-xl font-bold text-white mb-2">{metric.val}</div>
              </div>
              <p className="text-xs text-slate-400 font-normal leading-relaxed">{metric.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};



// --- Final CTA ---
const FinalCTA = () => (
  <section className="py-28 bg-slate-950 text-white relative overflow-hidden">
    {/* Clean grid lines for dark theme CTA */}
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#334155_1px,transparent_1px),linear-gradient(to_bottom,#334155_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-10 pointer-events-none" />

    <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
      <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6">
        Procurement Intelligence For Global Commerce
      </h2>
      <p className="text-base md:text-lg text-slate-400 font-normal leading-relaxed mb-10 max-w-2xl mx-auto">
        From supplier discovery to escrow-backed settlement, ProcureAI transforms fragmented procurement workflows into an intelligent autonomous system.
      </p>

      <div className="flex flex-wrap justify-center items-center gap-4">
        <Link to="/signup">
          <button className="px-8 py-3.5 bg-white text-slate-950 rounded-full font-bold text-sm hover:bg-slate-100 transition-all shadow-lg shadow-white/5">
            Launch Platform
          </button>
        </Link>
        <Link to="/login">
          <button className="px-8 py-3.5 bg-slate-900 border border-slate-800 text-slate-300 rounded-full font-bold text-sm hover:text-white hover:bg-slate-800 transition-all">
            View Demo
          </button>
        </Link>
      </div>
    </div>
  </section>
);

// --- Footer ---
const Footer = () => (
  <footer className="bg-white border-t border-slate-100 pt-16 pb-0 overflow-hidden relative">
    <div className="max-w-7xl mx-auto px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
        <div className="space-y-4 max-w-none">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="ProcureAI Logo" className="h-7 w-auto" />
            <span className="text-base font-bold text-slate-900">ProcureAI</span>
          </div>
          <p className="text-sm text-slate-500 leading-relaxed font-normal whitespace-nowrap">
            The world's first autonomous agentic commerce platform built on Algorand.
          </p>
        </div>

        <div className="flex flex-col items-start md:items-end gap-2 text-xs text-slate-500 font-medium pt-2">
          <p>&copy; {new Date().getFullYear()} ProcureAI. All rights reserved.</p>
          <p className="text-slate-400 font-normal">Built on Algorand</p>
        </div>
      </div>
    </div>

    {/* Giant Typography at the bottom */}
    <div className="w-full text-center overflow-hidden select-none pointer-events-none -mt-8 md:-mt-12">
      <h1 className="text-[15vw] font-black text-transparent bg-clip-text bg-gradient-to-b from-[#0f172a] via-[#1e293b]/90 to-[#cbd5e1]/10 tracking-tighter leading-none select-none">
        PROCURE AI
      </h1>
    </div>
  </footer>
);

// --- Main Page Component ---
const LandingPage = () => {
  useEffect(() => {
    // Hide Spline watermark logo inside its Shadow DOM
    const interval = setInterval(() => {
      const viewer = document.querySelector('spline-viewer');
      if (viewer && viewer.shadowRoot) {
        // Target Spline's logo elements inside shadow DOM
        const logo = viewer.shadowRoot.getElementById('logo') || viewer.shadowRoot.querySelector('#logo');
        if (logo) {
          logo.setAttribute('style', 'display: none !important; opacity: 0 !important; visibility: hidden !important; pointer-events: none !important;');
        }

        // Also inject a style sheet inside the shadow root to prevent it rendering
        if (!viewer.shadowRoot.querySelector('#spline-custom-style')) {
          const style = document.createElement('style');
          style.id = 'spline-custom-style';
          style.innerHTML = `
            #logo, a[href*="spline.design"], #logo-container, .logo {
              display: none !important;
              opacity: 0 !important;
              visibility: hidden !important;
              pointer-events: none !important;
            }
          `;
          viewer.shadowRoot.appendChild(style);
        }
      }
    }, 100);

    // Stop checking after 10 seconds to save CPU cycles
    const timeout = setTimeout(() => {
      clearInterval(interval);
    }, 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <SmoothScroll>
      <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-slate-100 selection:text-slate-900 relative">
        <Navbar />
        <main>
          <Hero />
          <ProblemSection />
          <WorkflowSection />
          <ComparisonSection />
          <ImpactSection />
          <FinalCTA />
        </main>
        <Footer />
        <ScrollProgressBar />
      </div>
    </SmoothScroll>
  );
};

export default LandingPage;
