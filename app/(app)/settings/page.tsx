"use client";

import * as React from "react";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { apiFetch } from "@/lib/api-client";
import type { AiProviderDTO, PreferenceDTO } from "@/types";

export default function SettingsPage() {
  const [provider, setProvider] = React.useState({
    name: "My Provider",
    baseUrl: "https://api.openai.com/v1",
    apiKey: "",
    model: "gpt-4o-mini",
  });
  const [preference, setPreference] = React.useState<PreferenceDTO | null>(null);
  const [customPrompt, setCustomPrompt] = React.useState("");
  const [savingProvider, setSavingProvider] = React.useState(false);
  const [savingPrefs, setSavingPrefs] = React.useState(false);

  React.useEffect(() => {
    apiFetch<PreferenceDTO>("/api/preferences")
      .then((data) => {
        setPreference(data);
        setCustomPrompt(data.customSystemPrompt ?? "");
      })
      .catch(() => {
        // Preferences may not exist yet; defaults are shown.
      });
    apiFetch<AiProviderDTO[]>("/api/providers")
      .then((providers) => {
        const active = providers.find((p) => p.isActive) ?? providers[0];
        if (active) {
          setProvider({
            name: active.name,
            baseUrl: active.baseUrl,
            apiKey: "",
            model: active.model,
          });
        }
      })
      .catch(() => {
        // No providers configured yet.
      });
  }, []);

  const saveProvider = async () => {
    if (!provider.apiKey.trim()) {
      toast.error("Enter an API key to save the provider.");
      return;
    }
    setSavingProvider(true);
    try {
      await apiFetch<AiProviderDTO>("/api/providers", {
        method: "POST",
        body: JSON.stringify({
          name: provider.name,
          baseUrl: provider.baseUrl,
          apiKey: provider.apiKey,
          model: provider.model,
          isActive: true,
        }),
      });
      setProvider((p) => ({ ...p, apiKey: "" }));
      toast.success("Provider saved and activated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save provider.");
    } finally {
      setSavingProvider(false);
    }
  };

  const savePreferences = async () => {
    setSavingPrefs(true);
    try {
      const updated = await apiFetch<PreferenceDTO>("/api/preferences", {
        method: "PATCH",
        body: JSON.stringify({
          customSystemPrompt: customPrompt.trim() || null,
          streamingEnabled: preference?.streamingEnabled ?? true,
          responseStyle: preference?.responseStyle ?? "balanced",
          contextWindow: preference?.contextWindow ?? 12,
        }),
      });
      setPreference(updated);
      toast.success("Preferences saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save preferences.");
    } finally {
      setSavingPrefs(false);
    }
  };

  return (
    <PageShell
      title="Settings"
      description="Configure your AI provider and personalize how GATE Mentor responds."
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>AI Provider</CardTitle>
            <CardDescription>
              Any OpenAI-compatible endpoint works — OpenAI, DeepSeek, OpenRouter, Groq,
              Together, Ollama, or LM Studio. Your key is encrypted at rest.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="provider-name">Name</Label>
                <Input
                  id="provider-name"
                  value={provider.name}
                  onChange={(e) => setProvider((p) => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="provider-model">Model</Label>
                <Input
                  id="provider-model"
                  value={provider.model}
                  onChange={(e) => setProvider((p) => ({ ...p, model: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="provider-base-url">Base URL</Label>
              <Input
                id="provider-base-url"
                value={provider.baseUrl}
                onChange={(e) => setProvider((p) => ({ ...p, baseUrl: e.target.value }))}
                placeholder="https://api.openai.com/v1"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="provider-key">API key</Label>
              <Input
                id="provider-key"
                type="password"
                value={provider.apiKey}
                onChange={(e) => setProvider((p) => ({ ...p, apiKey: e.target.value }))}
                placeholder="sk-…"
                autoComplete="off"
              />
            </div>
            <Button onClick={saveProvider} disabled={savingProvider}>
              <Save className="h-4 w-4" />
              {savingProvider ? "Saving…" : "Save provider"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Behavior</CardTitle>
            <CardDescription>
              Personalize the system prompt and response style.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="custom-prompt">Additional system instructions</Label>
              <Textarea
                id="custom-prompt"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="e.g. Prefer short answers, use C++ for code, emphasize time complexity."
                rows={4}
              />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="text-sm font-medium">Streaming responses</p>
                <p className="text-xs text-muted-foreground">
                  Stream tokens as they are generated.
                </p>
              </div>
              <Switch
                checked={preference?.streamingEnabled ?? true}
                onCheckedChange={(checked) =>
                  setPreference((p) =>
                    p ? { ...p, streamingEnabled: checked } : p,
                  )
                }
              />
            </div>
            <Button onClick={savePreferences} disabled={savingPrefs}>
              <Save className="h-4 w-4" />
              {savingPrefs ? "Saving…" : "Save preferences"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
