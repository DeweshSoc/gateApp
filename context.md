# GATE 2027 AI — Project Context (Source of Truth)

> **Purpose:** This file is the single source of truth for the codebase and the app.
> It consolidates [`plans/architecture.md`](plans/architecture.md) (design) and
> [`plans/PROGRESS.md`](plans/PROGRESS.md) (build state) with the **verified actual
> code**. Read this before any code, plan, or review work. Where this file and the
> `plans/` docs disagree, trust this file — it reflects what is actually implemented.
>
> _Last verified against code: 2026-11-23._

---

## 1. What the app is

A production-quality, **single-user (local)** web application: a personalized
**GATE 2027 CSE** research and learning companion. The UX is modeled on
ChatGPT/DeepSeek, but every layer is purpose-built for GATE preparation.

Core capabilities (v1): AI chat with streaming, subjects/topics syllabus,
AI behavior profiles, notes, PYQ (previous year questions) workspace, and a
progress-tracking foundation.

---

## 2. Tech stack (verified)

| Concern | Choice |
|---|---|
| Framework | Next.js **15** (App Router, TypeScript), `reactStrictMode: true` |
| UI | React **19**, Tailwind CSS **3**, shadcn/ui-style primitives (Radix UI), Lucide icons |
| Markdown/Math/Code | `react-markdown` + `remark-gfm` + `remark-math` + `rehype-katex` + **`rehype-highlight`** (highlight.js — *not* Shiki/`rehype-pretty-code`, which the plan doc mentions but is not installed) |
| Database | MongoDB **7** via **Mongoose 8** (single-user local; no auth) |
| State (client) | Zustand (single store: [`store/chat.ts`](store/chat.ts)) |
| Validation | Zod |
| Toasts | `sonner` |
| Package manager | **pnpm** (9.x; `packageManager` pinned to `pnpm@9.15.4`) |
| AI integration | Native `fetch` + streaming `ReadableStream` (no OpenAI SDK) |

**Dependencies of note:** `katex`, `next-themes`, `date-fns`, `class-variance-authority`,
`clsx`, `tailwind-merge`, `tsx` (dev, for seed). `pdf-parse` was **removed** (see §10).

---

## 3. Architecture at a glance

```
Browser (React client)
  ├── App Router pages (app/)
  ├── Zustand store (store/chat.ts)
  └── API Routes (app/api/*) ── Next.js route handlers
        ├── Zod validation (lib/validation/schemas.ts)
        ├── Service/helper layer (lib/server/*)
        ├── MongoDB via Mongoose (lib/db/*)
        ├── AI provider adapter (lib/ai/*) ── OpenAI-compatible endpoint
        └── AES-256-GCM key encryption (lib/crypto.ts)
```

**Key principles**
- **Server-only AI**: API keys never reach the browser. Chat and provider config are
  all server-side; crypto/AI modules must never be imported into client components.
- **Provider abstraction**: one `AiProvider` interface + `OpenAICompatibleProvider`
  implementation, selected by a registry. Adding a provider = new adapter file only.
- **Context management**: active context = system prompt + recent N messages +
  rolling summary + flagged important excerpts; never sends full history blindly.
- **No fabricated data**: PYQ workspace and syllabus seed contain only
  verified/manually entered data.

---

## 4. Directory structure (actual, verified)

```
GATE_APP/
├── app/
│   ├── layout.tsx                 # root layout, fonts, KaTeX CSS, providers
│   ├── page.tsx                   # redirect → /chat
│   ├── globals.css                # CSS variable palette + light/dark tokens
│   ├── (app)/
│   │   ├── layout.tsx             # app shell: Sidebar + MobileDrawer + main
│   │   ├── chat/page.tsx          # new chat / welcome
│   │   ├── chat/[id]/page.tsx     # conversation view
│   │   ├── dashboard/page.tsx     # static stats (Phase 6 pending)
│   │   ├── notes/page.tsx
│   │   ├── pyq/page.tsx
│   │   ├── subjects/page.tsx
│   │   └── settings/page.tsx
│   └── api/                       # all routes — see §7 for full list
├── components/
│   ├── ui/                        # shadcn-style primitives (13 files)
│   ├── layout/                    # sidebar, header, mobile drawer, page-shell, theme-toggle, logo, conversation-list, sidebar-nav
│   ├── chat/                      # chat-view, message-list, composer, message-actions, welcome-screen, chat-context-bar
│   ├── markdown/                  # markdown-renderer, code-block
│   ├── notes/                     # notes-board
│   ├── pyq/                       # pyq-workspace
│   ├── subjects/                  # subjects-grid
│   └── providers/                 # app-providers, theme-provider
├── lib/
│   ├── db/client.ts               # Mongoose singleton (HMR-safe)
│   ├── db/models/                 # 11 models + index.ts barrel
│   ├── ai/                        # provider, openai-compatible, registry, context, stream, system-prompts
│   ├── server/                    # server data loaders: conversations, subjects, profiles, pyqs
│   ├── validation/schemas.ts      # Zod schemas
│   ├── api.ts                     # SERVER response helpers: ok/fail/handleError/readJson
│   ├── api-client.ts              # CLIENT typed fetch wrapper: apiFetch + dedup/2s cache/invalidateApiCache + jsonBody
│   ├── crypto.ts                  # AES-256-GCM encrypt/decrypt/maskKey
│   ├── serialize.ts               # Mongoose doc → DTO mappers
│   ├── utils.ts                   # cn, dates, truncate, deriveTitle, slugify, errorMessage
│   └── constants.ts               # enums + app constants
├── store/chat.ts                  # Zustand conversation store
├── seed/                          # index.ts, subjects.ts, profiles.ts (idempotent)
├── types/index.ts                 # shared DTO/transport types
├── storage/.gitkeep               # empty placeholder (uploads deferred to v2)
├── plans/                         # architecture.md + PROGRESS.md (older docs)
└── config: package.json, tsconfig.json, next.config.ts, tailwind.config.ts,
    postcss.config.mjs, .env.example, .gitignore, pnpm-lock.yaml
```

**Deviations from `plans/architecture.md`:** the `lib/documents/`, `lib/search/`,
`components/settings/` directories and `documents/*` routes do **not** exist (v2-deferred
or consolidated). `lib/api-client.ts`, `lib/serialize.ts`, and `lib/server/` exist but
are not in the plan doc. Markdown code highlighting uses `rehype-highlight`, not Shiki.

---

## 5. Data model (MongoDB collections)

Every document carries an optional `userId` (defaults `null`) to future-proof v2
multi-user. All schemas use `timestamps: true`.

| Collection | Fields (beyond `userId`, `createdAt`, `updatedAt`) | Indexes / notes |
|---|---|---|
| `subjects` | `slug` (unique), `name`, `code`, `color` (#3b82f6), `description`, `order` | `slug` unique |
| `topics` | `subjectId` (ref Subject), `name`, `slug`, `order` | unique `(subjectId, slug)` |
| `conversations` | `title`, `subjectId?`, `topicId?`, `isPinned`, `isArchived`, `summary`, `importantExcerpts[]`, `messageCount`, `lastMessageAt` | index `(isArchived, lastMessageAt)` |
| `messages` | `conversationId` (ref), `role` (`user`\|`assistant`\|`system`), `content`, `summary?`, `isImportant`, `tokenCount` | index `(conversationId, createdAt)`; **text index on `content`**; **no attachments** |
| `notes` | `title`, `content`, `subjectId?`, `topicId?`, `tags[]`, `importance` (`low`\|`medium`\|`high`), `isFavorite`, `sourceMessageId?` | text index on title/content/tags |
| `aiproviders` | `name`, `baseUrl`, `apiKeyEncrypted`, `model`, `temperature`, `maxTokens`, `isActive` | key encrypted at rest |
| `aiprofiles` | `name`, `slug` (unique), `description`, `systemPrompt`, `temperature`, `isDefault` | `slug` unique |
| `preferences` | `theme`, `defaultSubjectId?`, `defaultProfileId?`, `customSystemPrompt?`, `responseStyle`, `streamingEnabled`, `contextWindow` | **singleton**: `userId` unique, default `"singleton"` |
| `progress` | `subjectId?`, `topicId?`, `status` (`not-started`\|`in-progress`\|`completed`\|`to-revise`), `note?` | index `(subjectId, topicId)` |
| `studysessions` | `date`, `subjectId?`, `durationMinutes` | index on `date` |
| `pyqs` | `subjectId?`, `topicId?`, `year`, `question`, `options[]` (`text`,`isCorrect`), `explanation`, `source`, `isVerified`, `difficulty` (`easy`\|`medium`\|`hard`), `isBookmarked` | index `(year, subjectId)` |
| `pyqattempts` | `pyqId` (ref), `selectedOption`, `isCorrect`, `attemptedAt` | — |

**Constants** ([`lib/constants.ts`](lib/constants.ts)): `APP_NAME="GATE 2027 AI"`,
`DEFAULT_CONTEXT_WINDOW=12`, `DEFAULT_AI_MODEL="gpt-4o-mini"`, `DEFAULT_TEMPERATURE=0.4`,
`DEFAULT_MAX_TOKENS=2048`, `MESSAGE_ROLES`, `PROGRESS_STATUSES`, `DIFFICULTIES`,
`RESPONSE_STYLES`, `IMPORTANCE_LEVELS`, `NAV_ITEMS` (6 sidebar entries).

---

## 6. AI layer

- **Interface** ([`lib/ai/provider.ts`](lib/ai/provider.ts)): `AiProvider` with
  `chatStream(messages, options) → ReadableStream<Uint8Array>` and
  `chat(...) → Promise<string>`. `ChatOptions` = `{ model, temperature?, maxTokens?, signal? }`.
- **Adapter** ([`lib/ai/openai-compatible.ts`](lib/ai/openai-compatible.ts)): native
  `fetch` to `{baseUrl}/chat/completions`, parses `data:` SSE lines, forwards
  `delta.content` chunks, ends on `[DONE]`.
- **Registry** ([`lib/ai/registry.ts`](lib/ai/registry.ts)): `resolveProvider(providerId?)`
  resolves in order: (1) explicit `providerId`, (2) active provider in DB, (3) env
  fallback (`AI_BASE_URL` + `AI_API_KEY`), else throws `PROVIDER_NOT_CONFIGURED`.
- **System prompt** ([`lib/ai/system-prompts.ts`](lib/ai/system-prompts.ts)):
  `composeSystemPrompt({ profilePrompt, customPrompt, responseStyle })` = profile prompt
  (or `DEFAULT_SYSTEM_PROMPT`) + custom instructions + response-style hint.
- **Context builder** ([`lib/ai/context.ts`](lib/ai/context.ts)):
  `buildActiveContext()` = system prompt → important (flagged) messages → rolling summary
  → last N messages (deduped, chronological). Selection is a **linear two-pass** algorithm
  (an index `Set` marks important + recent-window entries, then one pass builds the
  deduped, chronological list — no O(n²) `includes` scans). `estimateTokens()` ≈ `ceil(len/4)`.
- **Streaming** ([`lib/ai/stream.ts`](lib/ai/stream.ts)): `toSSEStream()` frames text
  chunks as `data: {json}\n\n` with a final `data: [DONE]`; `SSE_HEADERS` exported.
  Deltas are **batched** (default 24 ms flush) to reduce per-token frame overhead.

### Error model
`AiProviderError(code, message, status?, retryAfter?)` with codes: `TIMEOUT` (504),
`NETWORK_ERROR`, `INVALID_API_KEY` (401), `RATE_LIMITED` (429, `Retry-After` honored),
`MODEL_NOT_FOUND` (404), `PROVIDER_ERROR` (502), `EMPTY_STREAM`,
`PROVIDER_STREAM_ERROR`, `PROVIDER_NOT_CONFIGURED` (503).

---

## 7. API surface (verified)

**Envelope (every non-SSE route):** `{ ok: true, data }` on success, or
`{ ok: false, error: { code, message } }` on failure. Built by [`lib/api.ts`](lib/api.ts).

All routes set `export const runtime = "nodejs"` and `dynamic = "force-dynamic"`.

| Route | Methods | Notes |
|---|---|---|
| `/api/chat` | POST | **SSE streaming**; auto-creates conversation; persists assistant message; sets `x-conversation-id` response header |
| `/api/conversations` | GET, POST | GET: non-archived, pinned-first, limit 200 |
| `/api/conversations/[id]` | GET, PATCH, DELETE | DELETE cascades to messages |
| `/api/messages/[id]` | PATCH, DELETE | PATCH: `isImportant` / `content` |
| `/api/notes` | GET, POST | GET filters `?favorite=true` / `?subjectId=` |
| `/api/notes/[id]` | PATCH, DELETE | — |
| `/api/pyqs` | GET, POST | GET filters `?subjectId=` / `?year=` |
| `/api/pyqs/[id]` | PATCH, DELETE | PATCH toggles `isBookmarked` |
| `/api/pyqs/attempts` | POST | scores attempt, returns `{ isCorrect, correctOption, explanation }` |
| `/api/providers` | GET, POST | POST enforces single active provider |
| `/api/providers/[id]` | PATCH, DELETE | PATCH re-encrypts key if provided |
| `/api/profiles` | GET, POST | POST slugifies name if no slug |
| `/api/preferences` | GET, PATCH | singleton upsert on `userId:"singleton"` |
| `/api/progress` | GET, POST | POST upserts by subjectId or topicId |
| `/api/subjects` | GET | sorted by order/name |
| `/api/topics` | GET | filter `?subjectId=` |
| `/api/search` | GET | MongoDB `$text` search over **notes + messages**, `textScore`-ranked |
| `/api/health` | GET | DB connectivity + timestamp |

### Chat request flow (POST `/api/chat`)
1. Validate via `chatRequestSchema` (`conversationId?`, `message`, `providerId?`,
   `profileId?`, `subjectId?`, `topicId?`, `stream?`).
2. Load or create the conversation; if context changes, sync `subjectId`/`topicId` via
   `Conversation.updateOne` (never assign string ids to hydrated `ObjectId` fields).
3. Persist the user message (with `estimateTokens`).
4. Resolve system prompt: profile (`input.profileId` → `preference.defaultProfileId`) +
   `preference.customSystemPrompt` + subject context + response style.
5. `buildActiveContext()` over history + rolling summary + `preference.contextWindow`.
6. `resolveProvider()` → `chatStream()`; `tee()` the stream into client branch +
   persistence branch (`persistAssistantMessage`, non-fatal on failure).
7. Return `toSSEStream(clientStream)` with `SSE_HEADERS` + `x-conversation-id`.

---

## 8. Client behavior

- **State:** [`store/chat.ts`](store/chat.ts) holds `conversations`, sidebar open flag,
  loading flag, and upsert/remove helpers. All other state is local `useState`/`useRef`
  in components.
- **Chat** ([`components/chat/chat-view.tsx`](components/chat/chat-view.tsx)): optimistic
  user message → `fetch("/api/chat")` → reads SSE frames → accumulates `streamingContent`
  → appends assistant message on completion. First message in a new chat navigates to
  `/chat/{id}` using the `x-conversation-id` header. Supports abort (stop) and preserves
  partial output on error/abort. After creating a chat it re-reads
  `GET /api/conversations/{id}` and **unwraps `.conversation`** (the route returns
  `{ conversation, messages }`), then invalidates the `/api/conversations` cache — this
  fixed the `/chat/undefined` 404 regression (see §10).
- **Message list** ([`components/chat/message-list.tsx`](components/chat/message-list.tsx)):
  message rows are `React.memo`-ized and the streaming bubble re-parses Markdown on a
  ~100 ms throttle, so a token flood does not trigger full-list re-renders or
  per-token Markdown/KaTeX/highlight work.
- **Conversation list** ([`components/layout/conversation-list.tsx`](components/layout/conversation-list.tsx)):
  dropdown menus are lazily mounted on hover/focus; create/delete/pin/rename mutations
  invalidate the `/api/conversations` client cache.
- **PYQ workspace** ([`components/pyq/pyq-workspace.tsx`](components/pyq/pyq-workspace.tsx)):
  progressively renders a window of questions via `IntersectionObserver` (page size 30).
- **Client API wrapper** ([`lib/api-client.ts`](lib/api-client.ts)): `apiFetch` dedupes
  in-flight GETs and caches results for 2 s (bypassable via `{ noCache: true }` / `ttl`);
  `invalidateApiCache(prefix?)` clears matching entries.
- **Context bar** ([`components/chat/chat-context-bar.tsx`](components/chat/chat-context-bar.tsx)):
  optional subject / topic / profile pickers (pills). Topic list is filtered by selected
  subject. Radix Select uses `"__none__"` sentinel (empty string values are forbidden).
- **Providers** ([`components/providers/app-providers.tsx`](components/providers/app-providers.tsx)):
  `ThemeProvider` (next-themes) + `Toaster` (sonner).
- **Theme**: light/dark/system; tokens in [`app/globals.css`](app/globals.css).

---

## 9. Environment variables (`.env.example`)

| Var | Required | Purpose |
|---|---|---|
| `MONGODB_URI` | yes | e.g. `mongodb://127.0.0.1:27017/gate2027ai` |
| `ENCRYPTION_KEY` | yes | 32-byte key as 64 hex chars for AES-256-GCM |
| `AI_BASE_URL` | optional | env fallback provider base URL |
| `AI_API_KEY` | optional | env fallback provider key |
| `AI_MODEL` | optional | default `gpt-4o-mini` |
| `AI_TEMPERATURE` | optional | default `0.4` |
| `AI_MAX_TOKENS` | optional | default `2048` |

`ENCRYPTION_KEY` handling ([`lib/crypto.ts`](lib/crypto.ts)): a 64-hex value is used
directly; otherwise the string is derived via `scryptSync(raw, "gate-2027-ai-static-salt", 32)`.
Ciphertext format: `v1:<ivHex>:<authTagHex>:<ciphertextHex>`.

---

## 10. Current build state (from `plans/PROGRESS.md`, still accurate)

- **Built & verified:** foundation, data layer, AI layer, full UI shell, chat with SSE,
  notes board, PYQ workspace, subjects grid, settings, seed. `tsc --noEmit` exits 0.
  `pnpm build` passes (see performance note below).
- **Attachment removal (2026-11-21):** chat-only v1. `pdf-parse`, `Document` model,
  upload routes, `storage/` handling, and upload constants were removed. `summary` fields
  on Message/Conversation remain (they are rolling-summary context, not attachments).

- **Performance audit & fixes (2026-11-23, all applied + typechecked):**
  - `buildActiveContext()` made linear (was O(n²)).
  - Chat route limits history fetch to context window + important messages, and
    parallelizes DB reads.
  - Message rows memoized; streaming bubble throttled; scroll no longer fires per token.
  - `rehype-highlight` `detect: false` (skips per-block auto-detection).
  - Server loaders (`subjects`, `profiles`, `pyqs`) wrapped in React `cache()`.
  - Search switched from regex to MongoDB `$text` (added text index on `Message.content`).
  - SSE deltas batched server-side.
  - `apiFetch` gained in-flight dedup + 2 s TTL cache + `invalidateApiCache`.
  - PYQ list progressively rendered; conversation dropdowns lazily mounted.
  - `handleToggleImportant` memoized to preserve row memoization.

- **Bug fix (2026-11-23): `/chat/undefined` 404.** Root cause: after creating a chat,
  `ChatView` typed `GET /api/conversations/{id}` as a bare `ConversationDTO` but the
  route returns `{ conversation, messages }`, so `created.id` was `undefined` and a
  phantom store row rendered `/chat/undefined`. Fixed by unwrapping `.conversation` and
  guarding `upsertConversation`/`setConversations` against missing `id`. `tsc --noEmit`
  exits 0.

- **Initial-load investigation (2026-11-23):** warm `GET /chat` renders in **~65 ms**
  (loaders ~27 ms query on local MongoDB; `loadSubjectsWithTopics` + `loadProfiles`
  shared via `cache()`). The observed ~7 s first-hit is `next dev` compilation of the
  ~1998-module Markdown/KaTeX/highlight.js graph, not app logic. Production build ships
  `/chat` at **347 kB First Load JS** (vs 102 kB shared) — the markdown+math+highlight
  graph is statically imported by `ChatView`. KaTeX CSS (~24 kB) is also in the root
  layout and thus on every route. **Known optimization (not yet applied):** lazy-load
  `MarkdownRenderer` via `next/dynamic`, trim `rehype-highlight` to an explicit language
  subset, and scope `katex.min.css` to chat/PYQ routes.
- **Deferred to v2 (do not start without explicit request):**
  - Document uploads (`Document` model, upload route, `pdf-parse`/OCR, file storage, UI).
  - Auth / multi-user.
  - Optional vector search over notes.
- **Remaining work:**
  - **Phase 6** — Dashboard live stats (currently a static `STATS` array in
    [`app/(app)/dashboard/page.tsx`](app/(app)/dashboard/page.tsx)).
  - **Phase 5 remainder** — Notes search UI (server-side `GET /api/search` is done;
    search covers **notes + messages** only).
  - **Phase 7** — `pnpm build` production check, responsive pass, streaming/persistence
    re-verify, final docs.

---

## 11. Commands & operations

```bash
pnpm dev                     # dev server
pnpm exec tsc --noEmit       # typecheck (also: pnpm typecheck)
pnpm exec tsx seed/index.ts  # seed subjects/topics/profiles (idempotent; also: pnpm seed)
pnpm build                   # production build
pnpm start                   # production server
pnpm lint                    # next lint
```

**Start MongoDB when resuming:**
```bash
mkdir -p /home/dewesh/.local/share/gate-mongo
mongod --dbpath /home/dewesh/.local/share/gate-mongo --bind_ip 127.0.0.1 --port 27017 --fork --logpath /home/dewesh/.local/share/gate-mongo/mongod.log
mongosh --eval "db.runCommand({ping:1})"   # verify
```

---

## 12. Conventions to preserve

- **Server-only secrets**: never import `lib/crypto`, `lib/ai/*`, or `lib/db/*` into
  client components (`"use client"` files).
- **API envelope**: always return `{ ok, data }` / `{ ok: false, error: { code, message } }`.
  Zod errors → `VALIDATION_ERROR` (422). Use `ok`/`fail`/`handleError` from [`lib/api.ts`](lib/api.ts).
- **Validation**: all mutating routes Zod-validate input via [`lib/validation/schemas.ts`](lib/validation/schemas.ts).
- **Type safety**: `noUncheckedIndexedAccess`-friendly; avoid `any`. Object ids are
  24-hex strings validated by an `objectId` Zod helper.
- **Mongoose ids**: assigning a string id to a hydrated `ObjectId` field fails typecheck —
  use `Model.updateOne({ _id }, { $set: { … } })` instead.
- **Components**: modular under `components/<domain>/`; primitives under `components/ui/`.
- **Processes**: detached background processes use `setsid nohup … &`; do **not** use
  `pkill -f "next"` (can match the invoking shell).
