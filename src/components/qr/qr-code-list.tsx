'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { QRCodeSVG } from 'qrcode.react'
import { useQRCodes, useDeleteQRCode } from '@/hooks/use-qr-codes'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { QRCodeGenerator } from './qr-code-generator'
import { QrCodeIcon, PlusIcon, TrashIcon, EyeIcon, DownloadIcon } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ensureDefaultQRCode } from '@/lib/qr-codes'

interface QRCodeListProps {
  formId: string
  formName: string
}

export function QRCodeList({ formId, formName }: QRCodeListProps) {
  const [showGenerator, setShowGenerator] = useState(false)
  const { data: qrCodes, isLoading } = useQRCodes(formId)
  const deleteQRCode = useDeleteQRCode()
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [isEnsuringDefault, setIsEnsuringDefault] = useState(false)
  const [ensureError, setEnsureError] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const autoEnsureRef = useRef(false)

  const handleEnsureDefault = useCallback(async () => {
    if (isEnsuringDefault) return

    setIsEnsuringDefault(true)
    setEnsureError(null)

    try {
      await ensureDefaultQRCode(formId)
      await queryClient.invalidateQueries({ queryKey: ['qr-codes', formId] })
    } catch (error: any) {
      const message = error?.message ?? 'Failed to generate default QR code'
      setEnsureError(message)
    } finally {
      setIsEnsuringDefault(false)
    }
  }, [formId, isEnsuringDefault, queryClient])

  useEffect(() => {
    if (isLoading) return
    if (qrCodes && qrCodes.length > 0) return
    if (autoEnsureRef.current) return

    autoEnsureRef.current = true
    void handleEnsureDefault()
  }, [handleEnsureDefault, isLoading, qrCodes])

  useEffect(() => {
    if (qrCodes && qrCodes.length > 0) {
      autoEnsureRef.current = false
    }
  }, [qrCodes])

  useEffect(() => {
    if (!copiedId) return
    const timer = setTimeout(() => setCopiedId(null), 2000)
    return () => clearTimeout(timer)
  }, [copiedId])

  const totalCodes = qrCodes?.length ?? 0

  const handleDelete = async (qrCodeId: string) => {
    try {
      await deleteQRCode.mutateAsync({ id: qrCodeId, formId })
    } catch (error) {
      console.error('Failed to delete QR code:', error)
    } finally {
      setConfirmDeleteId(null)
    }
  }

  const handleCopyUrl = async (id: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(id)
    } catch (error) {
      console.error('Failed to copy URL:', error)
    }
  }

  const handleDownloadQR = (qrCode: any) => {
    const svg = document.querySelector(`#qr-${qrCode.id}`) as SVGElement
    if (!svg) return

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const img = new Image()

    img.onload = () => {
      canvas.width = 512
      canvas.height = 512
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      canvas.toBlob((blob) => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        const downloadLink = document.createElement('a')
        downloadLink.href = url
        downloadLink.download = `qr-code-${qrCode.location_name || qrCode.short_url}.png`
        document.body.appendChild(downloadLink)
        downloadLink.click()
        document.body.removeChild(downloadLink)
        URL.revokeObjectURL(url)
      }, 'image/png')
    }

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 animate-pulse rounded"></div>
        <div className="h-32 bg-gray-200 animate-pulse rounded"></div>
      </div>
    )
  }

  if (showGenerator) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Generate QR Code</h3>
          <Button
            variant="outline"
            onClick={() => setShowGenerator(false)}
          >
            Back to List
          </Button>
        </div>
        <QRCodeGenerator
          formId={formId}
          formName={formName}
          onSuccess={() => setShowGenerator(false)}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">QR Codes</h3>
          <p className="text-sm text-muted-foreground">
            Manage QR codes for {formName}
          </p>
        </div>
        <Button
          onClick={() => setShowGenerator(true)}
          disabled={isEnsuringDefault}
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          {qrCodes && qrCodes.length > 0 ? 'Generate Additional QR Code' : 'Generate QR Code'}
        </Button>
      </div>

      {isEnsuringDefault && (
        <Alert>
          <AlertDescription>
            Generating a default QR code for this form...
          </AlertDescription>
        </Alert>
      )}

      {totalCodes === 1 && !isEnsuringDefault && !ensureError && (
        <Alert>
          <AlertDescription>
            Each form keeps one default QR code so links you have shared stay active. Generate additional QR codes for different locations—any extra code can be removed later.
          </AlertDescription>
        </Alert>
      )}

      {ensureError && (
        <Alert variant="destructive">
          <AlertDescription className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <span>{ensureError}</span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleEnsureDefault}
              disabled={isEnsuringDefault}
            >
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {!qrCodes || qrCodes.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="p-12">
            <div className="text-center">
              <QrCodeIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No QR codes yet</h3>
              <p className="text-gray-600 mb-6">
                Generate your first QR code to start collecting feedback
              </p>
              <Button onClick={() => setShowGenerator(true)}>
                <PlusIcon className="w-4 h-4 mr-2" />
                Generate First QR Code
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {qrCodes.map((qrCode) => {
            const isOnlyQRCode = totalCodes === 1

            return (
              <Card key={qrCode.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base">
                        {qrCode.location_name || 'Unnamed Location'}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {qrCode.short_url}
                      </CardDescription>
                    </div>
                    {isOnlyQRCode ? (
                      <Badge variant="outline" className="text-xs uppercase tracking-wide">
                        Default
                      </Badge>
                    ) : confirmDeleteId === qrCode.id ? (
                      <div className="flex space-x-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(qrCode.id)}
                          disabled={deleteQRCode.isPending}
                        >
                          Confirm
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setConfirmDeleteId(null)}
                          disabled={deleteQRCode.isPending}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirmDeleteId(qrCode.id)}
                        disabled={deleteQRCode.isPending}
                        className="text-red-600 hover:text-red-700"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* QR Code Visual */}
                    <div className="flex justify-center bg-white p-4 rounded-lg border">
                      <QRCodeSVG
                        id={`qr-${qrCode.id}`}
                        value={qrCode.full_url}
                        size={160}
                        level="M"
                        includeMargin={true}
                      />
                    </div>

                    {/* QR Code Stats */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Scans</span>
                      <Badge variant="secondary">
                        {qrCode.scan_count}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Created</span>
                      <span className="text-sm">
                        {formatDistanceToNow(new Date(qrCode.created_at))} ago
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(qrCode.full_url, '_blank')}
                        className="flex-1"
                      >
                        <EyeIcon className="w-4 h-4 mr-1" />
                        Live
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadQR(qrCode)}
                        className="flex-1"
                      >
                        <DownloadIcon className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    </div>

                    {/* URL Display */}
                    <div className="text-xs text-muted-foreground font-mono bg-gray-50 p-2 rounded truncate">
                      {qrCode.full_url}
                    </div>
                    {copiedId === qrCode.id && (
                      <div className="text-xs text-green-600">Link copied to clipboard</div>
                    )}
                    {confirmDeleteId === qrCode.id && (
                      <div className="text-xs text-red-600">
                        Deleting removes this QR code permanently. Printed codes will stop working.
                      </div>
                    )}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleCopyUrl(qrCode.id, qrCode.full_url)}
                      className="w-full"
                    >
                      Copy Link
                    </Button>
                    {isOnlyQRCode && (
                      <p className="text-xs text-muted-foreground text-center">
                        This default QR code stays active so your shared links keep working. Create additional codes for different locations and delete those extras any time.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
