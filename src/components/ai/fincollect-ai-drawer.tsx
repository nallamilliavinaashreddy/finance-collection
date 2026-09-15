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
      text: `Hello, Administrator 👋\n\nI am **FinCollect AI**, your Pan-India financial assistant. I support **22 Scheduled Indian Languages** (తెలుగు, हिन्दी, தமிழ், ಕನ್ನಡ, മലയാളം, मराठी, বাংলা, ગુજરાતી, ਪੰਜਾਬੀ, ଓଡ଼ିଆ, অসমীয়া, اردو, etc.) + English & transliterated queries.`,
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
          ? `⚠️ Request timed out. Please click to retry.\n\n→ ${text}`
          : `⚠️ An error occurred while fetching data. Please retry.\n\n→ ${text}`;

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
      {/* FLOATING ACTION BUTTON (FAB) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-500 text-white shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-2.5 group ring-4 ring-indigo-500/20 backdrop-blur-xl border border-white/20"
        title="Open FinCollect AI Copilot"
      >
        <div className="relative flex items-center justify-center">
          <Bot className="w-5 h-5 text-white group-hover:rotate-12 transition-transform" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border-2 border-white rounded-full animate-ping" />
        </div>
        <span className="text-xs font-black tracking-wide uppercase font-sans">
          FinCollect AI
        </span>
        <Sparkles className="w-3.5 h-3.5 text-indigo-200 animate-pulse" />
      </button>

      {/* RIGHT-SIDE SLIDE-OVER AI PANEL */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 dark:bg-black/70 backdrop-blur-md flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-lg h-full bg-white/95 dark:bg-[#070B14]/95 text-slate-900 dark:text-[#F8FAFC] backdrop-blur-2xl border-l border-slate-200/80 dark:border-white/10 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
            {/* Header Bar */}
            <div className="p-4 border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between bg-slate-50/90 dark:bg-[#0F172A]/90 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#C052B8] via-[#8B5CF6] to-[#5B8DEF] flex items-center justify-center text-white shadow-md">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="flex flex-col leading-tight">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black tracking-tight text-[#F8FAFC]">FinCollect AI</h3>
                    <Badge variant="success" className="text-[9px] py-0 px-1.5 font-mono">
                      ● PAN-INDIA
                    </Badge>
                  </div>
                  <span className="text-[10px] text-[#94A3B8] font-medium">
                    22 Languages + Transliteration
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* AI Language Selector */}
                <div className="relative flex items-center bg-[#182237] border border-[#2A3652] rounded-xl px-2 py-1">
                  <Languages className="w-3.5 h-3.5 text-[#C084FC] mr-1" />
                  <select
                    value={preferredLang}
                    onChange={(e) => setPreferredLang(e.target.value as SupportedLanguageCode)}
                    className="bg-transparent text-[11px] font-bold text-[#F8FAFC] focus:outline-none cursor-pointer"
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
                  className="p-1.5 rounded-xl text-[#94A3B8] hover:text-white hover:bg-[#2A3652]/50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Page Context Banner */}
            <div className="px-4 py-2 border-b border-[#2A3652] bg-[#182237]/60 flex items-center justify-between text-[11px] text-[#94A3B8] font-medium shrink-0">
              <div className="flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-[#C084FC]" />
                <span>Context: <strong className="text-[#F8FAFC] font-bold">{pageContextTitle}</strong></span>
              </div>
              <span className="font-mono text-[9px] text-[#22C55E]">Target: {currentLangObj.name}</span>
            </div>

            {/* Quick Prompts Bar */}
            <div className="p-3 border-b border-[#2A3652] bg-[#182237]/40 shrink-0 overflow-x-auto flex items-center gap-2 no-scrollbar">
              {quickPrompts.map((qp) => (
                <button
                  key={qp.label}
                  onClick={() => handleSendQuery(qp.query)}
                  className="px-2.5 py-1.5 rounded-xl bg-[#182237] hover:bg-[#8B5CF6]/20 border border-[#2A3652] hover:border-[#8B5CF6]/40 text-[10px] font-bold text-[#94A3B8] hover:text-[#C084FC] whitespace-nowrap transition-all shrink-0"
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
                    className={`p-4 rounded-3xl text-xs leading-relaxed shadow-md ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-[#C052B8] via-[#8B5CF6] to-[#5B8DEF] text-white font-semibold rounded-tr-none'
                        : 'bg-[#182237] border border-[#2A3652] text-[#F8FAFC] rounded-tl-none'
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

                  <div className="flex items-center gap-2 px-2 text-[9px] text-[#64748B] font-mono">
                    <span>{msg.timestamp}</span>
                    {msg.sender === 'ai' && (
                      <button
                        onClick={() => handleCopyText(msg.id, msg.text)}
                        className="hover:text-white transition-colors flex items-center gap-0.5"
                        title="Copy Response"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3 h-3 text-[#22C55E]" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="self-start flex items-center gap-2.5 p-3.5 rounded-2xl bg-[#182237] border border-[#2A3652] text-xs text-[#94A3B8] shadow-md">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#8B5CF6]" />
                  <span className="font-semibold text-[#F8FAFC]">🤖 FinCollect AI processing multilingual query...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3.5 border-t border-[#2A3652] bg-[#182237] shrink-0 flex flex-col gap-2">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendQuery();
                }}
                className="flex items-end gap-2"
              >
                <textarea
                  rows={2}
                  placeholder="Ask in English, తెలుగు, हिन्दी, தமிழ், ಕನ್ನಡ, or transliteration... (Press Enter to send)"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendQuery();
                    }
                  }}
                  className="flex-1 p-3 text-xs rounded-2xl bg-[#121A2B] border border-[#2A3652] text-[#F8FAFC] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/40 focus:border-[#8B5CF6] resize-none"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={isLoading || !inputQuery.trim()}
                  className="h-12 px-4 rounded-2xl bg-gradient-to-r from-[#C052B8] via-[#8B5CF6] to-[#5B8DEF] text-white font-bold shrink-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
              <span className="text-[9px] text-[#94A3B8] block text-center font-mono">
                Supports 22 Scheduled Indian Languages in Read-Only Safety Mode.
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
