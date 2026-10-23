import { z } from 'zod';

export const EMPLOYMENT_TYPES = ['permanent', 'temporary', 'contract', 'intern'];

export const profileSchema = z.object({
  personalInfo: z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    phoneNumber: z.string().optional(),
  }),

  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  hireDate: z.string().min(1, 'Hire date is required'),
  jobTitle: z.string().min(1, 'Job title is required'),

  
  employmentType: z.enum(EMPLOYMENT_TYPES),
  emergencyContact: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    relationship: z.string().optional(),
  }),
  sensitive: z
    .object({
      bankName: z.string().optional(),
      accountNumber: z.string().optional(),
      nin: z.string().optional(),
    })
    .optional(),
});


export const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5MB

export function isValidPhotoFile(file) {
  if (!file) return false;
  return ALLOWED_PHOTO_TYPES.includes(file.type) && file.size <= MAX_PHOTO_BYTES;
}