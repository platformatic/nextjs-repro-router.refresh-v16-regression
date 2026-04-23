# `router.refresh()` eagerly refetches every in-viewport `<Link>` in Next.js 16

This is a minimal reproduction for a regression in Next.js 16 that hits any
app that combines three things:

1. A server-side `updateTag()` / `revalidateTag()` call (e.g. from a CMS
   webhook or a Server Action).
2. A push channel (Server-Sent Events, WebSocket, `BroadcastChannel`, etc.)
   that notifies every connected browser that content changed.
3. A client that responds to that notification by calling `router.refresh()`
   so the page streams in the fresh content without losing scroll position or
   client component state.

On **Next.js 15** this pattern is well-behaved: `router.refresh()` marks
prefetched `<Link>`s as stale but **does not refetch them** until the user
signals intent (hover / touch) or the link leaves and re-enters the viewport.

On **Next.js 16** `router.refresh()` now **eagerly** refetches every
prefetched `<Link>` currently in the viewport — for every route segment —
the moment the refresh runs. Multiply that by every connected visitor, and
a single `updateTag()` fans out into a viewport-wide stampede of concurrent
`CACHE: REVALIDATED` requests, each one an ISR Write.

### Production impact on `www.sanity.io`

After upgrading `www.sanity.io` from Next.js 15 to Next.js 16 in production:

- Daily average ISR Writes **before** upgrade: **7.1M** units.
- Daily average ISR Writes **after** upgrade: **358.5M** (~50x).
- Single-day peak: **1.52B** (~200x).
- The ISR **read/write ratio** inverted: from ~**3 reads : 1 write** to
  ~**1 read : 5 writes**. The site went from mostly serving cached content to
  mostly invalidating and rewriting it.

Disabling `<Link>` prefetching on the site made the spike go away, which is
what pointed us at prefetching behavior. Digging in, two changes in v16
compound: the already-known "multiple prefetch requests per `<Link>`" change
(partially mitigated by `experimental.prefetchInlining`), **and** the
previously-undocumented shift of `router.refresh()` from lazy to eager.
This repo isolates the second one.

## What's inside

| App           | Local port | Deployed                                                                                        | Next.js version        | `experimental.prefetchInlining`                |
| ------------- | ---------- | ----------------------------------------------------------------------------------------------- | ---------------------- | ---------------------------------------------- |
| `apps/v15`    | 3001       | [`nextjs-refresh-v15-reference.sanity.dev`](https://nextjs-refresh-v15-reference.sanity.dev/)   | `next@15.5.15`         | n/a (baseline)                                 |
| `apps/v16`    | 3000       | [`nextjs-refresh-v16-regression.sanity.dev`](https://nextjs-refresh-v16-regression.sanity.dev/) | `next@16.2.4`          | off (default on `next@latest`)                 |
| `apps/canary` | 3002       | [`nextjs-refresh-canary.sanity.dev`](https://nextjs-refresh-canary.sanity.dev/)                 | `next@16.3.0-canary.2` | **on** (default starting in this canary build) |

Neither `apps/v16` nor `apps/canary` opts in to `experimental.prefetchInlining`
explicitly — they have identical config. The difference is that
`next@16.3.0-canary.2` (the canary pinned here) enables
`experimental.prefetchInlining` by default, while `next@16.2.4` does not.
So:

- **`apps/v16`** shows the behavior users hit today on `next@latest`, where
  `experimental.prefetchInlining` is **not** on by default. Every in-viewport
  link refetches **every segment** after `router.refresh()`.
- **`apps/canary`** shows the behavior on `next@16.3.0-canary.2` with
  `experimental.prefetchInlining` **on** by default. Per-segment requests are
  collapsed, so the fan-out per link shrinks — but `router.refresh()` is
  **still eager**: every in-viewport link still refetches immediately. The
  underlying regression is unchanged.

That's the point of having both: the reproduction demonstrates that reducing
the _number of prefetches per in-viewport link_ is not enough — you also have
to change viewport prefetching back to **lazy** (the v15 behavior). As long
as `router.refresh()` is eager, every connected visitor still stampedes the
origin with `CACHE: REVALIDATED` requests for every visible link the moment
an `updateTag()` / `revalidateTag()` happens, just fewer of them per link.

Each app renders the same `@repo/ui` blog at `/blog` (a list of posts that
all use `<Link>` prefetching), and a controller at the **root route `/`** that
triggers `revalidateTag` / `updateTag` and then broadcasts a
`router.refresh()` over `BroadcastChannel` to every open blog tab.

## Reproducing the regression

The three apps are deployed on Vercel so you don't need to run anything
locally. Do the following for **each** of the three deployments:

1. Open the controller (root) URL in one tab:
   - v15: <https://nextjs-refresh-v15-reference.sanity.dev/>
   - v16: <https://nextjs-refresh-v16-regression.sanity.dev/>
   - canary: <https://nextjs-refresh-canary.sanity.dev/>
2. Open the blog — `/blog` on the same origin — in **one or more additional
   tabs**. Each blog tab will listen for the `BroadcastChannel` message from
   the controller and react with `router.refresh()`. Scroll each blog tab so
   a handful of post `<Link>`s are inside the viewport and have been
   prefetched.
3. On the blog tab, open DevTools → **Network**. Filter to the prefetch
   requests (the requests to the app router with the `RSC` / prefetch
   headers) and make sure the **`x-vercel-cache`** column is visible (right-
   click the column header → Response Headers → `x-vercel-cache`).
4. Switch to the controller tab and click **Call `revalidateTag()`**
   (or **Call `updateTag()`** on v16 / canary). The controller runs the
   revalidation and then broadcasts a `router.refresh()` to every open blog
   tab.
5. In the blog tab's Network panel, **count the prefetch requests that fire
   and look at their `x-vercel-cache` values.**

What you should see:

- **v15** (<https://nextjs-refresh-v15-reference.sanity.dev/blog>):
  the refresh itself re-fetches the current page, but **no extra `<Link>`
  prefetch requests fire** in response. The prefetched links in the viewport
  stay stale until you hover one or scroll it out and back into view. Lazy.
- **v16** (<https://nextjs-refresh-v16-regression.sanity.dev/blog>): every
  `<Link>` currently in the viewport fires a fresh prefetch **immediately**,
  one request **per route segment**, and every one of them comes back with
  `x-vercel-cache: REVALIDATED`. Each of those is an ISR Write on Vercel.
  Eager.
- **canary** (<https://nextjs-refresh-canary.sanity.dev/blog>): every
  `<Link>` in the viewport still fires a fresh prefetch immediately, but
  `experimental.prefetchInlining` collapses the per-segment requests into
  one per link. You'll see fewer prefetches than v16, but they're still
  `x-vercel-cache: REVALIDATED` — **the eager behavior is unchanged**.

The v15 → v16 difference is the regression. The v16 → canary difference is
the _partial_ mitigation that ships by default on canary today. Neither
brings canary back to v15's behavior; only re-introducing lazy viewport
prefetching does.

### Running locally

> `<Link>` prefetching is **disabled in `next dev`**, so `pnpm dev` / `next
dev` will **not** reproduce the bug. You have to run a production build of
> the specific app you want to test against `next start`.

Install, then build + start one app at a time:

```sh
pnpm install

# v15 → http://localhost:3001
cd apps/v15 && pnpm next build && pnpm next start

# v16 → http://localhost:3000
cd apps/v16 && pnpm next build && pnpm next start

# canary → http://localhost:3002
cd apps/canary && pnpm next build && pnpm next start
```

Then swap the deployed URLs above for their localhost equivalents:

| Deployed                                            | Local                   |
| --------------------------------------------------- | ----------------------- |
| <https://nextjs-refresh-v15-reference.sanity.dev/>  | `http://localhost:3001` |
| <https://nextjs-refresh-v16-regression.sanity.dev/> | `http://localhost:3000` |
| <https://nextjs-refresh-canary.sanity.dev/>         | `http://localhost:3002` |

Local runs don't have `x-vercel-cache`, since it's set by Vercel's edge.
The prefetch request **counts** still reproduce the regression against
`next start`; the `x-vercel-cache: REVALIDATED` bit only shows up on the
deployed version.

## The two v16 changes that compound

### 1. More prefetch requests per `<Link>` (documented)

In v16 a single `<Link>` can issue multiple prefetch requests, one per
route segment, instead of one combined prefetch. `experimental.prefetchInlining`
(enabled by default in `next@canary`) partially mitigates this by inlining the
per-segment payloads back into one request for unchanged segments, but the
segment still gets revalidated separately when the tag is invalidated.

This explains the **volume** increase, but not the inverted read/write ratio.

### 2. `router.refresh()` is now eager with prefetched links (undocumented)

The behavior that flipped the ratio — and that this repo reproduces — is how
`router.refresh()` interacts with prefetched `<Link>`s in the viewport:

| Version | Behavior after `router.refresh()`                                                                                                                                   |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **v15** | Prefetched links are marked **stale**, but **not refetched** until the user signals intent (hover / touch) or the link leaves and re-enters the viewport. **Lazy**. |
| **v16** | Every prefetched link **currently in the viewport** is refetched immediately, for every segment. **Eager**.                                                         |

This turns any `updateTag()` / `revalidateTag()` that is followed by a
broadcast `router.refresh()` into a viewport-wide fan-out of concurrent
`CACHE: REVALIDATED` requests — one per in-viewport link, per segment, per
connected visitor.

## Why this hits real-time content platforms especially hard

The architecture on `www.sanity.io` is an **early test of a new version of
[Sanity Live][sanity-live] that will ship in the next major of
[`next-sanity`][next-sanity]**. It's a specialized, optimized pipeline — so
the numbers in this repro are a **best case** for Sanity consumers. Sites
running the current default Sanity Live + Next.js stack hit a **much worse**
version of the same problem, because their fan-out per refresh event isn't
as carefully batched / deduplicated as ours.

The shape of the architecture — which any real-time content platform on
Next.js tends to end up with — looks like this:

- **Lane 1 (production):** a [Sanity Sync Tag Invalidate Function][sanity-sync-tag-fn]
  webhook calls `/api/revalidate-tag` which runs `revalidateTag()`.
- **Lane 2 (preview deployments in draft mode):** a Server Action calls
  `revalidateTag()` / `updateTag()` directly, since preview deployments don't
  receive the webhook.
- **Client:** every visitor is subscribed to a Sanity Live event source.
  When an event fires, the client calls `router.refresh()` so fresh content
  streams in **without losing scroll position or client component state** —
  exactly what the App Router is designed to preserve.

On **v15** this is very well-behaved:

- `revalidateTag()` marks the route as stale.
- All visitors fire `router.refresh()` concurrently.
- Each visitor's prefetched links go stale, but aren't refetched.
- At most a handful of visitors end up triggering `CACHE: REVALIDATED` later,
  driven by actual hover / scroll intent. The rest hit `CACHE: HIT` by the
  time any intent happens.
- Result: **a few** ISR writes per invalidation.

On **v16** the same flow stampedes:

- `revalidateTag()` + broadcast `router.refresh()` runs.
- Every visitor's browser **immediately** refetches every `<Link>` in the
  viewport, for every route segment.
- Every one of those requests hits the origin with `CACHE: REVALIDATED`
  concurrently, so every one of them performs an ISR write.

Concretely: with a sticky navbar linking to `/`, a single
`revalidateTag('/')` means every visitor on the site re-prefetches `/` at the
same instant.

Back-of-the-envelope for one refresh event, 100k concurrent visitors,
10 revalidated links visible, 7 segments each:

| Setup                                 | ISR Writes per event          |
| ------------------------------------- | ----------------------------- |
| v15 (lazy, intent-driven)             | ~ hundreds to low thousands   |
| v16 (eager, per-segment)              | 100k × 10 × 7 = **7,000,000** |
| v16 + `experimental.prefetchInlining` | 100k × 10 × 2 ≈ **1,000,000** |

`experimental.prefetchInlining` helps, but it's still orders of magnitude
above the v15 baseline, because it only changes the **segment multiplier** —
not the fact that every in-viewport link fans out.

[sanity-live]: https://www.sanity.io/docs/sanity-live
[next-sanity]: https://github.com/sanity-io/next-sanity
[sanity-sync-tag-fn]: https://www.sanity.io/docs/changelog/7a491dd1-67e8-41e0-9a89-eb9704055dc6

## How `www.sanity.io` worked around this

Because there is currently no way to opt out of the eager viewport refetching,
`www.sanity.io` changed its production implementation to avoid triggering it
at all:

- We **no longer call `router.refresh()` in production on content changes.**
  Live, push-driven content updates are turned off on the public site; fresh
  content now lands the next time a visitor navigates, not while they're
  sitting on the page.
- Revalidation switched from `revalidateTag(tag, { expire: 0 })` to
  `revalidateTag(tag, 'max')`. With the `'max'` profile, revalidation marks
  the cache entry as **`CACHE: STALE`** instead of immediately invalidating
  it as **`CACHE: REVALIDATED`**. Vercel's infrastructure handles stale
  responses far more gracefully — they coalesce, serve the stale copy
  instantly, and revalidate in the background — which dramatically reduces
  ISR Writes.

Together these let us re-enable `<Link>` prefetching in production without
the ISR Write spike. The cost is that the live content-push UX — arguably the
whole reason to wire `router.refresh()` to a push channel in the first place
— is disabled on the public site. That's the trade-off we had to make to
stay on Next.js 16.

## Where this is (barely) documented

The only reference we've found to the eager-on-refresh behavior is in the v16
prefetching guide, under **Partial Prerendering (PPR)**:

> Data invalidations (`revalidateTag`, `revalidatePath`) silently refresh associated prefetches
>
> — <https://nextjs.org/docs/app/guides/prefetching#partial-prerendering-ppr>

That wording suggests the behavior is scoped to PPR, which would mean it only
applies when `cacheComponents: true`. In practice this repo reproduces the
exact same eager viewport refetching regardless of whether `cacheComponents`
is enabled.

The v16 release notes mention the multi-request prefetching change, but do
**not** mention that `router.refresh()` now eagerly refetches every in-viewport
`<Link>`.

## What we're asking for

An opt-out that restores the v15 lazy behavior: after `router.refresh()` (or
`revalidateTag` invalidating a prefetch), in-viewport `<Link>`s should be
marked stale but **not refetched until the user shows intent or the link
re-enters the viewport**.

Arguably this should be the default and the eager behavior should be the
opt-in — the eager variant is only safe for sites with a small audience, a
small link surface, or no `router.refresh()`-on-event pattern.

## Dev notes

- `pnpm dev` runs all three apps through Turborepo, but `<Link>` prefetching
  is disabled in `next dev` — use `next build && next start` in the app you
  want to reproduce against (see "Running locally" above).
- Node ≥ 24, `pnpm@10.33.1`.
- Linting with `oxlint`, formatting with `oxfmt`.
- Shared UI lives in `packages/ui` (blog, debug page, broadcast channel).

## Related

- Next.js prefetching docs: <https://nextjs.org/docs/app/guides/prefetching>
- `experimental.prefetchInlining` PR: <https://github.com/vercel/next.js/pull/84958>
