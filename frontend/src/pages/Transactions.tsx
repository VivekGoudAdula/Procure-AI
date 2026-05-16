import React, { useState } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight,
  MoreVertical,
  Download,
  Calendar,
  DollarSign,
  User,
  X,
  Lock,
  Layers
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { cn } from '../lib/utils';

const Transactions = () => {
  const { transactions } = useApp();
  const [selectedTx, setSelectedTx] = useState<any>(null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100 font-bold shadow-none">Completed</Badge>;
      case 'Pending':
        return <Badge className="bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100 font-bold shadow-none">Pending</Badge>;
      default:
        return <Badge variant="outline" className="font-bold">{status}</Badge>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-display font-bold tracking-tight text-slate-900">Transaction History</h1>
          <p className="text-slate-500 mt-2 font-medium">Audit and manage your autonomous procurement settlements.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="bg-white border-slate-200 gap-2 text-slate-600 font-bold hover:bg-slate-50 h-12 px-6 rounded-xl">
            <Download className="w-4 h-4" /> Export CSV
          </Button>
          <Button className="bg-slate-900 hover:bg-slate-800 text-white gap-2 font-bold h-12 px-6 rounded-xl shadow-lg shadow-slate-200 transition-all hover:scale-[1.02]">
            <Filter className="w-4 h-4" /> Filter
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="bg-white border-slate-100 rounded-[2rem] shadow-sm overflow-hidden group hover:shadow-xl hover:shadow-slate-200/50 transition-all">
          <CardContent className="p-8">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                <DollarSign className="text-violet-600 w-8 h-8" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Volume</p>
                <p className="text-3xl font-display font-bold text-slate-900 mt-1">${transactions.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-100 rounded-[2rem] shadow-sm overflow-hidden group hover:shadow-xl hover:shadow-slate-200/50 transition-all">
          <CardContent className="p-8">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                <CheckCircle2 className="text-rose-600 w-8 h-8" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Settled Deals</p>
                <p className="text-3xl font-display font-bold text-slate-900 mt-1">{transactions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-100 rounded-[2rem] shadow-sm overflow-hidden group hover:shadow-xl hover:shadow-slate-200/50 transition-all">
          <CardContent className="p-8">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                <Clock className="text-emerald-600 w-8 h-8" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Avg. Settlement</p>
                <p className="text-3xl font-display font-bold text-slate-900 mt-1">1.2s</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="relative group max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-primary transition-colors" />
        <Input 
          placeholder="Search by supplier or transaction ID..." 
          className="h-14 pl-12 bg-white border-slate-200 rounded-2xl focus:border-primary/50 transition-all font-medium shadow-sm"
        />
      </div>

      <div className="space-y-4">
        {transactions.length === 0 ? (
          <Card className="glass-card border-white/5 border-dashed p-12 text-center">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <History className="text-foreground/20 w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-foreground/60">No transactions yet</h3>
            <p className="text-foreground/40 max-w-xs mx-auto mt-2">Start a new procurement cycle to see your transaction history here.</p>
            <Button 
              variant="link" 
              className="mt-4 text-primary font-bold"
              onClick={() => window.location.href = '/procurement'}
            >
              Start First Procurement <ArrowUpRight className="ml-1 w-4 h-4" />
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {transactions.map((tx, idx) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card 
                  className="bg-white border-slate-100 hover:border-primary/30 transition-all group overflow-hidden shadow-sm hover:shadow-xl hover:shadow-slate-200/50 rounded-[2rem] cursor-pointer"
                  onClick={() => setSelectedTx(tx)}
                >
                  <CardContent className="p-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-primary/10 transition-colors shadow-inner">
                          <User className="text-slate-400 group-hover:text-primary w-8 h-8 transition-colors" />
                        </div>
                        <div>
                          <h3 className="font-display font-bold text-xl text-slate-900">{tx.supplier}</h3>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-2 text-xs text-slate-400 font-bold uppercase tracking-widest">
                              <Calendar className="w-3.5 h-3.5" /> {tx.date}
                            </div>
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono font-bold">
                              ID: {tx.txId?.substring(0, 16)}...
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-3">
                        <span className="text-2xl font-display font-bold tracking-tight text-slate-900">${tx.amount.toLocaleString()}</span>
                        {getStatusBadge(tx.status)}
                      </div>

                      <div className="flex items-center gap-3 border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-8">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`https://testnet.explorer.perawallet.app/tx/${tx.txId}`, '_blank');
                          }}
                          className="w-12 h-12 rounded-xl text-slate-400 hover:text-primary hover:bg-primary/5 transition-all"
                        >
                          <ExternalLink className="w-6 h-6" />
                        </Button>
                        <Button variant="ghost" size="icon" className="w-12 h-12 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all">
                          <MoreVertical className="w-6 h-6" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedTx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setSelectedTx(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="font-display font-bold text-xl text-slate-900">Transaction Details</h3>
                <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-900" onClick={() => setSelectedTx(null)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="pt-8 pb-10 px-8">
                {/* Hero Amount Section */}
                <div className="flex flex-col items-center justify-center text-center space-y-3 mb-8 mt-2">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mb-2 shadow-inner ring-4 ring-emerald-50/50">
                    {selectedTx.status === 'Completed' ? <CheckCircle2 className="w-8 h-8" /> : <Lock className="w-8 h-8 text-amber-500" />}
                  </div>
                  <h2 className="text-5xl font-display font-bold text-slate-900 tracking-tight">
                    ${selectedTx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </h2>
                  <p className="text-slate-500 font-medium flex items-center gap-2">
                    Transaction to <span className="text-slate-900 font-bold">{selectedTx.supplier}</span>
                  </p>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-xs font-bold text-slate-600 mt-2">
                    <span className="w-2 h-2 rounded-full bg-primary" /> Algorand TestNet
                  </div>
                </div>

                {/* Receipt Line */}
                <div className="w-full h-px border-t border-dashed border-slate-200 my-8 relative">
                  <div className="absolute -left-11 -top-3 w-6 h-6 rounded-full bg-slate-900/40 backdrop-blur-sm shadow-inner" />
                  <div className="absolute -right-11 -top-3 w-6 h-6 rounded-full bg-slate-900/40 backdrop-blur-sm shadow-inner" />
                </div>

                {/* Details Section */}
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-bold tracking-wide">Date</span>
                    <span className="text-slate-900 font-bold">{selectedTx.date}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-bold tracking-wide">Status</span>
                    {selectedTx.status === 'Completed' ? (
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-md">Released</span>
                    ) : (
                      <span className="text-amber-700 font-bold bg-amber-50 px-2.5 py-1 rounded-md">Locked</span>
                    )}
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-bold tracking-wide">Transaction ID</span>
                    <a 
                      href={`https://testnet.explorer.perawallet.app/tx/${selectedTx.txId}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 cursor-pointer group hover:opacity-80 transition-opacity"
                    >
                      <span className="text-slate-900 font-mono font-bold truncate max-w-[120px]">{selectedTx.txId}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-primary transition-colors" />
                    </a>
                  </div>
                </div>

                {/* Timeline UI */}
                <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-100/50">
                  <h4 className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-4 px-1 text-center">Escrow Journey</h4>
                  <div className="flex justify-between relative px-2 mt-2 pb-2">
                    <div className="absolute top-3 left-6 right-6 h-0.5 bg-slate-200" />
                    <div className="absolute top-3 left-6 w-[33%] h-0.5 bg-primary" />
                    <div className="absolute top-3 left-[33%] w-[33%] h-0.5 bg-primary" />
                    <div className="absolute top-3 left-[66%] right-8 h-0.5 bg-primary" />
                    
                    <div className="flex flex-col items-center gap-2 relative z-10 -ml-2">
                      <div className="w-6 h-6 rounded-full bg-primary ring-4 ring-slate-50 flex items-center justify-center shadow-sm"><CheckCircle2 className="w-3.5 h-3.5 text-white"/></div>
                      <span className="text-[10px] font-bold text-slate-600">Selected</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 relative z-10">
                      <div className="w-6 h-6 rounded-full bg-primary ring-4 ring-slate-50 flex items-center justify-center shadow-sm"><Lock className="w-3.5 h-3.5 text-white"/></div>
                      <span className="text-[10px] font-bold text-slate-600">Locked</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 relative z-10">
                      <div className="w-6 h-6 rounded-full bg-primary ring-4 ring-slate-50 flex items-center justify-center shadow-sm"><Layers className="w-3.5 h-3.5 text-white"/></div>
                      <span className="text-[10px] font-bold text-slate-600">Delivered</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 relative z-10 -mr-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-500 ring-4 ring-emerald-50 flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.4)]"><CheckCircle2 className="w-3.5 h-3.5 text-white"/></div>
                      <span className="text-[10px] font-bold text-emerald-600">Released</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Transactions;
