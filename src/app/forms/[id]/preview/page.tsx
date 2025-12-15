import { FormPreviewPageClient } from './preview-page-client'

type Props = {
  params: Promise<{ id: string }>
}

export default async function FormPreviewPage({ params }: Props) {
  const { id } = await params
  return <FormPreviewPageClient formId={id} />
}
