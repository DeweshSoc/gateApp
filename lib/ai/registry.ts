import { connectToDatabase } from "@/lib/db/client";
import { AiProvider as AiProviderModel } from "@/lib/db/models";
import { decrypt } from "@/lib/crypto";
import {
  DEFAULT_AI_MODEL,
  DEFAULT_MAX_TOKENS,
  DEFAULT_TEMPERATURE,
} from "@/lib/constants";
import { OpenAICompatibleProvider } from "./openai-compatible";
import { AiProviderError, type AiProvider, type ProviderConfig } from "./provider";

/**
 * Build a provider adapter from stored config. Throws a descriptive error if
 * no active provider is configured and no environment fallback exists.
 */
export interface ResolvedProvider {
  provider: AiProvider;
  config: ProviderConfig;
  id: string | null;
  name: string;
}

export async function resolveProvider(providerId?: string): Promise<ResolvedProvider> {
  // 1. Explicit provider id.
  if (providerId) {
    await connectToDatabase();
    const doc = await AiProviderModel.findById(providerId).lean();
    if (doc) return fromDocument(doc);
  }

  // 2. Active provider from the database.
  try {
    await connectToDatabase();
    const active = await AiProviderModel.findOne({ isActive: true }).lean();
    if (active) return fromDocument(active);
  } catch {
    // Database may be unavailable; fall through to env fallback.
  }

  // 3. Environment fallback (documented in .env.example).
  const baseUrl = process.env.AI_BASE_URL;
  const apiKey = process.env.AI_API_KEY;
  if (baseUrl && apiKey) {
    const config: ProviderConfig = {
      baseUrl,
      apiKey,
      model: process.env.AI_MODEL?.trim() || DEFAULT_AI_MODEL,
      temperature: Number(process.env.AI_TEMPERATURE) || DEFAULT_TEMPERATURE,
      maxTokens: Number(process.env.AI_MAX_TOKENS) || DEFAULT_MAX_TOKENS,
    };
    return {
      provider: new OpenAICompatibleProvider(config),
      config,
      id: null,
      name: "Environment provider",
    };
  }

  throw new AiProviderError(
    "PROVIDER_NOT_CONFIGURED",
    "No AI provider configured. Add one in Settings or set AI_BASE_URL and AI_API_KEY.",
    503,
  );
}

interface ProviderLike {
  _id: unknown;
  name: string;
  baseUrl: string;
  apiKeyEncrypted: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

function fromDocument(doc: ProviderLike): ResolvedProvider {
  const config: ProviderConfig = {
    baseUrl: doc.baseUrl,
    apiKey: decrypt(doc.apiKeyEncrypted),
    model: doc.model,
    temperature: doc.temperature,
    maxTokens: doc.maxTokens,
  };

  return {
    provider: new OpenAICompatibleProvider(config),
    config,
    id: String(doc._id),
    name: doc.name,
  };
}
