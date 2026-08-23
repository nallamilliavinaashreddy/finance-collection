-- ==========================================================
-- MIGRATION: CREATE DAILY CASH CLOSURES & TRANSACTION REVERSALS TABLES
-- Supports Daily Day Book Physical Cash Reconciliation & Reversals
-- ==========================================================

-- 1. Daily Cash Closures Table
CREATE TABLE IF NOT EXISTS public.daily_cash_closures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    closure_date DATE UNIQUE NOT NULL,
    opening_cash NUMERIC(15, 2) NOT NULL DEFAULT 0,
    total_cash_in NUMERIC(15, 2) NOT NULL DEFAULT 0,
    total_cash_out NUMERIC(15, 2) NOT NULL DEFAULT 0,
    expected_closing_cash NUMERIC(15, 2) NOT NULL DEFAULT 0,
    actual_physical_cash NUMERIC(15, 2) NOT NULL DEFAULT 0,
    cash_difference NUMERIC(15, 2) NOT NULL DEFAULT 0, -- actual_physical_cash - expected_closing_cash
    notes TEXT,
    closed_by TEXT DEFAULT 'Admin',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_cash_closures_date ON public.daily_cash_closures(closure_date DESC);

ALTER TABLE public.daily_cash_closures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public full access to daily_cash_closures" ON public.daily_cash_closures;
CREATE POLICY "Allow public full access to daily_cash_closures" ON public.daily_cash_closures FOR ALL USING (TRUE) WITH CHECK (TRUE);

GRANT ALL ON TABLE public.daily_cash_closures TO anon, authenticated, service_role;

-- 2. Transaction Reversals Table
CREATE TABLE IF NOT EXISTS public.transaction_reversals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_module TEXT NOT NULL,
    source_transaction_id TEXT NOT NULL,
    reversal_type TEXT NOT NULL, -- 'cash_in' | 'cash_out'
    reversal_date DATE NOT NULL DEFAULT CURRENT_DATE,
    reversal_amount NUMERIC(15, 2) NOT NULL CHECK (reversal_amount > 0),
    reason TEXT NOT NULL,
    created_by TEXT DEFAULT 'Admin',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tx_reversals_date ON public.transaction_reversals(reversal_date DESC);
CREATE INDEX IF NOT EXISTS idx_tx_reversals_source ON public.transaction_reversals(source_module, source_transaction_id);

ALTER TABLE public.transaction_reversals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public full access to transaction_reversals" ON public.transaction_reversals;
CREATE POLICY "Allow public full access to transaction_reversals" ON public.transaction_reversals FOR ALL USING (TRUE) WITH CHECK (TRUE);

GRANT ALL ON TABLE public.transaction_reversals TO anon, authenticated, service_role;
