import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'motion/react';
import { Cpu, Mail, Lock, ArrowRight, UserPlus, LogIn, Github, Twitter } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { cn } from '../lib/utils';

interface AuthProps {
  initialMode?: 'login' | 'signup';
}

const GoogleLogo = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

import { API_BASE_URL } from '../config';

const Auth = ({ initialMode = 'login' }: AuthProps) => {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
        // After signup, switch to login mode
        setIsLogin(true);
        // Clear password for security
        setPassword('');
      }
    } catch (err: any) {
      console.error(err);
      const errorMsg = err.response?.data?.detail || "Authentication failed";
      // Assuming toast is available or just log it
      alert(errorMsg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFCFD] p-6 relative overflow-hidden">
      {/* Premium Mesh Background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-secondary/5 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.03)_0%,transparent_70%)]" />
      </div>

      {/* Top Left Logo to go back to Landing Page */}
      <div className="absolute top-8 left-8 z-50">
        <Link to="/" className="flex items-center gap-3 group cursor-pointer bg-white/50 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/50 shadow-sm hover:shadow-md transition-all">
          <img src="/logo.png" alt="ProcureAI Logo" className="h-8 w-auto group-hover:scale-110 transition-all duration-500" />
          <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-primary transition-colors">ProcureAI</span>
        </Link>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl w-full bg-white rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] border border-slate-100 flex overflow-hidden min-h-[700px] relative"
      >
        
        {/* Sliding Overlay Panel (The "Magic" Part) */}
        <motion.div 
          initial={false}
          animate={{ x: isLogin ? '100%' : '0%' }}
          transition={{ type: "spring", stiffness: 260, damping: 30 }}
          className="absolute top-0 left-0 w-1/2 h-full z-30 hidden md:flex flex-col items-center justify-center p-16 text-white text-center overflow-hidden"
        >
          {/* Animated Gradient Background */}
          <motion.div 
            animate={{ 
              background: isLogin 
                ? 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)' 
                : 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)' 
            }}
            className="absolute inset-0"
          />
          
          {/* Decorative Shapes */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-white rounded-full translate-x-1/2 translate-y-1/2 blur-3xl" />
          </div>

          <div className="relative z-10 space-y-8">
            <motion.div 
              whileHover={{ rotate: 10, scale: 1.1 }}
              className="w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-2xl overflow-hidden"
            >
              <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
            </motion.div>
            
            <AnimatePresence mode="wait">
              <motion.div
                key={isLogin ? 'login-text' : 'signup-text'}
                initial={{ opacity: 0, x: isLogin ? 50 : -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isLogin ? -50 : 50 }}
                transition={{ duration: 0.4, ease: "circOut" }}
                className="space-y-6"
              >
                <h2 className="text-5xl font-display font-bold tracking-tight">
                  {isLogin ? "Join the Future" : "Welcome Back"}
                </h2>
                <p className="text-white/90 text-lg font-medium leading-relaxed max-w-xs mx-auto">
                  {isLogin 
                    ? "Start your journey with the world's most advanced AI procurement network." 
                    : "Access your dashboard and manage your autonomous workforce seamlessly."}
                </p>
              </motion.div>
            </AnimatePresence>

            <Button 
              onClick={() => setIsLogin(!isLogin)}
              variant="outline" 
              className="mt-12 border-2 border-white/50 bg-white/10 backdrop-blur-md text-white hover:bg-white hover:text-primary h-16 px-12 rounded-2xl font-bold text-lg transition-all shadow-xl hover:shadow-white/20"
            >
              {isLogin ? "Create Account" : "Sign In Now"}
            </Button>
          </div>
        </motion.div>

        {/* Forms Container */}
        <div className="flex w-full relative bg-white">
          
          {/* Sign In Form */}
          <div className={cn(
            "w-full md:w-1/2 flex flex-col items-center justify-center p-8 md:p-20 transition-all duration-700 ease-in-out",
            isLogin ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-full pointer-events-none"
          )}>
            <div className="w-full max-w-sm space-y-10">
              <div className="text-center space-y-4">
                <h1 className="text-4xl font-display font-bold text-slate-900 tracking-tight">Sign in</h1>
                <p className="text-slate-500 font-medium">Welcome back! Please enter your details.</p>
                
                <div className="flex justify-center gap-4 pt-4">
                  <motion.button 
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 h-14 rounded-2xl border border-slate-100 flex items-center justify-center gap-3 hover:bg-slate-50 transition-all hover:shadow-xl hover:shadow-slate-200/50 bg-white group"
                  >
                    <GoogleLogo />
                    <span className="text-sm font-bold text-slate-700">Google</span>
                  </motion.button>
                </div>
                
                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-4 text-slate-400 font-bold tracking-widest">Or continue with</span></div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-primary transition-colors" />
                    <Input 
                      type="email" 
                      placeholder="Email address" 
                      className="pl-12 h-14 bg-slate-50 border-slate-100 focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all rounded-2xl font-medium"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-primary transition-colors" />
                    <Input 
                      type="password" 
                      placeholder="Password" 
                      className="pl-12 h-14 bg-slate-50 border-slate-100 focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all rounded-2xl font-medium"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between px-1">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary transition-all" />
                    <span className="text-sm font-bold text-slate-500 group-hover:text-slate-700 transition-colors">Remember me</span>
                  </label>
                  <p className="text-sm font-bold text-primary hover:text-primary/80 cursor-pointer transition-colors">Forgot password?</p>
                </div>
                <Button type="submit" className="w-full h-16 bg-primary hover:bg-primary/90 rounded-2xl font-bold text-lg shadow-2xl shadow-primary/20 transition-all hover:-translate-y-1">
                  Sign In
                </Button>
              </form>
              
              <p className="text-center text-sm font-bold text-slate-400 md:hidden">
                Don't have an account? <span onClick={() => setIsLogin(false)} className="text-primary cursor-pointer">Sign up</span>
              </p>
            </div>
          </div>

          {/* Sign Up Form */}
          <div className={cn(
            "w-full md:w-1/2 flex flex-col items-center justify-center p-8 md:p-20 transition-all duration-700 ease-in-out absolute right-0 top-0 h-full",
            !isLogin ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full pointer-events-none"
          )}>
            <div className="w-full max-w-sm space-y-10">
              <div className="text-center space-y-4">
                <h1 className="text-4xl font-display font-bold text-slate-900 tracking-tight">Create account</h1>
                <p className="text-slate-500 font-medium">Join thousands of businesses worldwide.</p>
                
                <div className="flex justify-center gap-4 pt-4">
                  <motion.button 
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 h-14 rounded-2xl border border-slate-100 flex items-center justify-center gap-3 hover:bg-slate-50 transition-all hover:shadow-xl hover:shadow-slate-200/50 bg-white group"
                  >
                    <GoogleLogo />
                    <span className="text-sm font-bold text-slate-700">Google</span>
                  </motion.button>
                </div>
                
                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-4 text-slate-400 font-bold tracking-widest">Or register with email</span></div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-primary transition-colors" />
                    <Input 
                      type="email" 
                      placeholder="Email address" 
                      className="pl-12 h-14 bg-slate-50 border-slate-100 focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all rounded-2xl font-medium"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-primary transition-colors" />
                    <Input 
                      type="password" 
                      placeholder="Create password" 
                      className="pl-12 h-14 bg-slate-50 border-slate-100 focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all rounded-2xl font-medium"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="px-1">
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">
                    By clicking Sign Up, you agree to our <span className="text-primary cursor-pointer">Terms of Service</span> and <span className="text-primary cursor-pointer">Privacy Policy</span>.
                  </p>
                </div>
                <Button type="submit" className="w-full h-16 bg-primary hover:bg-primary/90 rounded-2xl font-bold text-lg shadow-2xl shadow-primary/20 transition-all hover:-translate-y-1">
                  Sign Up
                </Button>
              </form>

              <p className="text-center text-sm font-bold text-slate-400 md:hidden">
                Already have an account? <span onClick={() => setIsLogin(true)} className="text-primary cursor-pointer">Sign in</span>
              </p>
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
