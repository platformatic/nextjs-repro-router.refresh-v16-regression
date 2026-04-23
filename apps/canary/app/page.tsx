import { DebugPage } from '@repo/ui/debug-page'

import { revalidateTagAction, updateTagAction } from './actions'

export default function Page() {
  return (
    <DebugPage
      version="Next.js 16 canary"
      revalidateTagAction={revalidateTagAction}
      updateTagAction={updateTagAction}
      supportsRevalidateTagProfile
    />
  )
}
