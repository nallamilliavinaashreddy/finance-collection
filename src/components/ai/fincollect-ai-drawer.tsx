'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { queryFinCollectAI, AIResponse } from '@/lib/actions/ai-assistant';
import { FormattedAIResponse } from './formatted-ai-response';
import { useToast } from '@/components/providers/toast-provider';
import {
  Bot,
  Sparkles,
  X,
  Send,
  Copy,
  Check,
  TrendingUp,
  Coins,
  Receipt,
  Wallet,
  Scale,
  RefreshCw,
  Zap,
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
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Hello, Administrator 👋\n\nI am **FinCollect AI**, your intelligent financial copilot. Ask me anything about your active loans, collections, operating expenses, or investment cash flows.`,
      category: 'general',
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  // Compute active page context tag
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

    const lower = text.toLowerCase().trim();

    // ----------------------------------------------------
    // CLIENT INSTANT INTERCEPT FOR GREETINGS & SIMPLE MESSAGES (< 2ms)
    // ----------------------------------------------------
    const greetingSet = new Set(['hi', 'hello', 'hey', 'namaste', 'good morning', 'good evening', 'good afternoon', 'hi there', 'hello ai']);
    const thanksSet = new Set(['thanks', 'thank you', 'thanks!', 'thank you!', 'dhanyavadagalu', 'thanks bro', 'thx']);
    const helpSet = new Set(['help', 'help me', 'what can you do', 'options', 'menu']);
    const byeSet = new Set(['bye', 'goodbye', 'ok', 'okay', 'cya']);

    if (greetingSet.has(lower)) {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: `Hello, Administrator 👋 How can I assist you with your FinCollect financial analytics today?\n\n→ Show today's collection\n→ Show highest pending loan\n→ Show business net profit`,
          category: 'general',
          timestamp: userTimestamp,
        },
      ]);
      return;
    }

    if (thanksSet.has(lower)) {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: `You're very welcome! Let me know whenever you need more financial insights or reports.\n\n→ Show today's collection\n→ Analyze Dashboard`,
          category: 'general',
          timestamp: userTimestamp,
        },
      ]);
      return;
    }

    if (helpSet.has(lower)) {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: `I am **FinCollect AI**, your intelligent financial copilot. You can ask me:\n- **Collections**: *What is today's collection?*, *Show weekly collection*\n- **Loans**: *Which loan has the highest pending balance?*, *Show active loans*\n- **Expenses**: *What are today's expenses?*\n- **Investment**: *What is my investment balance?*\n\n→ Analyze Dashboard\n→ Today's collection entha?`,
          category: 'general',
          timestamp: userTimestamp,
        },
      ]);
      return;
    }

    if (byeSet.has(lower)) {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: `Goodbye, Administrator! I am here whenever you need real-time business insights.`,
          category: 'general',
          timestamp: userTimestamp,
        },
      ]);
      return;
    }

    // ----------------------------------------------------
    // FINANCIAL DATA QUERIES (WITH 6-SECOND TIMEOUT RACE)
    // ----------------------------------------------------
    setIsLoading(true);

    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('REQUEST_TIMEOUT')), 6000)
      );

      const res = await Promise.race([
        queryFinCollectAI(text, pageSegment),
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
          ? `⚠️ I'm having trouble processing that request right now due to a network timeout. Please click below to try again.\n\n→ ${text}`
          : `⚠️ An error occurred while retrieving your financial data. Please click below to retry.\n\n→ ${text}`;

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
    { label: '📊 Analyze Dashboard', query: 'What is my current net profit and business overview?' },
    { label: '💰 Today\'s Collection', query: 'What is today\'s total collection?' },
    { label: '📅 Weekly Collection', query: 'Show my total collection for this week' },
    { label: '🗓 Monthly Collection', query: 'Show my total collection for this month' },
    { label: '⚠️ Pending Loans', query: 'Which loans have the highest pending balance?' },
    { label: '📈 Investment Summary', query: 'What is my current investment balance and cash flow?' },
    { label: '💸 Expense Analysis', query: 'What are today\'s expenses?' },
    { label: '🤝 Settlement Insights', query: 'Which loans are close to settlement?' },
  ];

  return (
    <>
      {/* FLOATING ACTION BUTTON (FAB) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-full bg-gradient-to-r from-[#A855F7] via-[#EC4899] to-[#6366F1] text-white shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-2.5 group ring-4 ring-[#A855F7]/20"
        title="Open FinCollect AI Copilot"
      >
        <div className="relative flex items-center justify-center">
          <Bot className="w-5 h-5 text-white group-hover:rotate-12 transition-transform" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border-2 border-white rounded-full animate-ping" />
        </div>
        <span className="text-xs font-black tracking-wide uppercase font-sans">
          FinCollect AI
        </span>
        <Sparkles className="w-3.5 h-3.5 text-pink-300 animate-pulse" />
      </button>

      {/* RIGHT-SIDE SLIDE-OVER AI PANEL */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-lg h-full bg-[#0B0F19]/98 dark:bg-[#0B0F19]/98 text-white backdrop-blur-2xl border-l border-[#252C40] shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
            {/* Header Bar */}
            <div className="p-4 border-b border-[#252C40] flex items-center justify-between bg-[#161B2C]/90 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#A855F7] to-[#EC4899] flex items-center justify-center text-white shadow-md">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="flex flex-col leading-tight">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black tracking-tight">FinCollect AI</h3>
                    <Badge variant="success" className="text-[9px] py-0 px-1.5 font-mono">
                      ● AI READY
                    </Badge>
                  </div>
                  <span className="text-[10px] text-[#A7B0C0] font-medium">
                    Your Intelligent Financial Assistant
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl text-[#A7B0C0] hover:text-white hover:bg-[#252C40]/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Page Context Banner */}
            <div className="px-4 py-2 border-b border-[#252C40] bg-[#111827] flex items-center justify-between text-[11px] text-[#A7B0C0] font-medium shrink-0">
              <div className="flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-[#EC4899]" />
                <span>Currently analyzing: <strong className="text-white font-bold">{pageContextTitle}</strong></span>
              </div>
              <span className="font-mono text-[9px] text-emerald-400">Read-Only Safety On</span>
            </div>

            {/* Quick Prompts Bar */}
            <div className="p-3 border-b border-[#252C40] bg-[#161B2C]/40 shrink-0 overflow-x-auto flex items-center gap-2 no-scrollbar">
              {quickPrompts.map((qp) => (
                <button
                  key={qp.label}
                  onClick={() => handleSendQuery(qp.query)}
                  className="px-2.5 py-1.5 rounded-xl bg-[#161B2C] hover:bg-[#A855F7]/20 border border-[#252C40] hover:border-[#A855F7]/40 text-[10px] font-bold text-[#A7B0C0] hover:text-[#EC4899] whitespace-nowrap transition-all shrink-0"
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
                    className={`p-4 rounded-3xl text-xs leading-relaxed shadow-lg ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-[#A855F7] via-[#EC4899] to-[#6366F1] text-white font-semibold rounded-tr-none'
                        : 'bg-[#161B2C] border border-[#252C40] text-[#F3F4F6] rounded-tl-none'
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

                  <div className="flex items-center gap-2 px-2 text-[9px] text-slate-500 font-mono">
                    <span>{msg.timestamp}</span>
                    {msg.sender === 'ai' && (
                      <button
                        onClick={() => handleCopyText(msg.id, msg.text)}
                        className="hover:text-white transition-colors flex items-center gap-0.5"
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
                <div className="self-start flex items-center gap-2.5 p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 shadow-md">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#F97316]" />
                  <span className="font-semibold">🤖 FinCollect AI is analyzing your financial data...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3.5 border-t border-[#252C40] bg-[#161B2C]/90 shrink-0 flex flex-col gap-2">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendQuery();
                }}
                className="flex items-end gap-2"
              >
                <textarea
                  rows={2}
                  placeholder="Ask FinCollect AI about your business... (Press Enter to send, Shift+Enter for newline)"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendQuery();
                    }
                  }}
                  className="flex-1 p-3 text-xs rounded-2xl bg-[#111827] border border-[#252C40] text-white placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-[#A855F7] resize-none"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={isLoading || !inputQuery.trim()}
                  className="h-12 px-4 rounded-2xl bg-gradient-to-r from-[#A855F7] via-[#EC4899] to-[#6366F1] text-white font-bold shrink-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
              <span className="text-[9px] text-[#A7B0C0] block text-center font-mono">
                FinCollect AI operates in Read-Only Safety Mode.
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
