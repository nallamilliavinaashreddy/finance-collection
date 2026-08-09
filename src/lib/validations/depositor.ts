import { z } from 'zod';

export const depositorSchema = z.object({
  depositorName: z
    .string()
    .min(2, { message: 'Depositor name must be at least 2 characters' }),
  mobileNumber: z.string().optional(),
  address: z.string().optional(),
  depositAmount: z
    .number({ invalid_type_error: 'Deposit amount must be a number' })
    .positive({ message: 'Deposit amount must be greater than ₹0' }),
  monthlyInterestRate: z
    .number({ invalid_type_error: 'Monthly interest rate must be a number' })
    .min(0, { message: 'Interest rate cannot be negative' }),
  depositDate: z.string().min(1, { message: 'Deposit date is required' }),
  expectedReturnDate: z.string().optional(),
  paymentMode: z.enum(['Cash', 'UPI', 'Bank Transfer', 'Cheque'], {
    required_error: 'Payment mode is required',
  }),
  remarks: z.string().optional(),
});

export type DepositorFormData = z.infer<typeof depositorSchema>;

export const depositorTransactionSchema = z.object({
  depositorId: z.string().min(1, { message: 'Depositor is required' }),
  transactionType: z.enum(
    ['deposit_received', 'interest_paid', 'partial_return', 'full_return'],
    { required_error: 'Transaction type is required' }
  ),
  amount: z
    .number({ invalid_type_error: 'Amount must be a number' })
    .positive({ message: 'Amount must be greater than ₹0' }),
  transactionDate: z.string().min(1, { message: 'Date is required' }),
  remarks: z.string().optional(),
});

export type DepositorTransactionFormData = z.infer<typeof depositorTransactionSchema>;
