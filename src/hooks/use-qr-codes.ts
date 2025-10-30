'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase-client'
import { QRCode } from '@/types/database'

export function useQRCodes(formId?: string) {
  return useQuery({
    queryKey: ['qr-codes', formId],
    queryFn: async () => {
      if (!formId) return []

      const { data, error } = await supabase
        .from('qr_codes')
        .select('*')
        .eq('form_id', formId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as QRCode[]
    },
    enabled: !!formId,
  })
}

export function useQRCode(qrCodeId: string) {
  return useQuery({
    queryKey: ['qr-code', qrCodeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('qr_codes')
        .select(`
          *,
          form:forms(
            id,
            name,
            project:projects(
              id,
              name,
              account_id
            )
          )
        `)
        .eq('id', qrCodeId)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!qrCodeId,
  })
}

export function useCreateQRCode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      formId: string
      locationName?: string
    }) => {
      const { data: qrCode, error } = await supabase.functions.invoke('generate-qr-code', {
        body: {
          formId: data.formId,
          locationName: data.locationName,
        },
      })

      if (error) throw error
      return qrCode as {
        id: string
        shortUrl: string
        fullUrl: string
        formId: string
        locationName?: string
        scanCount: number
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['qr-codes', data.formId] })
    },
  })
}

export function useUpdateQRCode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      id: string
      locationName?: string
    }) => {
      const { data: qrCode, error } = await supabase
        .from('qr_codes')
        .update({
          location_name: data.locationName,
        })
        .eq('id', data.id)
        .select()
        .single()

      if (error) throw error
      return qrCode
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['qr-code', data.id] })
      queryClient.invalidateQueries({ queryKey: ['qr-codes', data.form_id] })
    },
  })
}

export function useDeleteQRCode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { id: string; formId: string }) => {
      const { error } = await supabase
        .from('qr_codes')
        .delete()
        .eq('id', data.id)
        .eq('form_id', data.formId)

      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['qr-code', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['qr-codes', variables.formId] })
    },
  })
}

export function useIncrementQRScan() {
  return useMutation({
    mutationFn: async (qrCodeId: string) => {
      const { error } = await supabase.rpc('increment_qr_scan', {
        qr_code_uuid: qrCodeId,
      })

      if (error) throw error
    },
  })
}
