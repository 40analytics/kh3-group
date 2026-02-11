import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['ADMIN', 'MANAGER', 'SALES'], {
    message: 'Please select a role',
  }),
  teamName: z.string().optional(),
  managerId: z.string().optional(),
}).refine((data) => {
  // Require teamName for MANAGER and SALES
  if (['MANAGER', 'SALES'].includes(data.role)) {
    return !!data.teamName;
  }
  return true;
}, {
  message: 'Team name is required for Managers and Sales users',
  path: ['teamName'],
});

export type CreateUserFormData = z.infer<typeof createUserSchema>;
