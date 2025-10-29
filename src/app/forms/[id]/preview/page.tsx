import { FormPreviewPageClient } from './preview-page-client'

export default async function FormPreviewPage(props: PageProps<'/forms/[id]/preview'>) {
  const { id } = await props.params
  return <FormPreviewPageClient formId={id} />
}
