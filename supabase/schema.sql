-- ==========================================================
-- FINANCE COLLECTION MANAGEMENT DATABASE SCHEMA
-- Supports 4 Loan Types + Adjustment Ledger + Expenses + Stamps + Chits + Investment Khata + Interest Ledger
-- ==========================================================

-- 1. User Roles
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'collector');

-- 2. User Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'admin',
    phone_number TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (auth.jwt() ->> 'role' = 'admin' OR id = auth.uid());
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (id = auth.uid());

-- 3. Customers Table
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    mobile_number TEXT NOT NULL,
    address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access to customers" ON public.customers FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- 4. Loans Table (Supports Daily, Weekly, Monthly, Adjustment)
CREATE TABLE IF NOT EXISTS public.loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    loan_type TEXT NOT NULL DEFAULT 'daily', -- 'daily', 'weekly', 'monthly', 'adjustment'
    city TEXT DEFAULT 'Rajahmundry',
    amount_given NUMERIC(15, 2) NOT NULL,
    total_collection NUMERIC(15, 2) NOT NULL,
    interest_rate NUMERIC(5, 2) DEFAULT 0, -- Monthly interest % for Adjustment loans
    working_days INT DEFAULT 100,
    total_weeks INT DEFAULT 10,
    total_months INT DEFAULT 6,
    daily_amount NUMERIC(15, 2),
    weekly_amount NUMERIC(15, 2),
    monthly_amount NUMERIC(15, 2),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    collected_amount NUMERIC(15, 2) DEFAULT 0,
    balance_amount NUMERIC(15, 2),
    is_closed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS loan_type TEXT DEFAULT 'daily';
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'Rajahmundry';
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS interest_rate NUMERIC(5, 2) DEFAULT 0;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS total_weeks INT DEFAULT 10;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS total_months INT DEFAULT 6;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS weekly_amount NUMERIC(15, 2);
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS monthly_amount NUMERIC(15, 2);

ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access to loans" ON public.loans FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- 5. Collections Table Schema (For Daily, Weekly, Monthly Loans)
CREATE TABLE IF NOT EXISTS public.collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_number TEXT UNIQUE,
    loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE RESTRICT,
    amount_paid NUMERIC(15, 2) NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    remarks TEXT,
    remaining_balance_after_payment NUMERIC(15, 2),
    week_number INT,
    week_start_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.collections ADD COLUMN IF NOT EXISTS remaining_balance_after_payment NUMERIC(15, 2);
ALTER TABLE public.collections ADD COLUMN IF NOT EXISTS week_number INT;
ALTER TABLE public.collections ADD COLUMN IF NOT EXISTS week_start_date DATE;

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access to collections" ON public.collections FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- 6. Dedicated Adjustment Loan Ledger Table (Separate from collections)
CREATE TABLE IF NOT EXISTS public.adjustment_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    transaction_type TEXT NOT NULL, -- 'disbursement' | 'interest' | 'payment'
    opening_balance NUMERIC(15, 2) NOT NULL,
    interest_rate NUMERIC(5, 2) DEFAULT 0,
    interest_added NUMERIC(15, 2) DEFAULT 0,
    payment_received NUMERIC(15, 2) DEFAULT 0,
    closing_balance NUMERIC(15, 2) NOT NULL,
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.adjustment_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public full access to adjustment_ledger" ON public.adjustment_ledger FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- 7. Expenses Table
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    category TEXT NOT NULL, -- 'Office', 'Travel', 'Salary', 'Utilities', 'Maintenance', 'Marketing', 'Misc'
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    description TEXT NOT NULL,
    paid_to TEXT,
    payment_mode TEXT NOT NULL DEFAULT 'Cash', -- 'Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Card'
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public full access to expenses" ON public.expenses FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- 8. Stamps Table
CREATE TABLE IF NOT EXISTS public.stamps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    loan_id UUID REFERENCES public.loans(id) ON DELETE SET NULL,
    stamp_date DATE NOT NULL DEFAULT CURRENT_DATE,
    stamp_type TEXT NOT NULL, -- 'Agreement Stamp', 'Promissory Note', 'Legal Affidavit', 'e-Stamp', 'Revenue Stamp', 'Misc'
    stamp_number TEXT,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    vendor TEXT,
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stamps_customer_id ON public.stamps(customer_id);
CREATE INDEX IF NOT EXISTS idx_stamps_stamp_date ON public.stamps(stamp_date DESC);
CREATE INDEX IF NOT EXISTS idx_stamps_stamp_type ON public.stamps(stamp_type);

ALTER TABLE public.stamps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public full access to stamps" ON public.stamps FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- 9. Chits Table (External Chit Fund Subscriptions)
CREATE TABLE IF NOT EXISTS public.chits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chit_company TEXT NOT NULL, -- 'Margadarsi Chits', 'Kapil Chits', 'Shriram Chits', 'Misc'
    group_number TEXT NOT NULL,
    chit_value NUMERIC(15, 2) NOT NULL CHECK (chit_value > 0),
    monthly_installment NUMERIC(15, 2) NOT NULL CHECK (monthly_installment > 0),
    total_months INT NOT NULL DEFAULT 50,
    paid_months INT NOT NULL DEFAULT 0,
    total_paid NUMERIC(15, 2) NOT NULL DEFAULT 0,
    start_date DATE NOT NULL,
    next_due_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'completed', 'closed'
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chits_status ON public.chits(status);

ALTER TABLE public.chits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public full access to chits" ON public.chits FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- 10. Chit Payments Table (Monthly Installments Ledger)
CREATE TABLE IF NOT EXISTS public.chit_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chit_id UUID NOT NULL REFERENCES public.chits(id) ON DELETE CASCADE,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    receipt_number TEXT,
    payment_mode TEXT NOT NULL DEFAULT 'Bank Transfer', -- 'Cash', 'UPI', 'Bank Transfer', 'Cheque'
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chit_payments_chit_id ON public.chit_payments(chit_id);
CREATE INDEX IF NOT EXISTS idx_chit_payments_payment_date ON public.chit_payments(payment_date DESC);

ALTER TABLE public.chit_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public full access to chit_payments" ON public.chit_payments FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- 11. Investment Settings Table (Global Monthly Interest Rate Configuration)
CREATE TABLE IF NOT EXISTS public.investment_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    monthly_interest_rate NUMERIC(5, 2) NOT NULL DEFAULT 5.00,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.investment_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public full access to investment_settings" ON public.investment_settings FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- 12. Investment Transactions Table (Complete Ledger with Daily Interest)
CREATE TABLE IF NOT EXISTS public.investment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    transaction_type TEXT NOT NULL, -- 'Capital Added', 'Loan Given', 'Collection Received', 'Expense', 'Stamp Expense', 'Chit Payment', 'Business Withdrawal', 'Withdrawal Return', 'Daily Interest', 'Capital Returned'
    opening_balance NUMERIC(15, 2) NOT NULL DEFAULT 0,
    amount_in NUMERIC(15, 2) NOT NULL DEFAULT 0,
    amount_out NUMERIC(15, 2) NOT NULL DEFAULT 0,
    interest_rate NUMERIC(5, 2) NOT NULL DEFAULT 0, -- Monthly interest %
    daily_interest_added NUMERIC(15, 2) NOT NULL DEFAULT 0,
    balance NUMERIC(15, 2) NOT NULL, -- Closing balance = opening_balance + amount_in - amount_out + daily_interest_added
    reference_type TEXT, -- 'loan', 'collection', 'expense', 'stamp', 'chit', 'withdrawal', 'withdrawal_return', 'capital', 'interest'
    reference_id TEXT,
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_investment_tx_date ON public.investment_transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_investment_tx_type ON public.investment_transactions(transaction_type);

ALTER TABLE public.investment_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public full access to investment_transactions" ON public.investment_transactions FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- 13. Interest Transactions Table (Customer Collected Interest Ledger)
CREATE TABLE IF NOT EXISTS public.interest_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id UUID REFERENCES public.collections(id) ON DELETE CASCADE,
    loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    interest_type TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'adjustment'
    interest_amount NUMERIC(15, 2) NOT NULL CHECK (interest_amount >= 0),
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interest_tx_date ON public.interest_transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_interest_tx_type ON public.interest_transactions(interest_type);
CREATE INDEX IF NOT EXISTS idx_interest_tx_customer ON public.interest_transactions(customer_id);

ALTER TABLE public.interest_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public full access to interest_transactions" ON public.interest_transactions FOR ALL USING (TRUE) WITH CHECK (TRUE);

GRANT ALL ON TABLE public.interest_transactions TO anon, authenticated, service_role;

-- 14. External Investors Table
CREATE TABLE IF NOT EXISTS public.external_investors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    mobile TEXT,
    amount_invested NUMERIC(15, 2) NOT NULL CHECK (amount_invested > 0),
    monthly_interest_rate NUMERIC(5, 2) NOT NULL CHECK (monthly_interest_rate >= 0),
    investment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    outstanding_capital NUMERIC(15, 2) NOT NULL DEFAULT 0,
    total_interest_paid NUMERIC(15, 2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'closed'
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_external_investors_status ON public.external_investors(status);

ALTER TABLE public.external_investors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public full access to external_investors" ON public.external_investors FOR ALL USING (TRUE) WITH CHECK (TRUE);
GRANT ALL ON TABLE public.external_investors TO anon, authenticated, service_role;

-- 15. External Investor Ledger Table
CREATE TABLE IF NOT EXISTS public.external_investor_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    investor_id UUID NOT NULL REFERENCES public.external_investors(id) ON DELETE CASCADE,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    transaction_type TEXT NOT NULL, -- 'investment_received', 'interest_paid', 'partial_return', 'full_return'
    amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    principal_paid NUMERIC(15, 2) NOT NULL DEFAULT 0,
    interest_paid NUMERIC(15, 2) NOT NULL DEFAULT 0,
    opening_capital NUMERIC(15, 2) NOT NULL DEFAULT 0,
    closing_capital NUMERIC(15, 2) NOT NULL DEFAULT 0,
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ext_inv_ledger_investor ON public.external_investor_ledger(investor_id);
CREATE INDEX IF NOT EXISTS idx_ext_inv_ledger_date ON public.external_investor_ledger(transaction_date DESC);

ALTER TABLE public.external_investor_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public full access to external_investor_ledger" ON public.external_investor_ledger FOR ALL USING (TRUE) WITH CHECK (TRUE);
GRANT ALL ON TABLE public.external_investor_ledger TO anon, authenticated, service_role;

-- 16. Depositors Table
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

CREATE INDEX IF NOT EXISTS idx_depositors_status ON public.depositors(status);
CREATE INDEX IF NOT EXISTS idx_depositors_date ON public.depositors(deposit_date DESC);
CREATE INDEX IF NOT EXISTS idx_depositors_name ON public.depositors(name);

ALTER TABLE public.depositors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public full access to depositors" ON public.depositors FOR ALL USING (TRUE) WITH CHECK (TRUE);
GRANT ALL ON TABLE public.depositors TO anon, authenticated, service_role;

-- 17. Depositor Transactions Table
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

CREATE INDEX IF NOT EXISTS idx_depositor_tx_depositor ON public.depositor_transactions(depositor_id);
CREATE INDEX IF NOT EXISTS idx_depositor_tx_date ON public.depositor_transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_depositor_tx_type ON public.depositor_transactions(transaction_type);

ALTER TABLE public.depositor_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public full access to depositor_transactions" ON public.depositor_transactions FOR ALL USING (TRUE) WITH CHECK (TRUE);
GRANT ALL ON TABLE public.depositor_transactions TO anon, authenticated, service_role;

-- 18. Employees Table
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_name TEXT NOT NULL,
    mobile_number TEXT,
    address TEXT,
    monthly_salary NUMERIC(15, 2) NOT NULL CHECK (monthly_salary > 0),
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'inactive'
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employees_status ON public.employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_name ON public.employees(employee_name);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public full access to employees" ON public.employees FOR ALL USING (TRUE) WITH CHECK (TRUE);
GRANT ALL ON TABLE public.employees TO anon, authenticated, service_role;

-- 19. Employee Salaries Table (Simple Ledger)
CREATE TABLE IF NOT EXISTS public.employee_salaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    salary_month TEXT NOT NULL,
    salary_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    bonus NUMERIC(15, 2) NOT NULL DEFAULT 0,
    deduction NUMERIC(15, 2) NOT NULL DEFAULT 0,
    net_salary_paid NUMERIC(15, 2) NOT NULL DEFAULT 0,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_mode TEXT NOT NULL DEFAULT 'Bank Transfer',
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emp_salaries_employee ON public.employee_salaries(employee_id);
CREATE INDEX IF NOT EXISTS idx_emp_salaries_date ON public.employee_salaries(payment_date DESC);

ALTER TABLE public.employee_salaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public full access to employee_salaries" ON public.employee_salaries FOR ALL USING (TRUE) WITH CHECK (TRUE);
GRANT ALL ON TABLE public.employee_salaries TO anon, authenticated, service_role;

-- 20. Daily Cash Closures Table
CREATE TABLE IF NOT EXISTS public.daily_cash_closures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    closure_date DATE UNIQUE NOT NULL,
    opening_cash NUMERIC(15, 2) NOT NULL DEFAULT 0,
    total_cash_in NUMERIC(15, 2) NOT NULL DEFAULT 0,
    total_cash_out NUMERIC(15, 2) NOT NULL DEFAULT 0,
    expected_closing_cash NUMERIC(15, 2) NOT NULL DEFAULT 0,
    actual_physical_cash NUMERIC(15, 2) NOT NULL DEFAULT 0,
    cash_difference NUMERIC(15, 2) NOT NULL DEFAULT 0,
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

-- 21. Transaction Reversals Table
CREATE TABLE IF NOT EXISTS public.transaction_reversals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_module TEXT NOT NULL,
    source_transaction_id TEXT NOT NULL,
    reversal_type TEXT NOT NULL,
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




