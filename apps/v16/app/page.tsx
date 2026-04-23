import { DebugPage } from '@repo/ui/debug-page'

import { revalidateTagAction, updateTagAction } from './actions'

export default function Page() {
  return (
    <DebugPage
      version="Next.js 16"
      revalidateTagAction={revalidateTagAction}
      updateTagAction={updateTagAction}
      supportsRevalidateTagProfile
    />
  )
}
