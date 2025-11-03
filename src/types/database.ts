import type { ChoiceOption } from '@/lib/question-utils'

// Database types based on PRD data structure:
// User → Account → Project → Form → Question → QR → Response → ResponseItem

export interface User {
  id: string
  email: string
  created_at: string
  updated_at: string
}

export interface Account {
  id: string
  user_id: string
  name: string
  plan_id: string
  onboarding_completed?: boolean
  created_at: string
  updated_at: string
}

export interface Plan {
  id: string
  name: string
  price: number
  max_projects: number
  max_forms_per_project: number
  max_responses_per_form: number
  features: string[]
  created_at: string
}

export interface Project {
  id: string
  account_id: string
  name: string
  description?: string
  is_active?: boolean
  created_at: string
  updated_at: string
}

export interface Form {
  id: string
  project_id: string
  name: string
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Question {
  id: string
  form_id: string
  type: 'text' | 'textarea' | 'rating' | 'choice' | 'multiselect'
  title: string
  description?: string
  required: boolean
  options?: ChoiceOption[] | string[] // For choice/multiselect questions
  rating_scale?: number // For rating questions: 5 or 10
  order_index: number
  created_at: string
}

export interface QRCode {
  id: string
  form_id: string
  short_url: string
  full_url: string
  location_name?: string
  scan_count: number
  created_at: string
}

export interface Response {
  id: string
  form_id: string
  ip_hash?: string
  location_name?: string
  submitted_at: string
}

export interface ResponseItem {
  id: string
  response_id: string
  question_id: string
  value: string
  created_at: string
}

export interface UsageCounter {
  id: string
  account_id: string
  period_start: string
  period_end: string
  projects_count: number
  forms_count: number
  responses_count: number
  qr_scans_count: number
}

export interface Subscription {
  id: string
  account_id: string
  plan_id: string
  stripe_subscription_id?: string
  status: 'active' | 'canceled' | 'past_due' | 'trialing'
  current_period_start: string
  current_period_end: string
  created_at: string
  updated_at: string
}
