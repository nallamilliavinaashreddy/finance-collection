import { z } from 'zod';

export const loanSchema = z.object({
  customerId: z.string().min(1, { message: 'Please select a Customer' }),
  loanType: z.enum(['daily', 'weekly', 'monthly', 'adjustment']),
  city: z.string().optional(),
  amountGiven: z
    .number({ invalid_type_error: 'Amount Given must be a number' })
    .positive({ message: 'Amount Given must be greater than 0' }),
  totalCollectionAmount: z
    .number({ invalid_type_error: 'Total Collection Amount must be a number' })
    .positive({ message: 'Total Collection Amount must be greater than 0' }),
  interestRate: z
    .number({ invalid_type_error: 'Monthly Interest Percentage must be a number' })
    .min(0, { message: 'Interest Rate must be 0% or greater' })
    .optional(),
  workingDays: z
    .number({ invalid_type_error: 'Working Days must be a number' })
    .int()
    .min(1)
    .optional(),
  totalWeeks: z
    .number({ invalid_type_error: 'Total Weeks must be a number' })
    .int()
    .min(1)
    .optional(),
  totalMonths: z
    .number({ invalid_type_error: 'Total Months must be a number' })
    .int()
    .min(1)
    .optional(),
  dailyAmount: z
    .number({ invalid_type_error: 'Daily Amount must be a number' })
    .nonnegative()
    .optional(),
  weeklyAmount: z
    .number({ invalid_type_error: 'Weekly Amount must be a number' })
    .positive()
    .optional(),
  monthlyAmount: z
    .number({ invalid_type_error: 'Monthly Amount must be a number' })
    .positive()
    .optional(),
  startDate: z.string().min(1, { message: 'Start Date is required' }),
  endDate: z.string().min(1, { message: 'End Date is required' }),
  status: z.enum(['active', 'closed']),
});

export type LoanFormData = z.infer<typeof loanSchema>;
