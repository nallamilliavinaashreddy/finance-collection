'use server';

import { createClient } from '@/lib/supabase/server';
import { formatCurrency, formatDate } from '@/lib/utils';
import { getDashboardData } from './dashboard';
import { getInvestmentMetrics } from './investment';

export interface AIResponse {
  success: boolean;
  message: string;
  category?: 'dashboard' | 'loans' | 'collections' | 'expenses' | 'investments' | 'settlements' | 'general';
  suggestedFollowUps?: string[];
  timestamp: string;
  performanceMs?: number;
}

// Short-term In-Memory Cache (20s TTL)
const responseCache: Record<string, { data: AIResponse; expiry: number }> = {};

export async function queryFinCollectAI(
  rawQuery: string,
  pageContext: string = 'dashboard'
): Promise<AIResponse> {
  const startTime = performance.now();
  const timestamp = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  if (!rawQuery || !rawQuery.trim()) {
    return {
      success: true,
      message: 'Please ask a question about your business (e.g. *"What is today\'s collection?"*, *"Which loan has the highest pending balance?"*).',
      suggestedFollowUps: ['Today\'s collection entha?', 'Highest pending loan enti?', 'This month expense entha?'],
      timestamp,
      performanceMs: Math.round(performance.now() - startTime),
    };
  }

  const query = rawQuery.toLowerCase().trim();

  // ----------------------------------------------------
  // STEP 1: INSTANT RESPONSE FOR GREETINGS & SIMPLE MESSAGES (0-2ms)
  // NO SUPABASE CALLS / NO AI MODEL CALLS
  // ----------------------------------------------------
  const greetingSet = new Set(['hi', 'hello', 'hey', 'namaste', 'good morning', 'good evening', 'good afternoon', 'hi there', 'hello ai']);
  const thanksSet = new Set(['thanks', 'thank you', 'thanks!', 'thank you!', 'dhanyavadagalu', 'thanks bro', 'thx']);
  const helpSet = new Set(['help', 'help me', 'what can you do', 'options', 'menu']);
  const byeSet = new Set(['bye', 'goodbye', 'ok', 'okay', 'cya']);

  if (greetingSet.has(query)) {
    console.log(`[AI Performance] Greeting detected. Total time: ${Math.round(performance.now() - startTime)}ms`);
    return {
      success: true,
      message: `Hello, Administrator 👋 How can I assist you with your FinCollect financial analytics today?\n\n→ Show today's collection\n→ Show highest pending loan\n→ Show business net profit`,
      category: 'general',
      timestamp,
      performanceMs: Math.round(performance.now() - startTime),
    };
  }

  if (thanksSet.has(query)) {
    console.log(`[AI Performance] Thanks detected. Total time: ${Math.round(performance.now() - startTime)}ms`);
    return {
      success: true,
      message: `You're very welcome! Let me know whenever you need more financial insights or reports.\n\n→ Show today's collection\n→ Analyze Dashboard`,
      category: 'general',
      timestamp,
      performanceMs: Math.round(performance.now() - startTime),
    };
  }

  if (helpSet.has(query)) {
    console.log(`[AI Performance] Help detected. Total time: ${Math.round(performance.now() - startTime)}ms`);
    return {
      success: true,
      message: `I am **FinCollect AI**, your intelligent financial copilot. You can ask me:\n- **Collections**: *What is today's collection?*, *Show weekly collection*\n- **Loans**: *Which loan has the highest pending balance?*, *Show active loans*\n- **Expenses**: *What are today's expenses?*\n- **Investment**: *What is my investment balance?*\n\n→ Analyze Dashboard\n→ Today's collection entha?`,
      category: 'general',
      timestamp,
      performanceMs: Math.round(performance.now() - startTime),
    };
  }

  if (byeSet.has(query)) {
    return {
      success: true,
      message: `Goodbye, Administrator! I am here whenever you need real-time business insights.`,
      category: 'general',
      timestamp,
      performanceMs: Math.round(performance.now() - startTime),
    };
  }

  // ----------------------------------------------------
  // STEP 2: CHECK SHORT-TERM IN-MEMORY CACHE (20s TTL)
  // ----------------------------------------------------
  const cacheKey = `${query}_${pageContext}`;
  const cached = responseCache[cacheKey];
  if (cached && cached.expiry > Date.now()) {
    console.log(`[AI Performance] Served from Cache! Cache Key: ${cacheKey} | Total: ${Math.round(performance.now() - startTime)}ms`);
    return {
      ...cached.data,
      timestamp,
      performanceMs: Math.round(performance.now() - startTime),
    };
  }

  // Detect Telugu Transliteration Intent
  const isTelugu =
    query.includes('entha') ||
    query.includes('ivala') ||
    query.includes('ee month') ||
    query.includes('ee roju') ||
    query.includes('enti') ||
    query.includes('kharchu') ||
    query.includes('vasool') ||
    query.includes('paatalu') ||
    query.includes('naa');

  const supabase = await createClient();

  try {
    const todayISO = new Date().toISOString().split('T')[0];

    const now = new Date();
    const dayOfWeek = now.getDay();
    const distanceToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - distanceToMonday);
    const weekStartISO = weekStart.toISOString().split('T')[0];

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthStartISO = monthStart.toISOString().split('T')[0];

    const intentStart = performance.now();

    // ----------------------------------------------------
    // INTENT A: TODAY'S COLLECTION (OPTIMIZED LIGHTWEIGHT QUERY)
    // ----------------------------------------------------
    if (
      (query.includes('today') || query.includes('ivala') || query.includes('ee roju') || query.includes('aaj')) &&
      (query.includes('collection') || query.includes('collected') || query.includes('vasool') || query.includes('paatalu'))
    ) {
      const dbStart = performance.now();
      const { data: todaysColls, error: collErr } = await supabase
        .from('collections')
        .select('amount_paid, remaining_balance_after_payment, loans(customers(customer_name, customer_id))')
        .eq('payment_date', todayISO);

      if (collErr) {
        console.error('[FinCollect AI DB Error - Today Collections]:', collErr);
      }

      const dbTime = performance.now() - dbStart;
      const total = (todaysColls || []).reduce((acc, c) => acc + Number(c.amount_paid || 0), 0);
      const count = todaysColls?.length || 0;

      const intro = isTelugu
        ? `Ivala (**${formatDate(todayISO)}**) jarigina total collection snapshot:`
        : `Today's (**${formatDate(todayISO)}**) collection performance snapshot:`;

      let markdown = `### 💰 Today's Collection Report\n\n${intro}\n\n`;
      markdown += `- **Total Amount Collected Today**: **${formatCurrency(total)}**\n`;
      markdown += `- **Total Collection Entries**: **${count} payments**\n\n`;

      if (todaysColls && todaysColls.length > 0) {
        markdown += `| Customer Name | Code | Amount Paid | Remaining |\n`;
        markdown += `| :--- | :--- | :--- | :--- |\n`;
        todaysColls.slice(0, 5).forEach((c: any) => {
          const custName = c.loans?.customers?.customer_name || 'Customer';
          const code = c.loans?.customers?.customer_id || 'N/A';
          markdown += `| **${custName}** | \`${code}\` | **${formatCurrency(c.amount_paid)}** | ${formatCurrency(c.remaining_balance_after_payment)} |\n`;
        });
      } else {
        markdown += `*No collection payments recorded yet for today (${todayISO}).*\n`;
      }

      markdown += `\n→ Compare with weekly collection\n→ Show today's expenses\n→ Which loan has highest pending?`;

      const result: AIResponse = { success: true, message: markdown.trim(), category: 'collections', timestamp };
      responseCache[cacheKey] = { data: result, expiry: Date.now() + 20000 };
      console.log(`[AI Performance] Today Collections Query. Intent: ${Math.round(dbStart - intentStart)}ms | DB: ${Math.round(dbTime)}ms | Total: ${Math.round(performance.now() - startTime)}ms`);
      return result;
    }

    // ----------------------------------------------------
    // INTENT B: WEEKLY COLLECTION (OPTIMIZED LIGHTWEIGHT QUERY)
    // ----------------------------------------------------
    if (query.includes('week') || query.includes('weekly')) {
      const dbStart = performance.now();
      const { data: weeklyColls, error: wErr } = await supabase
        .from('collections')
        .select('amount_paid')
        .gte('payment_date', weekStartISO)
        .lte('payment_date', todayISO);

      if (wErr) {
        console.error('[FinCollect AI DB Error - Weekly Collections]:', wErr);
      }

      const dbTime = performance.now() - dbStart;
      const total = (weeklyColls || []).reduce((acc, c) => acc + Number(c.amount_paid || 0), 0);

      const markdown = `
### 📅 Current Week Collection Summary

- **Week Date Range**: ${formatDate(weekStartISO)} to ${formatDate(todayISO)}
- **Total Weekly Collection**: **${formatCurrency(total)}**
- **Transaction Count**: **${weeklyColls?.length || 0} collections**

> ℹ️ *Note: Weekly collections count transactions recorded strictly during the current calendar week.*

→ Compare with monthly collection
→ Show today's collection
→ Show pending loans
      `.trim();

      const result: AIResponse = { success: true, message: markdown, category: 'collections', timestamp };
      responseCache[cacheKey] = { data: result, expiry: Date.now() + 20000 };
      console.log(`[AI Performance] Weekly Collections Query. Intent: ${Math.round(dbStart - intentStart)}ms | DB: ${Math.round(dbTime)}ms | Total: ${Math.round(performance.now() - startTime)}ms`);
      return result;
    }

    // ----------------------------------------------------
    // INTENT C: MONTHLY COLLECTION (OPTIMIZED LIGHTWEIGHT QUERY)
    // ----------------------------------------------------
    if (query.includes('month') || query.includes('monthly')) {
      const dbStart = performance.now();
      const { data: monthlyColls, error: mErr } = await supabase
        .from('collections')
        .select('amount_paid')
        .gte('payment_date', monthStartISO)
        .lte('payment_date', todayISO);

      if (mErr) {
        console.error('[FinCollect AI DB Error - Monthly Collections]:', mErr);
      }

      const dbTime = performance.now() - dbStart;
      const total = (monthlyColls || []).reduce((acc, c) => acc + Number(c.amount_paid || 0), 0);

      const markdown = `
### 🗓️ Current Month Collection Summary

- **Month Date Range**: ${formatDate(monthStartISO)} to ${formatDate(todayISO)}
- **Total Monthly Collection**: **${formatCurrency(total)}**
- **Transaction Count**: **${monthlyColls?.length || 0} collections**

> ℹ️ *Note: Monthly collections count transactions recorded strictly during the current calendar month.*

→ Show today's collection
→ Show weekly collection
→ Show expense analysis
      `.trim();

      const result: AIResponse = { success: true, message: markdown, category: 'collections', timestamp };
      responseCache[cacheKey] = { data: result, expiry: Date.now() + 20000 };
      console.log(`[AI Performance] Monthly Collections Query. Intent: ${Math.round(dbStart - intentStart)}ms | DB: ${Math.round(dbTime)}ms | Total: ${Math.round(performance.now() - startTime)}ms`);
      return result;
    }

    // ----------------------------------------------------
    // INTENT D: HIGHEST PENDING LOANS (OPTIMIZED LIMIT 5 QUERY)
    // ----------------------------------------------------
    if (
      query.includes('pending') ||
      query.includes('highest') ||
      query.includes('overdue') ||
      (query.includes('loan') && (query.includes('balance') || query.includes('top')))
    ) {
      const dbStart = performance.now();
      const { data: topLoans, error: loanErr } = await supabase
        .from('loans')
        .select('id, balance_amount, total_collection, working_days, loan_type, customers(customer_name, customer_id)')
        .eq('is_closed', false)
        .order('balance_amount', { ascending: false })
        .limit(5);

      if (loanErr) {
        console.error('[FinCollect AI DB Error - Top Loans]:', loanErr);
      }

      const dbTime = performance.now() - dbStart;
      const intro = isTelugu
        ? `Mee loans lo highest pending balance unna top customers list:`
        : `Active loans sorted by highest outstanding customer balance:`;

      let markdown = `### ⚠️ Loans with Highest Pending Balances\n\n${intro}\n\n`;

      if (topLoans && topLoans.length > 0) {
        markdown += `| Customer Name | Code | Type | Target | Outstanding |\n`;
        markdown += `| :--- | :--- | :--- | :--- | :--- |\n`;
        topLoans.forEach((l: any) => {
          const name = l.customers?.customer_name || 'Customer';
          const code = l.customers?.customer_id || 'N/A';
          const type = (l.working_days ? 'daily' : l.loan_type || 'loan').toUpperCase();
          markdown += `| **${name}** | \`${code}\` | \`${type}\` | ${formatCurrency(l.total_collection)} | **${formatCurrency(l.balance_amount)}** |\n`;
        });
      } else {
        markdown += `*No active loans found with pending balances.*\n`;
      }

      markdown += `\n→ Show loans near settlement\n→ Show active loan count\n→ Show today's collection`;

      const result: AIResponse = { success: true, message: markdown.trim(), category: 'loans', timestamp };
      responseCache[cacheKey] = { data: result, expiry: Date.now() + 20000 };
      console.log(`[AI Performance] Highest Pending Loans Query. DB: ${Math.round(dbTime)}ms | Total: ${Math.round(performance.now() - startTime)}ms`);
      return result;
    }

    // ----------------------------------------------------
    // INTENT E: EXPENSES (PARALLELIZED QUERY)
    // ----------------------------------------------------
    if (
      query.includes('expense') ||
      query.includes('expenses') ||
      query.includes('kharchu') ||
      query.includes('kharcha') ||
      pageContext === 'expenses'
    ) {
      const dbStart = performance.now();
      const [todaysExpRes, monthlyExpRes] = await Promise.all([
        supabase.from('expenses').select('amount, category, remarks').eq('expense_date', todayISO),
        supabase.from('expenses').select('amount').gte('expense_date', monthStartISO).lte('expense_date', todayISO),
      ]);

      if (todaysExpRes.error) console.error('[FinCollect AI DB Error - Today Expenses]:', todaysExpRes.error);
      if (monthlyExpRes.error) console.error('[FinCollect AI DB Error - Monthly Expenses]:', monthlyExpRes.error);

      const dbTime = performance.now() - dbStart;
      const todaysExp = todaysExpRes.data || [];
      const monthlyExp = monthlyExpRes.data || [];

      const todayTotal = todaysExp.reduce((s, e) => s + Number(e.amount || 0), 0);
      const monthTotal = monthlyExp.reduce((s, e) => s + Number(e.amount || 0), 0);

      const intro = isTelugu
        ? `Ivala ebhi eemonth business operating expenses detailed view:`
        : `Operating expenses detailed breakdown:`;

      let markdown = `### 💸 Operating Expenses Analysis\n\n${intro}\n\n`;
      markdown += `- **Today's Total Expenses**: **${formatCurrency(todayTotal)}**\n`;
      markdown += `- **This Month's Total Expenses**: **${formatCurrency(monthTotal)}**\n\n`;

      if (todaysExp.length > 0) {
        markdown += `#### Today's Expense Items:\n`;
        todaysExp.forEach((e) => {
          markdown += `- **${e.category || 'General'}**: **${formatCurrency(e.amount)}** (${e.remarks || 'No remarks'})\n`;
        });
      } else {
        markdown += `*No operating expenses logged yet for today (${todayISO}).*\n`;
      }

      markdown += `\n→ Show today's collection\n→ Show net profit\n→ Show investment summary`;

      const result: AIResponse = { success: true, message: markdown.trim(), category: 'expenses', timestamp };
      responseCache[cacheKey] = { data: result, expiry: Date.now() + 20000 };
      console.log(`[AI Performance] Expenses Query. DB: ${Math.round(dbTime)}ms | Total: ${Math.round(performance.now() - startTime)}ms`);
      return result;
    }

    // ----------------------------------------------------
    // INTENT F: INVESTMENT KHATA (ACCURATE TRUSTED CALCULATIONS)
    // ----------------------------------------------------
    if (
      query.includes('investment') ||
      query.includes('capital') ||
      query.includes('khata') ||
      query.includes('working') ||
      pageContext === 'investment-khata'
    ) {
      const dbStart = performance.now();
      const invMetrics = await getInvestmentMetrics();
      const dbTime = performance.now() - dbStart;

      if (invMetrics.success && invMetrics.data) {
        const d = invMetrics.data;

        const intro = isTelugu
          ? `Mee Investment Khata ebhi central cash flow details ikkada unnai:`
          : `Investment Khata central cash flow & capital summary:`;

        const markdown = `
### 📈 Investment Khata & Cash Flow Analysis

${intro}

- **Total Capital Added**: **${formatCurrency(d.totalCapitalAdded ?? 0)}**
- **Total Disbursements / Capital Withdrawn**: **${formatCurrency(d.totalCapitalWithdrawn ?? 0)}**
- **Current Active Capital**: **${formatCurrency(d.currentCapital ?? 0)}**
- **Current Working Cash Balance**: **${formatCurrency(d.currentBalance ?? 0)}**
- **Accrued Interest**: **${formatCurrency(d.accruedInterest ?? 0)}**
- **Total Investment Value**: **${formatCurrency(d.totalInvestmentValue ?? 0)}**

> 💡 *Investment Khata tracks central cash flow, owner capital deployment, and accrued interest across disbursements and collections.*

→ Show active loan investment
→ Show today's collection
→ Show business net profit
        `.trim();

        const result: AIResponse = { success: true, message: markdown, category: 'investments', timestamp };
        responseCache[cacheKey] = { data: result, expiry: Date.now() + 20000 };
        console.log(`[AI Performance] Investment Metrics Query. DB: ${Math.round(dbTime)}ms | Total: ${Math.round(performance.now() - startTime)}ms`);
        return result;
      }
    }

    // ----------------------------------------------------
    // INTENT G: DASHBOARD & PROFIT/LOSS (FAST LIGHTWEIGHT)
    // ----------------------------------------------------
    if (
      query.includes('dashboard') ||
      query.includes('profit') ||
      query.includes('loss') ||
      query.includes('overview') ||
      (pageContext === 'dashboard' && query.includes('analyze'))
    ) {
      const dbStart = performance.now();
      const dash = await getDashboardData();
      const dbTime = performance.now() - dbStart;

      if (dash.success && dash.data) {
        const pl = dash.data.profitLoss;
        const ov = dash.data.overallSummary;
        const netProfit = pl.netProfit ?? 0;

        const greeting = isTelugu
          ? `Namaste Administrator 👋\n\nIvala mee business dashboard snapshot ikkada undi:`
          : `Hello Administrator 👋\n\nHere is your overall business financial performance snapshot:`;

        const markdown = `
### 📊 Business Overview & P&L Statement

${greeting}

- **Total Investment (Khata Balance)**: **${formatCurrency(pl.totalInvestment)}**
- **Total Loan Interest Earned**: **${formatCurrency(pl.loanInterest)}**
- **Investment Interest Cost**: **${formatCurrency(pl.investmentInterest)}**
- **Operating Expenses**: **${formatCurrency(pl.totalExpenses)}**
- **Current Business Status**: **${netProfit >= 0 ? '🟢 NET PROFIT' : '🔴 NET LOSS'}** (**${formatCurrency(Math.abs(netProfit))}**)

#### 💼 Portfolio Command Highlights:
- **Active Customers**: **${ov.totalCustomers}**
- **Active Loans**: **${ov.activeLoansCount}**
- **Active Investment**: **${formatCurrency(ov.activeInvestment)}**
- **Remaining Customer Outstanding**: **${formatCurrency(ov.remainingBalance)}**
- **Today's Collection**: **${formatCurrency(ov.todaysCollections)}**

> 💡 **Smart AI Insight**: Business is currently operating at a **${netProfit >= 0 ? 'positive net profit' : 'net capital deployment'}** position.

→ Show today's collection breakdown
→ Show highest pending balance loans
→ Show expense analysis
        `.trim();

        const result: AIResponse = { success: true, message: markdown, category: 'dashboard', timestamp };
        responseCache[cacheKey] = { data: result, expiry: Date.now() + 20000 };
        console.log(`[AI Performance] Dashboard Query. DB: ${Math.round(dbTime)}ms | Total: ${Math.round(performance.now() - startTime)}ms`);
        return result;
      }
    }

    // ----------------------------------------------------
    // FAST FALLBACK QUERY (Avoids Full Database Scanning)
    // ----------------------------------------------------
    const dbStart = performance.now();
    const [todaysCollRes, activeLoansRes] = await Promise.all([
      supabase.from('collections').select('amount_paid').eq('payment_date', todayISO),
      supabase.from('loans').select('id, balance_amount', { count: 'exact' }).eq('is_closed', false),
    ]);
    const dbTime = performance.now() - dbStart;

    const todaysCollsTotal = (todaysCollRes.data || []).reduce((s, c) => s + Number(c.amount_paid || 0), 0);
    const activeCount = activeLoansRes.count || 0;
    const remainingBal = (activeLoansRes.data || []).reduce((s, l) => s + Number(l.balance_amount || 0), 0);

    const fallbackMarkdown = `
### 🤖 FinCollect AI Assistant Response

I analyzed your query: *"_${rawQuery}_"*

Here is your live business financial snapshot today (${formatDate(todayISO)}):

- **Today's Collections**: **${formatCurrency(todaysCollsTotal)}**
- **Active Loans Count**: **${activeCount} active loans**
- **Total Outstanding Customer Balance**: **${formatCurrency(remainingBal)}**

→ What is today's collection?
→ Which loan has the highest pending balance?
→ Show this month's expenses
    `.trim();

    const result: AIResponse = {
      success: true,
      message: fallbackMarkdown,
      category: 'general',
      timestamp,
      performanceMs: Math.round(performance.now() - startTime),
    };
    responseCache[cacheKey] = { data: result, expiry: Date.now() + 20000 };
    console.log(`[AI Performance] Fast Fallback Query. DB: ${Math.round(dbTime)}ms | Total: ${Math.round(performance.now() - startTime)}ms`);
    return result;
  } catch (err: any) {
    console.error('Error in queryFinCollectAI server action:', err);
    return {
      success: false,
      message: '⚠️ An unexpected error occurred while querying your business database. Please click retry.',
      timestamp,
      performanceMs: Math.round(performance.now() - startTime),
    };
  }
}
