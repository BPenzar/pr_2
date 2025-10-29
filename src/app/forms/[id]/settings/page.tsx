import { FormSettingsPageClient } from './settings-page-client'

export default async function FormSettingsPage(props: PageProps<'/forms/[id]/settings'>) {
  const { id } = await props.params
  return <FormSettingsPageClient formId={id} />
}
