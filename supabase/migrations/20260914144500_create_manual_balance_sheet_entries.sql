-- ==========================================================
-- MIGRATION: CREATE MANUAL BALANCE SHEET ENTRIES TABLE
-- Supports Manual Financial Adjustments, Entry Breakdown & Audit Trail
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.manual_balance_sheet_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_type TEXT NOT NULL CHECK (entry_type IN ('Asset', 'Liability', 'Owner Capital', 'Expense/Adjustment')),
    category TEXT NOT NULL,
    amount NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (amount > 0),
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT NOT NULL,
    created_by TEXT DEFAULT 'Admin',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_manual_bs_entries_date ON public.manual_balance_sheet_entries(entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_manual_bs_entries_type ON public.manual_balance_sheet_entries(entry_type);

ALTER TABLE public.manual_balance_sheet_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public full access to manual_balance_sheet_entries" ON public.manual_balance_sheet_entries;
CREATE POLICY "Allow public full access to manual_balance_sheet_entries"
ON public.manual_balance_sheet_entries
FOR ALL
USING (TRUE)
WITH CHECK (TRUE);

GRANT ALL ON TABLE public.manual_balance_sheet_entries TO anon, authenticated, service_role;
