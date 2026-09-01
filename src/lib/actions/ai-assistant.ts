'use server';

import { createClient } from '@/lib/supabase/server';
import { formatCurrency, formatDate } from '@/lib/utils';
import { getDashboardData } from './dashboard';

export interface AIResponse {
  success: boolean;
  message: string;
  category?: 'dashboard' | 'loans' | 'collections' | 'expenses' | 'investments' | 'settlements' | 'general';
  suggestedFollowUps?: string[];
  timestamp: string;
}

export async function queryFinCollectAI(
  rawQuery: string,
  pageContext: string = 'dashboard'
): Promise<AIResponse> {
  const timestamp = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  if (!rawQuery || !rawQuery.trim()) {
    return {
      success: true,
      message: 'Please ask a question about your business (e.g. *"What is today\'s collection?"*, *"Which loan has the highest pending balance?"*).',
      suggestedFollowUps: ['Today\'s collection entha?', 'Highest pending loan enti?', 'This month expense entha?'],
      timestamp,
    };
  }

  const query = rawQuery.toLowerCase().trim();
  const supabase = await createClient();

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

    // ----------------------------------------------------
    // INTENT 1: DASHBOARD & PROFIT / LOSS SUMMARY
    // ----------------------------------------------------
    if (
      query.includes('dashboard') ||
      query.includes('profit') ||
      query.includes('loss') ||
      query.includes('overview') ||
      pageContext === 'dashboard' && query.includes('analyze')
    ) {
      const dash = await getDashboardData();
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

        return {
          success: true,
          message: markdown,
          category: 'dashboard',
          timestamp,
        };
      }
    }

    // ----------------------------------------------------
    // INTENT 2: COLLECTIONS (TODAY / WEEK / MONTH / TELUGU)
    // ----------------------------------------------------
    if (
      query.includes('collection') ||
      query.includes('collections') ||
      query.includes('collected') ||
      query.includes('ivala') ||
      query.includes('ee roju') ||
      query.includes('vasool') ||
      query.includes('paatalu')
    ) {
      if (query.includes('today') || query.includes('ivala') || query.includes('ee roju') || query.includes('aaj')) {
        const { data: todaysColls } = await supabase
          .from('collections')
          .select('*, loans(*, customers(*))')
          .eq('payment_date', todayISO);

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
          todaysColls.slice(0, 5).forEach((c) => {
            const custName = c.loans?.customers?.customer_name || 'Customer';
            const code = c.loans?.customers?.customer_id || 'N/A';
            markdown += `| **${custName}** | \`${code}\` | **${formatCurrency(c.amount_paid)}** | ${formatCurrency(c.remaining_balance_after_payment)} |\n`;
          });
        } else {
          markdown += `*No collection payments recorded yet for today (${todayISO}).*\n`;
        }

        markdown += `\n→ Compare with weekly collection\n→ Show today's expenses\n→ Which loan has highest pending?`;

        return { success: true, message: markdown.trim(), category: 'collections', timestamp };
      }

      if (query.includes('week') || query.includes('weekly')) {
        const { data: weeklyColls } = await supabase
          .from('collections')
          .select('amount_paid')
          .gte('payment_date', weekStartISO)
          .lte('payment_date', todayISO);

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

        return { success: true, message: markdown, category: 'collections', timestamp };
      }

      if (query.includes('month') || query.includes('monthly')) {
        const { data: monthlyColls } = await supabase
          .from('collections')
          .select('amount_paid')
          .gte('payment_date', monthStartISO)
          .lte('payment_date', todayISO);

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

        return { success: true, message: markdown, category: 'collections', timestamp };
      }
    }

    // ----------------------------------------------------
    // INTENT 3: LOAN & PENDING BALANCE ANALYSIS
    // ----------------------------------------------------
    if (
      query.includes('loan') ||
      query.includes('loans') ||
      query.includes('pending') ||
      query.includes('highest') ||
      query.includes('overdue') ||
      query.includes('balance') ||
      pageContext === 'loans'
    ) {
      const { data: topLoans } = await supabase
        .from('loans')
        .select('*, customers(*)')
        .eq('is_closed', false)
        .order('balance_amount', { ascending: false })
        .limit(5);

      const intro = isTelugu
        ? `Mee loans lo highest pending balance unna top customers list:`
        : `Active loans sorted by highest outstanding customer balance:`;

      let markdown = `### ⚠️ Loans with Highest Pending Balances\n\n${intro}\n\n`;

      if (topLoans && topLoans.length > 0) {
        markdown += `| Customer Name | Code | Type | Target | Outstanding |\n`;
        markdown += `| :--- | :--- | :--- | :--- | :--- |\n`;
        topLoans.forEach((l) => {
          const name = l.customers?.customer_name || 'Customer';
          const code = l.customers?.customer_id || 'N/A';
          const type = (l.working_days ? 'daily' : l.loan_type || 'loan').toUpperCase();
          markdown += `| **${name}** | \`${code}\` | \`${type}\` | ${formatCurrency(l.total_collection)} | **${formatCurrency(l.balance_amount)}** |\n`;
        });
      } else {
        markdown += `*No active loans found with pending balances.*\n`;
      }

      markdown += `\n→ Show loans near settlement\n→ Show active loan count\n→ Show today's collection`;

      return { success: true, message: markdown.trim(), category: 'loans', timestamp };
    }

    // ----------------------------------------------------
    // INTENT 4: EXPENSES ANALYSIS
    // ----------------------------------------------------
    if (
      query.includes('expense') ||
      query.includes('expenses') ||
      query.includes('kharchu') ||
      query.includes('kharcha') ||
      pageContext === 'expenses'
    ) {
      const { data: todaysExp } = await supabase
        .from('expenses')
        .select('*')
        .eq('expense_date', todayISO);

      const { data: monthlyExp } = await supabase
        .from('expenses')
        .select('*')
        .gte('expense_date', monthStartISO)
        .lte('expense_date', todayISO);

      const todayTotal = (todaysExp || []).reduce((s, e) => s + Number(e.amount || 0), 0);
      const monthTotal = (monthlyExp || []).reduce((s, e) => s + Number(e.amount || 0), 0);

      const intro = isTelugu
        ? `Ivala ebhi eemonth business operating expenses detailed view:`
        : `Operating expenses detailed breakdown:`;

      let markdown = `### 💸 Operating Expenses Analysis\n\n${intro}\n\n`;
      markdown += `- **Today's Total Expenses**: **${formatCurrency(todayTotal)}**\n`;
      markdown += `- **This Month's Total Expenses**: **${formatCurrency(monthTotal)}**\n\n`;

      if (todaysExp && todaysExp.length > 0) {
        markdown += `#### Today's Expense Items:\n`;
        todaysExp.forEach((e) => {
          markdown += `- **${e.category || 'General'}**: **${formatCurrency(e.amount)}** (${e.remarks || 'No remarks'})\n`;
        });
      } else {
        markdown += `*No operating expenses logged yet for today (${todayISO}).*\n`;
      }

      markdown += `\n→ Show today's collection\n→ Show net profit\n→ Show investment summary`;

      return { success: true, message: markdown.trim(), category: 'expenses', timestamp };
    }

    // ----------------------------------------------------
    // INTENT 5: INVESTMENT KHATA ANALYSIS
    // ----------------------------------------------------
    if (
      query.includes('investment') ||
      query.includes('capital') ||
      query.includes('khata') ||
      query.includes('working') ||
      pageContext === 'investment-khata'
    ) {
      const { data: invData } = await supabase.from('investment_transactions').select('*');
      const totalCashIn = (invData || []).reduce((s, i) => s + Number(i.cash_in || 0), 0);
      const totalCashOut = (invData || []).reduce((s, i) => s + Number(i.cash_out || 0), 0);
      const workingBalance = totalCashIn - totalCashOut;

      const markdown = `
### 📈 Investment Khata & Cash Flow Analysis

- **Total Capital / Cash In**: **${formatCurrency(totalCashIn)}**
- **Total Disbursements / Cash Out**: **${formatCurrency(totalCashOut)}**
- **Current Working Cash Balance**: **${formatCurrency(workingBalance)}**

> 💡 *Investment Khata tracks central cash flow and owner capital deployment across disbursements and collections.*

→ Show active loan investment
→ Show today's collection
→ Show business net profit
      `.trim();

      return { success: true, message: markdown, category: 'investments', timestamp };
    }

    // ----------------------------------------------------
    // INTENT 6: SETTLEMENT ASSISTANT
    // ----------------------------------------------------
    if (query.includes('settle') || query.includes('settlement') || query.includes('close loan')) {
      const { data: lowBalLoans } = await supabase
        .from('loans')
        .select('*, customers(*)')
        .eq('is_closed', false)
        .gt('balance_amount', 0)
        .order('balance_amount', { ascending: true })
        .limit(5);

      const { data: settledLoans } = await supabase
        .from('loan_settlements')
        .select('*, loans(*, customers(*))')
        .order('created_at', { ascending: false })
        .limit(3);

      let markdown = `### 🤝 Loan Settlement Insights & Candidates\n\n`;

      if (lowBalLoans && lowBalLoans.length > 0) {
        markdown += `#### 🎯 Loans Near Completion (Ideal for Settlement):\n`;
        lowBalLoans.forEach((l) => {
          const cust = l.customers?.customer_name || 'Customer';
          const code = l.customers?.customer_id || 'N/A';
          markdown += `- **${cust}** (\`${code}\`): Remaining Balance **${formatCurrency(l.balance_amount)}** of ${formatCurrency(l.total_collection)} target.\n`;
        });
      }

      if (settledLoans && settledLoans.length > 0) {
        markdown += `\n#### 📋 Recently Settled Loans Audit:\n`;
        settledLoans.forEach((s) => {
          const cust = s.loans?.customers?.customer_name || 'Customer';
          markdown += `- **${cust}**: Settled on ${formatDate(s.settlement_date)} (Paid: **${formatCurrency(s.amount_paid)}**, Waived: **${formatCurrency(s.waived_amount)}**)\n`;
        });
      }

      markdown += `\n> 🛡️ **Safety Policy**: FinCollect AI suggests settlement candidates but will **NEVER** automatically settle or close a loan without explicit admin confirmation.`;
      markdown += `\n\n→ Show highest pending loan\n→ Show today's collection\n→ Show active loan count`;

      return { success: true, message: markdown.trim(), category: 'settlements', timestamp };
    }

    // ----------------------------------------------------
    // FALLBACK INTELLIGENT COMPREHENSIVE RESPONSE
    // ----------------------------------------------------
    const dash = await getDashboardData();
    const ov = dash.data?.overallSummary;
    const pl = dash.data?.profitLoss;

    const fallbackMarkdown = `
### 🤖 FinCollect AI Assistant Response

I analyzed your query: *"_${rawQuery}_"*

Here is your live business financial snapshot today (${formatDate(todayISO)}):

- **Today's Collections**: **${formatCurrency(ov?.todaysCollections ?? 0)}**
- **Today's Expenses**: **${formatCurrency(ov?.todaysExpenses ?? 0)}**
- **Active Loans Count**: **${ov?.activeLoansCount ?? 0} active loans**
- **Current Net Profit**: **${formatCurrency(pl?.netProfit ?? 0)}**

→ What is today's collection?
→ Which loan has the highest pending balance?
→ Show this month's expenses
    `.trim();

    return {
      success: true,
      message: fallbackMarkdown,
      category: 'general',
      timestamp,
    };
  } catch (err: any) {
    console.error('Error in queryFinCollectAI server action:', err);
    return {
      success: false,
      message: '⚠️ An unexpected error occurred while querying your business database. Please click retry.',
      timestamp,
    };
  }
}
