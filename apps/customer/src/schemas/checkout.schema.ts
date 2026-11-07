import { z } from 'zod';

export const checkoutSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(2, 'Please enter your name (at least 2 characters).'),
  customerPhone: z
    .string()
    .trim()
    .min(7, 'Enter a valid mobile number.')
    .regex(/^[+0-9 ()-]{7,20}$/, 'Use digits only, e.g. +1 555 0100.'),
  customerEmail: z
    .string()
    .trim()
    .email('Enter a valid email address.')
    .optional()
    .or(z.literal('')),
  notes: z.string().trim().max(500, 'Notes must be 500 characters or fewer.').optional(),
});

export type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export const profileSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your name.'),
  email: z
    .string()
    .trim()
    .email('Enter a valid email address.')
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .trim()
    .optional()
    .refine(
      (value) => !value || /^[+0-9 ()-]{7,20}$/.test(value),
      'Enter a valid phone number.',
    ),
  diningNotes: z.string().trim().max(200, 'Keep it under 200 characters.').optional(),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
