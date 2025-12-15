import { FormSettingsPageClient } from './settings-page-client'

type Props = {
  params: Promise<{ id: string }>
}

export default async function FormSettingsPage({ params }: Props) {
  const { id } = await params
  return <FormSettingsPageClient formId={id} />
}
