import { z } from 'zod';

const password = z.string().min(8, 'At least 8 characters').regex(/[A-Za-z]/, 'Include a letter').regex(/\d/, 'Include a number');

export const loginSchema = z.object({ email: z.string().email('Enter a valid email'), password: z.string().min(1, 'Password is required') });

export const registerSchema = z.object({
  name: z.string().min(2, 'Enter your full name'),
  email: z.string().email('Enter a valid email'),
  password,
  confirmPassword: z.string(),
  role: z.enum(['participant', 'organizer']),
}).refine((v) => v.password === v.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match' });

export const forgotSchema = z.object({ email: z.string().email('Enter a valid email') });
export const resetSchema = z.object({ password, confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match' });
export const changePasswordSchema = z.object({ currentPassword: z.string().min(1, 'Required'), newPassword: password, confirmPassword: z.string() })
  .refine((v) => v.newPassword === v.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match' });

export const profileSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  headline: z.string().max(120).optional().or(z.literal('')),
  company: z.string().max(120).optional().or(z.literal('')),
  location: z.string().max(120).optional().or(z.literal('')),
  bio: z.string().max(1000, 'Max 1000 characters').optional().or(z.literal('')),
  skills: z.string().optional().or(z.literal('')),
  interests: z.string().optional().or(z.literal('')),
});

export const eventSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  description: z.string().min(10, 'Add a short description'),
  startDate: z.string().min(1, 'Start is required'),
  endDate: z.string().min(1, 'End is required'),
  category: z.string().optional().or(z.literal('')),
  location: z.string().optional().or(z.literal('')),
  capacity: z.string().optional().or(z.literal('')).refine((v) => !v || (Number(v) > 0 && Number.isInteger(Number(v))), 'Must be a positive whole number'),
}).refine((v) => !v.startDate || !v.endDate || new Date(v.endDate) > new Date(v.startDate), { path: ['endDate'], message: 'End must be after start' });

export const sessionSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  description: z.string().optional().or(z.literal('')),
  startTime: z.string().min(1, 'Start is required'),
  endTime: z.string().min(1, 'End is required'),
}).refine((v) => !v.startTime || !v.endTime || new Date(v.endTime) > new Date(v.startTime), { path: ['endTime'], message: 'End must be after start' });

export const speakerSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  designation: z.string().optional().or(z.literal('')),
  company: z.string().optional().or(z.literal('')),
  bio: z.string().max(1000).optional().or(z.literal('')),
});

export const questionSchema = z.object({ content: z.string().min(5, 'At least 5 characters').max(500, 'Max 500 characters') });
export const messageSchema = z.object({ content: z.string().trim().min(1).max(2000) });
