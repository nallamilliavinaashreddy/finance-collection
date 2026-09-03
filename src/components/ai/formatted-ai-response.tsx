'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { CheckCircle2, TrendingUp, AlertCircle, ArrowRight } from 'lucide-react';

interface FormattedAIResponseProps {
  content: string;
  onSelectFollowUp?: (suggestion: string) => void;
}

export function FormattedAIResponse({ content, onSelectFollowUp }: FormattedAIResponseProps) {
  // Parse structured blocks from markdown content
  const lines = content.split('\n');
  const renderedElements: React.ReactNode[] = [];
  const followUps: string[] = [];

  let inTable = false;
  let tableHeader: string[] = [];
  let tableRows: string[][] = [];

  const flushTable = (keyIndex: number) => {
    if (tableHeader.length > 0) {
      renderedElements.push(
        <div key={`table-${keyIndex}`} className="my-3 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
          <table className="w-full text-left text-[11px] border-collapse">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-800 text-slate-300 font-bold">
                {tableHeader.map((h, i) => (
                  <th key={i} className="p-2 font-mono uppercase text-[10px]">
                    {h.trim()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, rIdx) => (
                <tr key={rIdx} className="border-b border-slate-900/60 hover:bg-slate-900/40">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="p-2 font-medium text-slate-200">
                      {parseInlineFormatting(cell.trim())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    tableHeader = [];
    tableRows = [];
    inTable = false;
  };

  const parseInlineFormatting = (text: string): React.ReactNode => {
    // Handle **bold**
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-black text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 font-mono text-[10px]">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // Catch Table Rows
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const cells = trimmed.split('|').filter((c, i, a) => i > 0 && i < a.length - 1);
      if (cells.every((c) => c.trim().match(/^:?-+:?$/))) {
        // Divider row, ignore
        return;
      }
      if (!inTable) {
        inTable = true;
        tableHeader = cells;
      } else {
        tableRows.push(cells);
      }
      return;
    } else if (inTable) {
      flushTable(idx);
    }

    // Catch Follow-Up Suggestions
    if (trimmed.startsWith('→') || trimmed.startsWith('• Follow-up:') || trimmed.startsWith('Suggest:')) {
      const sug = trimmed.replace(/^→\s*|^•\s*Follow-up:\s*|^Suggest:\s*/, '').trim();
      if (sug) followUps.push(sug);
      return;
    }

    // Headings ###
    if (trimmed.startsWith('### ')) {
      renderedElements.push(
        <h3 key={idx} className="text-sm font-black text-amber-400 mt-3 mb-1.5 uppercase tracking-wider border-b border-slate-800 pb-1 flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-[#F97316]" />
          {trimmed.replace('### ', '')}
        </h3>
      );
      return;
    }

    // Subheadings ####
    if (trimmed.startsWith('#### ')) {
      renderedElements.push(
        <h4 key={idx} className="text-xs font-bold text-slate-200 mt-2 mb-1 uppercase tracking-wide">
          {trimmed.replace('#### ', '')}
        </h4>
      );
      return;
    }

    // Bullet lists -
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const bulletText = trimmed.slice(2);
      renderedElements.push(
        <div key={idx} className="flex items-start gap-2 my-1 text-xs text-slate-300">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
          <div>{parseInlineFormatting(bulletText)}</div>
        </div>
      );
      return;
    }

    // Blockquotes >
    if (trimmed.startsWith('> ')) {
      renderedElements.push(
        <div key={idx} className="my-2.5 p-3 rounded-xl bg-[#8B5CF6]/10 border-l-3 border-[#8B5CF6] text-xs text-purple-200 font-medium">
          {parseInlineFormatting(trimmed.slice(2))}
        </div>
      );
      return;
    }

    // Regular paragraphs
    if (trimmed) {
      renderedElements.push(
        <p key={idx} className="text-xs leading-relaxed text-[#F8FAFC] my-1">
          {parseInlineFormatting(trimmed)}
        </p>
      );
    }
  });

  if (inTable) {
    flushTable(lines.length);
  }

  return (
    <div className="flex flex-col gap-2">
      {renderedElements}

      {/* Suggested Follow-Ups Pills */}
      {followUps.length > 0 && (
        <div className="mt-4 pt-3 border-t border-[#2A3652] flex flex-col gap-2">
          <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">
            Suggested Follow-Up Queries:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {followUps.map((f, i) => (
              <button
                key={i}
                onClick={() => onSelectFollowUp?.(f)}
                className="px-2.5 py-1 rounded-xl bg-[#182237] hover:bg-[#8B5CF6]/20 border border-[#2A3652] hover:border-[#8B5CF6]/40 text-[11px] font-semibold text-[#94A3B8] hover:text-[#C084FC] transition-all flex items-center gap-1"
              >
                <span>{f}</span>
                <ArrowRight className="w-3 h-3 text-[#C084FC]" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
