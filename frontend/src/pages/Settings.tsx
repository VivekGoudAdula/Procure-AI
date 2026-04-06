import React from 'react';
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Shield, 
  Wallet, 
  Globe, 
  Moon, 
  Cpu,
  Save
} from 'lucide-react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';

const Settings = () => {
  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight">Settings</h1>
        <p className="text-foreground/60 mt-1">Configure your account, AI agents, and on-chain preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-1 space-y-1">
          {[
            { name: 'Profile', icon: User, active: true },
            { name: 'Notifications', icon: Bell },
            { name: 'Security', icon: Shield },
            { name: 'Wallets', icon: Wallet },
            { name: 'AI Config', icon: Cpu },
            { name: 'Network', icon: Globe },
          ].map((item) => (
            <button
              key={item.name}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                item.active 
                  ? "bg-primary/10 text-primary neon-glow-cyan" 
                  : "text-foreground/60 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </button>
          ))}
        </div>

        <div className="md:col-span-3 space-y-6">
          <Card className="glass-card border-white/5">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Account Profile</CardTitle>
              <CardDescription>Update your personal information and public profile.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest pl-1">Full Name</label>
                  <Input defaultValue="Vivek Goud" className="bg-white/5 border-white/10" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest pl-1">Email Address</label>
                  <Input defaultValue="adulavivekgoud@gmail.com" className="bg-white/5 border-white/10" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest pl-1">Organization</label>
                <Input defaultValue="ProcureAI Labs" className="bg-white/5 border-white/10" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-white/5">
            <CardHeader>
              <CardTitle className="text-lg font-bold">AI Agent Preferences</CardTitle>
              <CardDescription>Control how your autonomous agents behave during negotiations.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Aggressive Negotiation</p>
                  <p className="text-xs text-foreground/40">Agents will prioritize price over delivery time.</p>
                </div>
                <div className="w-12 h-6 bg-primary rounded-full relative cursor-pointer">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-lg" />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Auto-Settlement</p>
                  <p className="text-xs text-foreground/40">Automatically execute deals that meet all criteria.</p>
                </div>
                <div className="w-12 h-6 bg-white/10 rounded-full relative cursor-pointer">
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white/40 rounded-full shadow-lg" />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button variant="ghost" className="glass border-white/10">Cancel</Button>
            <Button className="bg-primary hover:bg-primary/90 neon-glow gap-2">
              <Save className="w-4 h-4" /> Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const cn = (...inputs: any[]) => inputs.filter(Boolean).join(' ');

export default Settings;
