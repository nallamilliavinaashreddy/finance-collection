-- ==========================================================
-- MIGRATION: CREATE LOAN SETTLEMENTS TABLE
-- Supports Full and Custom Loan Settlement, Waiver Tracking & Audit
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.loan_settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
    customer_id UUID,
    settlement_type TEXT NOT NULL CHECK (settlement_type IN ('full', 'custom')),
    settlement_date DATE NOT NULL DEFAULT CURRENT_DATE,
    outstanding_before_settlement NUMERIC(15, 2) NOT NULL DEFAULT 0,
    amount_paid NUMERIC(15, 2) NOT NULL DEFAULT 0,
    waived_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    payment_method TEXT DEFAULT 'Cash',
    reference_number TEXT,
    remarks TEXT,
    settled_by TEXT DEFAULT 'Administrator',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loan_settlements_loan ON public.loan_settlements(loan_id);
CREATE INDEX IF NOT EXISTS idx_loan_settlements_date ON public.loan_settlements(settlement_date DESC);

ALTER TABLE public.loan_settlements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public full access to loan_settlements" ON public.loan_settlements;
CREATE POLICY "Allow public full access to loan_settlements" ON public.loan_settlements FOR ALL USING (TRUE) WITH CHECK (TRUE);

GRANT ALL ON TABLE public.loan_settlements TO anon, authenticated, service_role;
