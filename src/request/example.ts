import { z } from "zod";

// Copy this file when creating a new feature request contract.
export const ExampleParamsSchema = z.object({
  id: z.string().min(1),
});

export const ExampleQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const ExampleBodySchema = z.object({
  name: z.string().trim().min(2).max(120),
});
