'use client';

import { createClient } from '@/lib/supabase/client';
import { Employee, EmployeeSalary, EmployeeMetrics, EmployeeStatus } from '@/types';
import { EmployeeFormData, EmployeeSalaryFormData } from '@/lib/validations/employee';
import { recordInvestmentTransaction } from '@/lib/actions/investment';

function isTableNotFoundError(error: any): boolean {
  if (!error) return false;
  const msg = (error.message || '').toLowerCase();
  const code = error.code || '';
  return (
    code === 'PGRST205' ||
    code === '42P01' ||
    (msg.includes('relation') && msg.includes('does not exist'))
  );
}

const TABLE_MISSING_ERROR =
  'The "employees" table does not exist in Supabase yet. Please execute the SQL migration script in supabase/migrations/20260804151700_create_employees_tables.sql in your Supabase SQL Editor.';

/**
 * 1. Fetch Employees List
 */
export async function getEmployees(
  searchQuery?: string,
  statusFilter?: string
): Promise<{ success: boolean; data: Employee[]; error?: string }> {
  const supabase = createClient();

  try {
    let query = supabase
      .from('employees')
      .select('*')
      .order('created_at', { ascending: false });

    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      if (isTableNotFoundError(error)) {
        return { success: true, data: [] };
      }
      console.error('Error fetching employees:', error);
      return { success: false, data: [], error: error.message };
    }

    let items: Employee[] = (data || []).map((row: any) => ({
      id: row.id,
      employeeName: row.employee_name || row.name || 'N/A',
      mobileNumber: row.mobile_number || row.mobile || undefined,
      address: row.address || undefined,
      monthlySalary: Number(row.monthly_salary || 0),
      status: row.status as EmployeeStatus,
      remarks: row.remarks || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    if (searchQuery && searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      items = items.filter(
        (emp) =>
          emp.employeeName.toLowerCase().includes(q) ||
          (emp.mobileNumber && emp.mobileNumber.includes(q)) ||
          (emp.address && emp.address.toLowerCase().includes(q)) ||
          (emp.remarks && emp.remarks.toLowerCase().includes(q))
      );
    }

    return { success: true, data: items };
  } catch (err: any) {
    console.error('Unexpected error in getEmployees:', err);
    return { success: true, data: [] };
  }
}

/**
 * 2. Create New Employee
 */
export async function createEmployee(
  formData: EmployeeFormData
): Promise<{ success: boolean; data?: Employee; error?: string }> {
  const supabase = createClient();

  try {
    const payload: any = {
      employee_name: formData.employeeName,
      full_name: formData.employeeName,
      mobile_number: formData.mobileNumber || null,
      address: formData.address || null,
      monthly_salary: formData.monthlySalary,
      status: formData.status || 'active',
      remarks: formData.remarks || null,
    };

    const { data: emp, error } = await supabase
      .from('employees')
      .insert([payload])
      .select('*')
      .single();

    if (error) {
      if (isTableNotFoundError(error)) {
        return { success: false, error: TABLE_MISSING_ERROR };
      }
      return { success: false, error: error.message };
    }

    const formatted: Employee = {
      id: emp.id,
      employeeName: emp.employee_name || emp.full_name || emp.name,
      mobileNumber: emp.mobile_number || emp.mobile || undefined,
      address: emp.address || undefined,
      monthlySalary: Number(emp.monthly_salary || 0),
      status: emp.status as EmployeeStatus,
      remarks: emp.remarks || undefined,
      createdAt: emp.created_at,
      updatedAt: emp.updated_at,
    };

    return { success: true, data: formatted };
  } catch (err: any) {
    console.error('Error creating employee:', err);
    return { success: false, error: err?.message || 'Failed to create employee' };
  }
}

/**
 * 3. Update Existing Employee
 */
export async function updateEmployee(
  id: string,
  formData: EmployeeFormData
): Promise<{ success: boolean; data?: Employee; error?: string }> {
  const supabase = createClient();

  try {
    const payload: any = {
      employee_name: formData.employeeName,
      full_name: formData.employeeName,
      mobile_number: formData.mobileNumber || null,
      address: formData.address || null,
      monthly_salary: formData.monthlySalary,
      status: formData.status || 'active',
      remarks: formData.remarks || null,
      updated_at: new Date().toISOString(),
    };

    const { data: emp, error } = await supabase
      .from('employees')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    const formatted: Employee = {
      id: emp.id,
      employeeName: emp.employee_name || emp.full_name || emp.name,
      mobileNumber: emp.mobile_number || emp.mobile || undefined,
      address: emp.address || undefined,
      monthlySalary: Number(emp.monthly_salary || 0),
      status: emp.status as EmployeeStatus,
      remarks: emp.remarks || undefined,
      createdAt: emp.created_at,
      updatedAt: emp.updated_at,
    };

    return { success: true, data: formatted };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to update employee' };
  }
}

/**
 * 4. Delete Employee
 */
export async function deleteEmployee(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  try {
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to delete employee' };
  }
}

/**
 * 5. Record Salary Payment & Automatically Sync with Investment Khata
 */
export async function recordEmployeeSalary(
  formData: EmployeeSalaryFormData
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  try {
    const { data: emp, error: empErr } = await supabase
      .from('employees')
      .select('*')
      .eq('id', formData.employeeId)
      .single();

    if (empErr || !emp) {
      if (isTableNotFoundError(empErr)) {
        return { success: false, error: TABLE_MISSING_ERROR };
      }
      return { success: false, error: 'Employee not found' };
    }

    const salaryAmount = Number(formData.salaryAmount || 0);
    const bonus = Number(formData.bonus || 0);
    const deduction = Number(formData.deduction || 0);
    const netSalaryPaid = Math.max(0, salaryAmount + bonus - deduction);

    const payload = {
      employee_id: emp.id,
      salary_month: formData.salaryMonth,
      salary_amount: salaryAmount,
      bonus,
      deduction,
      net_salary_paid: netSalaryPaid,
      payment_date: formData.paymentDate,
      payment_mode: formData.paymentMode,
      remarks: formData.remarks || null,
    };

    const { error: salErr } = await supabase
      .from('employee_salaries')
      .insert([payload]);

    if (salErr) {
      if (isTableNotFoundError(salErr)) {
        return { success: false, error: TABLE_MISSING_ERROR };
      }
      return { success: false, error: salErr.message };
    }

    // Automatically synchronize with central Investment Khata working capital ledger
    const empName = emp.employee_name || emp.name || 'Employee';
    await recordInvestmentTransaction(
      'Expense',
      0,
      netSalaryPaid,
      'employee_salary',
      emp.id,
      `Employee Salary: ${empName} - ${formData.salaryMonth} (Net Paid: ₹${netSalaryPaid})${formData.remarks ? ' | ' + formData.remarks : ''}`,
      formData.paymentDate
    );

    return { success: true };
  } catch (err: any) {
    console.error('Error recording employee salary:', err);
    return { success: false, error: err?.message || 'Failed to record salary payment' };
  }
}

/**
 * 6. Get Employee Salary History Ledger
 */
export async function getEmployeeSalaries(
  employeeId?: string
): Promise<{ success: boolean; data: EmployeeSalary[]; error?: string }> {
  const supabase = createClient();

  try {
    let query = supabase
      .from('employee_salaries')
      .select('*, employees(employee_name, name)')
      .order('payment_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (employeeId) {
      query = query.eq('employee_id', employeeId);
    }

    const { data, error } = await query;

    if (error) {
      if (isTableNotFoundError(error)) {
        return { success: true, data: [] };
      }
      return { success: false, data: [], error: error.message };
    }

    const items: EmployeeSalary[] = (data || []).map((row: any) => {
      const emp = row.employees || {};
      return {
        id: row.id,
        employeeId: row.employee_id,
        employeeName: emp.employee_name || emp.name || 'N/A',
        salaryMonth: row.salary_month,
        salaryAmount: Number(row.salary_amount || 0),
        bonus: Number(row.bonus || 0),
        deduction: Number(row.deduction || 0),
        netSalaryPaid: Number(row.net_salary_paid || 0),
        paymentDate: row.payment_date,
        paymentMode: row.payment_mode || 'Bank Transfer',
        remarks: row.remarks || undefined,
        createdAt: row.created_at,
      };
    });

    return { success: true, data: items };
  } catch (err: any) {
    console.error('Error fetching employee salaries:', err);
    return { success: true, data: [] };
  }
}

/**
 * 7. Get Employee Metrics Summary
 */
export async function getEmployeeMetrics(): Promise<{
  success: boolean;
  data: EmployeeMetrics;
  error?: string;
}> {
  const supabase = createClient();

  try {
    const [empRes, salRes] = await Promise.all([
      supabase.from('employees').select('*'),
      supabase.from('employee_salaries').select('*'),
    ]);

    if (empRes.error && isTableNotFoundError(empRes.error)) {
      return {
        success: true,
        data: {
          totalEmployees: 0,
          activeEmployees: 0,
          monthlyPayrollCost: 0,
          totalSalaryPaidYTD: 0,
        },
      };
    }

    const employees = empRes.data || [];
    const salaries = salRes.data || [];

    const totalEmployees = employees.length;
    const activeEmployees = employees.filter((e: any) => e.status === 'active').length;

    const monthlyPayrollCost = employees
      .filter((e: any) => e.status === 'active')
      .reduce((sum: number, e: any) => sum + Number(e.monthly_salary || 0), 0);

    const totalSalaryPaidYTD = salaries.reduce(
      (sum: number, s: any) => sum + Number(s.net_salary_paid || 0),
      0
    );

    return {
      success: true,
      data: {
        totalEmployees,
        activeEmployees,
        monthlyPayrollCost: Math.round(monthlyPayrollCost * 100) / 100,
        totalSalaryPaidYTD: Math.round(totalSalaryPaidYTD * 100) / 100,
      },
    };
  } catch (err: any) {
    return {
      success: true,
      data: {
        totalEmployees: 0,
        activeEmployees: 0,
        monthlyPayrollCost: 0,
        totalSalaryPaidYTD: 0,
      },
    };
  }
}
