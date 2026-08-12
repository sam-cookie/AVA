import { z } from 'zod'

export const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name too long'),
  icon: z.string().min(1, 'Select an icon'),
})

export type CategoryFormValues = z.infer<typeof categorySchema>
