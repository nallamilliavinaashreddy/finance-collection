-- ==========================================================
-- EMPLOYEES MODULE DATABASE MIGRATION
-- Migration: 20260804151700_create_employees_tables.sql
-- ==========================================================

-- 1. Employees Table
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

-- 2. Employee Salaries Table (Simple Ledger)
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
