import { z } from 'zod';

export const chitSchema = z.object({
  chitCompany: z.string().min(1, { message: 'Chit company name is required' }),
  groupNumber: z.string().min(1, { message: 'Group / Ticket number is required' }),
  chitValue: z
    .number({ invalid_type_error: 'Chit value must be a number' })
    .positive({ message: 'Chit value must be greater than ₹0' }),
  monthlyInstallment: z
    .number({ invalid_type_error: 'Monthly installment must be a number' })
    .positive({ message: 'Monthly installment must be greater than ₹0' }),
  totalMonths: z
    .number({ invalid_type_error: 'Total months must be a number' })
    .int()
    .min(1, { message: 'Total months must be at least 1' }),
  startDate: z.string().min(1, { message: 'Start date is required' }),
  nextDueDate: z.string().min(1, { message: 'Next due date is required' }),
  status: z.enum(['active', 'completed', 'closed']),
  remarks: z.string().optional(),
});

export type ChitFormData = z.infer<typeof chitSchema>;

export const chitPaymentSchema = z.object({
  chitId: z.string().min(1, { message: 'Chit subscription selection is required' }),
  paymentDate: z.string().min(1, { message: 'Payment date is required' }),
  amount: z
    .number({ invalid_type_error: 'Payment amount must be a number' })
    .positive({ message: 'Payment amount must be greater than ₹0' }),
  receiptNumber: z.string().optional(),
  paymentMode: z.string().min(1, { message: 'Payment mode is required' }),
  remarks: z.string().optional(),
});

export type ChitPaymentFormData = z.infer<typeof chitPaymentSchema>;
