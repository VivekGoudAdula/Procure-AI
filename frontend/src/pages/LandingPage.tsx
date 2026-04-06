import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Cpu, 
  ShieldCheck, 
  Zap, 
  Globe, 
  BarChart3,
  ChevronRight
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';

const LandingPage = () => {
  const features = [
    {
      title: "AI Agents",
      description: "Autonomous agents that understand your requirements and find the best suppliers.",
      icon: Cpu,
      color: "from-primary to-violet-400"
    },
    {
      title: "On-chain Settlement",
      description: "Secure, transparent, and instant payments using Algorand blockchain technology.",
      icon: ShieldCheck,
      color: "from-secondary to-rose-400"
    },
    {
      title: "Autonomous Negotiation",
      description: "Real-time AI-to-supplier negotiation to ensure you always get the best price.",
      icon: Zap,
      color: "from-accent to-orange-400"
    }
  ];

  const steps = [
    { number: "01", title: "Input Requirement", description: "Tell the agent what you need, your quantity, and budget." },
    { number: "02", title: "AI Negotiates", description: "Our agents negotiate with multiple suppliers in real-time." },
    { number: "03", title: "Blockchain Settlement", description: "Securely pay and settle the transaction on-chain." }
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Animated Blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <motion.div 
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px]"
        />
        <motion.div 
          animate={{
            x: [0, -80, 0],
            y: [0, 100, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/20 blur-[100px]"
        />
      </div>

      {/* Navbar */}
      <nav className="container mx-auto px-6 py-8 flex items-center justify-between relative z-20">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center shadow-2xl shadow-slate-900/20 group-hover:scale-110 transition-all duration-500">
            <Cpu className="text-white w-7 h-7" />
          </div>
          <span className="text-2xl font-display font-bold tracking-tighter text-slate-900">ProcureAI</span>
        </div>
        <div className="hidden lg:flex items-center gap-10 bg-white/50 backdrop-blur-xl border border-white/20 px-8 py-3 rounded-2xl shadow-xl shadow-slate-200/20">
          <a href="#features" className="text-sm font-bold text-slate-500 hover:text-primary transition-colors tracking-tight">Features</a>
          <a href="#how-it-works" className="text-sm font-bold text-slate-500 hover:text-primary transition-colors tracking-tight">How it Works</a>
          <div className="w-px h-4 bg-slate-200" />
          <Link to="/login">
            <Button variant="ghost" className="text-sm font-bold text-slate-500 hover:text-primary px-0">Login</Button>
          </Link>
          <Link to="/signup">
            <Button className="bg-slate-900 hover:bg-slate-800 text-white shadow-xl shadow-slate-900/20 font-bold px-8 h-11 rounded-xl transition-all hover:scale-[1.02]">Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 pt-24 pb-40 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white border border-slate-100 mb-10 shadow-xl shadow-slate-200/50">
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 overflow-hidden">
                  <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" referrerPolicy="no-referrer" />
                </div>
              ))}
            </div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Trusted by 2,000+ Enterprises</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-display font-bold mb-8 leading-[0.9] tracking-tighter text-slate-900">
            The Autonomous <br />
            <span className="text-primary italic font-serif font-light">Commerce</span> Engine
          </h1>
          <p className="text-xl md:text-2xl text-slate-500 max-w-3xl mx-auto mb-12 font-medium leading-relaxed tracking-tight">
            Deploy AI agents that source, negotiate, and settle deals on-chain. 
            Automate your entire supply chain with agentic intelligence.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link to="/signup">
              <Button size="lg" className="h-16 px-12 text-xl bg-slate-900 hover:bg-slate-800 shadow-2xl shadow-slate-900/20 group font-bold rounded-2xl transition-all hover:scale-[1.02]">
                Start Deploying 
                <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="h-16 px-12 text-xl bg-white border-slate-100 hover:bg-slate-50 text-slate-900 font-bold shadow-xl shadow-slate-200/50 rounded-2xl transition-all">
              Watch Demo
            </Button>
          </div>
        </motion.div>

        {/* Hero Image/Mockup */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="mt-20 relative"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10" />
          <div className="glass-card p-4 max-w-5xl mx-auto overflow-hidden border-slate-200/50 shadow-2xl shadow-slate-200/50">
            <img 
              src="https://picsum.photos/seed/procureai/1200/600?grayscale" 
              alt="Dashboard Preview" 
              className="rounded-xl w-full opacity-40"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <div className="bg-white/90 backdrop-blur-md p-10 rounded-3xl text-center max-w-md shadow-2xl border border-slate-100">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Cpu className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-foreground">Agentic Intelligence</h3>
                <p className="text-base text-foreground/60 font-medium">Our agents are currently negotiating 1,240+ deals across the Algorand mainnet.</p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 bg-slate-50/50 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-4 text-slate-900">Powerful Agentic Features</h2>
            <p className="text-slate-500 max-w-xl mx-auto font-medium">Everything you need to automate your supply chain with AI and Blockchain.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                whileHover={{ y: -10 }}
                className="group"
              >
                <Card className="bg-white border-slate-100 shadow-xl shadow-slate-200/30 hover:shadow-primary/10 hover:border-primary/30 transition-all duration-300 h-full">
                  <CardContent className="p-10">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-lg`}>
                      <feature.icon className="text-white w-7 h-7" />
                    </div>
                    <h3 className="text-2xl font-bold mb-4 text-foreground">{feature.title}</h3>
                    <p className="text-foreground/60 leading-relaxed font-medium">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-32 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-4 text-slate-900">How It Works</h2>
            <p className="text-slate-500 max-w-xl mx-auto font-medium">Three simple steps to autonomous procurement.</p>
          </div>
          
          <div className="relative">
            {/* Connector Line */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 z-0" />
            
            <div className="grid md:grid-cols-3 gap-12 relative z-10">
              {steps.map((step, index) => (
                <div key={index} className="text-center group">
                  <div className="w-20 h-20 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center mx-auto mb-8 shadow-xl group-hover:border-primary group-hover:text-primary transition-all duration-300">
                    <span className="text-2xl font-bold text-slate-400 group-hover:text-primary">{step.number}</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-foreground">{step.title}</h3>
                  <p className="text-foreground/60 font-medium">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative">
        <div className="container mx-auto px-6">
          <div className="bg-primary rounded-[3rem] p-12 md:p-24 text-center relative overflow-hidden shadow-2xl shadow-primary/30">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent -z-10" />
            <h2 className="text-4xl md:text-6xl font-display font-bold mb-8 text-white">Build the future of commerce</h2>
            <p className="text-xl text-white/80 max-w-2xl mx-auto mb-12 font-medium">
              Join the growing ecosystem of autonomous agents and decentralized commerce.
            </p>
            <Link to="/signup">
              <Button size="lg" className="h-16 px-12 text-xl bg-white text-primary hover:bg-slate-50 shadow-2xl font-bold rounded-2xl">
                Get Started Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 border-t border-slate-100 bg-slate-50/30">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Cpu className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-display font-bold text-foreground">ProcureAI</span>
          </div>
          <p className="text-sm text-foreground/40 font-medium">© 2026 ProcureAI. Built on Algorand.</p>
          <div className="flex items-center gap-8">
            <a href="#" className="text-sm font-bold text-foreground/40 hover:text-primary transition-colors">Twitter</a>
            <a href="#" className="text-sm font-bold text-foreground/40 hover:text-primary transition-colors">Discord</a>
            <a href="#" className="text-sm font-bold text-foreground/40 hover:text-primary transition-colors">Docs</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
