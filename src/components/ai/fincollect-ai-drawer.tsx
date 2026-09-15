'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { queryFinCollectAI, AIResponse } from '@/lib/actions/ai-assistant';
import { FormattedAIResponse } from './formatted-ai-response';
import { useToast } from '@/components/providers/toast-provider';
import { ALL_SUPPORTED_LANGUAGES, SupportedLanguageCode } from '@/lib/ai/multilingual-lexicon';
import {
  Bot,
  Sparkles,
  X,
  Send,
  Copy,
  Check,
  Languages,
  RefreshCw,
  Compass,
  Cpu,
  Radio,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  category?: string;
  timestamp: string;
}

export function FinCollectAIDrawer() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [preferredLang, setPreferredLang] = useState<SupportedLanguageCode>('auto');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Hello, Commander 👋\n\nI am **FINCOLLECT AI**, your JARVIS financial intelligence assistant. Ask me anything about your active loans, daily collections, operating expenses, Day Book, or Profit & Loss statements in **22 Indian languages** or transliteration.`,
      category: 'general',
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  const pageSegment = pathname.split('/')[1] || 'dashboard';
  const pageContextTitle =
    pageSegment.charAt(0).toUpperCase() + pageSegment.slice(1).replace('-', ' ');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendQuery = async (queryToSend?: string) => {
    const text = (queryToSend || inputQuery).trim();
    if (!text || isLoading) return;

    const userMsgId = `user-${Date.now()}`;
    const userTimestamp = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    setMessages((prev) => [
      ...prev,
      { id: userMsgId, sender: 'user', text, timestamp: userTimestamp },
    ]);

    if (!queryToSend) setInputQuery('');

    setIsLoading(true);

    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('REQUEST_TIMEOUT')), 8000)
      );

      const res = await Promise.race([
        queryFinCollectAI(text, pageSegment, preferredLang),
        timeoutPromise,
      ]) as AIResponse;

      const aiMsgId = `ai-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: aiMsgId,
          sender: 'ai',
          text: res.message,
          category: res.category,
          timestamp: res.timestamp,
        },
      ]);
    } catch (err: any) {
      console.error('AI drawer query error:', err);

      const errorText =
        err.message === 'REQUEST_TIMEOUT'
          ? `⚠️ Request timed out. Click to retry.\n\n→ ${text}`
          : `⚠️ An error occurred while retrieving data. Please retry.\n\n→ ${text}`;

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'ai',
          text: errorText,
          category: 'general',
          timestamp: userTimestamp,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('Copied response to clipboard.', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const quickPrompts = [
    { label: '💰 Today Collection', query: 'Today collection entha?' },
    { label: 'आज कितना कलेक्शन हुआ?', query: 'आज कितना कलेक्शन हुआ?' },
    { label: 'இன்று எவ்வளவு collection?', query: 'இன்று எவ்வளவு collection வந்தது?' },
    { label: '👥 Total Customers', query: 'How many customers are there?' },
    { label: '💵 Cash in Hand', query: 'Cash in hand entha undi?' },
    { label: '🏦 Active Loans', query: 'How many active loans?' },
    { label: '⚖️ Financial Statements', query: 'Show financial statements overview' },
  ];

  const currentLangObj = ALL_SUPPORTED_LANGUAGES.find(l => l.code === preferredLang) || ALL_SUPPORTED_LANGUAGES[0];

  return (
    <>
      {/* JARVIS ARC-REACTOR FLOATING ACTION BUTTON (FAB) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-full bg-[#070A12]/90 border border-sky-400/40 text-white shadow-[0_0_25px_rgba(56,189,248,0.25)] hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-2.5 group backdrop-blur-xl"
        title="Open JARVIS FinCollect AI"
      >
        <div className="relative flex items-center justify-center">
          <Cpu className="w-5 h-5 text-sky-400 group-hover:rotate-45 transition-transform duration-500" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border-2 border-black rounded-full animate-ping" />
        </div>
        <span className="text-xs font-mono font-bold tracking-wider uppercase">
          [JARVIS.AI]
        </span>
        <Radio className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
      </button>

      {/* RIGHT-SIDE JARVIS SLIDE-OVER PANEL */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-md flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-lg h-full bg-[#070A12]/95 text-white backdrop-blur-2xl border-l border-sky-500/25 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
            {/* JARVIS Header Bar */}
            <div className="p-4 border-b border-sky-500/20 flex items-center justify-between bg-slate-900/80 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-400/30 flex items-center justify-center text-sky-400 shadow-inner">
                  <Cpu className="w-5 h-5 text-sky-400" />
                </div>
                <div className="flex flex-col leading-tight">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black font-mono tracking-wider text-white">FINCOLLECT AI</h3>
                    <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-sky-500/10 text-sky-400 border border-sky-500/30 rounded uppercase">
                      [JARVIS.ONLINE]
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Multilingual Financial Telemetry OS
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* AI Language Selector */}
                <div className="relative flex items-center bg-slate-900 border border-sky-500/30 rounded-xl px-2 py-1">
                  <Languages className="w-3.5 h-3.5 text-sky-400 mr-1" />
                  <select
                    value={preferredLang}
                    onChange={(e) => setPreferredLang(e.target.value as SupportedLanguageCode)}
                    className="bg-transparent text-[11px] font-mono font-bold text-white focus:outline-none cursor-pointer"
                  >
                    {ALL_SUPPORTED_LANGUAGES.map(l => (
                      <option key={l.code} value={l.code} className="bg-[#0F172A] text-white">
                        {l.flag} {l.nativeName}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-sky-500/15 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Context Banner */}
            <div className="px-4 py-2 border-b border-sky-500/15 bg-slate-900/60 flex items-center justify-between text-[11px] font-mono text-slate-400 shrink-0">
              <div className="flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-sky-400" />
                <span>[CONTEXT]: <strong className="text-white font-bold">{pageContextTitle}</strong></span>
              </div>
              <span className="text-[9px] text-emerald-400">[READ-ONLY SAFEGUARD ACTIVE]</span>
            </div>

            {/* Quick Prompts Bar */}
            <div className="p-3 border-b border-sky-500/15 bg-slate-900/40 shrink-0 overflow-x-auto flex items-center gap-2 no-scrollbar">
              {quickPrompts.map((qp) => (
                <button
                  key={qp.label}
                  onClick={() => handleSendQuery(qp.query)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-sky-500/20 border border-sky-500/20 hover:border-sky-500/40 text-[10px] font-mono text-slate-300 hover:text-sky-300 whitespace-nowrap transition-all shrink-0"
                >
                  {qp.label}
                </button>
              ))}
            </div>

            {/* Chat Conversation Area */}
            <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col gap-1 max-w-[92%] ${
                    msg.sender === 'user' ? 'self-end items-end' : 'self-start items-start'
                  }`}
                >
                  <div
                    className={`p-4 rounded-2xl text-xs leading-relaxed shadow-md ${
                      msg.sender === 'user'
                        ? 'bg-blue-600/90 text-white font-semibold rounded-tr-none border border-blue-400/30'
                        : 'bg-slate-900/90 border border-sky-500/20 text-slate-100 rounded-tl-none'
                    }`}
                  >
                    {msg.sender === 'user' ? (
                      <div className="whitespace-pre-wrap font-sans">{msg.text}</div>
                    ) : (
                      <FormattedAIResponse
                        content={msg.text}
                        onSelectFollowUp={(suggestion) => handleSendQuery(suggestion)}
                      />
                    )}
                  </div>

                  <div className="flex items-center gap-2 px-2 text-[9px] text-slate-400 font-mono">
                    <span>{msg.timestamp}</span>
                    {msg.sender === 'ai' && (
                      <button
                        onClick={() => handleCopyText(msg.id, msg.text)}
                        className="hover:text-sky-400 transition-colors flex items-center gap-0.5"
                        title="Copy Response"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="self-start flex items-center gap-2.5 p-3.5 rounded-2xl bg-slate-900 border border-sky-500/30 text-xs text-slate-300 shadow-md">
                  <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
                  <span className="font-mono text-sky-300">[JARVIS PROCESSING TELEMETRY QUERY...]</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3.5 border-t border-sky-500/20 bg-slate-900/90 shrink-0 flex flex-col gap-2">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendQuery();
                }}
                className="flex items-end gap-2"
              >
                <textarea
                  rows={2}
                  placeholder="Ask JARVIS in English, తెలుగు, हिन्दी, தமிழ், or transliteration... (Press Enter to send)"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendQuery();
                    }
                  }}
                  className="flex-1 p-3 text-xs rounded-2xl bg-[#070A12] border border-sky-500/30 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-400 resize-none font-sans"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={isLoading || !inputQuery.trim()}
                  className="h-12 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold shrink-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
              <span className="text-[9px] text-slate-500 block text-center font-mono">
                JARVIS TELEMETRY OS • READ-ONLY SAFEGUARD ACTIVE
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
