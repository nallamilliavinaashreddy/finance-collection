'use server';

import { createClient } from '@/lib/supabase/server';
import { formatCurrency, formatDate } from '@/lib/utils';
import { getAIDateBounds } from '@/lib/utils/ai-date-utils';
import { getDashboardData } from './dashboard';
import { getInvestmentMetrics } from './investment';

export interface AIResponse {
  success: boolean;
  message: string;
  category?: 'dashboard' | 'loans' | 'collections' | 'expenses' | 'investments' | 'settlements' | 'general';
  suggestedFollowUps?: string[];
  timestamp: string;
  performanceMs?: number;
  error?: string;
}

// In-Memory Server Cache (15s TTL)
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
      message: 'Please ask a question about your business (e.g. *"How many customers are there?"*, *"What is today\'s collection?"*).',
      suggestedFollowUps: ['How many customers are there?', 'What is today\'s collection?', 'How many active loans?'],
      timestamp,
      performanceMs: Math.round(performance.now() - startTime),
    };
  }

  const query = rawQuery.toLowerCase().trim();
  const bounds = getAIDateBounds();

  // ----------------------------------------------------
  // STEP 1: DETERMINISTIC GREETINGS & SIMPLE MESSAGES (0-2ms)
  // ----------------------------------------------------
  const greetingSet = new Set(['hi', 'hello', 'hey', 'namaste', 'good morning', 'good evening', 'good afternoon', 'hi there', 'hello ai']);
  const thanksSet = new Set(['thanks', 'thank you', 'thanks!', 'thank you!', 'dhanyavadagalu', 'thanks bro', 'thx']);
  const helpSet = new Set(['help', 'help me', 'what can you do', 'options', 'menu']);
  const byeSet = new Set(['bye', 'goodbye', 'ok', 'okay', 'cya']);

  if (greetingSet.has(query)) {
    logAIDebug({
      rawQuery,
      detectedIntent: 'GREETING',
      bounds,
      tablesQueried: [],
      queryResultCount: 0,
      rawAggregateSum: 'N/A',
      finalFormattedValue: 'Greeting Response',
      dbDurationMs: 0,
      totalDurationMs: performance.now() - startTime,
    });

    return {
      success: true,
      message: `Hello, Administrator 👋 How can I assist you with your FinCollect financial analytics today?\n\n→ How many customers are there?\n→ What is today's collection?\n→ How many active loans?`,
      category: 'general',
      timestamp,
      performanceMs: Math.round(performance.now() - startTime),
    };
  }

  if (thanksSet.has(query)) {
    return {
      success: true,
      message: `You're very welcome! Let me know whenever you need more financial insights or reports.\n\n→ What is today's collection?\n→ How many customers are there?`,
      category: 'general',
      timestamp,
      performanceMs: Math.round(performance.now() - startTime),
    };
  }

  if (helpSet.has(query)) {
    return {
      success: true,
      message: `I am **FinCollect AI**, your intelligent financial copilot. You can ask me:\n- **Customers**: *How many customers are there in total?*\n- **Collections**: *What is today's collection?*, *Show weekly collection*\n- **Loans**: *How many active loans?*, *Which loan has highest pending balance?*\n- **Expenses**: *What are today's expenses?*\n- **Investment**: *What is my investment balance?*\n\n→ How many customers are there?\n→ What is today's collection?`,
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
  // STEP 2: IN-MEMORY CACHE CHECK (15s TTL)
  // ----------------------------------------------------
  const cacheKey = `${query}_${pageContext}`;
  const cached = responseCache[cacheKey];
  if (cached && cached.expiry > Date.now()) {
    console.log(`[AI Debug Log] Served from Server Cache! Key: "${cacheKey}" | Total: ${Math.round(performance.now() - startTime)}ms`);
    return {
      ...cached.data,
      timestamp,
      performanceMs: Math.round(performance.now() - startTime),
    };
  }

  // Language Detection (Telugu Transliteration)
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
    // ----------------------------------------------------
    // INTENT 1: CUSTOMERS (COUNT & LIST)
    // ----------------------------------------------------
    if (
      query.includes('customer') ||
      query.includes('customers') ||
      query.includes('borrower') ||
      query.includes('borrowers') ||
      query.includes('client') ||
      query.includes('clients') ||
      (query.includes('how many') && (query.includes('people') || query.includes('person') || query.includes('user')))
    ) {
      const dbStart = performance.now();
      const { count, error: dbErr } = await supabase
        .from('customers')
        .select('id', { count: 'exact', head: true });

      const dbDurationMs = performance.now() - dbStart;

      if (dbErr) {
        console.error('[FinCollect AI DB Error - Customers Count]:', dbErr);
        return {
          success: false,
          message: `⚠️ **Database Query Failure**: Failed to fetch customer count from Supabase. Error: ${dbErr.message}`,
          error: dbErr.message,
          timestamp,
          performanceMs: Math.round(performance.now() - startTime),
        };
      }

      const totalCust = count || 0;

      logAIDebug({
        rawQuery,
        detectedIntent: 'GET_TOTAL_CUSTOMERS',
        bounds,
        tablesQueried: ['customers'],
        queryResultCount: totalCust,
        rawAggregateSum: `Count: ${totalCust}`,
        finalFormattedValue: `${totalCust} customers`,
        dbDurationMs,
        totalDurationMs: performance.now() - startTime,
      });

      const intro = isTelugu
        ? `Mee business lo total registered customers count ikkada undi:`
        : `Here is the total registered customer count in your business:`;

      const markdown = `
### 👥 Customer Directory Summary

${intro}

- **Total Registered Customers**: **${totalCust} customers**

→ How many active loans?
→ What is today's collection?
→ Show highest pending loan
      `.trim();

      const result: AIResponse = { success: true, message: markdown, category: 'general', timestamp };
      responseCache[cacheKey] = { data: result, expiry: Date.now() + 15000 };
      return result;
    }

    // ----------------------------------------------------
    // INTENT 2: TODAY'S COLLECTION
    // ----------------------------------------------------
    if (
      (query.includes('today') || query.includes('ivala') || query.includes('ee roju') || query.includes('aaj')) &&
      (query.includes('collection') || query.includes('collected') || query.includes('vasool') || query.includes('paatalu'))
    ) {
      const dbStart = performance.now();
      const { data: rawColls, error: dbErr } = await supabase
        .from('collections')
        .select('id, amount_paid, remaining_balance_after_payment, payment_date, loans(customers(customer_name, customer_id))')
        .eq('payment_date', bounds.todayISO);

      const dbDurationMs = performance.now() - dbStart;

      if (dbErr) {
        console.error('[FinCollect AI DB Error - Today Collections]:', dbErr);
        return {
          success: false,
          message: `⚠️ **Database Query Failure**: Failed to fetch today's collection data from Supabase. Error: ${dbErr.message}`,
          error: dbErr.message,
          timestamp,
          performanceMs: Math.round(performance.now() - startTime),
        };
      }

      const uniqueCollsMap = new Map();
      (rawColls || []).forEach((c: any) => uniqueCollsMap.set(c.id, c));
      const todaysColls = Array.from(uniqueCollsMap.values());

      const total = todaysColls.reduce((sum, c) => sum + Number(c.amount_paid || 0), 0);
      const count = todaysColls.length;

      logAIDebug({
        rawQuery,
        detectedIntent: 'TODAY_COLLECTION',
        bounds,
        selectedDateRange: bounds.todayISO,
        tablesQueried: ['collections', 'loans', 'customers'],
        queryResultCount: count,
        rawAggregateSum: `₹${total}`,
        finalFormattedValue: formatCurrency(total),
        dbDurationMs,
        totalDurationMs: performance.now() - startTime,
      });

      const intro = isTelugu
        ? `Ivala (**${formatDate(bounds.todayISO)}**) jarigina total collection snapshot:`
        : `Today's (**${formatDate(bounds.todayISO)}**) collection performance snapshot:`;

      let markdown = `### 💰 Today's Collection Report\n\n${intro}\n\n`;
      markdown += `- **Business Date**: **${formatDate(bounds.todayISO)}**\n`;
      markdown += `- **Total Amount Collected Today**: **${formatCurrency(total)}**\n`;
      markdown += `- **Total Collection Entries**: **${count} payments**\n\n`;

      if (todaysColls.length > 0) {
        markdown += `| Customer Name | Code | Amount Paid | Remaining |\n`;
        markdown += `| :--- | :--- | :--- | :--- |\n`;
        todaysColls.slice(0, 5).forEach((c: any) => {
          const custName = c.loans?.customers?.customer_name || 'Customer';
          const code = c.loans?.customers?.customer_id || 'N/A';
          markdown += `| **${custName}** | \`${code}\` | **${formatCurrency(c.amount_paid)}** | ${formatCurrency(c.remaining_balance_after_payment)} |\n`;
        });
      } else {
        markdown += `*No collection payments recorded yet for today (${formatDate(bounds.todayISO)}).*\n`;
      }

      markdown += `\n→ Compare with weekly collection\n→ Show today's expenses\n→ Which loan has highest pending?`;

      const result: AIResponse = { success: true, message: markdown.trim(), category: 'collections', timestamp };
      responseCache[cacheKey] = { data: result, expiry: Date.now() + 15000 };
      return result;
    }

    // ----------------------------------------------------
    // INTENT 3: WEEKLY COLLECTION
    // ----------------------------------------------------
    if (query.includes('week') || query.includes('weekly')) {
      const dbStart = performance.now();
      const { data: rawColls, error: dbErr } = await supabase
        .from('collections')
        .select('id, amount_paid, payment_date')
        .gte('payment_date', bounds.weekStartISO)
        .lte('payment_date', bounds.todayISO);

      const dbDurationMs = performance.now() - dbStart;

      if (dbErr) {
        console.error('[FinCollect AI DB Error - Weekly Collections]:', dbErr);
        return {
          success: false,
          message: `⚠️ **Database Query Failure**: Failed to fetch weekly collection data from Supabase. Error: ${dbErr.message}`,
          error: dbErr.message,
          timestamp,
          performanceMs: Math.round(performance.now() - startTime),
        };
      }

      const uniqueCollsMap = new Map();
      (rawColls || []).forEach((c: any) => uniqueCollsMap.set(c.id, c));
      const weeklyColls = Array.from(uniqueCollsMap.values());

      const total = weeklyColls.reduce((sum, c) => sum + Number(c.amount_paid || 0), 0);
      const count = weeklyColls.length;

      logAIDebug({
        rawQuery,
        detectedIntent: 'WEEKLY_COLLECTION',
        bounds,
        selectedDateRange: `${bounds.weekStartISO} to ${bounds.todayISO}`,
        tablesQueried: ['collections'],
        queryResultCount: count,
        rawAggregateSum: `₹${total}`,
        finalFormattedValue: formatCurrency(total),
        dbDurationMs,
        totalDurationMs: performance.now() - startTime,
      });

      const markdown = `
### 📅 Current Week Collection Summary

- **Current Week**: **${formatDate(bounds.weekStartISO)} – ${formatDate(bounds.weekEndISO)}**
- **Data Available Through**: **${formatDate(bounds.todayISO)}**
- **Total Weekly Collection**: **${formatCurrency(total)}**
- **Transaction Count**: **${count} collections**

> ℹ️ *Note: Weekly collections include valid transactions recorded during the current calendar week up to today.*

→ Compare with monthly collection
→ Show today's collection
→ Show pending loans
      `.trim();

      const result: AIResponse = { success: true, message: markdown, category: 'collections', timestamp };
      responseCache[cacheKey] = { data: result, expiry: Date.now() + 15000 };
      return result;
    }

    // ----------------------------------------------------
    // INTENT 4: MONTHLY COLLECTION
    // ----------------------------------------------------
    if (query.includes('month') || query.includes('monthly')) {
      if (query.includes('expense') || query.includes('kharchu')) {
        // Skip to expense handler below
      } else {
        const dbStart = performance.now();
        const { data: rawColls, error: dbErr } = await supabase
          .from('collections')
          .select('id, amount_paid, payment_date')
          .gte('payment_date', bounds.monthStartISO)
          .lte('payment_date', bounds.todayISO);

        const dbDurationMs = performance.now() - dbStart;

        if (dbErr) {
          console.error('[FinCollect AI DB Error - Monthly Collections]:', dbErr);
          return {
            success: false,
            message: `⚠️ **Database Query Failure**: Failed to fetch monthly collection data from Supabase. Error: ${dbErr.message}`,
            error: dbErr.message,
            timestamp,
            performanceMs: Math.round(performance.now() - startTime),
          };
        }

        const uniqueCollsMap = new Map();
        (rawColls || []).forEach((c: any) => uniqueCollsMap.set(c.id, c));
        const monthlyColls = Array.from(uniqueCollsMap.values());

        const total = monthlyColls.reduce((sum, c) => sum + Number(c.amount_paid || 0), 0);
        const count = monthlyColls.length;

        logAIDebug({
          rawQuery,
          detectedIntent: 'MONTHLY_COLLECTION',
          bounds,
          selectedDateRange: `${bounds.monthStartISO} to ${bounds.todayISO}`,
          tablesQueried: ['collections'],
          queryResultCount: count,
          rawAggregateSum: `₹${total}`,
          finalFormattedValue: formatCurrency(total),
          dbDurationMs,
          totalDurationMs: performance.now() - startTime,
        });

        const markdown = `
### 🗓️ Current Month Collection Summary

- **Calendar Month**: **${formatDate(bounds.monthStartISO)} – ${formatDate(bounds.monthEndISO)}**
- **Data Available Through**: **${formatDate(bounds.todayISO)}**
- **Total Monthly Collection**: **${formatCurrency(total)}**
- **Transaction Count**: **${count} collections**

> ℹ️ *Note: Monthly collections include valid transactions recorded during the selected calendar month up to today.*

→ Show today's collection
→ Show weekly collection
→ Show expense analysis
        `.trim();

        const result: AIResponse = { success: true, message: markdown, category: 'collections', timestamp };
        responseCache[cacheKey] = { data: result, expiry: Date.now() + 15000 };
        return result;
      }
    }

    // ----------------------------------------------------
    // INTENT 5: ACTIVE LOANS COUNT
    // ----------------------------------------------------
    if (
      (query.includes('how many') && query.includes('loan')) ||
      query.includes('active loan count') ||
      query.includes('active loans')
    ) {
      const dbStart = performance.now();
      const { data: activeLoans, count, error: dbErr } = await supabase
        .from('loans')
        .select('id, amount_given, balance_amount', { count: 'exact' })
        .eq('is_closed', false);

      const dbDurationMs = performance.now() - dbStart;

      if (dbErr) {
        console.error('[FinCollect AI DB Error - Active Loans Count]:', dbErr);
        return {
          success: false,
          message: `⚠️ **Database Query Failure**: Failed to fetch active loans count from Supabase. Error: ${dbErr.message}`,
          error: dbErr.message,
          timestamp,
          performanceMs: Math.round(performance.now() - startTime),
        };
      }

      const activeCount = count || 0;
      const totalBalance = (activeLoans || []).reduce((s, l) => s + Number(l.balance_amount || 0), 0);
      const totalDeployed = (activeLoans || []).reduce((s, l) => s + Number(l.amount_given || 0), 0);

      logAIDebug({
        rawQuery,
        detectedIntent: 'ACTIVE_LOANS_COUNT',
        bounds,
        tablesQueried: ['loans'],
        queryResultCount: activeCount,
        rawAggregateSum: `Count: ${activeCount} | Balance: ₹${totalBalance}`,
        finalFormattedValue: `${activeCount} active loans`,
        dbDurationMs,
        totalDurationMs: performance.now() - startTime,
      });

      const markdown = `
### 🏦 Active Loans Portfolio Summary

- **Total Active Loans**: **${activeCount} active loans**
- **Active Investment Deployed**: **${formatCurrency(totalDeployed)}**
- **Total Outstanding Customer Balance**: **${formatCurrency(totalBalance)}**

→ Which loan has highest pending balance?
→ Show today's collection
→ Show how many customers
      `.trim();

      const result: AIResponse = { success: true, message: markdown, category: 'loans', timestamp };
      responseCache[cacheKey] = { data: result, expiry: Date.now() + 15000 };
      return result;
    }

    // ----------------------------------------------------
    // INTENT 6: HIGHEST PENDING LOANS
    // ----------------------------------------------------
    if (
      query.includes('pending') ||
      query.includes('highest') ||
      query.includes('overdue') ||
      (query.includes('loan') && (query.includes('balance') || query.includes('top')))
    ) {
      const dbStart = performance.now();
      const { data: topLoans, error: dbErr } = await supabase
        .from('loans')
        .select('id, balance_amount, total_collection, working_days, loan_type, customers(customer_name, customer_id)')
        .eq('is_closed', false)
        .order('balance_amount', { ascending: false })
        .limit(5);

      const dbDurationMs = performance.now() - dbStart;

      if (dbErr) {
        console.error('[FinCollect AI DB Error - Top Loans]:', dbErr);
        return {
          success: false,
          message: `⚠️ **Database Query Failure**: Failed to fetch active loans data from Supabase. Error: ${dbErr.message}`,
          error: dbErr.message,
          timestamp,
          performanceMs: Math.round(performance.now() - startTime),
        };
      }

      logAIDebug({
        rawQuery,
        detectedIntent: 'HIGHEST_PENDING_LOANS',
        bounds,
        tablesQueried: ['loans', 'customers'],
        queryResultCount: topLoans?.length || 0,
        rawAggregateSum: topLoans && topLoans[0] ? `Top Balance: ₹${topLoans[0].balance_amount}` : 'N/A',
        finalFormattedValue: topLoans && topLoans[0] ? formatCurrency(topLoans[0].balance_amount) : '₹0',
        dbDurationMs,
        totalDurationMs: performance.now() - startTime,
      });

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

      markdown += `\n→ Show active loan count\n→ Show today's collection\n→ How many customers are there?`;

      const result: AIResponse = { success: true, message: markdown.trim(), category: 'loans', timestamp };
      responseCache[cacheKey] = { data: result, expiry: Date.now() + 15000 };
      return result;
    }

    // ----------------------------------------------------
    // INTENT 7: OPERATING EXPENSES ANALYSIS
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
        supabase.from('expenses').select('id, amount, category, remarks').eq('expense_date', bounds.todayISO),
        supabase.from('expenses').select('id, amount').gte('expense_date', bounds.monthStartISO).lte('expense_date', bounds.todayISO),
      ]);

      const dbDurationMs = performance.now() - dbStart;

      if (todaysExpRes.error || monthlyExpRes.error) {
        const errObj = todaysExpRes.error || monthlyExpRes.error;
        console.error('[FinCollect AI DB Error - Operating Expenses]:', errObj);
        return {
          success: false,
          message: `⚠️ **Database Query Failure**: Failed to fetch operating expenses data from Supabase. Error: ${errObj?.message}`,
          error: errObj?.message,
          timestamp,
          performanceMs: Math.round(performance.now() - startTime),
        };
      }

      const todaysExp = todaysExpRes.data || [];
      const monthlyExp = monthlyExpRes.data || [];

      const todayTotal = todaysExp.reduce((s, e) => s + Number(e.amount || 0), 0);
      const monthTotal = monthlyExp.reduce((s, e) => s + Number(e.amount || 0), 0);

      logAIDebug({
        rawQuery,
        detectedIntent: 'OPERATING_EXPENSES',
        bounds,
        selectedDateRange: `${bounds.monthStartISO} to ${bounds.todayISO}`,
        tablesQueried: ['expenses'],
        queryResultCount: todaysExp.length + monthlyExp.length,
        rawAggregateSum: `Today: ₹${todayTotal} | Month: ₹${monthTotal}`,
        finalFormattedValue: formatCurrency(monthTotal),
        dbDurationMs,
        totalDurationMs: performance.now() - startTime,
      });

      const intro = isTelugu
        ? `Ivala ebhi eemonth business operating expenses detailed view:`
        : `Operating expenses detailed breakdown:`;

      let markdown = `### 💸 Operating Expenses Analysis\n\n${intro}\n\n`;
      markdown += `- **Today's Total Expenses**: **${formatCurrency(todayTotal)}**\n`;
      markdown += `- **This Month's Total Expenses**: **${formatCurrency(monthTotal)}** (${formatDate(bounds.monthStartISO)} – ${formatDate(bounds.monthEndISO)})\n\n`;

      if (todaysExp.length > 0) {
        markdown += `#### Today's Expense Items:\n`;
        todaysExp.forEach((e) => {
          markdown += `- **${e.category || 'General'}**: **${formatCurrency(e.amount)}** (${e.remarks || 'No remarks'})\n`;
        });
      } else {
        markdown += `*No operating expenses logged yet for today (${formatDate(bounds.todayISO)}).*\n`;
      }

      markdown += `\n→ Show today's collection\n→ Show net profit\n→ Show investment summary`;

      const result: AIResponse = { success: true, message: markdown.trim(), category: 'expenses', timestamp };
      responseCache[cacheKey] = { data: result, expiry: Date.now() + 15000 };
      return result;
    }

    // ----------------------------------------------------
    // INTENT 8: INVESTMENT KHATA METRICS
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
      const dbDurationMs = performance.now() - dbStart;

      if (!invMetrics.success || !invMetrics.data) {
        console.error('[FinCollect AI DB Error - Investment Metrics]:', invMetrics.error);
        return {
          success: false,
          message: `⚠️ **Database Query Failure**: Failed to calculate Investment Khata metrics. Error: ${invMetrics.error || 'Unknown calculation error'}`,
          error: invMetrics.error,
          timestamp,
          performanceMs: Math.round(performance.now() - startTime),
        };
      }

      const d = invMetrics.data;

      logAIDebug({
        rawQuery,
        detectedIntent: 'INVESTMENT_KHATA',
        bounds,
        tablesQueried: ['investment_transactions', 'loans', 'expenses', 'investment_settings'],
        queryResultCount: 1,
        rawAggregateSum: `Capital: ₹${d.totalCapitalAdded} | Working: ₹${d.currentBalance}`,
        finalFormattedValue: formatCurrency(d.currentBalance ?? 0),
        dbDurationMs,
        totalDurationMs: performance.now() - startTime,
      });

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
      responseCache[cacheKey] = { data: result, expiry: Date.now() + 15000 };
      return result;
    }

    // ----------------------------------------------------
    // INTENT 9: DASHBOARD & P&L OVERVIEW
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
      const dbDurationMs = performance.now() - dbStart;

      if (!dash.success || !dash.data) {
        console.error('[FinCollect AI DB Error - Dashboard Data]:', dash.error);
        return {
          success: false,
          message: `⚠️ **Database Query Failure**: Failed to load Dashboard metrics. Error: ${dash.error || 'Unknown dashboard error'}`,
          error: dash.error,
          timestamp,
          performanceMs: Math.round(performance.now() - startTime),
        };
      }

      const pl = dash.data.profitLoss;
      const ov = dash.data.overallSummary;
      const netProfit = pl.netProfit ?? 0;

      logAIDebug({
        rawQuery,
        detectedIntent: 'DASHBOARD_PNL',
        bounds,
        tablesQueried: ['customers', 'loans', 'collections', 'expenses', 'investment_transactions'],
        queryResultCount: ov.activeLoansCount,
        rawAggregateSum: `Net Profit: ₹${netProfit}`,
        finalFormattedValue: formatCurrency(netProfit),
        dbDurationMs,
        totalDurationMs: performance.now() - startTime,
      });

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
      responseCache[cacheKey] = { data: result, expiry: Date.now() + 15000 };
      return result;
    }

    // ----------------------------------------------------
    // FALLBACK CLARIFICATION BEHAVIOR (NO RANDOM DASHBOARD SUMMARY)
    // ----------------------------------------------------
    logAIDebug({
      rawQuery,
      detectedIntent: 'CLARIFICATION_FALLBACK',
      bounds,
      tablesQueried: [],
      queryResultCount: 0,
      rawAggregateSum: 'N/A',
      finalFormattedValue: 'Clarification Prompt',
      dbDurationMs: 0,
      totalDurationMs: performance.now() - startTime,
    });

    const fallbackMarkdown = `
### 🤖 FinCollect AI Assistant

I am here to help analyze your business data. Could you please specify which information you would like?

- 👥 **Total Customers**: Ask *"How many customers are there?"*
- 💰 **Today's Collections**: Ask *"What is today's collection?"*
- 📅 **Weekly Collections**: Ask *"What is this week's collection?"*
- 🗓️ **Monthly Collections**: Ask *"What is this month's collection?"*
- 🏦 **Active Loans**: Ask *"How many active loans?"* or *"Which loan has highest pending?"*
- 💸 **Expenses**: Ask *"Show this month's expenses"*
- 📈 **Investment Khata**: Ask *"What is my investment balance?"*

→ How many customers are there?
→ What is today's collection?
→ How many active loans?
    `.trim();

    const result: AIResponse = {
      success: true,
      message: fallbackMarkdown,
      category: 'general',
      timestamp,
      performanceMs: Math.round(performance.now() - startTime),
    };
    responseCache[cacheKey] = { data: result, expiry: Date.now() + 15000 };
    return result;
  } catch (err: any) {
    console.error('Error in queryFinCollectAI server action:', err);
    return {
      success: false,
      message: `⚠️ **System Execution Error**: ${err.message || 'An unexpected error occurred while executing AI request.'}`,
      error: err.message,
      timestamp,
      performanceMs: Math.round(performance.now() - startTime),
    };
  }
}

/**
 * End-to-End Server-Side Debug Logger
 */
function logAIDebug(params: {
  rawQuery: string;
  detectedIntent: string;
  bounds: any;
  selectedDateRange?: string;
  tablesQueried: string[];
  queryResultCount: number;
  rawAggregateSum: string;
  finalFormattedValue: string;
  dbDurationMs: number;
  totalDurationMs: number;
}) {
  console.log('====================================================');
  console.log(`[FinCollect AI End-to-End Debug Log] ${new Date().toISOString()}`);
  console.log(`- User Query           : "${params.rawQuery}"`);
  console.log(`- Detected Intent      : ${params.detectedIntent}`);
  console.log(`- Business Timezone    : ${params.bounds.businessTimezone}`);
  console.log(`- Date Bounds          : Today (${params.bounds.todayISO}) | Week (${params.bounds.weekStartISO}..${params.bounds.weekEndISO}) | Month (${params.bounds.monthStartISO}..${params.bounds.monthEndISO})`);
  if (params.selectedDateRange) {
    console.log(`- Selected Query Range : ${params.selectedDateRange}`);
  }
  console.log(`- Tables Queried       : [${params.tablesQueried.join(', ')}]`);
  console.log(`- Query Result Count   : ${params.queryResultCount} rows`);
  console.log(`- Raw Aggregate Sum    : ${params.rawAggregateSum}`);
  console.log(`- Final Formatted Value: ${params.finalFormattedValue}`);
  console.log(`- DB Query Duration    : ${Math.round(params.dbDurationMs)}ms`);
  console.log(`- Total Response Time  : ${Math.round(params.totalDurationMs)}ms`);
  console.log('====================================================\n');
}
