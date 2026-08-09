import { createClient } from '@/lib/supabase/client';

export interface DatabaseHealthInfo {
  status: 'healthy' | 'degraded' | 'disconnected';
  latencyMs: number;
  supabaseUrl: string;
  totalTables: number;
  tables: { name: string; rowCount: number }[];
  lastSyncTime: string;
}

export interface CompanySettingsData {
  companyName: string;
  companyLogoUrl: string;
  companyAddress: string;
  phoneNumber: string;
  email: string;
}

export interface AppSettingsData {
  currency: string;
  dateFormat: string;
  theme: string;
  defaultWorkingDays: number;
  skipSundays: boolean;
  confirmBeforeDelete: boolean;
  sessionTimeoutMinutes: number;
}

export async function getDatabaseHealth(): Promise<{
  success: boolean;
  data: DatabaseHealthInfo | null;
  error?: string;
}> {
  const supabase = createClient();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rioyhvzjmotxlkkiosxz.supabase.co';

  try {
    const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();

    // Core table names to check
    const tableNames = [
      'customers',
      'loans',
      'collections',
      'expenses',
      'stamps',
      'chits',
      'chit_payments',
      'investment_transactions',
      'business_withdrawals',
      'adjustment_ledger',
      'depositors',
      'employees',
      'profiles',
    ];

    let hasSuccessQuery = false;
    let primaryError: string | null = null;

    // Perform real queries for each table using select('*', { count: 'exact' }).limit(1)
    const results = await Promise.all(
      tableNames.map(async (name) => {
        try {
          const { count, error } = await supabase
            .from(name)
            .select('*', { count: 'exact' })
            .limit(1);

          if (!error) {
            hasSuccessQuery = true;
            return { name, rowCount: count ?? 0 };
          } else {
            if (!primaryError && error.message) {
              primaryError = error.message;
            }
            return { name, rowCount: 0 };
          }
        } catch (err: any) {
          return { name, rowCount: 0 };
        }
      })
    );

    const t1 = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const latencyMs = Math.max(1, Math.round(t1 - t0));

    // Connected if at least one real query succeeded
    const isConnected = hasSuccessQuery;
    const status: 'healthy' | 'degraded' | 'disconnected' = isConnected
      ? latencyMs < 500
        ? 'healthy'
        : 'degraded'
      : 'disconnected';

    return {
      success: true,
      data: {
        status,
        latencyMs,
        supabaseUrl,
        totalTables: results.length,
        tables: results,
        lastSyncTime: new Date().toISOString(),
      },
      error: isConnected ? undefined : primaryError || 'Database connection error',
    };
  } catch (err: any) {
    console.error('Database health check error:', err);
    return {
      success: false,
      data: {
        status: 'disconnected',
        latencyMs: 0,
        supabaseUrl,
        totalTables: 0,
        tables: [],
        lastSyncTime: new Date().toISOString(),
      },
      error: err?.message || 'Database connection error',
    };
  }
}

/**
 * Clean all application test records in strict foreign-key dependency order,
 * preserving schema, migrations, settings, and user credentials.
 */
export async function resetDatabaseTestData(): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  try {
    const tablesInOrder = [
      'collections',
      'adjustment_ledger',
      'employee_salaries',
      'depositor_transactions',
      'chit_payments',
      'chit_prizes',
      'loans',
      'customers',
      'employees',
      'depositors',
      'chits',
      'expenses',
      'stamps',
      'investment_transactions',
      'external_investor_transactions',
      'external_investors',
    ];

    for (const table of tablesInOrder) {
      try {
        await supabase
          .from(table)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');
      } catch {
        // Table may not exist or may be empty
      }
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to reset test data' };
  }
}
