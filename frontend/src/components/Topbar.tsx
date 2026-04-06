import React from 'react';
import { useApp } from '../context/AppContext';
import { cn } from '../lib/utils';
import { 
  Bell, 
  Search, 
  Wallet, 
  User,
  ChevronDown
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

const Topbar = () => {
  const { user, walletAddress } = useApp();

  return (
    <header className="h-20 border-b border-slate-100/60 bg-white/60 backdrop-blur-2xl sticky top-0 z-30 flex items-center justify-between px-10">
      <div className="flex items-center gap-6 flex-1">
         <div className="relative max-w-md w-full hidden md:block group">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
           <input 
             type="text" 
             placeholder="Search agents, transactions..." 
             className="w-full bg-slate-100/50 border border-slate-100 rounded-[1.25rem] py-3 pl-12 pr-4 text-sm font-bold text-slate-900 focus:outline-none focus:border-primary/50 focus:bg-white focus:shadow-2xl focus:shadow-primary/5 transition-all"
           />
         </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Wallet Status */}
        <div className="hidden sm:flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group">
          <div className={cn(
            "w-8 h-8 rounded-xl flex items-center justify-center transition-all group-hover:scale-110",
            walletAddress ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400"
          )}>
            <Wallet className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] leading-none mb-1">Network</span>
            <span className="text-xs font-black text-slate-950 font-mono tracking-tight">
              {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Disconnected'}
            </span>
          </div>
          {walletAddress && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-1" />}
        </div>

        <Button variant="ghost" size="icon" className="w-12 h-12 rounded-2xl relative text-slate-400 hover:text-slate-950 hover:bg-slate-50 transition-all">
          <Bell className="w-6 h-6" />
          <span className="absolute top-3.5 right-3.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white shadow-sm" />
        </Button>

        <div className="h-8 w-px bg-slate-100 mx-1" />

        <div className="flex items-center gap-4 pl-2 cursor-pointer group">
          <div className="w-11 h-11 rounded-2xl bg-slate-950 flex items-center justify-center text-white font-black text-xs shadow-xl group-hover:scale-110 transition-transform">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="hidden lg:block">
            <p className="text-sm font-black leading-none mb-1 group-hover:text-primary transition-colors text-slate-950">{user?.name || 'User'}</p>
            <p className="text-[9px] text-primary font-black uppercase tracking-[0.2em]">Enterprise</p>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-primary transition-colors" />
        </div>
      </div>
    </header>
  );
};

export default Topbar;
