'use client'

import { useParams } from 'next/navigation'
import { PublicForm } from '@/components/public-form/public-form'

export default function PublicFormPage() {
  const params = useParams()
  const shortUrl = params.shortUrl as string

  return <PublicForm shortUrl={shortUrl} />
}