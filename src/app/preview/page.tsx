import type { Metadata } from 'next'
import PreviewConsole from './preview-console'

export const metadata: Metadata = {
  title: 'Frontend Preview | ReRider Rentals',
  description: 'Read-only preview of the ReRider admin and rider interfaces using fictional sample data.',
}

export default function PreviewPage() {
  const supportPhone = process.env.RERIDER_SUPPORT_PHONE?.trim() ?? ''
  return <PreviewConsole supportPhone={supportPhone} />
}
