import { createClient } from '@/lib/supabase/client';
import * as XLSX from 'xlsx';

export interface FullBackupPayload {
  version: string;
  timestamp: string;
  database: string;
  data: {
    customers: any[];
    loans: any[];
    collections: any[];
  };
}

/**
 * Exports complete database to JSON backup file
 */
export async function exportFullBackupToJson(): Promise<{ success: boolean; message?: string; error?: string }> {
  const supabase = createClient();

  try {
    const [custRes, loansRes, collRes] = await Promise.all([
      supabase.from('customers').select('*'),
      supabase.from('loans').select('*'),
      supabase.from('collections').select('*'),
    ]);

    if (custRes.error) throw custRes.error;
    if (loansRes.error) throw loansRes.error;
    if (collRes.error) throw collRes.error;

    const backupPayload: FullBackupPayload = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      database: 'Supabase PostgreSQL',
      data: {
        customers: custRes.data || [],
        loans: loansRes.data || [],
        collections: collRes.data || [],
      },
    };

    const jsonString = JSON.stringify(backupPayload, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance_collection_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return { success: true, message: 'JSON backup exported successfully.' };
  } catch (err: any) {
    console.error('Export JSON backup error:', err);
    return { success: false, error: err?.message || 'Failed to export JSON backup' };
  }
}

/**
 * Exports all database tables to individual CSV files
 */
export async function exportDatabaseToCsv(): Promise<{ success: boolean; message?: string; error?: string }> {
  const supabase = createClient();

  try {
    const [custRes, loansRes, collRes] = await Promise.all([
      supabase.from('customers').select('*'),
      supabase.from('loans').select('*'),
      supabase.from('collections').select('*'),
    ]);

    if (custRes.data && custRes.data.length > 0) {
      const ws = XLSX.utils.json_to_sheet(custRes.data);
      const csv = XLSX.utils.sheet_to_csv(ws);
      downloadFile(csv, `customers_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
    }

    if (loansRes.data && loansRes.data.length > 0) {
      const ws = XLSX.utils.json_to_sheet(loansRes.data);
      const csv = XLSX.utils.sheet_to_csv(ws);
      downloadFile(csv, `loans_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
    }

    if (collRes.data && collRes.data.length > 0) {
      const ws = XLSX.utils.json_to_sheet(collRes.data);
      const csv = XLSX.utils.sheet_to_csv(ws);
      downloadFile(csv, `collections_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
    }

    return { success: true, message: 'Database CSV files exported.' };
  } catch (err: any) {
    console.error('Export CSV error:', err);
    return { success: false, error: err?.message || 'Failed to export CSV' };
  }
}

/**
 * Imports JSON backup file and restores records into Supabase
 */
export async function importJsonBackup(file: File): Promise<{ success: boolean; message?: string; error?: string }> {
  const supabase = createClient();

  try {
    const text = await file.text();
    const parsed: FullBackupPayload = JSON.parse(text);

    if (!parsed || !parsed.data) {
      return { success: false, error: 'Invalid backup file format.' };
    }

    const { customers, loans, collections } = parsed.data;

    if (customers && customers.length > 0) {
      const { error: custErr } = await supabase.from('customers').upsert(customers as any);
      if (custErr) console.error('Upsert customers error:', custErr);
    }

    if (loans && loans.length > 0) {
      const { error: loansErr } = await supabase.from('loans').upsert(loans as any);
      if (loansErr) console.error('Upsert loans error:', loansErr);
    }

    if (collections && collections.length > 0) {
      const { error: collErr } = await supabase.from('collections').upsert(collections as any);
      if (collErr) console.error('Upsert collections error:', collErr);
    }

    return { success: true, message: 'Backup data imported and restored successfully into Supabase.' };
  } catch (err: any) {
    console.error('Import JSON backup error:', err);
    return { success: false, error: err?.message || 'Failed to parse and import backup file' };
  }
}

function downloadFile(content: string, fileName: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
