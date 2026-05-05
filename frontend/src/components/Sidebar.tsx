import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Users, 
  History, 
  BarChart3, 
  LogOut,
  Cpu,
  Settings,
  HelpCircle,
  ChevronDown
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

const Sidebar = () => {
  const { logout } = useApp();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Procurement', icon: ShoppingCart, path: '/procurement' },
    { name: 'Transactions', icon: History, path: '/transactions' },
    { name: 'Analytics', icon: BarChart3, path: '/analytics' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="w-72 bg-white/80 backdrop-blur-xl border-r border-slate-100 h-screen flex flex-col fixed left-0 top-0 z-40">
      <div className="p-7 flex-1 flex flex-col overflow-y-auto">
        <div className="flex items-center gap-3 mb-10 pl-2 group cursor-pointer" onClick={() => navigate('/dashboard')}>
          <img src="/logo.png" alt="ProcureAI Logo" className="h-11 w-auto group-hover:rotate-6 transition-transform duration-500 shadow-2xl rounded-2xl" />
          <span className="text-2xl font-display font-medium tracking-tight text-slate-950">ProcureAI</span>
        </div>

        <nav className="space-y-2 flex-1 mt-4">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) => cn(
                "group flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 relative",
                isActive
                  ? "text-primary bg-primary/5 shadow-[inset_0_0_0_1px_rgba(139,92,246,0.1)]"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              )}
            >
              {({ isActive }) => (
                <>
                  <item.icon className={cn(
                    "w-5 h-5 transition-transform group-hover:scale-110",
                    isActive ? "text-primary" : "text-slate-400"
                  )} />
                  {item.name}
                  {isActive && (
                    <motion.div 
                      layoutId="sidebar-active-pill"
                      className="ml-auto w-1 h-3 rounded-full bg-primary"
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
          
          <div className="pt-8">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 pl-4">System</p>
            <NavLink to="/settings" className={({ isActive }) => cn(
              "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300",
              isActive ? "text-primary bg-primary/5" : "text-slate-500 hover:text-slate-950 hover:bg-slate-50"
            )}>
              <Settings className="w-5 h-5 text-slate-400" />
              Settings
            </NavLink>
          </div>
        </nav>
      </div>

      <div className="p-7 border-t border-slate-100 bg-slate-50/40">
        <div className="flex items-center gap-3 mb-6 p-3 rounded-2xl hover:bg-white hover:shadow-2xl hover:shadow-slate-200/50 transition-all cursor-pointer group border border-transparent hover:border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-black text-sm shadow-xl group-hover:scale-110 transition-transform">
            {useApp().user?.name?.charAt(0) || 'U'}
          </div>
          <div className="flex flex-col flex-1 overflow-hidden">
            <span className="text-sm font-black text-slate-900 truncate">{useApp().user?.name || 'User'}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{useApp().user?.email}</span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full text-xs font-black text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all group tracking-widest uppercase"
        >
          <LogOut className="w-4 h-4 text-slate-400 group-hover:text-rose-600 transition-colors" />
          Logout System
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
