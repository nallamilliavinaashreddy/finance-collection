import { z } from 'zod';

export const addCapitalSchema = z.object({
  amount: z
    .number({ invalid_type_error: 'Capital amount must be a number' })
    .positive({ message: 'Capital amount must be greater than ₹0' }),
  transactionDate: z.string().min(1, { message: 'Date is required' }),
  source: z.string().min(1, { message: 'Source of funds is required' }),
  monthlyInterestRate: z
    .number({ invalid_type_error: 'Monthly interest rate must be a number' })
    .min(0, { message: 'Monthly interest rate cannot be negative' })
    .optional(),
  remarks: z.string().optional(),
});

export type AddCapitalFormData = z.infer<typeof addCapitalSchema>;

export const businessWithdrawalSchema = z.object({
  amount: z
    .number({ invalid_type_error: 'Withdrawal amount must be a number' })
    .positive({ message: 'Withdrawal amount must be greater than ₹0' }),
  withdrawalDate: z.string().min(1, { message: 'Withdrawal date is required' }),
  remarks: z.string().optional(),
});

export type BusinessWithdrawalFormData = z.infer<typeof businessWithdrawalSchema>;

export const withdrawalReturnSchema = z.object({
  amount: z
    .number({ invalid_type_error: 'Return amount must be a number' })
    .positive({ message: 'Return amount must be greater than ₹0' }),
  returnDate: z.string().min(1, { message: 'Return date is required' }),
  paymentMode: z.enum(['Cash', 'UPI', 'Bank Transfer', 'Cheque'], {
    required_error: 'Payment mode is required',
  }),
  remarks: z.string().optional(),
});

export type WithdrawalReturnFormData = z.infer<typeof withdrawalReturnSchema>;

export const investmentSettingsSchema = z.object({
  monthlyInterestRate: z
    .number({ invalid_type_error: 'Monthly interest rate must be a number' })
    .min(0, { message: 'Interest rate cannot be negative' }),
});

export type InvestmentSettingsFormData = z.infer<typeof investmentSettingsSchema>;

export const externalInvestorSchema = z.object({
  name: z.string().min(2, { message: 'Investor name must be at least 2 characters' }),
  mobile: z.string().optional(),
  amountInvested: z
    .number({ invalid_type_error: 'Amount invested must be a number' })
    .positive({ message: 'Amount invested must be greater than ₹0' }),
  monthlyInterestRate: z
    .number({ invalid_type_error: 'Monthly interest rate must be a number' })
    .min(0, { message: 'Interest rate cannot be negative' }),
  investmentDate: z.string().min(1, { message: 'Investment date is required' }),
  remarks: z.string().optional(),
});

export type ExternalInvestorFormData = z.infer<typeof externalInvestorSchema>;

export const externalInvestorTransactionSchema = z.object({
  investorId: z.string().min(1, { message: 'Investor selection is required' }),
  transactionType: z.enum(
    ['interest_paid', 'partial_return', 'full_return', 'investment_received'],
    { required_error: 'Transaction type is required' }
  ),
  amount: z
    .number({ invalid_type_error: 'Amount must be a number' })
    .positive({ message: 'Amount must be greater than ₹0' }),
  transactionDate: z.string().min(1, { message: 'Date is required' }),
  remarks: z.string().optional(),
});

export type ExternalInvestorTransactionFormData = z.infer<typeof externalInvestorTransactionSchema>;
