'use client'

import { useState, useTransition, type ReactNode } from 'react'

import { posts, tagPrefixes } from './blog'
import { sendBroadcastEvent } from './broadcast'

const firstPost = posts[0]
const secondPost = posts[1]
const lastPost = posts.at(-1)

const defaultTagValue = secondPost
  ? `${tagPrefixes.slug}${secondPost.slug}`
  : `${tagPrefixes.type}post`

const knownTags: string[] = [
  `${tagPrefixes.type}post`,
  ...posts.map((p) => `${tagPrefixes.slug}${p.slug}`),
]

const quickFillTags: { label: string; value: string }[] = [
  { label: 'Blog page.tsx', value: `${tagPrefixes.type}post` },
  ...(firstPost
    ? [{ label: 'First blog post', value: `${tagPrefixes.slug}${firstPost.slug}` }]
    : []),
  ...(lastPost ? [{ label: 'Last blog post', value: `${tagPrefixes.slug}${lastPost.slug}` }] : []),
]

export type RevalidateTagProfile = string | { stale?: number; revalidate?: number; expire?: number }

export type RevalidateTagAction = (tag: string, profile?: RevalidateTagProfile) => Promise<unknown>
export type UpdateTagAction = (tag: string) => Promise<unknown>

export type DebugPageProps = {
  /** Label shown in the header, e.g. "Next.js 15". */
  version?: string
  /** Default tag populated in the tag input. */
  defaultTag?: string
  /** Server action wrapping `revalidateTag()`. Called when transport is "server-action". */
  revalidateTagAction: RevalidateTagAction
  /** Server action wrapping `updateTag()`. Only supported on Next 16+. */
  updateTagAction?: UpdateTagAction
  /**
   * When true, expose controls for the second `revalidateTag(tag, profile)`
   * argument (Next 16+).
   */
  supportsRevalidateTagProfile?: boolean
}

type Transport = 'server-action' | 'http'
type ProfileChoice = 'max' | 'expire-0'

const profileChoices: Record<ProfileChoice, RevalidateTagProfile> = {
  max: 'max',
  'expire-0': { expire: 0 },
}

const primaryButton =
  'inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60'
const input =
  'w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-600 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100'
const sectionLabel =
  'text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400'

export function DebugPage({
  version,
  defaultTag = defaultTagValue,
  revalidateTagAction,
  updateTagAction,
  supportsRevalidateTagProfile = false,
}: DebugPageProps) {
  const [tag, setTag] = useState(defaultTag)
  const [transport, setTransport] = useState<Transport>('http')
  const [profileChoice, setProfileChoice] = useState<ProfileChoice>('expire-0')
  const [status, setStatus] = useState<{
    kind: 'idle' | 'ok' | 'error'
    message: string
  }>({ kind: 'idle', message: '' })
  const [isPending, startTransition] = useTransition()

  const broadcastRouterRefresh = () => {
    sendBroadcastEvent({ type: 'router-refresh' })
  }

  const resolveProfile = (): RevalidateTagProfile | undefined => {
    if (!supportsRevalidateTagProfile) return undefined
    return profileChoices[profileChoice]
  }

  const runAction = (label: string, fn: () => Promise<unknown>) => {
    startTransition(async () => {
      setStatus({ kind: 'idle', message: `${label}…` })
      try {
        await fn()
        broadcastRouterRefresh()
        setStatus({
          kind: 'ok',
          message: `${label} — then broadcast router.refresh()`,
        })
      } catch (error) {
        setStatus({
          kind: 'error',
          message: `${label} failed: ${error instanceof Error ? error.message : String(error)}`,
        })
      }
    })
  }

  const handleRouterRefresh = () => {
    broadcastRouterRefresh()
    setStatus({ kind: 'ok', message: 'Broadcasted router.refresh()' })
  }

  const handleRevalidateTag = () => {
    const profile = resolveProfile()
    const profileSuffix = profile === undefined ? '' : `, ${JSON.stringify(profile)}`
    const label = `revalidateTag(${JSON.stringify(tag)}${profileSuffix}) via ${transportLabel(transport)}`

    if (transport === 'server-action') {
      runAction(label, () => revalidateTagAction(tag, profile))
      return
    }
    runAction(label, async () => {
      const params = new URLSearchParams({ tag })
      if (supportsRevalidateTagProfile) {
        params.set('expire', profileChoice === 'max' ? 'max' : '0')
      }
      const res = await fetch(`/api/revalidate-tag?${params.toString()}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
    })
  }

  const handleUpdateTag = () => {
    if (!updateTagAction) return
    const label = `updateTag(${JSON.stringify(tag)}) via ${transportLabel(transport)}`

    if (transport === 'server-action') {
      runAction(label, () => updateTagAction(tag))
      return
    }
    runAction(label, async () => {
      const params = new URLSearchParams({ tag })
      const res = await fetch(`/api/update-tag?${params.toString()}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
    })
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <header className="mb-8 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Debug</h1>
        {version ? (
          <span className="font-mono text-sm text-gray-500 dark:text-gray-400">{version}</span>
        ) : null}
      </header>

      <section className="mb-10 rounded-lg border border-gray-200 bg-gray-50 p-5 text-sm leading-6 text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
        <p className="mb-3 font-medium text-gray-900 dark:text-gray-100">How to run the repro</p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>
            Open{' '}
            <a
              href="/blog"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-indigo-600 underline underline-offset-2 hover:text-indigo-500 dark:text-indigo-400"
            >
              /blog
            </a>{' '}
            in one or more new tabs (open as many as you need — this page is the controller and
            broadcasts to every open blog tab).
          </li>
          <li>Pick a tag and a transport below.</li>
          <li>
            Trigger an action. After it resolves, this page broadcasts{' '}
            <code className="font-mono">router.refresh()</code> to every open blog tab via{' '}
            <code className="font-mono">BroadcastChannel</code>.
          </li>
          <li>Watch the blog tabs to see whether the refresh picks up the revalidation.</li>
        </ol>
      </section>

      <section className="mb-6">
        <label htmlFor="debug-tag" className={`${sectionLabel} mb-2 block`}>
          Tag
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <input
            id="debug-tag"
            type="text"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            className={`${input} min-w-[16rem] flex-1`}
            placeholder="e.g. t:post or s:my-slug"
            list="debug-tag-options"
            autoComplete="off"
          />
          {quickFillTags.map((entry) => (
            <button
              key={entry.label}
              type="button"
              onClick={() => setTag(entry.value)}
              title={entry.value}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              {entry.label}
            </button>
          ))}
        </div>
        <datalist id="debug-tag-options">
          {knownTags.map((value) => (
            <option key={value} value={value} />
          ))}
        </datalist>
      </section>

      <section className="mb-8">
        <p className={`${sectionLabel} mb-2`}>Transport</p>
        <div className="inline-flex rounded-md border border-gray-300 bg-white p-0.5 dark:border-gray-700 dark:bg-gray-900">
          <TransportButton
            active={transport === 'server-action'}
            onClick={() => setTransport('server-action')}
          >
            Server action
          </TransportButton>
          <TransportButton active={transport === 'http'} onClick={() => setTransport('http')}>
            HTTP /api
          </TransportButton>
        </div>
      </section>

      <section className="space-y-6">
        <ActionRow
          title="revalidateTag()"
          description={
            supportsRevalidateTagProfile
              ? "Invalidate a cache tag. Toggle between the 'max' profile and { expire: 0 }."
              : 'Invalidate a cache tag.'
          }
        >
          {supportsRevalidateTagProfile ? (
            <div className="mb-3 space-y-2">
              <p className={sectionLabel}>Profile argument</p>
              <div className="inline-flex flex-wrap gap-1 rounded-md border border-gray-300 bg-white p-0.5 dark:border-gray-700 dark:bg-gray-900">
                <TransportButton
                  active={profileChoice === 'max'}
                  onClick={() => setProfileChoice('max')}
                >
                  {"'max'"}
                </TransportButton>
                <TransportButton
                  active={profileChoice === 'expire-0'}
                  onClick={() => setProfileChoice('expire-0')}
                >
                  {'{ expire: 0 }'}
                </TransportButton>
              </div>
            </div>
          ) : null}
          <button
            type="button"
            onClick={handleRevalidateTag}
            disabled={isPending || !tag}
            className={primaryButton}
          >
            Call revalidateTag()
          </button>
        </ActionRow>

        {updateTagAction && transport === 'server-action' ? (
          <ActionRow
            title="updateTag()"
            description="Update a cache tag. Must be called from a Server Action."
          >
            <button
              type="button"
              onClick={handleUpdateTag}
              disabled={isPending || !tag}
              className={primaryButton}
            >
              Call updateTag()
            </button>
          </ActionRow>
        ) : null}

        <ActionRow
          title="router.refresh()"
          description="Broadcast a router.refresh() event to every open blog tab. No server round-trip."
        >
          <button
            type="button"
            onClick={handleRouterRefresh}
            disabled={isPending}
            className={primaryButton}
          >
            Trigger router.refresh()
          </button>
        </ActionRow>
      </section>

      <section className="mt-10 min-h-[2.5rem]">
        {status.message ? (
          <p
            className={
              status.kind === 'error'
                ? 'font-mono text-sm text-red-600 dark:text-red-400'
                : 'font-mono text-sm text-gray-700 dark:text-gray-300'
            }
          >
            {status.message}
          </p>
        ) : null}
      </section>
    </div>
  )
}

function TransportButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? 'rounded bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white'
          : 'rounded px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800'
      }
    >
      {children}
    </button>
  )
}

function ActionRow({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <div className="rounded-lg border border-gray-200 p-5 dark:border-gray-800">
      <h2 className="mb-1 font-mono text-sm font-semibold text-gray-900 dark:text-gray-100">
        {title}
      </h2>
      <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">{description}</p>
      {children}
    </div>
  )
}

function transportLabel(transport: Transport): string {
  return transport === 'server-action' ? 'server action' : 'HTTP /api'
}
