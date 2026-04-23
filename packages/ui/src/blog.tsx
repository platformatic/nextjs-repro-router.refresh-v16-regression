export type Post = {
  slug: string
  title: string
  description: string
  image: string
  accent: string
}

const NOT_FOUND_SLUG = 'not-found'
export const tagPrefixes = {
  slug: 's:',
  type: 't:',
} as const

function slugify(title: string): string {
  return title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function hashString(input: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

function hueFromSlug(slug: string): number {
  return hashString(slug) % 360
}

function pastelOklchFromSlug(slug: string): string {
  return `oklch(0.9 0.08 ${hueFromSlug(slug)})`
}

function buildSvgDataUrl(color: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 630'><rect width='1200' height='630' fill='${color}'/></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

function getPlaceholderImage(slug: string): string {
  return buildSvgDataUrl(pastelOklchFromSlug(slug))
}

function getAccentColor(slug: string): string {
  return `oklch(0.72 0.17 ${hueFromSlug(slug)})`
}

const DANGER_PLACEHOLDER = buildSvgDataUrl('oklch(0.87 0.11 25)')
const DANGER_ACCENT = 'oklch(0.65 0.2 25)'

type SourceEntry = {
  title: string
  description: string
  slug?: string
  image?: string
  accent?: string
}

const source: ReadonlyArray<SourceEntry> = [
  {
    title: 'The Hidden Cost of Client Components in Next.js',
    description:
      "A look at how 'use client' drags entire dependency trees across the network boundary, and how to audit the damage.",
  },
  {
    title: 'Streaming SSR Patterns for Large Lists',
    description:
      'Techniques for progressively streaming server-rendered UI so users see content before the database finishes responding.',
  },
  {
    title: 'Debugging Prefetch Behavior in the App Router',
    description:
      'Reading the Network tab like a professional to figure out what the router is actually prefetching and when.',
  },
  {
    title: 'Why Your Bundle Is Bigger Than You Think',
    description:
      'Source-map explorer, import cost, and the day-to-day habits that keep JavaScript payloads honest.',
  },
  {
    title: 'A Practical Guide to Server Actions',
    description:
      'Moving mutation logic into the server runtime without giving up end-to-end type safety or progressive enhancement.',
  },
  {
    title: 'From Pages to App Router: A Migration Story',
    description:
      'Six months of incremental adoption, what surprised us, and what we would do differently the second time around.',
  },
  {
    title: 'Designing for Dark Mode Without Regret',
    description:
      'Token choices, contrast checks, and the common traps that make dark mode feel like an afterthought.',
  },
  {
    title: 'Tailwind CSS v4: What Actually Changed',
    description:
      'A short, practical tour of the new engine, configuration format, and how migration plays out in real apps.',
  },
  {
    title: 'Type-Safe Environment Variables at Scale',
    description:
      'Why parsing env once at the edge of your program saves you hours of production debugging later.',
  },
  {
    title: 'Edge Runtime vs Node Runtime in 2026',
    description:
      'Where each runtime wins, where they tie, and the handful of APIs that still make the choice for you.',
  },
  {
    title: 'Incremental Static Regeneration Explained',
    description:
      'A mental model for stale-while-revalidate at the page level, with diagrams that finally make sense.',
  },
  {
    title: 'Structured Logging for Next.js Applications',
    description:
      'Escaping console.log culture and giving your future self something searchable to grep through at 3am.',
  },
  {
    title: 'The Quiet Return of Monolithic Architectures',
    description:
      'How teams are consolidating services without giving up the scalability benefits they spent years chasing.',
  },
  {
    title: 'Pragmatic Accessibility for Product Teams',
    description:
      'A short list of habits that turn accessibility from a last-minute audit into an everyday design input.',
  },
  {
    title: 'Rewriting Our Auth Layer in a Weekend',
    description:
      'What happens when you finally stop patching the session layer and give it the surgery it has been asking for.',
  },
  {
    title: 'Zero-Downtime Deploys on Vercel',
    description:
      'Feature flags, preview URLs, and the quiet deploy choreography that keeps users from ever noticing a release.',
  },
  {
    title: 'Measuring Core Web Vitals That Actually Matter',
    description:
      'Which metrics move product outcomes, which ones are vanity, and how to wire real user monitoring on a budget.',
  },
  {
    title: 'A Love Letter to the Command Palette',
    description:
      'Why the humble Cmd+K overlay quietly became the most important piece of UI in the apps I use every day.',
  },
  {
    title: 'When to Reach for a State Machine',
    description:
      'Signs your reducer is secretly a finite-state machine begging to be written as one, plus when to resist.',
  },
  {
    title: 'Taming Long Forms With React Hook Form',
    description:
      'Patterns for multi-step, conditional, and dynamically-shaped forms that do not collapse under their own weight.',
  },
  {
    title: 'The Truth About React Server Components',
    description:
      'A calm, spec-first explainer that cuts through the hype and names exactly what they are and are not.',
  },
  {
    title: 'Database Migrations Without the Panic',
    description:
      'Expand-contract, shadow tables, and the small rituals that make schema changes feel almost boring.',
  },
  {
    title: 'Why We Stopped Using Barrel Exports',
    description:
      'A single `index.ts` can quietly double your cold-start time. Here is what we replaced it with.',
  },
  {
    title: 'Writing Effective Pull Request Descriptions',
    description:
      'Reviewing is expensive; the author pays the smaller cost of writing so the team pays the smaller cost overall.',
  },
  {
    title: 'Async Work Is Cultural, Not Technical',
    description:
      'Tools only help if the team already believes written communication is the default. Here is how to get there.',
  },
  {
    title: 'Designing APIs You Will Not Regret',
    description:
      'A checklist of questions that consistently surface the mistakes you only notice a year after shipping.',
  },
  {
    title: 'A Field Guide to Optimistic Updates',
    description:
      'When to lie to your users for their own good, and how to gracefully admit it when the server disagrees.',
  },
  {
    title: 'Rate Limiting for the Paranoid',
    description:
      'Token bucket, leaky bucket, and why most teams accidentally ship the wrong one for the traffic they have.',
  },
  {
    title: 'Feature Flags That Do Not Leak',
    description:
      'Keeping flag logic out of the UI and close to the boundary, so cleanup is a delete rather than an archaeology dig.',
  },
  {
    title: 'The Subtle Art of Cache Invalidation',
    description:
      'A walk through tag-based, time-based, and event-driven invalidation, with their respective failure modes.',
  },
  {
    title: 'Typing Third-Party Libraries Without Tears',
    description:
      'Ambient declarations, module augmentation, and other escape hatches for when DefinitelyTyped lets you down.',
  },
  {
    title: 'Monorepos Are Not the Problem',
    description:
      'Build graphs, caching, and ownership boundaries are. A monorepo just makes your existing problems visible.',
  },
  {
    title: 'The Case Against Global State',
    description:
      'Half of your Redux store is server cache in disguise. The other half is probably URL state.',
  },
  {
    title: 'Shipping a Design System Nobody Hates',
    description:
      'Why the component library is the easy part, and the governance is the hard part you will keep putting off.',
  },
  {
    title: 'Handling Money in JavaScript Safely',
    description:
      'Integer cents, decimal libraries, and the one-line rounding bug that cost us a remarkably long afternoon.',
  },
  {
    title: 'Lessons From a Year of On-Call',
    description:
      'What I learned about systems, humans, and sleep debt across twelve rotations of the pager.',
  },
  {
    title: 'Reading Stack Traces Like a Detective',
    description:
      'Frame-by-frame habits that let you locate the real bug without scrolling past the first async boundary.',
  },
  {
    title: 'React Suspense in Real Applications',
    description:
      'Where boundaries belong, what they accidentally break, and how to reason about fallback UI without hand-waving.',
  },
  {
    title: 'A Gentle Introduction to eBPF',
    description:
      'Tracing syscalls, profiling the kernel, and understanding why your server is doing what it says it is doing.',
  },
  {
    title: 'Rust for the TypeScript Programmer',
    description:
      'A translation dictionary for everyday concepts, so your first week of Rust is a head start rather than a wall.',
  },
  {
    title: 'The Life and Death of a Side Project',
    description:
      'Why most weekend projects die on Sunday night, and the small habits that occasionally let one survive.',
  },
  {
    title: 'Interviewing for Senior Engineering Roles',
    description:
      'Signals interviewers are actually looking for, and the way to surface them without rehearsing canned stories.',
  },
  {
    title: 'How We Cut Our CI Time in Half',
    description:
      'Cache keys, test sharding, and three small YAML changes that gave a hundred engineers back an hour a day.',
  },
  {
    title: 'Practical OpenTelemetry for Web Apps',
    description:
      'Spans, attributes, and the minimum viable instrumentation that makes a production incident merely annoying.',
  },
  {
    title: 'The Smallest Viable Kubernetes Cluster',
    description:
      'When you finally outgrow your VPS, what the simplest self-hosted cluster looks like before it grows teeth.',
  },
  {
    title: 'Why Your Postgres Queries Are Slow',
    description:
      'EXPLAIN ANALYZE, statistics, and the two or three patterns that cover most of the queries I get asked about.',
  },
  {
    title: 'Indexing Strategies That Pay Off Later',
    description:
      'Partial indexes, expression indexes, and the ones you wish you had created before the table got interesting.',
  },
  {
    title: 'Migrating From Redux to Zustand',
    description:
      'An incremental path that does not require a big-bang rewrite or a hiring freeze on the UI team.',
  },
  {
    title: 'Drawing Boundaries in a Fullstack App',
    description:
      'Where the server ends, where the client begins, and how to stop your types from smearing across the line.',
  },
  {
    title: 'Unit Tests Are Not a Replacement for Thought',
    description:
      'They catch regressions, not design mistakes. Here is the kind of thinking that still has to happen up front.',
  },
  {
    slug: NOT_FOUND_SLUG,
    title: '404 Not Found',
    description:
      'This blog post simulates content that existed during `next build` but has since been deleted and on-demand ISR removed, clicking this will trigger `notFound()`',
    image: DANGER_PLACEHOLDER,
    accent: DANGER_ACCENT,
  },
  {
    title: 'E2E Testing That Does Not Flake',
    description:
      'Deterministic selectors, network stubbing, and the small investments that turn a red pipeline back to green.',
  },
  {
    title: 'A Sober Look at AI Code Assistants',
    description:
      'Where they genuinely help, where they introduce silent regressions, and how senior engineers actually use them.',
  },
  {
    title: 'Prompt Engineering Is Just Engineering',
    description:
      'Versioning, tests, and observability apply to prompts exactly the way they apply to the rest of your code.',
  },
  {
    title: 'Running LLMs Locally for Fun and Profit',
    description:
      'A weekend setup that takes you from zero to a usable local chat interface without selling your graphics card.',
  },
  {
    title: 'Vector Databases Without the Hype',
    description:
      'When a dedicated vector store earns its keep, and when a well-indexed Postgres column will quietly do the job.',
  },
  {
    title: 'Retrieval Augmented Generation In Practice',
    description:
      'Chunking, reranking, and the evaluation loop that keeps your RAG pipeline from silently degrading over time.',
  },
  {
    title: 'Writing a Custom ESLint Rule From Scratch',
    description:
      'AST basics, a worked example, and the small codemod that enforced a team convention better than any wiki page.',
  },
  {
    title: 'The Rise of Colocated Configuration',
    description:
      'Why the config file nearest to the code it configures tends to win, and what that means for your repo layout.',
  },
  {
    title: 'A Short History of CSS Layout',
    description:
      'From floats to grid, a tour of the bad decisions we made together and the better ones we eventually agreed on.',
  },
  {
    title: 'Container Queries Changed Responsive Design',
    description:
      'Component-level media queries quietly replaced a decade of workarounds; here is how to actually use them.',
  },
  {
    title: 'Why I No Longer Use CSS-in-JS',
    description:
      'A balanced retrospective on runtime styles, the benefits I miss, and the problems I stopped having.',
  },
  {
    title: 'Static Analysis Beyond TypeScript',
    description:
      'Linters, codemods, and the underrated layer of tooling that catches the bugs types cannot reason about.',
  },
  {
    title: 'Code Reviews That Teach',
    description:
      'Notes from a principal engineer who reviews more than they write, and what they have learned to leave alone.',
  },
  {
    title: 'On-Call Playbooks Worth Writing',
    description:
      'The shape of a runbook that helps a sleepy human, not a confident one, and why the difference matters.',
  },
  {
    title: 'Incident Response Without Blame',
    description:
      'How to run a post-incident review that produces durable learning instead of a lingering bad taste.',
  },
  {
    title: 'Architecting for Graceful Degradation',
    description:
      'Designing systems where the first failure is a shrug, not a full outage that trends on social media.',
  },
  {
    title: 'The Underrated Power of Feature Branches',
    description:
      'Why the shape of your branching strategy quietly determines the shape of the conversations your team has.',
  },
  {
    title: 'Chaos Engineering for Small Teams',
    description:
      'Lightweight experiments that give you most of the Netflix benefits without any of the Netflix budget.',
  },
  {
    title: 'Secrets Management Without Vault',
    description:
      'What you actually need before reaching for dedicated infra, and how far a cloud secret manager will take you.',
  },
  {
    title: 'A Tour of Browser Storage APIs',
    description:
      'Cookies, localStorage, IndexedDB, and the one most people forget about until it would have been useful.',
  },
  {
    title: 'Service Workers Are Still Useful',
    description:
      'Post-PWA hype, the quiet cases where a service worker is genuinely the right tool for the job.',
  },
  {
    title: 'Progressive Enhancement Is Back',
    description:
      'Starting from HTML and layering JavaScript on top turns out to map surprisingly well to modern frameworks.',
  },
  {
    title: 'Hypermedia as a Sensible Default',
    description:
      'What HATEOAS was trying to tell us, and why a thoughtful REST API still beats most JSON dumps on ergonomics.',
  },
  {
    title: 'HTMX For the Curious React Developer',
    description:
      'A weekend exploration of a library that made me rethink which problems actually needed a bundler.',
  },
  {
    title: 'The Myth of the 10x Engineer',
    description:
      'A careful look at what that label usually describes, and why naming it that way tends to make teams worse.',
  },
  {
    title: 'Remote First Is Not the Same as Remote Friendly',
    description:
      'The policy differences that decide whether remote teammates are full participants or slightly inconvenient guests.',
  },
  {
    title: 'Writing Documentation Your Team Will Read',
    description:
      'Cognitive load, scannability, and the small formatting habits that separate reference docs from write-only docs.',
  },
  {
    title: 'The Engineering Ladder We Wish We Had',
    description:
      'Behaviors and outcomes rather than years, and why the difference is worth the several meetings it will take.',
  },
  {
    title: 'Managing Up Without Becoming a Politician',
    description:
      'Straight talk about communicating with leadership in a way that serves your team without selling your soul.',
  },
  {
    title: 'Estimating Software Projects Honestly',
    description:
      'Why ranges beat single numbers, why your gut is smarter than your Gantt chart, and when to admit you do not know.',
  },
  {
    title: 'A Postmortem of Our Biggest Outage',
    description:
      'What happened, what we thought happened, and the five improvements we shipped in the following quarter.',
  },
  {
    title: 'Building a Personal Knowledge Base That Lasts',
    description:
      'File formats, folder conventions, and a review cadence that keeps notes useful for longer than a semester.',
  },
  {
    title: 'Shell Tricks Every Developer Should Know',
    description:
      'A short, opinionated list of incantations that quietly save an hour a week once they become muscle memory.',
  },
  {
    title: 'Git Workflows Reconsidered',
    description:
      'Trunk-based, GitFlow, and the handful of questions that actually decide which one fits your team.',
  },
  {
    title: 'Why Conventional Commits Are Worth the Overhead',
    description:
      'A small discipline with outsized payoffs in changelogs, release automation, and pull request review velocity.',
  },
  {
    title: 'Semantic Versioning Is a Social Contract',
    description:
      'Why SemVer only works when publishers and consumers agree on what "breaking" means, and what to do when they do not.',
  },
  {
    title: 'Publishing a TypeScript Package in 2026',
    description:
      'Dual ESM/CJS, `exports` fields, and the minimum setup that will not embarrass you on npm next week.',
  },
  {
    title: 'The Small Joy of Finishing Side Projects',
    description:
      'A nudge toward shipping the imperfect version tonight rather than rewriting the landing page for another weekend.',
  },
  {
    title: 'Reading Papers Without Going Insane',
    description:
      'A practical workflow for working engineers who want to stay current with research without pretending to be academics.',
  },
  {
    title: "The Programmer's Guide to Deep Work",
    description:
      'What the research does and does not say, and the small environmental tweaks that actually compound over months.',
  },
  {
    title: 'Tools I Use Every Day as a Staff Engineer',
    description:
      'A calm, unsponsored list of software that has earned its place on my machine over the last several years.',
  },
  {
    title: 'A Letter to My Junior Self',
    description:
      'The handful of habits and attitudes I wish someone had pushed me to adopt in my first two years of work.',
  },
  {
    title: 'The Art of Walking Away From Technical Debt',
    description:
      'Not every shortcut deserves a rewrite. Here is how to tell which debts to pay down and which to simply retire.',
  },
  {
    title: 'Designing Email That Actually Renders',
    description:
      'Table layouts, inline styles, and a short list of clients that will continue to break your heart anyway.',
  },
  {
    title: 'Running Background Jobs on the Edge',
    description:
      'Queues, cron, and durable execution patterns for code that has to keep running after the request goes away.',
  },
  {
    title: 'The Forgotten Power of the HTTP Cache',
    description:
      'ETags, Vary, and the headers your CDN is already willing to respect if you would only bother to set them.',
  },
  {
    title: 'Writing Fast Tests Without Cutting Corners',
    description:
      'Test design choices that keep a suite under thirty seconds even as the product grows past a million users.',
  },
  {
    title: 'The Case for Boring Stacks',
    description:
      'Why the most interesting work at most companies is built on the least interesting technology choices.',
  },
]

export const posts: Post[] = source.map((entry) => {
  const slug = entry.slug ?? slugify(entry.title)
  return {
    slug,
    title: entry.title,
    description: entry.description,
    image: entry.image ?? getPlaceholderImage(slug),
    accent: entry.accent ?? getAccentColor(slug),
  }
})

if (new Set(posts.map((p) => p.slug)).size !== posts.length) {
  throw new Error('Duplicate blog slugs detected')
}

function getPost(slug: string): (Post & { siblings: string[] }) | undefined {
  const post = posts.find((p) => p.slug === slug && p.slug !== NOT_FOUND_SLUG)
  if (post) {
    return { ...post, siblings: getSiblingPosts(slug).map((p) => p.slug) }
  }
  return post
}

function getSiblingPosts(slug: string, count = 3): Post[] {
  const index = posts.findIndex((p) => p.slug === slug)
  if (index === -1) return []
  const result: Post[] = []
  for (let offset = 1; offset < posts.length && result.length < count; offset++) {
    const candidate = posts[(index + offset) % posts.length]
    if (!candidate) continue
    if (candidate.slug === slug) continue
    if (candidate.slug === NOT_FOUND_SLUG) continue
    result.push(candidate)
  }
  return result
}

async function sleep(ms = 300) {
  const { resolve, promise } = Promise.withResolvers<void>()
  setTimeout(resolve, ms)
  await promise
}

export async function fetchPosts() {
  // Simulates data fetching
  await sleep(900)
  return { data: posts, tags: [`${tagPrefixes.type}post`] }
}
export async function fetchPost(slug: string) {
  // Simulates data fetching
  await sleep(300)
  const post = getPost(slug)
  return { data: post, tags: post ? [`${tagPrefixes.slug}${post.slug}`] : [] }
}
export async function fetchSiblings(slugs: string[]) {
  const data = await Promise.all(slugs.map((slug) => fetchPost(slug)))
  return {
    data: data.flatMap((p) => p.data).filter((p) => p !== undefined),
    tags: data.flatMap((p) => p.tags),
  }
}
export async function fetchStaticParams(): Promise<{ slug: string }[]> {
  return posts
    .filter((p) => p.slug !== NOT_FOUND_SLUG)
    .slice(0, 50)
    .map((p) => ({ slug: p.slug }))
}
