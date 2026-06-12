import { z } from "zod";

export const fanCollectSchema = z
  .object({
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  })
  .passthrough();
