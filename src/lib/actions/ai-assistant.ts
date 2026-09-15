'use server';

import { createClient } from '@/lib/supabase/server';
import { formatCurrency, formatDate } from '@/lib/utils';
import { getAIDateBounds } from '@/lib/utils/ai-date-utils';
import { getDayBookData } from './day-book';
import { getFinancialStatements } from './accounting';
import { getInvestmentMetrics } from './investment';
import { getAdjustmentLoanBalances } from './adjustment-ledger';
import { decodeLoanType } from './loans';

export interface AIResponse {
  success: boolean;
  message: string;
  category?: 'dashboard' | 'loans' | 'collections' | 'expenses' | 'investments' | 'accounting' | 'general';
  suggestedFollowUps?: string[];
  timestamp: string;
  performanceMs?: number;
  error?: string;
}

// Lightweight cache for identical queries within 5 seconds
const responseCache: Record<string, { data: AIResponse; expiry: number }> = {};

/**
 * Universal FinCollect AI Assistant: Direct Database Query Router + Accounting Engine Alignment
 */
export async function queryFinCollectAI(
  rawQuery: string,
  pageContext: string = 'dashboard'
): Promise<AIResponse> {
  const startTime = performance.now();
  const timestamp = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  if (!rawQuery || !rawQuery.trim()) {
    return {
      success: true,
      message: 'Please ask a question about your business (e.g. *"How many customers are there?"*, *"Today collection entha?"*, *"Ramesh balance entha?"*).',
      suggestedFollowUps: ['How many customers are there?', "What is today's collection?", 'How many active loans?'],
      timestamp,
      performanceMs: Math.round(performance.now() - startTime),
    };
  }

  const query = rawQuery.toLowerCase().trim();
  const bounds = getAIDateBounds();

  // ----------------------------------------------------
  // SECURITY GUARD: STRICTLY READ-ONLY
  // ----------------------------------------------------
  const mutationKeywords = ['create ', 'insert ', 'delete ', 'drop ', 'update ', 'remove ', 'truncate ', 'alter '];
  if (mutationKeywords.some(k => query.includes(k))) {
    return {
      success: true,
      message: '🔒 **Security Guard**: FinCollect AI operates in **READ-ONLY mode**. It cannot create, modify, or delete database records. Please use the application modules to record transactions.',
      category: 'general',
      timestamp,
      performanceMs: Math.round(performance.now() - startTime),
    };
  }

  // ----------------------------------------------------
  // STEP 1: DETERMINISTIC GREETINGS & SIMPLE MESSAGES
  // ----------------------------------------------------
  const greetingSet = new Set(['hi', 'hello', 'hey', 'namaste', 'good morning', 'good evening', 'good afternoon', 'hi there', 'hello ai']);
  const thanksSet = new Set(['thanks', 'thank you', 'thanks!', 'thank you!', 'dhanyavadagalu', 'thanks bro', 'thx']);
  const helpSet = new Set(['help', 'help me', 'what can you do', 'options', 'menu']);
  const byeSet = new Set(['bye', 'goodbye', 'ok', 'okay', 'cya']);

  if (greetingSet.has(query)) {
    return {
      success: true,
      message: `Hello! 👋 How can I assist you with your FinCollect financial data today?\n\n→ Total customers entha mandi?\n→ Today collection entha?\n→ Cash in hand entha undi?\n→ Ramesh balance entha?`,
      category: 'general',
      timestamp,
      performanceMs: Math.round(performance.now() - startTime),
    };
  }

  if (thanksSet.has(query)) {
    return {
      success: true,
      message: `You're very welcome! Ask me anytime you need financial insights or customer balance updates.`,
      category: 'general',
      timestamp,
      performanceMs: Math.round(performance.now() - startTime),
    };
  }

  if (helpSet.has(query)) {
    return {
      success: true,
      message: `I am **FinCollect AI**, your real-time financial assistant. I understand English & Telugu transliteration:\n\n- 👥 **Customers**: *"How many customers are there?"*, *"Ramesh balance entha?"*\n- 💰 **Collections**: *"Today collection entha?"*, *"Show today's transactions"*\n- 📖 **Day Book**: *"What is today's opening balance?"*, *"Today closing balance"* \n- 🏦 **Loans**: *"How many active loans?"*, *"Which loans are fully settled?"*\n- ⚖️ **Accounting**: *"Total assets entha?"*, *"Cash in hand entha undi?"*, *"Today profit/loss?"*\n- 💸 **Expenses**: *"Today expenses entha?"*`,
      category: 'general',
      timestamp,
      performanceMs: Math.round(performance.now() - startTime),
    };
  }

  if (byeSet.has(query)) {
    return {
      success: true,
      message: `Goodbye! Have a great day.`,
      category: 'general',
      timestamp,
      performanceMs: Math.round(performance.now() - startTime),
    };
  }

  // Check 5-second query cache for identical fast repeat prompts
  const cacheKey = `${query}_${pageContext}`;
  const cached = responseCache[cacheKey];
  if (cached && cached.expiry > Date.now()) {
    return { ...cached.data, timestamp, performanceMs: Math.round(performance.now() - startTime) };
  }

  const supabase = await createClient();

  try {
    // ----------------------------------------------------
    // INTENT 1: TOTAL CUSTOMERS COUNT
    // ----------------------------------------------------
    if (
      (query.includes('customer') || query.includes('customers') || query.includes('borrower') || query.includes('client')) &&
      (query.includes('how many') || query.includes('count') || query.includes('total') || query.includes('entha mandi') || query.includes('anni')) &&
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
      const message = `**Total Customers**: **${totalCust}**`;

      const result: AIResponse = {
        success: true,
        message,
        category: 'general',
        suggestedFollowUps: ['How many active loans?', "Today's collection?", 'Cash in hand?'],
        timestamp,
        performanceMs: Math.round(performance.now() - startTime),
      };
      responseCache[cacheKey] = { data: result, expiry: Date.now() + 5000 };
      return result;
    }

    // ----------------------------------------------------
    // INTENT 2: CUSTOMER SPECIFIC LOOKUP (e.g. "Ramesh balance entha?", "Ramesh collection history")
    // ----------------------------------------------------
    const isCustomerQuery =
      query.includes('balance') ||
      query.includes('pending') ||
      query.includes('history') ||
      query.includes('collected') ||
      query.includes('amount') ||
      query.includes('entha');

    // Extract potential customer search query
    let nameSearchTerm = '';
    if (isCustomerQuery) {
      // Remove keywords to isolate name
      const cleaned = query
        .replace(/balance|pending|history|collection|collected|amount|entha|mandi|vachindi|ki|aaj|ivala|today|show|what|is|the|from|for|of/g, ' ')
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
        return { success: true, message: msg.trim(), category: 'general', timestamp };
      }

      if (matchedCustomers && matchedCustomers.length === 1) {
        const cust = matchedCustomers[0];

        // Fetch customer's loans
        const { data: custLoans } = await supabase
          .from('loans')
          .select('*, collections(id, amount_paid, payment_date)')
          .eq('customer_id', cust.id);

        let totalGiven = 0;
        let totalTarget = 0;
        let totalCollected = 0;
        let totalOutstanding = 0;
        let totalAccruedInterest = 0;
        let activeLoansCount = 0;
        let closedLoansCount = 0;

        for (const l of custLoans || []) {
          const given = Number(l.amount_given || 0);
          const target = Number(l.total_collection || 0);
          const colls = l.collections || [];
          const collected = colls.reduce((sum: number, c: any) => sum + Number(c.amount_paid || 0), 0);
          const balance = Math.max(0, target - collected);

          totalGiven += given;
          totalTarget += target;
          totalCollected += collected;
          totalOutstanding += balance;

          const lType = decodeLoanType(l.working_days, l.loan_type);
          if (lType === 'adjustment') {
            const adjBal = await getAdjustmentLoanBalances(l.id, supabase);
            totalAccruedInterest += adjBal.accruedInterest;
          }

          if (l.is_closed || balance <= 0) closedLoansCount++;
          else activeLoansCount++;
        }

        let msg = `### 👤 ${cust.customer_name} (ID: \`${cust.customer_id}\`)\n\n`;
        msg += `- **Active Loans**: ${activeLoansCount} (Closed: ${closedLoansCount})\n`;
        msg += `- **Total Principal Given**: ${formatCurrency(totalGiven)}\n`;
        msg += `- **Total Collected**: ${formatCurrency(totalCollected)}\n`;
        msg += `- **Outstanding Principal**: **${formatCurrency(totalOutstanding)}**\n`;
        if (totalAccruedInterest > 0) {
          msg += `- **Accrued Interest (Adjustment)**: **${formatCurrency(totalAccruedInterest)}**\n`;
          msg += `- **Total Payable**: **${formatCurrency(totalOutstanding + totalAccruedInterest)}**\n`;
        }

        // Fetch recent collections
        const { data: custColls } = await supabase
          .from('collections')
          .select('amount_paid, payment_date, remarks, loans(customer_id)')
          .eq('loans.customer_id', cust.id)
          .order('payment_date', { ascending: false })
          .limit(3);

        if (custColls && custColls.length > 0) {
          msg += `\n#### 📜 Recent Collections:\n`;
          custColls.forEach((c: any) => {
            msg += `- **${formatCurrency(c.amount_paid)}** on ${formatDate(c.payment_date)}${c.remarks ? ` (${c.remarks})` : ''}\n`;
          });
        }

        const result: AIResponse = { success: true, message: msg.trim(), category: 'loans', timestamp };
        responseCache[cacheKey] = { data: result, expiry: Date.now() + 5000 };
        return result;
      }
    }

    // ----------------------------------------------------
    // INTENT 3: TODAY'S COLLECTION & TODAY'S TRANSACTIONS
    // ----------------------------------------------------
    if (
      (query.includes('today') || query.includes('ivala') || query.includes('ee roju') || query.includes('aaj')) &&
      (query.includes('collection') || query.includes('collected') || query.includes('transaction') || query.includes('vachindi'))
    ) {
      const { data: rawColls, error: dbErr } = await supabase
        .from('collections')
        .select('id, amount_paid, payment_date, remarks, loans(loan_type, working_days, balance_amount, customers(customer_name, customer_id))')
        .eq('payment_date', bounds.todayISO);

      if (dbErr) {
        console.error('[FinCollect AI DB Error - Today Collection]:', dbErr);
        return { success: false, message: "Unable to query today's collections.", error: dbErr.message, timestamp };
      }

      const todaysColls = rawColls || [];
      const total = todaysColls.reduce((sum, c) => sum + Number(c.amount_paid || 0), 0);

      if (query.includes('transaction') || query.includes('show') || query.includes('list')) {
        let msg = `### 📜 Today's Transactions (${formatDate(bounds.todayISO)})\n\n`;
        msg += `- **Total Collected Today**: **${formatCurrency(total)}** (${todaysColls.length} payments)\n\n`;

        if (todaysColls.length > 0) {
          msg += `| Customer Name | Code | Type | Amount Paid |\n`;
          msg += `| :--- | :--- | :--- | :--- |\n`;
          todaysColls.forEach((c: any) => {
            const name = c.loans?.customers?.customer_name || 'Customer';
            const code = c.loans?.customers?.customer_id || 'N/A';
            const type = decodeLoanType(c.loans?.working_days, c.loans?.loan_type);
            msg += `| **${name}** | \`${code}\` | \`[${type.toUpperCase()}]\` | **${formatCurrency(c.amount_paid)}** |\n`;
          });
        } else {
          msg += `*No transactions recorded today (${formatDate(bounds.todayISO)}).*`;
        }

        return { success: true, message: msg.trim(), category: 'collections', timestamp };
      }

      const message = `**Today's Collection**: **${formatCurrency(total)}** (${todaysColls.length} payments on ${formatDate(bounds.todayISO)})`;
      const result: AIResponse = { success: true, message, category: 'collections', timestamp };
      responseCache[cacheKey] = { data: result, expiry: Date.now() + 5000 };
      return result;
    }

    // ----------------------------------------------------
    // INTENT 4: MONTHLY COLLECTION
    // ----------------------------------------------------
    if (
      (query.includes('month') || query.includes('ee month') || query.includes('this month')) &&
      (query.includes('collection') || query.includes('collected') || query.includes('vachindi'))
    ) {
      const { data: rawColls } = await supabase
        .from('collections')
        .select('amount_paid')
        .gte('payment_date', bounds.monthStartISO)
        .lte('payment_date', bounds.todayISO);

      const total = (rawColls || []).reduce((sum, c) => sum + Number(c.amount_paid || 0), 0);
      const message = `**This Month's Collection**: **${formatCurrency(total)}** (${formatDate(bounds.monthStartISO)} – ${formatDate(bounds.todayISO)})`;

      const result: AIResponse = { success: true, message, category: 'collections', timestamp };
      responseCache[cacheKey] = { data: result, expiry: Date.now() + 5000 };
      return result;
    }

    // ----------------------------------------------------
    // INTENT 5: DAY BOOK OPENING / CLOSING BALANCE
    // ----------------------------------------------------
    if (
      query.includes('opening balance') ||
      query.includes('closing balance') ||
      query.includes('day book')
    ) {
      const dayBookRes = await getDayBookData(bounds.todayISO);

      if (!dayBookRes.success || !dayBookRes.data) {
        return { success: false, message: 'Failed to fetch Day Book data.', timestamp };
      }

      const d = dayBookRes.data;
      let msg = `### 📖 Day Book (${formatDate(bounds.todayISO)})\n\n`;
      msg += `- **Opening Balance**: **${formatCurrency(d.openingBalance)}**\n`;
      msg += `- **Total Cash In Today**: **${formatCurrency(d.totalCashIn)}**\n`;
      msg += `- **Total Cash Out Today**: **${formatCurrency(d.totalCashOut)}**\n`;
      msg += `- **Closing Balance**: **${formatCurrency(d.closingBalance)}**`;

      const result: AIResponse = { success: true, message: msg.trim(), category: 'general', timestamp };
      responseCache[cacheKey] = { data: result, expiry: Date.now() + 5000 };
      return result;
    }

    // ----------------------------------------------------
    // INTENT 6: CASH IN HAND & WORKING CAPITAL
    // ----------------------------------------------------
    if (
      query.includes('cash in hand') ||
      query.includes('cash balance') ||
      query.includes('hand cash') ||
      (query.includes('cash') && query.includes('entha'))
    ) {
      const invMetrics = await getInvestmentMetrics();
      const currentCash = invMetrics.data?.currentBalance ?? 0;
      const message = `**Cash in Hand**: **${formatCurrency(currentCash)}**`;

      const result: AIResponse = { success: true, message, category: 'investments', timestamp };
      responseCache[cacheKey] = { data: result, expiry: Date.now() + 5000 };
      return result;
    }

    // ----------------------------------------------------
    // INTENT 7: ACTIVE LOANS, SETTLED LOANS, & TOTAL OUTSTANDING
    // ----------------------------------------------------
    if (
      query.includes('active loan') ||
      query.includes('loan count') ||
      query.includes('settled') ||
      query.includes('outstanding') ||
      (query.includes('total') && query.includes('pending'))
    ) {
      const { data: allLoans } = await supabase
        .from('loans')
        .select('id, amount_given, total_collection, balance_amount, is_closed');

      const loansList = allLoans || [];
      const activeLoans = loansList.filter(l => !l.is_closed && Number(l.balance_amount || 0) > 0);
      const settledLoans = loansList.filter(l => l.is_closed || Number(l.balance_amount || 0) <= 0);

      const totalOutstanding = activeLoans.reduce((sum, l) => sum + Number(l.balance_amount || 0), 0);
      const totalTarget = loansList.reduce((sum, l) => sum + Number(l.total_collection || 0), 0);

      if (query.includes('settled')) {
        const message = `**Fully Settled / Closed Loans**: **${settledLoans.length} loans**`;
        return { success: true, message, category: 'loans', timestamp };
      }

      if (query.includes('outstanding')) {
        const message = `**Total Customer Outstanding Balance**: **${formatCurrency(totalOutstanding)}** (${activeLoans.length} active loans)`;
        return { success: true, message, category: 'loans', timestamp };
      }

      let msg = `### 🏦 Loans Portfolio Overview\n\n`;
      msg += `- **Active Loans**: **${activeLoans.length}**\n`;
      msg += `- **Closed / Settled Loans**: **${settledLoans.length}**\n`;
      msg += `- **Total Outstanding Balance**: **${formatCurrency(totalOutstanding)}**`;

      const result: AIResponse = { success: true, message: msg.trim(), category: 'loans', timestamp };
      responseCache[cacheKey] = { data: result, expiry: Date.now() + 5000 };
      return result;
    }

    // ----------------------------------------------------
    // INTENT 8: INTEREST COLLECTED & ACCRUED
    // ----------------------------------------------------
    if (query.includes('interest')) {
      const { data: intTx } = await supabase.from('interest_transactions').select('interest_amount');
      const totalInterestCollected = (intTx || []).reduce((sum, r) => sum + Number(r.interest_amount || 0), 0);

      const message = `**Total Interest Collected**: **${formatCurrency(totalInterestCollected)}**`;
      const result: AIResponse = { success: true, message, category: 'loans', timestamp };
      responseCache[cacheKey] = { data: result, expiry: Date.now() + 5000 };
      return result;
    }

    // ----------------------------------------------------
    // INTENT 9: OPERATING EXPENSES
    // ----------------------------------------------------
    if (query.includes('expense') || query.includes('kharchu') || query.includes('kharcha')) {
      const { data: todayExp } = await supabase
        .from('expenses')
        .select('amount')
        .eq('expense_date', bounds.todayISO);

      const totalTodayExp = (todayExp || []).reduce((sum, e) => sum + Number(e.amount || 0), 0);
      const message = `**Today's Expenses**: **${formatCurrency(totalTodayExp)}** (${formatDate(bounds.todayISO)})`;

      const result: AIResponse = { success: true, message, category: 'expenses', timestamp };
      responseCache[cacheKey] = { data: result, expiry: Date.now() + 5000 };
      return result;
    }

    // ----------------------------------------------------
    // INTENT 10: INVESTMENT BALANCE
    // ----------------------------------------------------
    if (query.includes('investment')) {
      const invMetrics = await getInvestmentMetrics();
      const cap = invMetrics.data?.totalCapitalAdded ?? 0;
      const bal = invMetrics.data?.currentBalance ?? 0;

      let msg = `### 📈 Investment Summary\n\n`;
      msg += `- **Total Owner Capital Added**: **${formatCurrency(cap)}**\n`;
      msg += `- **Current Working Balance**: **${formatCurrency(bal)}**`;

      const result: AIResponse = { success: true, message: msg.trim(), category: 'investments', timestamp };
      responseCache[cacheKey] = { data: result, expiry: Date.now() + 5000 };
      return result;
    }

    // ----------------------------------------------------
    // INTENT 11: FINANCIAL STATEMENTS (ASSETS, LIABILITIES, PROFIT/LOSS, TRIAL BALANCE)
    // ----------------------------------------------------
    if (
      query.includes('asset') ||
      query.includes('liability') ||
      query.includes('liabilities') ||
      query.includes('profit') ||
      query.includes('loss') ||
      query.includes('trial balance')
    ) {
      const bundle = await getFinancialStatements(bounds.todayISO);
      const bs = bundle.balanceSheet;
      const pnl = bundle.profitAndLoss;

      if (query.includes('asset')) {
        const message = `**Total Assets**: **${formatCurrency(bs.summary.totalAssets)}**`;
        return { success: true, message, category: 'accounting', timestamp };
      }

      if (query.includes('liability') || query.includes('liabilities')) {
        const message = `**Total Liabilities & Capital**: **${formatCurrency(bs.summary.totalLiabilitiesAndCapital)}**`;
        return { success: true, message, category: 'accounting', timestamp };
      }

      if (query.includes('profit') || query.includes('loss')) {
        const message = `**${pnl.isNetProfit ? "Today's / Accumulated Net Profit" : 'Net Loss'}**: **${formatCurrency(Math.abs(pnl.netProfitOrLoss))}**`;
        return { success: true, message, category: 'accounting', timestamp };
      }

      let msg = `### ⚖️ Financial Statements Summary (${formatDate(bounds.todayISO)})\n\n`;
      msg += `- **Total Assets**: **${formatCurrency(bs.summary.totalAssets)}**\n`;
      msg += `- **Total Liabilities & Capital**: **${formatCurrency(bs.summary.totalLiabilitiesAndCapital)}**\n`;
      msg += `- **Net Profit**: **${formatCurrency(pnl.netProfitOrLoss)}**\n`;
      msg += `- **Books Balanced**: **${bs.summary.isBalanced ? '✓ Yes' : '⚠️ No'}**`;

      return { success: true, message: msg.trim(), category: 'accounting', timestamp };
    }

    // ----------------------------------------------------
    // FALLBACK CLARIFICATION
    // ----------------------------------------------------
    const fallbackMarkdown = `
### 🤖 FinCollect AI Assistant

I am your real-time financial data assistant. You can ask me:

- 👥 *"How many customers are there?"*
- 💰 *"Today collection entha?"*
- 📜 *"Show today's transactions"*
- 👤 *"Ramesh balance entha?"*
- 📖 *"What is today's opening balance?"*
- 💵 *"Cash in hand entha undi?"*
- 🏦 *"How many active loans?"*
- ⚖️ *"Total assets entha?"* or *"Today profit/loss entha?"*
    `.trim();

    return {
      success: true,
      message: fallbackMarkdown,
      category: 'general',
      timestamp,
      performanceMs: Math.round(performance.now() - startTime),
    };
  } catch (err: any) {
    console.error('Error in queryFinCollectAI server action:', err);
    return {
      success: false,
      message: 'An unexpected database error occurred while querying FinCollect AI. Please try again.',
      error: err?.message,
      timestamp,
      performanceMs: Math.round(performance.now() - startTime),
    };
  }
}
