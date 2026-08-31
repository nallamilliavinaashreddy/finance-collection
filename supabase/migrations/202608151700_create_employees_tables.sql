-- ==========================================================
-- EMPLOYEES & SALARIES MODULE DATABASE MIGRATION
-- Migration: 202608151700_create_employees_tables.sql
-- ==========================================================

-- 1. Employees Table
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_name TEXT,
    full_name TEXT,
    mobile_number TEXT,
    address TEXT,
    monthly_salary NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (monthly_salary >= 0),
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'inactive'
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger to sync full_name and employee_name automatically
CREATE OR REPLACE FUNCTION public.sync_employee_name()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.full_name IS NULL AND NEW.employee_name IS NOT NULL THEN
        NEW.full_name := NEW.employee_name;
    ELSIF NEW.employee_name IS NULL AND NEW.full_name IS NOT NULL THEN
        NEW.employee_name := NEW.full_name;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_employee_name ON public.employees;
CREATE TRIGGER trg_sync_employee_name
BEFORE INSERT OR UPDATE ON public.employees
FOR EACH ROW EXECUTE FUNCTION public.sync_employee_name();

CREATE INDEX IF NOT EXISTS idx_employees_status ON public.employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_name ON public.employees(employee_name);
CREATE INDEX IF NOT EXISTS idx_employees_full_name ON public.employees(full_name);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public full access to employees" ON public.employees;
CREATE POLICY "Allow public full access to employees" ON public.employees FOR ALL USING (TRUE) WITH CHECK (TRUE);
GRANT ALL ON TABLE public.employees TO anon, authenticated, service_role;

-- 2. Employee Salaries Table (Ledger)
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
DROP POLICY IF EXISTS "Allow public full access to employee_salaries" ON public.employee_salaries;
CREATE POLICY "Allow public full access to employee_salaries" ON public.employee_salaries FOR ALL USING (TRUE) WITH CHECK (TRUE);
GRANT ALL ON TABLE public.employee_salaries TO anon, authenticated, service_role;
