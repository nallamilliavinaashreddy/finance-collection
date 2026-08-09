import { z } from 'zod';

export const stampSchema = z.object({
  customerId: z.string().min(1, { message: 'Customer selection is required' }),
  loanId: z.string().optional(),
  stampDate: z.string().min(1, { message: 'Stamp date is required' }),
  stampType: z.string().min(1, { message: 'Stamp type is required' }),
  stampNumber: z.string().optional(),
  amount: z
    .number({ invalid_type_error: 'Amount must be a number' })
    .positive({ message: 'Amount must be greater than ₹0' }),
  vendor: z.string().optional(),
  remarks: z.string().optional(),
});

export type StampFormData = z.infer<typeof stampSchema>;
