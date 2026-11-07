import { z } from 'zod';

export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .email('Enter a valid email address')
  .max(255);

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters');

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerRestaurantSchema = z
  .object({
    name: z.string().trim().min(2, 'Restaurant name must be at least 2 characters').max(120),
    ownerFirstName: z.string().trim().min(1, 'First name is required').max(80),
    ownerLastName: z.string().trim().min(1, 'Last name is required').max(80),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterRestaurantFormValues = z.infer<typeof registerRestaurantSchema>;

export const tenantOnboardingSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(120),
  slug: z
    .string()
    .trim()
    .min(2, 'Slug is required')
    .max(60)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and hyphens'),
  ownerEmail: emailSchema,
  ownerFirstName: z.string().trim().min(1, 'First name is required').max(80),
  ownerLastName: z.string().trim().min(1, 'Last name is required').max(80),
  planCode: z.string().trim().min(1, 'Select a plan'),
});

export type TenantOnboardingFormValues = z.infer<typeof tenantOnboardingSchema>;

export const branchSchema = z.object({
  name: z.string().trim().min(1, 'Branch name is required').max(120),
  addressLine1: z.string().trim().min(1, 'Address is required').max(200),
  city: z.string().trim().min(1, 'City is required').max(100),
  postalCode: z.string().trim().max(20).optional(),
  phone: z.string().trim().max(30).optional(),
});

export type BranchFormValues = z.infer<typeof branchSchema>;

export const menuItemSchema = z.object({
  name: z.string().trim().min(1, 'Item name is required').max(120),
  description: z.string().trim().max(1000, 'Description must be at most 1000 characters').optional().or(z.literal('')),
  sku: z.string().trim().min(1, 'SKU is required').max(60, 'SKU must be at most 60 characters'),
  price: z.coerce.number().min(0, 'Price must not be negative'),
  categoryId: z.coerce.number().int().positive('Select a category'),
  imageUrl: z
    .string()
    .trim()
    .max(500, 'Image URL must be at most 500 characters')
    .refine((value) => value === '' || /^https?:\/\/\S+$/i.test(value), 'Enter a valid URL starting with http:// or https://'),
});

export type MenuItemFormValues = z.infer<typeof menuItemSchema>;

export const checkoutSchema = z.object({
  customerName: z.string().trim().min(1, 'Name is required').max(120),
  customerPhone: z.string().trim().max(30).optional(),
  customerEmail: emailSchema.optional().or(z.literal('')),
  notes: z.string().trim().max(500).optional(),
  tipAmount: z.coerce.number().min(0).default(0),
});

export type CheckoutFormValues = z.infer<typeof checkoutSchema>;
