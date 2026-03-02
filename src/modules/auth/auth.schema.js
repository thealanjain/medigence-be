const { z } = require('zod');

const signupSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Please provide a valid email address')
    .toLowerCase()
    .trim(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(6, 'Password must be at least 6 characters'),
  role: z
    .enum(['PATIENT', 'DOCTOR'], {
      errorMap: () => ({ message: 'Role must be PATIENT or DOCTOR' }),
    })
    .default('PATIENT'),
});

const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Please provide a valid email address')
    .toLowerCase()
    .trim(),
  password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required'),
});

module.exports = { signupSchema, loginSchema };
