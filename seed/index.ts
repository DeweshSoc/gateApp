/**
 * Idempotent database seeder.
 *
 *   pnpm seed
 *
 * Loads .env manually (tsx does not do so), then upserts the official GATE CSE
 * syllabus (subjects + topics) and the default AI behavior profiles. Safe to
 * run repeatedly: records are matched by their stable `slug`.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { slugify } from "@/lib/utils";
import { SEED_SUBJECTS } from "./subjects";
import { SEED_PROFILES } from "./profiles";

/** Minimal .env loader (KEY=VALUE, ignores comments and blank lines). */
function loadEnv(): void {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    // No .env file — rely on the ambient environment.
  }
}

async function main(): Promise<void> {
  loadEnv();

  if (!process.env.MONGODB_URI) {
    console.error(
      "MONGODB_URI is not set. Copy .env.example to .env and set MONGODB_URI.",
    );
    process.exitCode = 1;
    return;
  }

  // Import after env is populated so lib/db/client sees MONGODB_URI.
  const { connectToDatabase } = await import("@/lib/db/client");
  const { Subject, Topic, AiProfile } = await import("@/lib/db/models");

  await connectToDatabase();
  console.log("Connected to MongoDB.");

  let subjectCount = 0;
  let topicCount = 0;

  for (let index = 0; index < SEED_SUBJECTS.length; index += 1) {
    const seed = SEED_SUBJECTS[index];
    const subject = await Subject.findOneAndUpdate(
      { slug: seed.slug },
      {
        $set: {
          name: seed.name,
          code: seed.code,
          color: seed.color,
          description: seed.description,
          order: index,
        },
        $setOnInsert: { slug: seed.slug },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    subjectCount += 1;

    for (let t = 0; t < seed.topics.length; t += 1) {
      const name = seed.topics[t];
      const slug = slugify(name);
      await Topic.updateOne(
        { subjectId: subject._id, slug },
        {
          $set: { name, order: t },
          $setOnInsert: { subjectId: subject._id, slug },
        },
        { upsert: true },
      );
      topicCount += 1;
    }
  }

  let profileCount = 0;
  for (const seed of SEED_PROFILES) {
    await AiProfile.updateOne(
      { slug: seed.slug },
      {
        $set: {
          name: seed.name,
          description: seed.description,
          systemPrompt: seed.systemPrompt,
          temperature: seed.temperature,
          isDefault: seed.isDefault,
        },
        $setOnInsert: { slug: seed.slug },
      },
      { upsert: true },
    );
    profileCount += 1;
  }

  // Guarantee exactly one default profile.
  const defaultProfile = await AiProfile.findOne({ isDefault: true }).lean();
  if (!defaultProfile) {
    await AiProfile.updateOne({ slug: "gate-mentor" }, { $set: { isDefault: true } });
  } else {
    await AiProfile.updateMany(
      { _id: { $ne: defaultProfile._id }, isDefault: true },
      { $set: { isDefault: false } },
    );
  }

  console.log(
    `Seed complete: ${subjectCount} subjects, ${topicCount} topics, ${profileCount} profiles.`,
  );

  const { default: mongoose } = await import("mongoose");
  await mongoose.disconnect();
}

main().catch((error: unknown) => {
  console.error("Seed failed:", error);
  process.exitCode = 1;
});
