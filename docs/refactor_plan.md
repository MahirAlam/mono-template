# Refactor Plan: Universal Content Creation + Universal Feed

This plan outlines the high-level architecture and step-by-step approach for turning the `post` subsystem into two reusable, production-grade modules.

## Goals

- Consolidate content creation into a single, configurable module (create, edit, share, comment, reply) to prevent duplication.
- Build a single universal feed component that can render any feed context and supports robust infinite loading, virtualization, optimistic updates, and error handling.
- Provide typed, auditable query key helpers for safe optimistic updates.

---

## Strategy: Universal Content Creation Module

1. Design contract and API
   - Public components:
     - `ContentEditor`: lightweight, generic editor (TipTap) that accepts props for `contentType`, `initialContent`, `onSubmit`, `onCancel`, `maxMedia`, `placeholder` and `renderAttachmentPreview`.
     - `ContentEditorModal`: modal wrapper that handles showing/hiding and keeps a minimal dependency on UI system.
   - Hooks:
     - `useCreateContent`: generic hook to call a tRPC endpoint and manage optimistic UI via `queryClient`.
     - `useContentEditorStore`: provides the UI state for the editor, independent of content type.
   - Store will manage: staged media, upload progress, draft save, submission state (idle, uploading, saving, error), and an `optimisticId` generator.

2. Migrations
   - Add `contentEditorStore$` to replace `postEditorStore$` gradually.
   - `postEditorStore$` will be a small compatibility wrapper that sets `contentType: 'post'` (temporary).
   - Replace `PostEditorModal` with `ContentEditorModal` that accepts config for `contentType`.

3. Server-side
   - Keep server `post.add` but make server operable with `contentType` extension (future migration). Keep idempotency via `optimisticId`.

4. UX Focus
   - Provide optimistic preview UI (created in client before server returns). Allow edit before server publishes.
   - Expose hooks to transfer reactions/likes when optimistic ID replaced with real ID.

---

## Strategy: Universal Feed Module

1. Design
   - Single component `UniversalFeed` accepts props:
     - `type`: 'home' | 'profile' | 'reacts' | 'bookmarks' | 'hashtag' | 'search'
     - `queryInput`: any (optional) - control param for feed filtering
     - `renderItem`: function that renders a feed item (accepts RankedPost|generic)
     - `emptyState`: ReactNode or message
     - `pageSize`: number (default: config PAGE_SIZE)
     - `virtualize`: boolean (default true)
   - Behavior:
     - Uses `trpc.post.getFeed.useInfiniteQuery` for paging
     - Show skeleton loaders for initial load and `load more` states
     - Use `@tanstack/react-virtual` for virtualization
     - Works with optimistic update flows — uses typed query keys and `getQueryKey` helpers to update caches

2. API
   - Internally chooses tRPC endpoint based on `type` (e.g., 'profile' uses `post.getFeed`) or other future APIs; for `hashtag`, use `hashtag.getPosts` if available; otherwise fallback.
   - Will support explicit `getItemKey` and `getItemId` for generic arrays of content.

3. Integration
   - `ContentEditor` will call `useCreateContent` which will patch feed caches via typed query keys from `lib/query-keys` (existing).
   - `UniversalFeed` will be resilient to a missing `optimisticId` by ignoring items that start with `temp-` or by detecting the `optimisticId` field and replacing it when the real post arrives.

---

## UI/UX Audit & Prioritized Fixes

This audit focuses on the user-facing components tied to posting and feeds.

1. Priority A (blocking or severe UX)
   - Offline post: currently the user can get a confusing upload error if offline — add clear inline guidance and an explicit "Retry when online" action.
   - Duplicate submissions: guard multiple submit clicks.
   - Upload progress: toast-based progress is okay but not accessible; also add inline progress within the editor.

2. Priority B (improve delight & usability)
   - TipTap toolbar: reposition actions for small screens, collapse rarely-used actions into a menu.
   - Media re-ordering UX: use animated drag handles and provide a clearer affordance.
   - Attachments: show thumbnails with aspect ratio constraints and more consistent spacing.

3. Priority C (polish)
   - Consistent spacing & alignment: normalize paddings across editor parts.
   - Accessibility: ensure labels, keyboard navigation, and focus states are present.

---

## Deliverables

1. `apps/nextjs/src/components/content/ContentEditor.tsx` (generic)
2. `apps/nextjs/src/components/content/ContentEditorModal.tsx` (modal wrapper)
3. `apps/nextjs/src/components/feed/UniversalFeed.tsx` (universal feed)
4. `apps/nextjs/src/stores/content-editor-store.tsx` (shared store)
5. `apps/nextjs/src/hooks/useCreateContent.ts` (optimistic & idempotent create)
6. `apps/nextjs/src/lib/query-keys.ts` (typed query keys) — already added
7. Plan, documentation, and UX audit (this file)

---

## Rollout Strategy

- Phase 1: Implement modules and tests (e2e), keep old code paths intact but marked deprecated.
- Phase 2: Replace `PostEditor` usage with `ContentEditor` for posts; gradually migrate other content types.
- Phase 3: Harden server and edge-cases (idempotency, retries, monitoring) and finalize e2e.

If you approve this plan, I'll implement the core code and wire it into the front end with minimal disruption and full backward compatibility.
