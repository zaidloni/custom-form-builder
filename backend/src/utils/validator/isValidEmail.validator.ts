import z from 'zod'

export const isValidEmail = z.string().email().min(1).max(255).safeParse
