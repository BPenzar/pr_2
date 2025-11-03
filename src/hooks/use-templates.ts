'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase-client'
import { useAuth } from '@/contexts/auth-context'
import { type FormTemplate } from '@/lib/form-templates'
import { ensureDefaultQRCode } from '@/lib/qr-codes'
import { normalizeChoiceOptions, sanitizeChoiceOptions } from '@/lib/question-utils'

interface CreateFormFromTemplateParams {
  template: FormTemplate
  projectId: string
  customName?: string
  customDescription?: string
}

/**
 * Create a new form from a template
 */
export function useCreateFormFromTemplate() {
  const queryClient = useQueryClient()
  const { account } = useAuth()

  return useMutation({
    mutationFn: async ({ template, projectId, customName, customDescription }: CreateFormFromTemplateParams) => {
      if (!account?.id) throw new Error('No account')

      // Check if user can create more forms
      const { data: canCreate, error: limitError } = await supabase
        .rpc('can_create_form', {
          project_uuid: projectId,
          account_uuid: account.id
        })

      if (limitError) throw limitError
      if (!canCreate) {
        throw new Error('You have reached your form limit for this plan')
      }

      // Create the form
      const formName = customName || template.name
      const formDescription = customDescription || template.description

      const { data: form, error: formError } = await supabase
        .from('forms')
        .insert({
          project_id: projectId,
          name: formName,
          description: formDescription,
          is_active: true, // Forms created from templates go live immediately
        })
        .select()
        .single()

      if (formError) throw formError

      try {
        await ensureDefaultQRCode(form.id)
      } catch (qrError: any) {
        await supabase.from('forms').delete().eq('id', form.id)
        throw new Error(qrError?.message || 'Failed to generate default QR code')
      }

      // Create questions from template
      const questions = template.questions.map(q => {
        const normalizedOptions = normalizeChoiceOptions(q.options)
        const sanitizedOptions = sanitizeChoiceOptions(normalizedOptions)
        const optionsPayload =
          q.type === 'choice' || q.type === 'multiselect'
            ? sanitizedOptions.length ? sanitizedOptions : null
            : null

        return {
          form_id: form.id,
          type: q.type,
          title: q.title,
          description: q.description || null,
          required: q.required,
          options: optionsPayload,
          order_index: q.order_index,
        }
      })

      const { error: questionsError } = await supabase
        .from('questions')
        .insert(questions)

      if (questionsError) {
        // Clean up form if questions creation fails
        await supabase.from('forms').delete().eq('id', form.id)
        throw questionsError
      }

      return form
    },
    onSuccess: (form, variables) => {
      const projectId = variables.projectId
      // Invalidate relevant queries scoped to this project/account
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
      queryClient.invalidateQueries({ queryKey: ['forms', projectId] })
      if (account?.id) {
        queryClient.invalidateQueries({ queryKey: ['projects', account.id] })
        queryClient.invalidateQueries({ queryKey: ['account-plan', account.id] })
        queryClient.invalidateQueries({ queryKey: ['account-analytics', account.id] })
      }
    },
  })
}

/**
 * Create a quick setup form (minimal feedback form)
 */
export function useCreateQuickSetupForm() {
  const queryClient = useQueryClient()
  const { account } = useAuth()

  return useMutation({
    mutationFn: async ({ projectId, businessType }: { projectId: string; businessType?: string }) => {
      if (!account?.id) throw new Error('No account')

      // Check if user can create more forms
      const { data: canCreate, error: limitError } = await supabase
        .rpc('can_create_form', {
          project_uuid: projectId,
          account_uuid: account.id
        })

      if (limitError) throw limitError
      if (!canCreate) {
        throw new Error('You have reached your form limit for this plan')
      }

      // Create a basic feedback form
      const { data: form, error: formError } = await supabase
        .from('forms')
        .insert({
          project_id: projectId,
          name: 'Quick Feedback Form',
          description: 'A simple form to collect customer feedback',
          is_active: true, // Start as active for quick setup
        })
        .select()
        .single()

      if (formError) throw formError

      try {
        await ensureDefaultQRCode(form.id)
      } catch (qrError: any) {
        await supabase.from('forms').delete().eq('id', form.id)
        throw new Error(qrError?.message || 'Failed to generate default QR code')
      }

      // Create basic questions
      const basicQuestions = [
        {
          form_id: form.id,
          type: 'rating',
          title: 'How satisfied are you with your experience?',
          description: null,
          required: true,
          options: null,
          order_index: 0,
        },
        {
          form_id: form.id,
          type: 'textarea',
          title: 'What did you like most?',
          description: null,
          required: false,
          options: null,
          order_index: 1,
        },
        {
          form_id: form.id,
          type: 'textarea',
          title: 'How can we improve?',
          description: null,
          required: false,
          options: null,
          order_index: 2,
        },
        {
          form_id: form.id,
          type: 'choice',
          title: 'Would you recommend us to others?',
          description: null,
          required: true,
          options: ['Yes, definitely', 'Yes, probably', 'Not sure', 'Probably not', 'Definitely not'],
          order_index: 3,
        }
      ]

      const { error: questionsError } = await supabase
        .from('questions')
        .insert(basicQuestions)

      if (questionsError) {
        // Clean up form if questions creation fails
        await supabase.from('forms').delete().eq('id', form.id)
        throw questionsError
      }

      return form
    },
    onSuccess: (form, variables) => {
      const projectId = variables.projectId
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
      queryClient.invalidateQueries({ queryKey: ['forms', projectId] })
      if (account?.id) {
        queryClient.invalidateQueries({ queryKey: ['projects', account.id] })
        queryClient.invalidateQueries({ queryKey: ['account-plan', account.id] })
        queryClient.invalidateQueries({ queryKey: ['account-analytics', account.id] })
      }
    },
  })
}

/**
 * Create a project and form from onboarding data
 */
export function useCompleteOnboarding() {
  const queryClient = useQueryClient()
  const { account } = useAuth()

  return useMutation({
    mutationFn: async (data: {
      projectName: string
      projectDescription?: string
      template?: FormTemplate
      setupOption: 'quick' | 'guided' | 'template'
      businessType: string
    }) => {
      if (!account?.id) throw new Error('No account')

      // Ensure account can still create projects
      const { data: canCreateProject, error: projectLimitError } = await supabase
        .rpc('can_create_project', { account_uuid: account.id })

      if (projectLimitError) throw projectLimitError
      if (!canCreateProject) {
        throw new Error('You have reached your project limit for this plan')
      }

      // Create project first
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          account_id: account.id,
          name: data.projectName,
          description: data.projectDescription,
        })
        .select()
        .single()

      if (projectError) throw projectError

      let form: any = null

      // Create form based on setup option
      if (data.setupOption === 'quick') {
        // Create quick setup form
        const { data: quickForm, error: quickError } = await supabase
          .from('forms')
          .insert({
            project_id: project.id,
            name: 'Quick Feedback Form',
            description: 'A simple form to collect customer feedback',
            is_active: true,
          })
          .select()
          .single()

        if (quickError) throw quickError

        try {
          await ensureDefaultQRCode(quickForm.id)
        } catch (qrError: any) {
          await supabase.from('forms').delete().eq('id', quickForm.id)
          throw new Error(qrError?.message || 'Failed to generate default QR code')
        }

        // Create basic questions
        const basicQuestions = [
          {
            form_id: quickForm.id,
            type: 'rating',
            title: 'How satisfied are you with your experience?',
            required: true,
            order_index: 0,
          },
          {
            form_id: quickForm.id,
            type: 'textarea',
            title: 'What did you like most?',
            required: false,
            order_index: 1,
          },
          {
            form_id: quickForm.id,
            type: 'textarea',
            title: 'How can we improve?',
            required: false,
            order_index: 2,
          },
          {
            form_id: quickForm.id,
            type: 'choice',
            title: 'Would you recommend us to others?',
            required: true,
            options: ['Yes, definitely', 'Yes, probably', 'Not sure', 'Probably not', 'Definitely not'],
            order_index: 3,
          }
        ]

        const { error: questionsError } = await supabase
          .from('questions')
          .insert(basicQuestions)

        if (questionsError) throw questionsError

        form = quickForm
      } else if (data.setupOption === 'template' && data.template) {
        // Create form from template
        const { data: templateForm, error: templateError } = await supabase
          .from('forms')
          .insert({
            project_id: project.id,
            name: data.template.name,
            description: data.template.description,
            is_active: true,
          })
          .select()
          .single()

        if (templateError) throw templateError

        try {
          await ensureDefaultQRCode(templateForm.id)
        } catch (qrError: any) {
          await supabase.from('forms').delete().eq('id', templateForm.id)
          throw new Error(qrError?.message || 'Failed to generate default QR code')
        }

        // Create questions from template
        const questions = data.template.questions.map(q => {
          const normalizedOptions = normalizeChoiceOptions(q.options)
          const sanitizedOptions = sanitizeChoiceOptions(normalizedOptions)
          const optionsPayload =
            q.type === 'choice' || q.type === 'multiselect'
              ? sanitizedOptions.length ? sanitizedOptions : null
              : null

          return {
            form_id: templateForm.id,
            type: q.type,
            title: q.title,
            description: q.description || null,
            required: q.required,
            options: optionsPayload,
            order_index: q.order_index,
          }
        })

        const { error: questionsError } = await supabase
          .from('questions')
          .insert(questions)

        if (questionsError) throw questionsError

        form = templateForm
      }
      // For 'guided' option, we'll just create the project and let the user be guided to the form builder

      return { project, form }
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['forms'] })
      queryClient.invalidateQueries({ queryKey: ['account-plan'] })
    },
  })
}
