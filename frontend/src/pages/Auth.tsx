import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { cn } from '../lib/utils';
import { API_BASE_URL } from '../config';

interface AuthProps {
  initialMode?: 'login' | 'signup';
}

const BackgroundDots = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-20 bg-[#f8fafc]">
      {/* Base Dotted Background - Always visible */}
      <div 
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, #94A3B8 2px, transparent 0)',
          backgroundSize: '40px 40px'
        }}
      />
      {/* Interactive Highlight Dotted Background - Becomes very dark near mouse */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, #0F172A 2px, transparent 0)',
          backgroundSize: '40px 40px',
          WebkitMaskImage: `radial-gradient(circle 120px at ${mousePosition.x}px ${mousePosition.y}px, black 0%, transparent 100%)`
        }}
      />
    </div>
  );
};

const Auth = ({ initialMode = 'login' }: AuthProps) => {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useApp();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    try {
      const endpoint = isLogin ? `${API_BASE_URL}/api/login` : `${API_BASE_URL}/api/signup`;
      const response = await axios.post(endpoint, { email, password });
      
      if (isLogin) {
        login(email);
        navigate('/dashboard');
      } else {
        setIsLogin(true);
        setPassword('');
      }
    } catch (err: any) {
      console.error(err);
      const errorMsg = err.response?.data?.detail || "Authentication failed";
      alert(errorMsg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <BackgroundDots />

      {/* Top Left Logo to go back to Landing Page */}
      <div className="absolute top-8 left-8 z-50">
        <Link to="/" className="flex items-center gap-3 group cursor-pointer bg-white/50 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/50 shadow-sm hover:shadow-md transition-all">
          <img src="/logo.png" alt="ProcureAI Logo" className="h-8 w-auto group-hover:scale-110 transition-all duration-500" />
          <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">ProcureAI</span>
        </Link>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-[900px] w-full bg-white rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-slate-100 flex overflow-hidden min-h-[540px] relative z-10"
      >
        
        {/* Sliding Overlay Panel — Procurement Image */}
        <motion.div
          initial={false}
          animate={{ x: isLogin ? '100%' : '0%' }}
          transition={{ type: "spring", stiffness: 220, damping: 28 }}
          className="absolute top-0 left-0 w-1/2 h-full z-30 hidden md:flex flex-col overflow-hidden"
        >
          {/* Full-bleed procurement image */}
          <img
            src="/auth-panel.png"
            alt="Procurement Intelligence"
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Bottom vignette — top of image stays fully visible */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent" />

          {/* All UI content pinned to the bottom */}
          <div className="relative z-10 mt-auto px-7 pb-8 text-white flex flex-col items-center text-center gap-3">

            {/* Logo */}
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/10 backdrop-blur-md border border-white/20 p-2">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>

            {/* Animated title + subtitle */}
            <AnimatePresence mode="wait">
              <motion.div
                key={isLogin ? 'login-text' : 'signup-text'}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="space-y-1"
              >
                <h2 className="text-xl font-black tracking-tight">
                  {isLogin ? "Join the Future" : "Welcome Back"}
                </h2>
                <p className="text-white/55 text-[11px] font-medium leading-relaxed max-w-[12rem] mx-auto">
                  {isLogin
                    ? "AI agents negotiate deals globally — secured on Algorand."
                    : "Access your procurement dashboard and AI negotiation engine."}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* KPI stats row */}
            <div className="flex gap-4 py-2 border-t border-b border-white/10 w-full justify-center">
              {[
                { label: 'Deals', value: '1,240+' },
                { label: 'Saved', value: '$2.4M' },
                { label: 'Success', value: '92%' },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-sm font-black text-white">{stat.value}</div>
                  <div className="text-[7px] font-bold text-white/35 uppercase tracking-widest">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Forms Container */}
        <div className="flex w-full relative bg-white">
          
          {/* Sign In Form */}
          <div className={cn(
            "w-full md:w-1/2 flex flex-col justify-center p-8 md:p-12 transition-all duration-700 ease-in-out",
            isLogin ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-full pointer-events-none absolute"
          )}>
            <div className="w-full max-w-sm mx-auto space-y-8">
              <div className="space-y-2">
                <div className="w-3 h-3 rounded-full bg-rose-500 mb-6"></div>
                <h1 className="text-[2rem] font-black text-slate-900 tracking-tight">Welcome back!</h1>
                <p className="text-slate-500 font-medium text-sm">Enter your credentials to access your dashboard.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-900 ml-1">Email Address</label>
                  <Input 
                    type="email" 
                    placeholder="you@company.io" 
                    className="h-12 bg-white border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all rounded-xl font-medium placeholder:text-slate-400"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2 relative">
                  <label className="text-sm font-bold text-slate-900 ml-1">Password</label>
                  <div className="relative">
                    <Input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      className="h-12 bg-white border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all rounded-xl font-medium placeholder:text-slate-400 pr-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white rounded-full font-bold shadow-lg shadow-slate-900/20 transition-all hover:scale-[1.02] active:scale-[0.98] mt-4">
                  SIGN IN
                </Button>
              </form>
              
              <p className="text-center text-sm font-bold text-slate-500 mt-8">
                Don't have an account? <span onClick={() => { setIsLogin(false); setEmail(''); setPassword(''); }} className="text-indigo-600 cursor-pointer hover:underline">Sign up</span>
              </p>
            </div>
          </div>

          {/* Sign Up Form */}
          <div className={cn(
            "w-full md:w-1/2 flex flex-col justify-center p-8 md:p-16 transition-all duration-700 ease-in-out absolute right-0 top-0 h-full",
            !isLogin ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full pointer-events-none"
          )}>
            <div className="w-full max-w-sm mx-auto space-y-10">
              <div className="space-y-2">
                <div className="w-3 h-3 rounded-full bg-indigo-500 mb-6"></div>
                <h1 className="text-[2rem] font-black text-slate-900 tracking-tight">Create Account</h1>
                <p className="text-slate-500 font-medium text-sm">Join thousands of businesses worldwide.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-900 ml-1">Email Address</label>
                  <Input 
                    type="email" 
                    placeholder="you@company.io" 
                    className="h-12 bg-white border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all rounded-xl font-medium placeholder:text-slate-400"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2 relative">
                  <label className="text-sm font-bold text-slate-900 ml-1">Create Password</label>
                  <div className="relative">
                    <Input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      className="h-12 bg-white border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all rounded-xl font-medium placeholder:text-slate-400 pr-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white rounded-full font-bold shadow-lg shadow-slate-900/20 transition-all hover:scale-[1.02] active:scale-[0.98] mt-4">
                  SIGN UP
                </Button>
              </form>
              
              <p className="text-center text-sm font-bold text-slate-500 mt-8">
                Already have an account? <span onClick={() => { setIsLogin(true); setEmail(''); setPassword(''); }} className="text-indigo-600 cursor-pointer hover:underline">Sign in</span>
              </p>
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
