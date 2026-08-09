import { z } from 'zod';

export const customerSchema = z.object({
  customerId: z
    .string()
    .min(1, { message: 'Customer ID is required' })
    .max(30, { message: 'Customer ID must not exceed 30 characters' })
    .regex(/^[A-Za-z0-9_-]+$/, {
      message: 'Customer ID can only contain letters, numbers, hyphens, and underscores',
    }),
  customerName: z
    .string()
    .min(2, { message: 'Customer Name must be at least 2 characters' })
    .max(100, { message: 'Customer Name must not exceed 100 characters' }),
  mobileNumber: z
    .string()
    .min(7, { message: 'Mobile Number must be at least 7 digits' })
    .max(20, { message: 'Mobile Number must not exceed 20 characters' })
    .regex(/^[0-9+\s()-]+$/, {
      message: 'Please enter a valid mobile number',
    }),
  address: z
    .string()
    .max(250, { message: 'Address must not exceed 250 characters' })
    .optional()
    .or(z.literal('')),
});

export type CustomerFormData = z.infer<typeof customerSchema>;
