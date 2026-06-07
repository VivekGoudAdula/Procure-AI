import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'motion/react';
import { ArrowLeft, Loader2, Mail, Lock, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { API_BASE_URL } from '../config';
import { toast } from 'sonner';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'otp' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/forgot-password/send-otp`, { email });
      toast.success('OTP sent to your email');
      setStep('otp');
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.detail || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;

    setIsLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/forgot-password/verify-otp`, { email, otp });
      toast.success('OTP verified');
      setStep('reset');
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.detail || 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/forgot-password/reset-password`, {
        email,
        otp,
        new_password: newPassword
      });
      toast.success('Password reset successfully');
      navigate('/login');
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.detail || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-[#f8fafc]">
      {/* Background Dots */}
      <div 
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, #94A3B8 2px, transparent 0)',
          backgroundSize: '40px 40px'
        }}
      />

      {/* Top Left Logo */}
      <div className="absolute top-8 left-8 z-50">
        <Link to="/" className="flex items-center gap-3 group cursor-pointer bg-white/50 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/50 shadow-sm hover:shadow-md transition-all">
          <img src="/logo.png" alt="ProcureAI Logo" className="h-8 w-auto group-hover:scale-110 transition-all duration-500" />
          <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">ProcureAI</span>
        </Link>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-slate-100 p-8 relative z-10"
      >
        {/* Back Button */}
        <button
          onClick={() => {
            if (step === 'otp') setStep('email');
            else if (step === 'reset') setStep('otp');
            else navigate('/login');
          }}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back</span>
        </button>

        {/* Step 1: Email */}
        {step === 'email' && (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center mb-4">
                <Mail className="w-6 h-6 text-indigo-600" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Forgot Password?</h1>
              <p className="text-slate-500 font-medium text-sm">Enter your email address and we'll send you an OTP to reset your password.</p>
            </div>

            <form onSubmit={handleSendOTP} className="space-y-4">
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

              <Button type="submit" disabled={isLoading} className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white rounded-full font-bold shadow-lg shadow-slate-900/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'SEND OTP'}
              </Button>
            </form>
          </div>
        )}

        {/* Step 2: OTP */}
        {step === 'otp' && (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Enter OTP</h1>
              <p className="text-slate-500 font-medium text-sm">Enter the 6-digit OTP sent to your email address.</p>
            </div>

            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-900 ml-1">OTP Code</label>
                <Input 
                  type="text" 
                  placeholder="123456" 
                  className="h-12 bg-white border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all rounded-xl font-medium placeholder:text-slate-400 text-center text-2xl tracking-widest"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  required
                />
              </div>

              <Button type="submit" disabled={isLoading} className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white rounded-full font-bold shadow-lg shadow-slate-900/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'VERIFY OTP'}
              </Button>
            </form>

            <p className="text-center text-sm text-slate-500">
              Didn't receive OTP? <button onClick={handleSendOTP} className="text-indigo-600 font-bold hover:underline">Resend</button>
            </p>
          </div>
        )}

        {/* Step 3: Reset Password */}
        {step === 'reset' && (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-violet-600" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Reset Password</h1>
              <p className="text-slate-500 font-medium text-sm">Enter your new password below.</p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-900 ml-1">New Password</label>
                <div className="relative">
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    className="h-12 bg-white border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all rounded-xl font-medium placeholder:text-slate-400 pr-10"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <Lock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-900 ml-1">Confirm Password</label>
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  className="h-12 bg-white border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all rounded-xl font-medium placeholder:text-slate-400"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" disabled={isLoading} className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white rounded-full font-bold shadow-lg shadow-slate-900/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'RESET PASSWORD'}
              </Button>
            </form>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-slate-100 text-center">
          <Link to="/login" className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">
            Back to Login
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
