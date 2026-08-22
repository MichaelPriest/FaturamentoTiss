import { z } from 'zod';
export const loginSchema=z.object({email:z.string().trim().email('Informe um e-mail válido.'),password:z.string().min(8,'A senha deve possuir ao menos 8 caracteres.')});
export type LoginInput=z.infer<typeof loginSchema>;
