# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install deps + generate Prisma client + run migrations
npm run setup

# Dev server (must be run via bash, not cmd)
export PATH="/c/Program Files/nodejs:$PATH"
NODE_OPTIONS='--require ./node-compat.cjs' npx next dev --turbopack

# Build
NODE_OPTIONS='--require ./node-compat.cjs' npx next build

# Run all tests
npm test

# Run a single test file
npx vitest run src/components/chat/__tests__/ChatInterface.test.tsx

# Reset database
npm run db:reset
```

> **Note:** `npm run dev` fails on Windows because the script uses Unix env var syntax. Run the dev command directly via bash as shown above.

## Environment Variables

- `ANTHROPIC_API_KEY` — Claude API key. If absent, a mock provider is used (returns static components).
- `JWT_SECRET` — Session signing key. Defaults to `"development-secret-key"` if unset.

## Architecture Overview

UIGen is a full-stack AI-powered React component generator. Users chat with Claude to generate, edit, and preview React components live in the browser.

### Key Concepts

**Virtual File System (`src/lib/VirtualFileSystem.ts`)**
All generated code lives in an in-memory `VirtualFileSystem` — nothing is written to disk. It's serialized as JSON and stored in the `Project.data` column (SQLite). The AI operates on it via tool calls.

**AI Tool Calls (`src/lib/tools/`)**
The `/api/chat` route uses `streamText` (Vercel AI SDK) with two tools:
- `str_replace_editor` — view, create, str_replace, insert on virtual files
- `file_manager` — rename and delete virtual files

**JSX Transformation Pipeline (`src/lib/transform/`)**
Babel Standalone transforms JSX → JS in the browser. Components are rendered inside an `<iframe>` using an import map that resolves packages from esm.sh CDN. This is what powers the live preview.

**State Management**
Two React contexts drive the UI:
- `FileSystemContext` (`src/lib/contexts/FileSystemContext.tsx`) — virtual FS, active file, file ops
- `ChatContext` (`src/lib/contexts/ChatContext.tsx`) — messages, streaming state, chat submission

### Request Lifecycle

1. User sends a message → `ChatContext` POSTs to `/api/chat` with current files + message history
2. Claude streams back text + tool calls → tools mutate the `VirtualFileSystem`
3. `FileSystemContext` reflects changes → `PreviewFrame` re-transforms and re-renders
4. If authenticated, messages + FS state are persisted to the DB after the stream completes

### Auth

JWT-based (HS256, 7-day expiry), stored as an HttpOnly cookie. Server actions (`src/actions/index.ts`) handle sign-up/sign-in with bcrypt. Anonymous users can generate components but cannot save projects — their work is flagged in `localStorage` via `hasAnonWork`.

### Database

Prisma + SQLite (`prisma/dev.db`). Always reference `prisma/schema.prisma` to understand data structures. Two models: `User` and `Project`. `Project.messages` and `Project.data` are JSON strings (serialized in application code, not by Prisma).

### `node-compat.cjs`

Strips `localStorage`/`sessionStorage` globals at startup to prevent SSR crashes on Node 25+, where these globals exist but are non-functional. Required via `NODE_OPTIONS`.

### Mock Provider

When `ANTHROPIC_API_KEY` is not set, a mock language model simulates a 4-step generation and returns a static component (Counter, Form, or Card). Useful for UI development without API costs.

## Code Style

Use comments sparingly — only for complex logic that isn't self-evident.

## Testing

Tests use Vitest + jsdom + React Testing Library. Test files live alongside source in `__tests__/` subdirectories. Coverage areas: chat components, file tree, contexts, JSX transformer.
