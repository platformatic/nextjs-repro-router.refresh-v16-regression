import { DebugPage } from '@repo/ui/debug-page'

import { revalidateTagAction } from './actions'

export default function Page() {
  return <DebugPage version="Next.js 15" revalidateTagAction={revalidateTagAction} />
}
