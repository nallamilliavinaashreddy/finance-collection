-- ==========================================================
-- MIGRATION: FIX RLS POLICIES FOR DAILY CASH CLOSURES & REVERSALS
-- Ensures RLS remains ENABLED and aligns policies with existing FinCollect table conventions
-- Supports both authenticated and anon API clients used by Next.js Server Actions
-- ==========================================================

-- 1. Daily Cash Closures Table RLS
ALTER TABLE public.daily_cash_closures ENABLE ROW LEVEL SECURITY;

-- Clean up any prior conflicting policy names
DROP POLICY IF EXISTS "Allow authenticated select daily_cash_closures" ON public.daily_cash_closures;
DROP POLICY IF EXISTS "Allow authenticated insert daily_cash_closures" ON public.daily_cash_closures;
DROP POLICY IF EXISTS "Allow authenticated update daily_cash_closures" ON public.daily_cash_closures;
DROP POLICY IF EXISTS "Allow public full access to daily_cash_closures" ON public.daily_cash_closures;

CREATE POLICY "Allow public full access to daily_cash_closures"
ON public.daily_cash_closures
FOR ALL
USING (TRUE)
WITH CHECK (TRUE);

GRANT ALL ON TABLE public.daily_cash_closures TO anon, authenticated, service_role;


-- 2. Transaction Reversals Table RLS
ALTER TABLE public.transaction_reversals ENABLE ROW LEVEL SECURITY;

-- Clean up any prior conflicting policy names
DROP POLICY IF EXISTS "Allow authenticated select transaction_reversals" ON public.transaction_reversals;
DROP POLICY IF EXISTS "Allow authenticated insert transaction_reversals" ON public.transaction_reversals;
DROP POLICY IF EXISTS "Allow public full access to transaction_reversals" ON public.transaction_reversals;

CREATE POLICY "Allow public full access to transaction_reversals"
ON public.transaction_reversals
FOR ALL
USING (TRUE)
WITH CHECK (TRUE);

GRANT ALL ON TABLE public.transaction_reversals TO anon, authenticated, service_role;
