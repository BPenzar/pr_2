import { ProjectSettingsPageClient } from './settings-page-client'

type Props = {
  params: Promise<{ id: string }>
}

export default async function ProjectSettingsPage({ params }: Props) {
  const { id } = await params
  return <ProjectSettingsPageClient projectId={id} />
}
