import z from 'zod'

export const getEventsBody = z.object({
  year: z.coerce.number().min(1900).max(2100),
  month: z.coerce.number().min(1).max(12),
})

export type GetEventsBody = z.infer<typeof getEventsBody>

const recurrenceTypeSchema = z.enum([
  'DAILY',
  'WEEKLY',
  'MONTHLY',
  'YEARLY',
])

export const createEventBody = z.object({
  title: z.string().trim().min(1),
  date: z.iso.date(),
  type: recurrenceTypeSchema.optional(),
  cycle: z.coerce.number().int().min(1).optional(),
  endDate: z.iso.date().optional(),
})
