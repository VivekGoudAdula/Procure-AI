import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'motion/react';
import { API_BASE_URL } from '../../config';

// --- Types ---
interface NegotiationRound {
  round: number;
  topic: string;
  buyer_message_english: string;
  translated_message: string;
  supplier_response_native: string;
  supplier_response_english: string;
  analysis: {
    flexibility: string;
    confidence: number;
    pricing_potential: string;
    risk: string;
    supplier_pattern: string;
    intent_signals: string[];
  };
}

interface NegotiationResult {
  source_language: string;
  target_language: string;
  supplier_flag: string;
  supplier_country: string;
  supplier_region: string;
  product: string;
  total_rounds: number;
  rounds: NegotiationRound[];
  final_analysis: {
    average_confidence: number;
    overall_flexibility: string;
    procurement_recommendation: string;
    risk_rating: string;
    suggested_action: string;
  };
  cultural_intelligence: {
    communication_style: string;
    negotiation_approach: string;
    response_confidence: number;
    risk_profile: string;
    fulfillment_confidence: number;
    cultural_note: string;
  };
}

// --- Language options ---
const LANGUAGES = [
  { value: 'Chinese', label: 'Chinese', flag: '🇨🇳', region: 'East Asia' },
  { value: 'Vietnamese', label: 'Vietnamese', flag: '🇻🇳', region: 'Southeast Asia' },
  { value: 'Spanish', label: 'Spanish', flag: '🇲🇽', region: 'Latin America' },
  { value: 'Hindi', label: 'Hindi', flag: '🇮🇳', region: 'South Asia' },
  { value: 'Japanese', label: 'Japanese', flag: '🇯🇵', region: 'Asia-Pacific' },
];

// --- Terminal log messages ---
const BOOT_LOGS = [
  '[PROCURE-AI] Initializing multilingual procurement channel...',
  '[PROCURE-AI] Detecting supplier language profile...',
  '[PROCURE-AI] Translation model synchronized.',
  '[PROCURE-AI] Cross-border negotiation bridge established.',
  '[PROCURE-AI] Supplier intent analysis active.',
  '[PROCURE-AI] Cultural intelligence layer loaded.',
  '[PROCURE-AI] Procurement negotiation intelligence running...',
];

// --- Sub-components ---

const TerminalLog: React.FC<{ logs: string[] }> = ({ logs }) => {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs]);
  return (
    <div className="bg-black rounded-xl border border-green-900/40 p-4 font-mono text-xs h-36 overflow-y-auto">
      {logs.map((log, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="text-green-400 leading-relaxed"
        >
          {log}
        </motion.div>
      ))}
      <div ref={endRef} />
    </div>
  );
};

const MessageBubble: React.FC<{
  label: string;
  labelColor: string;
  text: string;
  delay?: number;
  isNative?: boolean;
}> = ({ label, labelColor, text, delay = 0, isNative }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    className="space-y-1"
  >
    <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${labelColor}`}>{label}</span>
    <div className={`px-4 py-3 rounded-xl text-sm font-medium leading-relaxed ${
      isNative
        ? 'bg-slate-800 border border-slate-700 text-slate-200'
        : 'bg-slate-900 border border-slate-700 text-slate-100'
    }`}>
      {text}
    </div>
  </motion.div>
);

const RoundBlock: React.FC<{ round: NegotiationRound; flag: string; language: string; visible: boolean }> = ({
  round, flag, language, visible
}) => {
  if (!visible) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-slate-800 rounded-2xl overflow-hidden"
    >
      {/* Round header */}
      <div className="bg-slate-800/60 px-5 py-3 flex items-center justify-between border-b border-slate-700">
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-md">
            Round {round.round}
          </span>
          <span className="text-slate-300 text-xs font-bold">{round.topic}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-[9px] text-cyan-400 font-bold uppercase tracking-widest">Confidence {round.analysis.confidence}%</span>
        </div>
      </div>

      <div className="p-5 space-y-4 bg-slate-900/50">
        {/* Buyer → Translated */}
        <MessageBubble
          label="🇺🇸 Buyer Message (English)"
          labelColor="text-blue-400"
          text={round.buyer_message_english}
          delay={0}
        />
        <div className="flex items-center gap-3 py-1">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
          <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest animate-pulse">
            ⚡ AI Translating → {language}
          </span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
        </div>
        <MessageBubble
          label={`${flag} AI Translated (${language})`}
          labelColor="text-amber-400"
          text={round.translated_message}
          delay={0.3}
          isNative
        />
        <MessageBubble
          label={`${flag} Supplier Response (${language})`}
          labelColor="text-emerald-400"
          text={round.supplier_response_native}
          delay={0.6}
          isNative
        />
        <div className="flex items-center gap-3 py-1">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
          <span className="text-[9px] font-black text-violet-400 uppercase tracking-widest animate-pulse">
            ⚡ AI Interpreting → English
          </span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
        </div>
        <MessageBubble
          label="🇺🇸 AI Interpreted Response (English)"
          labelColor="text-violet-400"
          text={round.supplier_response_english}
          delay={0.9}
        />

        {/* Intent signals */}
        <div className="pt-2 flex flex-wrap gap-2">
          {round.analysis.intent_signals.map((sig, i) => (
            <span key={i} className="text-[8px] font-bold uppercase tracking-wider text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full">
              ✓ {sig}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

// --- Main Component ---
const MultilingualNegotiationEngine: React.FC<{ product?: string }> = ({ product = 'Procurement Order' }) => {
  const [selectedLang, setSelectedLang] = useState('Chinese');
  const [isRunning, setIsRunning] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [result, setResult] = useState<NegotiationResult | null>(null);
  const [visibleRound, setVisibleRound] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<'idle' | 'booting' | 'negotiating' | 'done'>('idle');

  const langData = LANGUAGES.find(l => l.value === selectedLang) || LANGUAGES[0];

  /** Stream terminal boot logs one by one */
  const streamBootLogs = async () => {
    for (const log of BOOT_LOGS) {
      await new Promise(r => setTimeout(r, 380 + Math.random() * 320));
      setTerminalLogs(prev => [...prev, log]);
    }
  };

  /** Reveal rounds progressively */
  const revealRounds = async (count: number) => {
    for (let i = 1; i <= count; i++) {
      await new Promise(r => setTimeout(r, 1400));
      setVisibleRound(i);
      setTerminalLogs(prev => [
        ...prev,
        `[PROCURE-AI] Round ${i} negotiation complete. Analyzing supplier intent...`,
      ]);
    }
  };

  const handleStartNegotiation = async () => {
    setIsRunning(true);
    setResult(null);
    setVisibleRound(0);
    setError(null);
    setTerminalLogs([]);
    setPhase('booting');

    try {
      // Boot phase
      const bootPromise = streamBootLogs();

      // API call in parallel
      const apiPromise = axios.post(`${API_BASE_URL}/api/negotiation/multilingual/full`, {
        buyer_message: `Initiating cross-border procurement negotiation for ${product}`,
        supplier_language: selectedLang,
        product,
      });

      const [, apiRes] = await Promise.all([bootPromise, apiPromise]);
      const data: NegotiationResult = apiRes.data;
      setResult(data);
      setPhase('negotiating');

      // Reveal rounds sequentially
      await revealRounds(data.total_rounds);

      setPhase('done');
      setTerminalLogs(prev => [
        ...prev,
        `[PROCURE-AI] All ${data.total_rounds} rounds complete.`,
        `[PROCURE-AI] Final confidence: ${data.final_analysis.average_confidence}%`,
        `[PROCURE-AI] Recommendation: ${data.final_analysis.suggested_action}`,
      ]);
    } catch (err: any) {
      setError('Negotiation engine error. Check backend connection.');
      setPhase('idle');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="rounded-3xl overflow-hidden border border-slate-800 shadow-[0_0_60px_rgba(0,0,0,0.5)] bg-[#070d1a]">
      {/* ── Header ── */}
      <div className="relative px-8 py-6 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-[#0a1628] to-slate-950 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(34,211,238,0.06),transparent_60%)]" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-[0.25em] text-cyan-400">
                ProcureAI · Multilingual Intelligence Layer
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Cross-Border Negotiation Intelligence</h2>
            <p className="text-slate-400 text-xs mt-0.5 font-medium">AI-powered multilingual supplier communication</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {['AI Translation Active', 'Cross-Border Intelligence', 'Supplier Intent Detection', 'x402 Channel'].map(b => (
              <span key={b} className="text-[8px] font-black uppercase tracking-wider text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-full">
                {b}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-6">
        {/* ── Language Selector + Flow Indicator ── */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Selector */}
          <div className="space-y-3">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Select Supplier Language</label>
            <div className="grid grid-cols-5 gap-2">
              {LANGUAGES.map(l => (
                <button
                  key={l.value}
                  onClick={() => setSelectedLang(l.value)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-center transition-all ${
                    selectedLang === l.value
                      ? 'border-cyan-500/60 bg-cyan-500/10 shadow-[0_0_12px_rgba(34,211,238,0.2)]'
                      : 'border-slate-700 bg-slate-800/40 hover:border-slate-600'
                  }`}
                >
                  <span className="text-xl">{l.flag}</span>
                  <span className="text-[8px] font-bold text-slate-300 uppercase tracking-wider leading-tight">{l.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Flow indicator */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Language Flow Indicator</p>
            <div className="space-y-2">
              {[
                { label: 'Buyer Language', value: 'English 🇺🇸', color: 'text-blue-400' },
                { label: 'Supplier Language', value: `${langData.label} ${langData.flag}`, color: 'text-amber-400' },
                { label: 'AI Translation Layer', value: 'ACTIVE', color: 'text-emerald-400' },
                { label: 'Negotiation Status', value: phase === 'done' ? 'COMPLETE' : phase === 'idle' ? 'STANDBY' : 'LIVE', color: phase === 'done' ? 'text-emerald-400 animate-none' : 'text-cyan-400 animate-pulse' },
              ].map(row => (
                <div key={row.label} className="flex justify-between items-center py-1 border-b border-slate-800/50">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{row.label}</span>
                  <span className={`text-[10px] font-black ${row.color}`}>{row.value}</span>
                </div>
              ))}
            </div>
            <div className="text-[8px] text-slate-600 font-medium pt-1">
              Regions: China · Vietnam · India · Japan · Latin America &nbsp;|&nbsp; Protocol: Cross-border AI procurement orchestration
            </div>
          </div>
        </div>

        {/* ── Start Button ── */}
        <button
          onClick={handleStartNegotiation}
          disabled={isRunning}
          className="w-full h-14 rounded-2xl font-black text-sm uppercase tracking-[0.15em] transition-all relative overflow-hidden group disabled:opacity-60 disabled:cursor-not-allowed bg-gradient-to-r from-cyan-600 via-blue-600 to-violet-600 text-white shadow-[0_0_30px_rgba(34,211,238,0.25)] hover:shadow-[0_0_50px_rgba(34,211,238,0.4)]"
        >
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          {isRunning ? (
            <span className="flex items-center justify-center gap-3">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              AI Agents Negotiating Cross-Border...
            </span>
          ) : (
            <span>⚡ Start AI Negotiation</span>
          )}
        </button>

        {error && (
          <div className="p-4 rounded-xl bg-red-950/50 border border-red-800/50 text-red-400 text-xs font-bold">
            ⚠ {error}
          </div>
        )}

        {/* ── Terminal Logs ── */}
        <AnimatePresence>
          {terminalLogs.length > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Live System Logs</p>
              <TerminalLog logs={terminalLogs} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Negotiation Rounds ── */}
        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="flex items-center gap-3">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Negotiation Rounds — {result.supplier_flag} {result.supplier_country}
                </p>
                <div className="flex-1 h-px bg-slate-800" />
                <span className="text-[8px] text-slate-600 font-bold uppercase">{result.supplier_region}</span>
              </div>
              {result.rounds.map(r => (
                <RoundBlock
                  key={r.round}
                  round={r}
                  flag={result.supplier_flag}
                  language={result.target_language}
                  visible={visibleRound >= r.round}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── AI Reasoning + Cultural Intelligence (only after all rounds done) ── */}
        <AnimatePresence>
          {phase === 'done' && result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="grid md:grid-cols-2 gap-5"
            >
              {/* AI Reasoning Panel */}
              <div className="bg-slate-900/70 border border-slate-700 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                  <span className="text-[9px] font-black text-violet-400 uppercase tracking-[0.2em]">Negotiation Intelligence</span>
                </div>
                <div className="space-y-2">
                  {[
                    { label: 'Overall Flexibility', value: result.final_analysis.overall_flexibility },
                    { label: 'Avg Confidence', value: `${result.final_analysis.average_confidence}%` },
                    { label: 'Risk Rating', value: result.final_analysis.risk_rating },
                    { label: 'Suggested Action', value: result.final_analysis.suggested_action },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between items-center py-1.5 border-b border-slate-800">
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{item.label}</span>
                      <span className="text-[10px] font-black text-emerald-400">{item.value}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed pt-2 border-t border-slate-800">
                  {result.final_analysis.procurement_recommendation}
                </p>
              </div>

              {/* Cultural Intelligence Panel */}
              <div className="bg-slate-900/70 border border-slate-700 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-[9px] font-black text-amber-400 uppercase tracking-[0.2em]">Communication Style Analysis</span>
                </div>
                <div className="space-y-2">
                  {[
                    { label: 'Supplier Response Pattern', value: result.cultural_intelligence.communication_style },
                    { label: 'Negotiation Flexibility', value: result.final_analysis.overall_flexibility },
                    { label: 'Response Confidence', value: `${result.cultural_intelligence.response_confidence}%` },
                    { label: 'Risk Profile', value: result.cultural_intelligence.risk_profile },
                    { label: 'Fulfillment Confidence', value: `${result.cultural_intelligence.fulfillment_confidence}%` },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between items-center py-1.5 border-b border-slate-800">
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{item.label}</span>
                      <span className="text-[10px] font-black text-amber-400">{item.value}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed pt-2 border-t border-slate-800">
                  {result.cultural_intelligence.cultural_note}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Final CTA ── */}
        <AnimatePresence>
          {phase === 'done' && result && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-cyan-950/60 to-blue-950/60 border border-emerald-800/40 flex items-start gap-4"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 text-lg">
                ✅
              </div>
              <div>
                <p className="text-emerald-400 font-black text-xs uppercase tracking-widest mb-1">
                  AI Procurement Diplomacy Layer — Negotiation Complete
                </p>
                <p className="text-slate-300 text-xs leading-relaxed">
                  ProcureAI successfully eliminated cross-border procurement friction by autonomously negotiating
                  with the <strong className="text-white">{result.supplier_country}</strong> supplier across language boundaries.
                  Confidence Index: <strong className="text-emerald-400">{result.final_analysis.average_confidence}%</strong>
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MultilingualNegotiationEngine;
