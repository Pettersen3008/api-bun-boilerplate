import { z } from "zod";

// Endre denne til å validere parameterne du ønsker å bruke for å hente met dataen, f.eks. lat og long.
export const ExampleParamsSchema = z.object({
  id: z.string().min(1),
});

export const ExampleQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const ExampleBodySchema = z.object({
  name: z.string().trim().min(2).max(120),
});
