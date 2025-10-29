'use client'

import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { useQRCodes, useDeleteQRCode } from '@/hooks/use-qr-codes'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { QRCodeGenerator } from './qr-code-generator'
import { QrCodeIcon, PlusIcon, TrashIcon, EyeIcon, DownloadIcon } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface QRCodeListProps {
  formId: string
  formName: string
}

export function QRCodeList({ formId, formName }: QRCodeListProps) {
  const [showGenerator, setShowGenerator] = useState(false)
  const { data: qrCodes, isLoading } = useQRCodes(formId)
  const deleteQRCode = useDeleteQRCode()

  const handleDelete = async (qrCodeId: string) => {
    if (!confirm('Are you sure you want to delete this QR code?')) return

    try {
      await deleteQRCode.mutateAsync({ id: qrCodeId, formId })
    } catch (error) {
      console.error('Failed to delete QR code:', error)
    }
  }

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      // You could add a toast notification here
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
        <Button onClick={() => setShowGenerator(true)}>
          <PlusIcon className="w-4 h-4 mr-2" />
          Generate QR Code
        </Button>
      </div>

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
          {qrCodes.map((qrCode) => (
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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(qrCode.id)}
                    disabled={deleteQRCode.isPending}
                    className="text-red-600 hover:text-red-700"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </Button>
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
                      Preview
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
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
