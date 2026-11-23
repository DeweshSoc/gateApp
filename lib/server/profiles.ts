import { cache } from "react";
import { connectToDatabase } from "@/lib/db/client";
import { AiProfile } from "@/lib/db/models";
import { toProfileDTO } from "@/lib/serialize";
import type { AiProfileDTO } from "@/types";

/**
 * Load available AI behaviour profiles for pickers. Returns an empty array when
 * the database is unavailable or not seeded.
 *
 * Wrapped in React `cache()` so concurrent callers within one render share the
 * same query.
 */
export const loadProfiles = cache(async (): Promise<AiProfileDTO[]> => {
  try {
    await connectToDatabase();
    const profiles = await AiProfile.find().sort({ isDefault: -1, name: 1 }).lean();
    return profiles.map(toProfileDTO);
  } catch {
    return [];
  }
});
