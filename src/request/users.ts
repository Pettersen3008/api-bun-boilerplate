import { z } from "zod";
import { CursorFirstPaginationSchema } from "./listing";

const sanitizeName = (value: string): string =>
  value
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ");

const EmailSchema = z
  .string()
  .transform((value) => value.trim().toLowerCase())
  .pipe(z.string().email());

export const CreateUserSchema = z.object({
  email: EmailSchema,
  fullName: z.string().min(2).max(120).transform(sanitizeName),
});

export const UserIdParamsSchema = z.object({
  id: z.uuid(),
});

export const ListUsersQuerySchema = CursorFirstPaginationSchema.extend({
  // No endpoint-specific filters for users list in baseline boilerplate.
})
  .strict()
  .superRefine((value, ctx) => {
  if (value.offset !== undefined && value.cursor !== undefined) {
    ctx.addIssue({
      code: "custom",
      message: "offset and cursor cannot be used together",
      path: ["cursor"],
    });
  }

});
