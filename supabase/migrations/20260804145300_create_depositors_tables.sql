-- ==========================================================
-- DEPOSITORS MODULE DATABASE MIGRATION
-- Migration: 20260804145300_create_depositors_tables.sql
-- ==========================================================

-- 1. Depositors Table
CREATE TABLE IF NOT EXISTS public.depositors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    mobile TEXT,
    address TEXT,
    deposit_amount NUMERIC(15, 2) NOT NULL CHECK (deposit_amount > 0),
    monthly_interest_rate NUMERIC(5, 2) NOT NULL CHECK (monthly_interest_rate >= 0),
    deposit_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_return_date DATE,
    payment_mode TEXT NOT NULL DEFAULT 'Bank Transfer',
    remarks TEXT,
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'closed'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for Depositors Table
CREATE INDEX IF NOT EXISTS idx_depositors_status ON public.depositors(status);
CREATE INDEX IF NOT EXISTS idx_depositors_date ON public.depositors(deposit_date DESC);
CREATE INDEX IF NOT EXISTS idx_depositors_name ON public.depositors(name);

-- RLS & Grants for Depositors Table
ALTER TABLE public.depositors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public full access to depositors" ON public.depositors FOR ALL USING (TRUE) WITH CHECK (TRUE);
GRANT ALL ON TABLE public.depositors TO anon, authenticated, service_role;

-- 2. Depositor Transactions Table
CREATE TABLE IF NOT EXISTS public.depositor_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    depositor_id UUID NOT NULL REFERENCES public.depositors(id) ON DELETE CASCADE,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    transaction_type TEXT NOT NULL, -- 'Deposit Received', 'Interest Paid', 'Partial Return', 'Full Return'
    amount_in NUMERIC(15, 2) NOT NULL DEFAULT 0,
    amount_out NUMERIC(15, 2) NOT NULL DEFAULT 0,
    outstanding_balance NUMERIC(15, 2) NOT NULL DEFAULT 0,
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for Depositor Transactions Table
CREATE INDEX IF NOT EXISTS idx_depositor_tx_depositor ON public.depositor_transactions(depositor_id);
CREATE INDEX IF NOT EXISTS idx_depositor_tx_date ON public.depositor_transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_depositor_tx_type ON public.depositor_transactions(transaction_type);

-- RLS & Grants for Depositor Transactions Table
ALTER TABLE public.depositor_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public full access to depositor_transactions" ON public.depositor_transactions FOR ALL USING (TRUE) WITH CHECK (TRUE);
GRANT ALL ON TABLE public.depositor_transactions TO anon, authenticated, service_role;
