-- Migration: 20260809114000_drop_partners_module.sql
-- Safely drop all Partners module database objects and clean schema

DROP TABLE IF EXISTS public.partner_investments CASCADE;
DROP TABLE IF EXISTS public.partners CASCADE;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'loans' AND column_name = 'partner_id'
    ) THEN
        ALTER TABLE public.loans DROP COLUMN partner_id;
    END IF;
END $$;

NOTIFY pgrst, 'reload schema';
