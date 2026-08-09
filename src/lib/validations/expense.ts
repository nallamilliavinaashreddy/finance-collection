import { z } from 'zod';

export const expenseSchema = z.object({
  expenseDate: z.string().min(1, { message: 'Expense date is required' }),
  category: z.string().min(1, { message: 'Category is required' }),
  amount: z
    .number({ invalid_type_error: 'Amount must be a number' })
    .positive({ message: 'Amount must be greater than ₹0' }),
  description: z.string().min(2, { message: 'Description must be at least 2 characters' }),
  paidTo: z.string().optional(),
  paymentMode: z.string().min(1, { message: 'Payment mode is required' }),
  remarks: z.string().optional(),
});

export type ExpenseFormData = z.infer<typeof expenseSchema>;
