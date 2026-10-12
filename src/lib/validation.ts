import { z } from 'zod';

/** Shared zod rules so every form words its errors the same way. */
export const required = (message: string) => z.string().trim().min(1, message);
export const email = (message = 'Enter a valid email.') => z.string().trim().toLowerCase().regex(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, message);
export const phone = (message = 'Enter a valid phone number.') => z.string().transform((v) => v.replace(/\s/g, '')).pipe(z.string().regex(/^\+?[0-9]{10,15}$/, message));
export const optionalPhone = (message = 'Enter a valid phone number, or leave it empty.') =>
  z.string().transform((v) => v.replace(/\s/g, '')).pipe(z.union([z.literal(''), z.string().regex(/^\+?[0-9]{10,15}$/, message)]));
export const password = (message = 'Use at least 8 characters.') => z.string().min(8, message);
