import { z } from "zod";
import { env } from "../provider/config";

const EmailSchema = z
  .email()
  .transform((value) => value.trim().toLowerCase())
  .pipe(z.string());

export const RegisterSchema = z.object({
  email: EmailSchema,
  fullName: z.string().trim().min(2).max(120),
  password: z.string().min(env.PASSWORD_MIN_LENGTH).max(env.PASSWORD_MAX_LENGTH),
});

export const LoginSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1).max(env.PASSWORD_MAX_LENGTH),
});
