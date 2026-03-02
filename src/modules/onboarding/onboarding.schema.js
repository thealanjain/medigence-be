const { z } = require('zod');

// Phone regex: accepts formats like +91-9876543210, 9876543210, +1 (555) 000-0000, etc.
const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{3,6}[-\s.]?[0-9]{3,6}$/;

const step1Schema = z.object({
  full_name: z
    .string({ required_error: 'Full name is required' })
    .trim()
    .refine(
      (val) => val.trim().split(/\s+/).length >= 2,
      'Full name must contain at least 2 words'
    ),
  age: z
    .number({ required_error: 'Age is required', invalid_type_error: 'Age must be a number' })
    .int('Age must be a whole number')
    .min(18, 'You must be at least 18 years old'),
  gender: z.enum(['Male', 'Female', 'Other', 'Prefer not to say']).optional(),
  phone: z
    .string({ required_error: 'Phone number is required' })
    .trim()
    .regex(phoneRegex, 'Please enter a valid phone number'),
  address: z.string().trim().max(500, 'Address too long').optional(),
  city: z.string().trim().max(100).optional(),
  country: z.string().trim().max(100).default('India'),
});

const step2Schema = z.object({
  blood_type: z
    .enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], {
      errorMap: () => ({ message: 'Invalid blood type' }),
    })
    .optional(),
  allergies: z
    .array(z.string().trim().max(100, 'Each allergy must be under 100 characters'))
    .max(20, 'Too many allergies listed')
    .default([]),
  chronic_conditions: z
    .array(z.string().trim().max(150, 'Each condition must be under 150 characters'))
    .max(20, 'Too many conditions listed')
    .default([]),
  current_medications: z.string().trim().max(1000, 'Medications field too long').optional(),
  emergency_contact: z.string().trim().max(255).optional(),
  emergency_phone: z
    .string()
    .trim()
    .regex(phoneRegex, 'Please enter a valid emergency phone number')
    .optional()
    .or(z.literal('')),
  additional_notes: z.string().trim().max(2000, 'Notes too long').optional(),
});

const step3Schema = z.object({
  preferred_time_slot: z
    .enum(['Morning', 'Afternoon', 'Evening', 'Night'], {
      errorMap: () => ({ message: 'Invalid time slot' }),
    })
    .optional(),
  referral_source: z.string().trim().max(255).optional(),
  insurance_provider: z.string().trim().max(255).optional(),
  policy_number: z.string().trim().max(100).optional(),
  additional_notes: z.string().trim().max(2000).optional(),
});

module.exports = { step1Schema, step2Schema, step3Schema };
