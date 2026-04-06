import React from 'react';
import { 
  HelpCircle, 
  Search, 
  Book, 
  MessageSquare, 
  Mail, 
  ExternalLink, 
  ChevronRight,
  Shield,
  Cpu,
  Wallet
} from 'lucide-react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

const Help = () => {
  const faqs = [
    {
      question: "How do AI agents negotiate?",
      answer: "Our agents use advanced LLMs to interact with supplier APIs and communication channels, applying game theory and negotiation strategies to reach optimal price points.",
      icon: Cpu
    },
    {
      question: "Is the settlement secure?",
      answer: "All transactions are settled on the Algorand blockchain using smart contracts, ensuring transparency, immutability, and instant finality.",
      icon: Shield
    },
    {
      question: "Which wallets are supported?",
      answer: "Currently, we support Pera Wallet for Algorand transactions. More wallet integrations are coming soon.",
      icon: Wallet
    }
  ];

  return (
    <div className="space-y-12 max-w-5xl">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-display font-bold tracking-tight">How can we help?</h1>
        <p className="text-foreground/60 max-w-xl mx-auto">Search our documentation or contact our support team for assistance with your autonomous commerce journey.</p>
        <div className="relative group max-w-2xl mx-auto mt-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 w-6 h-6 group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Search for guides, API docs, and more..." 
            className="h-16 pl-14 bg-white/5 border-white/10 rounded-2xl focus:border-primary/50 transition-all text-lg"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { title: 'Documentation', icon: Book, desc: 'Detailed guides and API references.' },
          { title: 'Community', icon: MessageSquare, desc: 'Join our Discord and talk to other users.' },
          { title: 'Direct Support', icon: Mail, desc: 'Email our team for personalized help.' },
        ].map((item) => (
          <Card key={item.title} className="glass-card border-white/5 hover:border-primary/30 transition-all group cursor-pointer">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 neon-glow group-hover:bg-primary/20 transition-colors">
                <item.icon className="text-primary w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">{item.title}</h3>
              <p className="text-sm text-foreground/60 leading-relaxed">{item.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <HelpCircle className="text-secondary w-6 h-6" />
          Frequently Asked Questions
        </h2>
        <div className="grid grid-cols-1 gap-4">
          {faqs.map((faq) => (
            <Card key={faq.question} className="glass-card border-white/5 hover:bg-white/5 transition-colors cursor-pointer group">
              <CardContent className="p-6 flex items-start gap-6">
                <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
                  <faq.icon className="text-secondary w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-lg mb-2 group-hover:text-secondary transition-colors">{faq.question}</h4>
                  <p className="text-sm text-foreground/60 leading-relaxed">{faq.answer}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-foreground/20 group-hover:text-secondary transition-colors" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card className="glass-card border-primary/30 bg-gradient-to-br from-primary/10 to-transparent overflow-hidden neon-glow">
        <CardContent className="p-12 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 text-center md:text-left">
            <h2 className="text-3xl font-bold tracking-tight">Still have questions?</h2>
            <p className="text-foreground/60 max-w-md">Our team of experts is ready to help you optimize your procurement workflows.</p>
          </div>
          <Button className="h-14 px-8 text-lg font-bold bg-primary hover:bg-primary/90 neon-glow rounded-xl gap-2">
            Contact Support <ExternalLink className="w-5 h-5" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Help;
