import { z } from 'zod';

export const collectionSchema = z.object({
  customerId: z.string().min(1, { message: 'Please select a Customer' }),
  loanId: z.string().min(1, { message: 'Please select an active Loan' }),
  paymentDate: z.string().min(1, { message: 'Collection Date is required' }),
  amountPaid: z
    .number({ invalid_type_error: 'Amount Collected must be a number' })
    .positive({ message: 'Amount Collected must be greater than 0' }),
  remarks: z.string().optional().or(z.literal('')),
});

export type CollectionFormData = z.infer<typeof collectionSchema>;
