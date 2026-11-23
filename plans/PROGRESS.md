# Build Progress — GATE 2027 AI

_Last updated: 2026-11-21T08:34 UTC_

This document is the resume point. Read `plans/architecture.md` first for the full
design, then this file for current build state.

---

## Environment verified

| Check | Result |
|---|---|
| Node.js | v24.18.0 |
| pnpm | 9.15.4 |
| git | 2.53.0 |
| Next.js | 15.5.29 (App Router, TS) |
| React | 19.3.1 |
| MongoDB | 7.0.45 at `/usr/bin/mongod` (mongosh present) |
| MongoDB service | Not running by default — see below |
| Typecheck | `pnpm exec tsc --noEmit` → exit 0 |

### How to start MongoDB when resuming
```bash
mkdir -p /home/dewesh/.local/share/gate-mongo
mongod --dbpath /home/dewesh/.local/share/gate-mongo --bind_ip 127.0.0.1 --port 27017 --fork --logpath /home/dewesh/.local/share/gate-mongo/mongod.log
```
Then verify: `mongosh --eval "db.runCommand({ping:1})"`

### Common commands
```bash
pnpm dev                    # dev server
pnpm exec tsc --noEmit      # typecheck
pnpm exec tsx seed/index.ts # seed subjects/topics/profiles (idempotent)
pnpm build                  # production build
```

---

## Confirmed product decisions

1. **Next.js (App Router) + TypeScript** — scaffolded manually for control.
2. **MongoDB** via **Mongoose** — single-user local app.
3. **Auth deferred to v2** — every schema carries an optional `userId`.
4. **Chat works with OpenAI-compatible APIs** — base URL + key + model configured in
   Settings; native `fetch`, no OpenAI SDK.
5. **Chat-only for v1. Document uploads / attachments deferred to v2.**
   All attachment code was removed on 2026-11-21 per user directive. Do not
   re-introduce `Document` model, upload routes, or `pdf-parse` without an explicit v2
   request.

---

## What is built and verified

### Foundation
- `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`,
  `tailwind.config.ts`, `.eslintrc`/eslint config, `.gitignore`, `.env.example`
- `app/globals.css` — CSS variable palette (neutral + restrained blue), light/dark
  tokens, KaTeX + highlight.js token theme
- `lib/utils.ts` (`cn`), `lib/constants.ts`
- `lib/crypto.ts` — AES-256-GCM, `v1:iv:tag:ciphertext` format
- `lib/api.ts` — shared `{ ok, data }` / `{ ok: false, error }` envelope + error handling
- `lib/validation/schemas.ts` — Zod schemas (no document/upload schema)

### Data layer
- `lib/db/client.ts` — Mongoose singleton with global HMR cache
- `lib/db/models/` — Subject, Topic, Conversation, Message, Note, AiProvider,
  AiProfile, Preference, Progress, StudySession, Pyq, PyqAttempt + `index.ts` barrel
- `types/index.ts` — DTOs incl. `SubjectWithTopics`, `ChatContextValue`

### AI layer
- `lib/ai/provider.ts` — provider interface + `AiProviderError`
- `lib/ai/openai-compatible.ts` — native-fetch streaming adapter (`ReadableStream`)
- `lib/ai/registry.ts` — resolves active provider, decrypts key
- `lib/ai/system-prompts.ts`, `lib/ai/context.ts` (rolling summary + important
  excerpts + recent history), `lib/ai/stream.ts`

### UI
- `components/ui/*` — button, input, textarea, label, card, badge, switch, tabs,
  dialog, dropdown-menu, select, separator, scroll-area, skeleton, empty-state
- Shell: `app/layout.tsx`, `app/(app)/layout.tsx`, sidebar, header, mobile drawer,
  theme toggle, page-shell
- Chat: welcome screen, message list, composer, markdown renderer (react-markdown +
  remark-gfm + remark-math + rehype-katex + rehype-highlight), message actions,
  **chat context bar** (subject / topic / profile pickers)
- Notes board, PYQ workspace (filters, attempt scoring, explanations, bookmarks),
  subjects grid, settings page

### API routes
- `POST /api/chat` — SSE streaming, conversation auto-create, assistant persistence,
  context (subject/topic) sync via `Conversation.updateOne`
- `/api/conversations`, `/api/conversations/[id]`, `/api/messages/[id]`
- `/api/subjects`, `/api/topics`, `/api/providers`, `/api/providers/[id]`,
  `/api/profiles`, `/api/preferences`, `/api/health`
- `/api/notes`, `/api/notes/[id]`, `/api/pyqs`, `/api/pyqs/[id]`,
  `/api/pyqs/attempts`, `/api/progress`
- `GET /api/search` — keyword search over **notes + messages** only (documents
  removed with the v2 deferral)

### Seed
- `seed/index.ts` (idempotent runner, manual `.env` load + dynamic imports),
  `seed/subjects.ts` (12 GATE CSE subjects + topics), `seed/profiles.ts`
  (4 AI behavior profiles)

---

## Verified end-to-end (before the attachment pivot, still valid)

- `GET /api/health` OK; seed ran; REST endpoints returned expected envelopes
- SSE chat round-trip via a mock OpenAI-compatible server: streamed chunks + `[DONE]`,
  conversation auto-created with derived title, assistant message persisted
  (`messageCount: 2`)
- Subject/topic/profile context flowed to `/api/chat` and persisted on the
  conversation (`subjectId`/`topicId` match confirmed)
- All mock-server and `/tmp` test artifacts cleaned up

---

## Attachment removal (completed 2026-11-21)

Removed in one pass; `tsc --noEmit` exit 0 afterwards:

| Removed | Where |
|---|---|
| `pdf-parse` dependency | `package.json` (`pnpm remove pdf-parse`) |
| `Document` model file | `lib/db/models/Document.ts` (deleted) |
| `DocumentModel`/`DocumentDoc` export | `lib/db/models/index.ts` |
| `attachments` field (kept `summary`) | `lib/db/models/Message.ts` |
| `DocumentStatus`, `DocumentDTO` | `types/index.ts` |
| `MAX_UPLOAD_BYTES`, `ALLOWED_UPLOAD_MIME_TYPES`, `DOCUMENT_STATUSES` | `lib/constants.ts` |
| `DocumentModel` import + document search block | `app/api/search/route.ts` |
| `experimental.serverActions.bodySizeLimit` | `next.config.ts` |
| `/storage/*` ignore rules + `storage/` dir | `.gitignore` |

`summary` fields on Message/Conversation remain — they are rolling-summary
context management, not attachments.

---

## Remaining work

### Next up (safe, non-attachment)
- **Phase 6**: Dashboard live stats — replace static `STATS` with real numbers from
  conversations/messages/notes/PYQ attempts/progress.
- **Phase 5 remainder**: Notes search UI (keyword search over notes + messages is
  already implemented server-side at `GET /api/search`).

### Phase 7
- `pnpm build` production check; responsive pass; streaming/persistence re-verify;
  final docs.

### Deferred to v2 (do not start)
- Document uploads: `Document` model, upload route, `pdf-parse`/OCR pipeline,
  file storage dir, attachment UI.
- Auth / multi-user.
- Optional vector search over notes.

---

## Notes / conventions to preserve

- Server-only secrets: never import crypto/AI modules into client components.
- All API routes: Zod-validate input, return the
  `{ ok: true, data }` / `{ ok: false, error: { code, message } }` envelope.
- `noUncheckedIndexedAccess`-friendly code; avoid `any`.
- Components modular under `components/<domain>/`.
- Detached background processes: `setsid nohup … &`. Do **not** use
  `pkill -f "next"` (it can match the invoking shell).
- Assigning a string id to a hydrated Mongoose `ObjectId` field fails typecheck —
  use `Model.updateOne({ _id }, { $set: { … } })` instead.
