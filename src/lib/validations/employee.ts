import { z } from 'zod';

export const employeeSchema = z.object({
  employeeName: z
    .string()
    .min(2, { message: 'Employee name must be at least 2 characters' }),
  mobileNumber: z.string().optional(),
  address: z.string().optional(),
  monthlySalary: z
    .number({ invalid_type_error: 'Monthly salary must be a number' })
    .positive({ message: 'Monthly salary must be greater than ₹0' }),
  status: z.enum(['active', 'inactive'], {
    required_error: 'Status is required',
  }),
  remarks: z.string().optional(),
});

export type EmployeeFormData = z.infer<typeof employeeSchema>;

export const employeeSalarySchema = z.object({
  employeeId: z.string().min(1, { message: 'Please select an employee' }),
  salaryMonth: z.string().min(1, { message: 'Salary month is required' }),
  salaryAmount: z
    .number({ invalid_type_error: 'Salary amount must be a number' })
    .min(0, { message: 'Salary amount cannot be negative' }),
  bonus: z.number({ invalid_type_error: 'Bonus must be a number' }).min(0),
  deduction: z.number({ invalid_type_error: 'Deduction must be a number' }).min(0),
  paymentDate: z.string().min(1, { message: 'Payment date is required' }),
  paymentMode: z.enum(['Cash', 'UPI', 'Bank Transfer', 'Cheque'], {
    required_error: 'Payment mode is required',
  }),
  remarks: z.string().optional(),
});

export type EmployeeSalaryFormData = z.infer<typeof employeeSalarySchema>;
