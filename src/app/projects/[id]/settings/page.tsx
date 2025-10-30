import { ProjectSettingsPageClient } from './settings-page-client'

export default async function ProjectSettingsPage(props: PageProps<'/projects/[id]/settings'>) {
  const { id } = await props.params
  return <ProjectSettingsPageClient projectId={id} />
}
