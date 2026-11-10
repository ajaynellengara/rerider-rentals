import type { Metadata } from 'next'
import PreviewConsole from './preview-console'

export const metadata: Metadata = {
  title: 'Frontend Preview | ReRider Rentals',
  description: 'Read-only preview of the ReRider admin and rider interfaces using fictional sample data.',
}

export default function PreviewPage() {
  return <PreviewConsole />
}
