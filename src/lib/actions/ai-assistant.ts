'use server';

import { createClient } from '@/lib/supabase/server';
import { formatCurrency, formatDate } from '@/lib/utils';
import { getAIDateBounds } from '@/lib/utils/ai-date-utils';
import { getDayBookData } from './day-book';
import { getFinancialStatements } from './accounting';
import { getInvestmentMetrics } from './investment';
import { getAdjustmentLoanBalances } from './adjustment-ledger';
import { decodeLoanType } from './loans';
import { SupportedLanguageCode, FINANCIAL_LEXICON } from '@/lib/ai/multilingual-lexicon';
import { detectLanguage } from '@/lib/ai/language-detector';
import { MultilingualResponseFormatter } from '@/lib/ai/response-templates';

export interface AIResponse {
  success: boolean;
  message: string;
  category?: 'dashboard' | 'loans' | 'collections' | 'expenses' | 'investments' | 'accounting' | 'general';
  suggestedFollowUps?: string[];
  timestamp: string;
  performanceMs?: number;
  error?: string;
  detectedLanguage?: SupportedLanguageCode;
}

// Lightweight cache for identical queries within 5 seconds
const responseCache: Record<string, { data: AIResponse; expiry: number }> = {};

/**
 * Universal FinCollect AI Assistant: Pan-India Multilingual Direct DB Router
 */
export async function queryFinCollectAI(
  rawQuery: string,
  pageContext: string = 'dashboard',
  preferredLanguage: SupportedLanguageCode = 'auto'
): Promise<AIResponse> {
  const startTime = performance.now();
  const timestamp = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  if (!rawQuery || !rawQuery.trim()) {
    return {
      success: true,
      message: 'Please ask a question about your business (e.g. *"How many customers are there?"*, *"Today collection entha?"*, *"आज कितना कलेक्शन हुआ?"*, *"இன்று எவ்வளவு collection வந்தது?"*).',
      suggestedFollowUps: ['How many customers are there?', "What is today's collection?", 'How many active loans?'],
      timestamp,
      performanceMs: Math.round(performance.now() - startTime),
    };
  }

  // Detect Language & Script
  const langDetection = detectLanguage(rawQuery, preferredLanguage);
  const targetLang = langDetection.effectiveCode;

  const query = rawQuery.toLowerCase().trim();
  const bounds = getAIDateBounds();

  // ----------------------------------------------------
  // SECURITY GUARD: STRICTLY READ-ONLY
  // ----------------------------------------------------
  const mutationKeywords = ['create ', 'insert ', 'delete ', 'drop ', 'update ', 'remove ', 'truncate ', 'alter '];
  if (mutationKeywords.some(k => query.includes(k))) {
    return {
      success: true,
      message: '🔒 **Security Guard**: Jai Ram Finance AI operates in **READ-ONLY mode**. It cannot create, modify, or delete database records. Please use the application modules to record transactions.',
      category: 'general',
      timestamp,
      detectedLanguage: targetLang,
      performanceMs: Math.round(performance.now() - startTime),
    };
  }

  // ----------------------------------------------------
  // STEP 1: DETERMINISTIC GREETINGS & SIMPLE MESSAGES
  // ----------------------------------------------------
  const greetingSet = new Set(['hi', 'hello', 'hey', 'namaste', 'good morning', 'good evening', 'good afternoon', 'hi there', 'hello ai', 'హలో', 'నమస్తే', 'नमस्ते', 'வணக்கம்', 'ನಮಸ್ಕಾರ']);
  const thanksSet = new Set(['thanks', 'thank you', 'thanks!', 'thank you!', 'dhanyavadagalu', 'thanks bro', 'thx', 'ధన్యవాదాలు', 'धन्यवाद', 'நன்றி', 'ಧನ್ಯವಾದಗಳು']);
  const helpSet = new Set(['help', 'help me', 'what can you do', 'options', 'menu', 'సహాయం', 'मदद', 'உதவி']);

  if (greetingSet.has(query)) {
    return {
      success: true,
      message: `Hello! 👋 How can I assist you with your Jai Ram Finance financial data today?\n\n→ Total customers entha mandi?\n→ Today collection entha?\n→ आज कितना कलेक्शन हुआ?\n→ இன்று எவ்வளவு collection வந்தது?`,
      category: 'general',
      timestamp,
      detectedLanguage: targetLang,
      performanceMs: Math.round(performance.now() - startTime),
    };
  }

  if (thanksSet.has(query)) {
    return {
      success: true,
      message: `You're very welcome! Ask me anytime you need financial insights or customer balance updates.`,
      category: 'general',
      timestamp,
      detectedLanguage: targetLang,
      performanceMs: Math.round(performance.now() - startTime),
    };
  }

  if (helpSet.has(query)) {
    return {
      success: true,
      message: `I am **Jai Ram Finance AI**, your Pan-India financial assistant supporting 22 Indian languages & transliterations:\n\n- 👥 **Customers**: *"How many customers are there?"*, *"Ramesh balance entha?"*, *"आज Ramesh का balance कितना है?"*\n- 💰 **Collections**: *"Today collection entha?"*, *"आज कितना कलेक्शन हुआ?"*, *"இன்று எவ்வளவு collection வந்தது?"*\n- 📖 **Day Book**: *"What is today's opening balance?"*, *"Today closing balance"*\n- 🏦 **Loans**: *"How many active loans?"*, *"Which loans are fully settled?"*\n- ⚖️ **Accounting**: *"Total assets entha?"*, *"Cash in hand entha undi?"*, *"Today profit/loss?"*`,
      category: 'general',
      timestamp,
      detectedLanguage: targetLang,
      performanceMs: Math.round(performance.now() - startTime),
    };
  }

  // Check 5-second query cache for identical fast repeat prompts
  const cacheKey = `${query}_${pageContext}_${targetLang}`;
  const cached = responseCache[cacheKey];
  if (cached && cached.expiry > Date.now()) {
    return { ...cached.data, timestamp, performanceMs: Math.round(performance.now() - startTime) };
  }

  const supabase = await createClient();

  try {
    // Helper matchers against financial lexicon
    const hasWord = (list: string[]) => list.some(word => query.includes(word));

    const isCustomerWord = hasWord(FINANCIAL_LEXICON.customer);
    const isCollectionWord = hasWord(FINANCIAL_LEXICON.collection);
    const isLoanWord = hasWord(FINANCIAL_LEXICON.loan);
    const isTodayWord = hasWord(FINANCIAL_LEXICON.today);
    const isBalanceWord = hasWord(FINANCIAL_LEXICON.balance);
    const isCashInHandWord = hasWord(FINANCIAL_LEXICON.cashInHand);
    const isInterestWord = hasWord(FINANCIAL_LEXICON.interest);
    const isExpenseWord = hasWord(FINANCIAL_LEXICON.expenses);

    // ----------------------------------------------------
    // INTENT 1: TOTAL CUSTOMERS COUNT
    // ----------------------------------------------------
    if (
      isCustomerWord &&
      (query.includes('how many') || query.includes('count') || query.includes('total') || query.includes('entha mandi') || query.includes('anni') || query.includes('kitne') || query.includes('kitna') || query.includes('eshtu') || query.includes('কত') || query.includes('எவ்வளவு')) &&
      !query.includes('balance') && !query.includes('pending') && !query.includes('history')
    ) {
      const { count, error: dbErr } = await supabase
        .from('customers')
        .select('id', { count: 'exact', head: true });

      if (dbErr) {
        console.error('[FinCollect AI DB Error - Customer Count]:', dbErr);
        return { success: false, message: 'Failed to query customer count.', error: dbErr.message, timestamp };
      }

      const totalCust = count || 0;
      const message = MultilingualResponseFormatter.formatCustomerCount(totalCust, targetLang);

      const result: AIResponse = {
        success: true,
        message,
        category: 'general',
        suggestedFollowUps: ['How many active loans?', "Today's collection?", 'Cash in hand?'],
        timestamp,
        detectedLanguage: targetLang,
        performanceMs: Math.round(performance.now() - startTime),
      };
      responseCache[cacheKey] = { data: result, expiry: Date.now() + 5000 };
      return result;
    }

    // ----------------------------------------------------
    // INTENT 2: CUSTOMER SPECIFIC LOOKUP (e.g. "Ramesh balance entha?", "आज Ramesh का balance कितना है?")
    // ----------------------------------------------------
    const isCustomerQuery =
      isBalanceWord ||
      query.includes('pending') ||
      query.includes('history') ||
      query.includes('collected') ||
      query.includes('amount') ||
      query.includes('entha') ||
      query.includes('kitna') ||
      query.includes('kitne') ||
      query.includes('eshtu') ||
      query.includes('evvalavu');

    let nameSearchTerm = '';
    if (isCustomerQuery) {
      const cleaned = query
        .replace(/balance|pending|history|collection|collected|amount|entha|mandi|vachindi|ki|aaj|ivala|today|show|what|is|the|from|for|of|kitna|kitne|batao|ka|ge|inru|evvalavu|ivattu|eshtu|aastu|aait|baki|bakilu/g, ' ')
        .trim();
      if (cleaned.length >= 2) {
        nameSearchTerm = cleaned;
      }
    }

    if (nameSearchTerm && !['today', 'weekly', 'monthly', 'active', 'settled', 'expenses', 'profit', 'loss', 'assets', 'liabilities', 'investment', 'opening', 'closing', 'cash'].includes(nameSearchTerm)) {
      const { data: matchedCustomers } = await supabase
        .from('customers')
        .select('*')
        .or(`customer_name.ilike."%${nameSearchTerm}%",customer_id.ilike."%${nameSearchTerm}%"`);

      if (matchedCustomers && matchedCustomers.length > 1) {
        let msg = `Multiple customers matched **"${nameSearchTerm}"**. Please specify:\n\n`;
        matchedCustomers.slice(0, 5).forEach(c => {
          msg += `- **${c.customer_name}** (ID: \`${c.customer_id}\`)\n`;
        });
        return { success: true, message: msg.trim(), category: 'general', timestamp, detectedLanguage: targetLang };
      }

      if (matchedCustomers && matchedCustomers.length === 1) {
        const cust = matchedCustomers[0];

        const { data: custLoans } = await supabase
          .from('loans')
          .select('*, collections(id, amount_paid, payment_date)')
          .eq('customer_id', cust.id);

        let totalOutstanding = 0;
        let totalAccruedInterest = 0;
        let activeLoansCount = 0;

        for (const l of custLoans || []) {
          const target = Number(l.total_collection || 0);
          const colls = l.collections || [];
          const collected = colls.reduce((sum: number, c: any) => sum + Number(c.amount_paid || 0), 0);
          const balance = Math.max(0, target - collected);

          totalOutstanding += balance;

          const lType = decodeLoanType(l.working_days, l.loan_type);
          if (lType === 'adjustment') {
            const adjBal = await getAdjustmentLoanBalances(l.id, supabase);
            totalAccruedInterest += adjBal.accruedInterest;
          }

          if (!l.is_closed && balance > 0) activeLoansCount++;
        }

        const { data: custColls } = await supabase
          .from('collections')
          .select('amount_paid, payment_date')
          .eq('loans.customer_id', cust.id)
          .order('payment_date', { ascending: false })
          .limit(3);

        const lastColl = custColls && custColls.length > 0 ? Number(custColls[0].amount_paid || 0) : 0;
        const lastDate = custColls && custColls.length > 0 ? custColls[0].payment_date : undefined;

        const payload = {
          customer_id: cust.customer_id,
          customer_name: cust.customer_name,
          mobile_number: cust.mobile_number,
          activeLoansCount,
          totalPrincipalOutstanding: totalOutstanding,
          totalAccruedAdjustmentInterest: totalAccruedInterest,
          totalPayableAmount: totalOutstanding + totalAccruedInterest,
          recentCollectionsCount: custColls?.length || 0,
          lastCollectionAmount: lastColl,
          lastCollectionDate: lastDate,
        };

        const msg = MultilingualResponseFormatter.formatCustomerDetails(payload, targetLang);

        const result: AIResponse = { success: true, message: msg, category: 'loans', timestamp, detectedLanguage: targetLang };
        responseCache[cacheKey] = { data: result, expiry: Date.now() + 5000 };
        return result;
      }
    }

    // ----------------------------------------------------
    // INTENT 3: TODAY'S COLLECTION
    // ----------------------------------------------------
    if (isTodayWord && (isCollectionWord || query.includes('vachindi') || query.includes('hua') || query.includes('vandhadhu') || query.includes('aayitu'))) {
      const { data: rawColls, error: dbErr } = await supabase
        .from('collections')
        .select('id, amount_paid')
        .eq('payment_date', bounds.todayISO);

      if (dbErr) {
        console.error('[FinCollect AI DB Error - Today Collection]:', dbErr);
        return { success: false, message: "Unable to query today's collections.", error: dbErr.message, timestamp };
      }

      const todaysColls = rawColls || [];
      const total = todaysColls.reduce((sum, c) => sum + Number(c.amount_paid || 0), 0);
      const message = MultilingualResponseFormatter.formatTodayCollection(total, todaysColls.length, targetLang);

      const result: AIResponse = { success: true, message, category: 'collections', timestamp, detectedLanguage: targetLang };
      responseCache[cacheKey] = { data: result, expiry: Date.now() + 5000 };
      return result;
    }

    // ----------------------------------------------------
    // INTENT 4: MONTHLY COLLECTION
    // ----------------------------------------------------
    if ((query.includes('month') || query.includes('મહિના') || query.includes('మహిన') || query.includes('మహా') || query.includes('ਮਹੀਨੇ') || query.includes('মাস')) && (isCollectionWord || query.includes('vachindi'))) {
      const { data: rawColls } = await supabase
        .from('collections')
        .select('amount_paid')
        .gte('payment_date', bounds.monthStartISO)
        .lte('payment_date', bounds.todayISO);

      const total = (rawColls || []).reduce((sum, c) => sum + Number(c.amount_paid || 0), 0);
      const message = MultilingualResponseFormatter.formatMonthlyCollection(total, (rawColls || []).length, targetLang);

      const result: AIResponse = { success: true, message, category: 'collections', timestamp, detectedLanguage: targetLang };
      responseCache[cacheKey] = { data: result, expiry: Date.now() + 5000 };
      return result;
    }

    // ----------------------------------------------------
    // INTENT 5: CASH IN HAND & DAY BOOK
    // ----------------------------------------------------
    if (isCashInHandWord || (query.includes('cash') && (query.includes('hand') || query.includes('entha') || query.includes('kitna') || query.includes('und')))) {
      const invMetrics = await getInvestmentMetrics();
      const currentCash = invMetrics.data?.currentBalance ?? 0;
      const dayBookRes = await getDayBookData(bounds.todayISO);
      const closingBal = dayBookRes.data?.closingBalance ?? currentCash;

      const message = MultilingualResponseFormatter.formatCashInHand(currentCash, closingBal, targetLang);

      const result: AIResponse = { success: true, message, category: 'investments', timestamp, detectedLanguage: targetLang };
      responseCache[cacheKey] = { data: result, expiry: Date.now() + 5000 };
      return result;
    }

    // ----------------------------------------------------
    // INTENT 6: ACTIVE LOANS PORTFOLIO
    // ----------------------------------------------------
    if (isLoanWord && (query.includes('active') || query.includes('count') || query.includes('outstanding') || query.includes('pending') || query.includes('kitne') || query.includes('entha'))) {
      const { data: allLoans } = await supabase
        .from('loans')
        .select('id, balance_amount, is_closed');

      const loansList = allLoans || [];
      const activeLoans = loansList.filter(l => !l.is_closed && Number(l.balance_amount || 0) > 0);
      const totalOutstanding = activeLoans.reduce((sum, l) => sum + Number(l.balance_amount || 0), 0);

      const message = MultilingualResponseFormatter.formatActiveLoans(activeLoans.length, totalOutstanding, targetLang);

      const result: AIResponse = { success: true, message, category: 'loans', timestamp, detectedLanguage: targetLang };
      responseCache[cacheKey] = { data: result, expiry: Date.now() + 5000 };
      return result;
    }

    // ----------------------------------------------------
    // INTENT 7: FINANCIAL STATEMENTS (ASSETS, LIABILITIES, PROFIT/LOSS)
    // ----------------------------------------------------
    if (
      query.includes('asset') || query.includes('liability') || query.includes('liabilities') ||
      query.includes('profit') || query.includes('loss') || query.includes('लाभ') || query.includes('லாபம்')
    ) {
      const bundle = await getFinancialStatements(bounds.todayISO);
      const bs = bundle.balanceSheet;
      const pnl = bundle.profitAndLoss;

      const message = MultilingualResponseFormatter.formatFinancialStatements(
        {
          totalAssets: bs.summary.totalAssets,
          totalLiabilities: bs.summary.totalLiabilitiesAndCapital,
          netProfitLoss: pnl.netProfitOrLoss,
        },
        targetLang
      );

      const result: AIResponse = { success: true, message, category: 'accounting', timestamp, detectedLanguage: targetLang };
      responseCache[cacheKey] = { data: result, expiry: Date.now() + 5000 };
      return result;
    }

    // ----------------------------------------------------
    // FALLBACK CLARIFICATION
    // ----------------------------------------------------
    const fallbackMarkdown = `
### 🤖 Jai Ram Finance AI Assistant (Pan-India Multilingual)

I answer financial questions across 22 Indian languages & transliterations:

- 👥 *"How many customers are there?"* / *"మొత్తం వినియోగదారులు ఎంత మంది?"*
- 💰 *"Today collection entha?"* / *"आज कितना कलेक्शन हुआ?"* / *"இன்று எவ்வளவு collection வந்தது?"*
- 👤 *"Ramesh balance entha?"* / *"आज Ramesh का balance कितना है?"*
- 💵 *"Cash in hand entha undi?"* / *"हाथ में नकद कितना है?"*
- 🏦 *"How many active loans?"* / *"एक्टिव लोन कितने हैं?"*
    `.trim();

    return {
      success: true,
      message: fallbackMarkdown,
      category: 'general',
      timestamp,
      detectedLanguage: targetLang,
      performanceMs: Math.round(performance.now() - startTime),
    };
  } catch (err: any) {
    console.error('Error in queryFinCollectAI server action:', err);
    return {
      success: false,
      message: 'An unexpected database error occurred while querying Jai Ram Finance AI. Please try again.',
      error: err?.message,
      timestamp,
      detectedLanguage: targetLang,
      performanceMs: Math.round(performance.now() - startTime),
    };
  }
}
