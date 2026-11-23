import { connectToDatabase } from "@/lib/db/client";
import { AiProfile } from "@/lib/db/models";
import { toProfileDTO } from "@/lib/serialize";
import type { AiProfileDTO } from "@/types";

/**
 * Load available AI behaviour profiles for pickers. Returns an empty array when
 * the database is unavailable or not seeded.
 */
export async function loadProfiles(): Promise<AiProfileDTO[]> {
  try {
    await connectToDatabase();
    const profiles = await AiProfile.find().sort({ isDefault: -1, name: 1 }).lean();
    return profiles.map(toProfileDTO);
  } catch {
    return [];
  }
}
