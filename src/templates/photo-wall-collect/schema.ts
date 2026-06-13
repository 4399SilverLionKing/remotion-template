import { z } from "zod";

export const photoWallCollectSchema = z
  .object({
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    randomSeed: z.number().finite().optional(),
  })
  .passthrough();
